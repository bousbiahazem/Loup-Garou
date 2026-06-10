import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { createApi, createRoomSocket, DEFAULT_API_URL } from "./src/api/client";
import { AppHeader } from "./src/components/AppHeader";
import { ConfirmDialog } from "./src/components/ConfirmDialog";
import { OFFLINE_GAME_KEY } from "./src/constants/offline";
import { FACTION_COLORS, ROLE_IMAGES } from "./src/data/roleAssets";
import { LANGUAGES, translate } from "./src/i18n/translations";
import { HomeScreen } from "./src/screens/HomeScreen";
import { buildOfflineDeck, createEmptyOfflineGame, createLocalId, getOfflineNightOrder, isWolfRoleKey } from "./src/utils/offlineGame";

const PROFILE_KEY = "loup-garou.profile";
const AVATAR_COLORS = ["#c99455", "#8b704f", "#7c8456", "#8f4232", "#b58a5a", "#6f5b45"];
const AVATAR_KEYS = ["moon", "crown", "leaf", "flame", "eye", "mask"];

export default function App() {
  const [language, setLanguage] = useState("en");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signup");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarKey, setAvatarKey] = useState(AVATAR_KEYS[0]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [hubMode, setHubMode] = useState("menu");
  const [offlineGame, setOfflineGame] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [roles, setRoles] = useState([]);
  const [room, setRoom] = useState(null);
  const [roomMode, setRoomMode] = useState("room");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const api = useMemo(() => createApi(apiUrl), [apiUrl]);
  const isArabic = language === "ar";
  const t = (key) => translate(language, key);

  const me = room?.players.find((player) => player.userId === profile?._id);
  const isHost = Boolean(room && profile && room.hostUserId === profile._id);
  const isNarrator = Boolean(me?.isNarrator);
  const activePlayerCount = room ? room.players.filter((player) => !player.isNarrator).length : 0;
  const selectedRoleCount = room ? Object.values(room.roleCounts || {}).reduce((total, count) => total + Number(count || 0), 0) : 0;

  useEffect(() => {
    async function boot() {
      try {
        const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
        const storedOfflineGame = await AsyncStorage.getItem(OFFLINE_GAME_KEY);

        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          setProfile(parsedProfile);
          setDisplayName(parsedProfile.displayName || "");
          setLanguage(parsedProfile.language || "en");
          setAvatarColor(parsedProfile.avatarColor || AVATAR_COLORS[0]);
          setAvatarKey(parsedProfile.avatarKey || AVATAR_KEYS[0]);
        }

        if (storedOfflineGame) {
          setOfflineGame(JSON.parse(storedOfflineGame));
        }
      } catch (storageError) {
        setError(storageError.message);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  useEffect(() => {
    loadRoles(language);
  }, [api, language]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (offlineGame) {
      AsyncStorage.setItem(OFFLINE_GAME_KEY, JSON.stringify(offlineGame)).catch(() => {});
    } else {
      AsyncStorage.removeItem(OFFLINE_GAME_KEY).catch(() => {});
    }
  }, [offlineGame, loading]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  async function loadRoles(nextLanguage) {
    try {
      const response = await api.getRoles(nextLanguage);
      setRoles(response.roles || []);
    } catch {
      setRoles([]);
    }
  }

  async function run(action) {
    setBusy(true);
    setError("");

    try {
      await action();
    } catch (actionError) {
      setError(t(`error_${actionError.message}`));
    } finally {
      setBusy(false);
    }
  }

  async function persistProfile(nextProfile) {
    setProfile(nextProfile);
    setDisplayName(nextProfile.displayName || "");
    setLanguage(nextProfile.language || "en");
    setAvatarColor(nextProfile.avatarColor || AVATAR_COLORS[0]);
    setAvatarKey(nextProfile.avatarKey || AVATAR_KEYS[0]);
    setPassword("");
    setAuthMode("login");
    setActiveTab("home");
    setHubMode("menu");
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    return nextProfile;
  }

  function profilePayload(_source, includePassword = false) {
    const payload = {
      displayName,
      language: language || "en",
      avatarColor: avatarColor || AVATAR_COLORS[0],
      avatarKey: avatarKey || AVATAR_KEYS[0]
    };

    if (includePassword && password) {
      payload.password = password;
    }

    return payload;
  }

  function shouldRequireLogin(error) {
    return error?.message === "USER_NOT_FOUND";
  }

  async function clearLocalProfile() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setRoom(null);
    setRoomMode("room");
    setJoinCode("");
    setPassword("");
    setEditingProfile(false);
    setActiveTab("home");
    setHubMode("menu");
    setOfflineGame(null);
    setAuthMode("login");
  }

  async function ensureProfile() {
    if (!profile?._id) {
      throw new Error("PROFILE_LOGIN_REQUIRED");
    }

    try {
      const response = await api.getUser(profile._id);
      return persistProfile(response.user);
    } catch (error) {
      if (shouldRequireLogin(error)) {
        await clearLocalProfile();
        throw new Error("PROFILE_LOGIN_REQUIRED");
      }

      throw error;
    }
  }

  async function saveProfile() {
    await run(async () => {
      let response;

      if (!profile) {
        if (authMode === "login") {
          response = await api.loginUser({ displayName, password });
          await persistProfile(response.user);
          return;
        }

        await api.createUser(profilePayload(null, true));
        setPassword("");
        setAuthMode("login");
        return;
      }

      try {
        response = await api.updateUser(profile._id, profilePayload(null, true));
      } catch (error) {
        if (shouldRequireLogin(error)) {
          await clearLocalProfile();
          throw new Error("PROFILE_LOGIN_REQUIRED");
        }

        throw error;
      }

      await persistProfile(response.user);
      setEditingProfile(false);
      setActiveTab("home");
    });
  }

  async function createRoom() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.createRoom(safeProfile._id);
      setRoom(response.room);
      setRoomMode("room");
      setActiveTab("home");
      setHubMode("menu");
      watchRoom(response.room.code, safeProfile._id);
    });
  }

  async function joinRoom() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.joinRoom(joinCode, safeProfile._id);
      setRoom(response.room);
      setRoomMode("room");
      setJoinCode("");
      setActiveTab("home");
      setHubMode("menu");
      watchRoom(response.room.code, safeProfile._id);
    });
  }

  function watchRoom(code, userId = profile?._id) {
    socketRef.current?.disconnect();
    const socket = createRoomSocket(apiUrl, code, userId);
    socketRef.current = socket;
    socket.on("room:update", (nextRoom) => setRoom(nextRoom));
    socket.on("room:error", (payload) => setError(t(`error_${payload.error}`)));
  }

  async function saveRoleSetup(roleCounts) {
    if (!room || !isNarrator) {
      return;
    }

    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.updateRoles(room.code, safeProfile._id, roleCounts);
      setRoom(response.room);
      setRoomMode("room");
    });
  }

  async function chooseNarrator(playerId) {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.setNarrator(room.code, safeProfile._id, playerId);
      setRoom(response.room);
    });
  }

  async function kickPlayer(playerId) {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.kickPlayer(room.code, safeProfile._id, playerId);
      setRoom(response.room);
    });
  }

  async function startGame() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.startGame(room.code, safeProfile._id);
      setRoom(response.room);
    });
  }

  async function restartGame() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.restartGame(room.code, safeProfile._id);
      setRoom(response.room);
      setRoomMode("roles");
      setActiveTab("home");
    });
  }

  async function setPhase(phase) {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.setPhase(room.code, safeProfile._id, phase);
      setRoom(response.room);
    });
  }

  async function advanceNight() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.advanceNight(room.code, safeProfile._id);
      setRoom(response.room);
    });
  }

  async function openVote() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.openVote(room.code, safeProfile._id);
      setRoom(response.room);
    });
  }

  async function castVote(targetPlayerId) {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.castVote(room.code, safeProfile._id, targetPlayerId);
      setRoom(response.room);
    });
  }

  async function resolveVote() {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.resolveVote(room.code, safeProfile._id);
      setRoom(response.room);
    });
  }

  async function setLife(player, isAlive) {
    await run(async () => {
      const safeProfile = await ensureProfile();
      const response = await api.setLife(room.code, safeProfile._id, player.id, isAlive);
      setRoom(response.room);
    });
  }

  async function leaveRoom() {
    await run(async () => {
      if (room && profile) {
        const safeProfile = await ensureProfile();
        await api.leaveRoom(room.code, safeProfile._id);
      }

      socketRef.current?.disconnect();
      socketRef.current = null;
      setRoom(null);
      setRoomMode("room");
      setJoinCode("");
      setHubMode("menu");
      setError("");
    });
  }

  async function logOut() {
    const currentRoom = room;
    const currentProfile = profile;

    if (currentRoom && currentProfile?._id) {
      try {
        await api.leaveRoom(currentRoom.code, currentProfile._id);
      } catch {
        // Logout should still clear local data even if the server is unreachable.
      }
    }

    socketRef.current?.disconnect();
    socketRef.current = null;
    await AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setRoom(null);
    setRoomMode("room");
    setJoinCode("");
    setDisplayName("");
    setPassword("");
    setAuthMode("login");
    setAvatarColor(AVATAR_COLORS[0]);
    setAvatarKey(AVATAR_KEYS[0]);
    setEditingProfile(false);
    setActiveTab("home");
    setHubMode("menu");
    setOfflineGame(null);
    setError("");
  }

  function openProfilePage() {
    setPassword("");
    setEditingProfile(false);
    setActiveTab("profile");
    setHubMode("menu");
    setError("");
  }

  function handleBack() {
    setError("");

    if (editingProfile || activeTab === "profile") {
      setEditingProfile(false);
      setActiveTab("home");
      return;
    }

    if (hubMode === "join") {
      setHubMode("menu");
      return;
    }

    if (roomMode === "roles") {
      setRoomMode("room");
      return;
    }

    if (offlineGame?.step === "roles") {
      setOfflineGame((current) => current ? { ...current, step: "players" } : current);
      return;
    }

    if (offlineGame?.step === "reveal") {
      setOfflineGame((current) => current ? { ...current, step: "roles", revealVisible: false } : current);
    }
  }

  function askConfirm(title, message, onConfirm) {
    setConfirmDialog({ title, message, onConfirm });
  }

  function closeConfirm() {
    setConfirmDialog(null);
  }

  function runConfirmedAction() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const showingProfile = (!profile && !offlineGame) || editingProfile || activeTab === "profile";
  const isHomeScreen = Boolean(profile && !showingProfile && !offlineGame && !room);
  const canGoBack = Boolean(
    (profile && (
      editingProfile ||
      activeTab === "profile" ||
      hubMode === "join" ||
      roomMode === "roles"
    )) ||
    offlineGame?.step === "roles"
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.appShell}>
          <View style={styles.fixedHeader}>
            <AppHeader
              canGoBack={canGoBack}
              showProfile={Boolean(isHomeScreen && hubMode === "menu")}
              title={t("appTitle")}
              subtitle={room ? [t(room.phase), room.dayNumber || ""].join(" ").trim() : offlineGame ? t("offlineGame") : undefined}
              onBackPress={handleBack}
              onProfilePress={openProfilePage}
            />
          </View>
          <ScrollView ref={scrollRef} scrollEnabled={!offlineGame?.isReordering} contentContainerStyle={[styles.scrollContent, isHomeScreen && styles.homeScrollContent]} keyboardShouldPersistTaps="handled">
            {showingProfile ? (
              <ProfileScreen
                authMode={authMode}
                avatarColor={avatarColor}
                avatarKey={avatarKey}
                displayName={displayName}
                hasProfile={Boolean(profile)}
                isArabic={isArabic}
                language={language}
                password={password}
                setAuthMode={setAuthMode}
                setAvatarColor={setAvatarColor}
                setAvatarKey={setAvatarKey}
                setDisplayName={setDisplayName}
                setLanguage={setLanguage}
                setPassword={setPassword}
                t={t}
                onCancel={() => {
                  setEditingProfile(false);
                  setActiveTab("home");
                }}
                onLogOut={logOut}
                onOffline={() => {
                  setActiveTab("home");
                  setOfflineGame((current) => current || createEmptyOfflineGame());
                }}
                onSubmit={saveProfile}
              />
            ) : offlineGame ? (
              <OfflineGameScreen
                isArabic={isArabic}
                offlineGame={offlineGame}
                roles={roles}
                setOfflineGame={setOfflineGame}
                t={t}
                onClose={() => setOfflineGame(null)}
                onConfirm={askConfirm}
              />
            ) : room ? (
              <RoomScreen
                activePlayerCount={activePlayerCount}
                busy={busy}
                isArabic={isArabic}
                isHost={isHost}
                isNarrator={isNarrator}
                me={me}
                profile={profile}
                roleCount={selectedRoleCount}
                roomMode={roomMode}
                roles={roles}
                room={room}
                t={t}
                onAdvanceNight={advanceNight}
                onCastVote={castVote}
                onChooseNarrator={chooseNarrator}
                onCloseRoleSetup={() => setRoomMode("room")}
                onKickPlayer={kickPlayer}
                onLeave={leaveRoom}
                onLife={setLife}
                onOpenVote={openVote}
                onPhase={setPhase}
                onResolveVote={resolveVote}
                onSaveRoles={saveRoleSetup}
                onOpenRoleSetup={() => setRoomMode("roles")}
                onRestart={restartGame}
                onStart={startGame}
              />
            ) : (
              <HomeScreen
                hubMode={hubMode}
                isArabic={isArabic}
                joinCode={joinCode}
                setHubMode={setHubMode}
                setJoinCode={setJoinCode}
                t={t}
                onCreate={createRoom}
                onJoin={joinRoom}
                onOffline={() => setOfflineGame((current) => current || createEmptyOfflineGame())}
              />
            )}

            {error ? <Text style={[styles.error, isArabic && styles.rtlText]}>{error}</Text> : null}
            {busy ? <ActivityIndicator color={theme.gold} style={styles.loader} /> : null}
          </ScrollView>
          {offlineGame?.step === "roles" ? (
            <Pressable onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} style={({ pressed }) => [styles.fixedScrollTopButton, pressed && styles.pressed]}>
              <Text style={styles.scrollTopText}>{"\u2191"}</Text>
            </Pressable>
          ) : null}
          <ConfirmDialog
            cancelLabel={t("cancel")}
            confirmLabel={t("confirmAction")}
            dialog={confirmDialog}
            isArabic={isArabic}
            onCancel={closeConfirm}
            onConfirm={runConfirmedAction}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

}

function ProfileScreen({
  authMode,
  avatarColor,
  avatarKey,
  displayName,
  hasProfile,
  isArabic,
  language,
  password,
  setAuthMode,
  setAvatarColor,
  setAvatarKey,
  setDisplayName,
  setLanguage,
  setPassword,
  t,
  onCancel,
  onLogOut,
  onOffline,
  onSubmit
}) {
  const isLogin = !hasProfile && authMode === "login";

  return (
    <View style={styles.panel}>
      <Text style={[styles.title, isArabic && styles.rtlText]}>{t(isLogin ? "loginTitle" : "profileTitle")}</Text>
      <Text style={[styles.muted, isArabic && styles.rtlText]}>{t(isLogin ? "loginSubtitle" : "profileSubtitle")}</Text>
      {!hasProfile ? (
        <SegmentedControl
          options={[
            { code: "signup", label: t("signupMode") },
            { code: "login", label: t("loginMode") }
          ]}
          value={authMode}
          onChange={setAuthMode}
        />
      ) : null}
      <Field label={t("displayName")} isArabic={isArabic}>
        <TextInput
          autoCapitalize="none"
          placeholder={t("displayNamePlaceholder")}
          placeholderTextColor={theme.muted}
          value={displayName}
          onChangeText={setDisplayName}
          style={[styles.input, isArabic && styles.rtlInput]}
        />
      </Field>
      <Field label={t("password")} isArabic={isArabic}>
        <TextInput
          autoCapitalize="none"
          placeholder={hasProfile ? t("newPasswordPlaceholder") : t("passwordPlaceholder")}
          placeholderTextColor={theme.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, isArabic && styles.rtlInput]}
        />
      </Field>
      {!isLogin ? (
        <>
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("language")}</Text>
          <SegmentedControl options={LANGUAGES} value={language} onChange={setLanguage} />
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("avatar")}</Text>
          <View style={styles.avatarPicker}>
            {AVATAR_KEYS.map((key) => (
              <Pressable
                key={key}
                onPress={() => setAvatarKey(key)}
                style={[styles.avatarChoice, avatarKey === key && styles.avatarChoiceActive]}
              >
                <Avatar color={avatarColor} name={key} avatarKey={key} />
              </Pressable>
            ))}
          </View>
          <View style={styles.colorPicker}>
            {AVATAR_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setAvatarColor(color)}
                style={[styles.colorSwatch, { backgroundColor: color }, avatarColor === color && styles.colorSwatchActive]}
              />
            ))}
          </View>
        </>
      ) : null}
      <PrimaryButton label={isLogin ? t("login") : hasProfile ? t("saveProfile") : t("createAccount")} onPress={onSubmit} />
      {!hasProfile ? <SecondaryButton label={t("playOffline")} onPress={onOffline} /> : null}
      {hasProfile ? <SecondaryButton label={t("logOut")} onPress={onLogOut} /> : null}
    </View>
  );
}

function RoomScreen({
  activePlayerCount,
  busy,
  isArabic,
  isHost,
  isNarrator,
  me,
  profile,
  roleCount,
  roomMode,
  roles,
  room,
  t,
  onAdvanceNight,
  onCastVote,
  onChooseNarrator,
  onCloseRoleSetup,
  onKickPlayer,
  onLeave,
  onLife,
  onOpenVote,
  onPhase,
  onResolveVote,
  onSaveRoles,
  onOpenRoleSetup,
  onRestart,
  onStart
}) {
  const myRole = roles.find((role) => role.key === me?.roleKey);

  if (roomMode === "roles" && isNarrator && room.status === "lobby") {
    return (
      <RoleSetupPage
        activePlayerCount={activePlayerCount}
        isArabic={isArabic}
        roleCount={roleCount}
        roles={roles}
        room={room}
        t={t}
        onClose={onCloseRoleSetup}
        onSaveRoles={onSaveRoles}
      />
    );
  }

  return (
    <View style={styles.stack}>
      <View style={styles.roomCodeBand}>
        <View>
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("roomCode")}</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
        </View>
        <SecondaryButton compact label={t("leaveRoom")} onPress={onLeave} />
      </View>

      {room.status === "lobby" ? (
        <>
          <PlayersPanel
            canManagePlayers={isNarrator || isHost}
            isArabic={isArabic}
            isNarrator={isNarrator}
            players={room.players}
            room={room}
            t={t}
            onChooseNarrator={onChooseNarrator}
            onKickPlayer={onKickPlayer}
          />
          {isNarrator ? <PrimaryButton label={t("openRoleSetup")} onPress={onOpenRoleSetup} /> : null}
          {room.narratorUserId ? null : <Text style={[styles.warning, isArabic && styles.rtlText]}>{t("waitingNarrator")}</Text>}
          {isNarrator ? (
            <PrimaryButton disabled={busy} label={t("startGame")} onPress={onStart} />
          ) : (
            <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("waitingStart")}</Text>
          )}
        </>
      ) : isNarrator ? (
        <NarratorPanel
          isArabic={isArabic}
          players={room.players}
          roles={roles}
          room={room}
          t={t}
          onAdvanceNight={onAdvanceNight}
          onLife={onLife}
          onOpenVote={onOpenVote}
          onPhase={onPhase}
          onRestart={onRestart}
          onResolveVote={onResolveVote}
        />
      ) : (
        <PlayerGamePanel
          isArabic={isArabic}
          player={me}
          players={room.players}
          role={myRole}
          roles={roles}
          room={room}
          t={t}
          onCastVote={onCastVote}
        />
      )}

      <EventLog events={room.events} isArabic={isArabic} t={t} />
    </View>
  );
}

function PlayersPanel({ canManagePlayers, isArabic, isNarrator, players, room, t, onChooseNarrator, onKickPlayer }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  return (
    <View style={styles.panel}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("players")}</Text>
      {players.map((player) => (
        <View key={player.id} style={[styles.playerRow, !player.isAlive && styles.deadPlayerRow, isArabic && styles.reverseRow]}>
          <View style={[styles.playerIdentity, isArabic && styles.reverseRow]}>
            <Pressable onPress={() => canManagePlayers && setSelectedPlayer(player)}>
              <Avatar name={player.displayName} color={player.avatarColor} avatarKey={player.avatarKey} isDead={!player.isAlive} />
            </Pressable>
            <View>
              <Text style={[styles.playerName, isArabic && styles.rtlText]}>{player.displayName}</Text>
              <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>
                {player.userId === room.hostUserId ? t("host") : player.isNarrator ? t("narrator") : player.isAlive ? t("alive") : t("dead")}
              </Text>
            </View>
          </View>
        </View>
      ))}
      {selectedPlayer ? (
        <View style={styles.actionPanel}>
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("playerActions")}</Text>
          <Text style={[styles.playerName, isArabic && styles.rtlText]}>{selectedPlayer.displayName}</Text>
          {!selectedPlayer.isNarrator ? (
            <PrimaryButton label={t("makeNarrator")} onPress={() => {
              onChooseNarrator(selectedPlayer.id);
              setSelectedPlayer(null);
            }} />
          ) : null}
          {isNarrator && !selectedPlayer.isNarrator ? (
            <SecondaryButton label={t("kickPlayer")} onPress={() => {
              onKickPlayer(selectedPlayer.id);
              setSelectedPlayer(null);
            }} />
          ) : null}
          <SecondaryButton label={t("cancel")} onPress={() => setSelectedPlayer(null)} />
        </View>
      ) : null}
    </View>
  );
}

function RoleSetupPage({ activePlayerCount, isArabic, roleCount, roles, room, t, onClose, onSaveRoles }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [draftCounts, setDraftCounts] = useState(() => ({ ...(room.roleCounts || {}) }));

  useEffect(() => {
    setDraftCounts({ ...(room.roleCounts || {}) });
  }, [room.code, room.updatedAt]);

  const draftTotal = Object.values(draftCounts).reduce((total, count) => total + Number(count || 0), 0);

  function changeCount(role, delta) {
    setDraftCounts((current) => {
      const currentCount = Number(current[role.key] || 0);
      const nextCount = Math.max(0, Math.min(role.max || 50, currentCount + delta));
      const nextTotal = Object.entries(current).reduce((total, [key, value]) => total + (key === role.key ? 0 : Number(value || 0)), 0) + nextCount;

      if (nextTotal > activePlayerCount) {
        return current;
      }

      return { ...current, [role.key]: nextCount };
    });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.roomCodeBand}>
        <View>
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("roleSetup")}</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <View style={[styles.roleHeader, isArabic && styles.reverseRow]}>
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("roleSetup")}</Text>
          <Text style={styles.countPill}>
            {t("deckTotal")}: {draftTotal}/{activePlayerCount}
          </Text>
        </View>
        <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("autoVillagers")}</Text>
        <View style={styles.roleGrid}>
          {roles.map((role) => {
            const count = Number(draftCounts?.[role.key] || 0);
            return (
              <RoleCountCard
                key={role.key}
                count={count}
                disabled={false}
                plusDisabled={count >= role.max || draftTotal >= activePlayerCount}
                isArabic={isArabic}
                role={role}
                t={t}
                onMinus={() => changeCount(role, -1)}
                onPlus={() => changeCount(role, 1)}
                onRolePress={() => setSelectedRole(role)}
              />
            );
          })}
        </View>
        <PrimaryButton label={t("saveRoles")} onPress={() => onSaveRoles(draftCounts)} />
        {selectedRole ? (
          <View style={styles.descriptionPanel}>
            <RoleAvatar role={selectedRole} size={78} />
            <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{selectedRole.name}</Text>
            <Text style={[styles.muted, isArabic && styles.rtlText]}>{selectedRole.description}</Text>
            <SecondaryButton label={t("cancel")} onPress={() => setSelectedRole(null)} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RoleCountCard({ count, disabled, plusDisabled, isArabic, role, t, onMinus, onPlus, onRolePress }) {
  return (
    <Pressable onPress={onRolePress} style={({ pressed }) => [styles.roleCountCard, pressed && styles.pressed]}>
      <View style={[styles.roleMiniHeader, isArabic && styles.reverseRow]}>
        <RoleAvatar role={role} size={42} />
        <View style={styles.roleMiniText}>
          <Text style={[styles.roleName, isArabic && styles.rtlText]} numberOfLines={2}>{role.name}</Text>
          <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{t(role.faction)}</Text>
        </View>
      </View>
      <View style={styles.stepper}>
        <RoundButton disabled={disabled} label="-" onPress={onMinus} />
        <Text style={styles.stepperValue}>{count}</Text>
        <RoundButton disabled={disabled || plusDisabled} label="+" onPress={onPlus} />
      </View>
    </Pressable>
  );
}

function NarratorPanel({ isArabic, players, roles, room, t, onAdvanceNight, onLife, onOpenVote, onPhase, onRestart, onResolveVote }) {
  const currentNightRole = roles.find((role) => role.key === room.night?.currentRoleKey);
  const currentRolePlayers = currentNightRole
    ? players.filter((player) => player.roleKey === currentNightRole.key && player.isAlive)
    : [];
  const lastTapRef = useRef({ playerId: null, at: 0 });

  function handlePlayerTap(player) {
    const now = Date.now();
    const lastTap = lastTapRef.current;

    if (lastTap.playerId === player.id && now - lastTap.at < 450) {
      onLife(player, !player.isAlive);
      lastTapRef.current = { playerId: null, at: 0 };
      return;
    }

    lastTapRef.current = { playerId: player.id, at: now };
  }

  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("narratorPanel")}</Text>
        <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("allRolesVisible")}</Text>
        {room.phase === "night" ? (
          <NightGuide
            currentRolePlayers={currentRolePlayers}
            isArabic={isArabic}
            role={currentNightRole}
            room={room}
            t={t}
            onAdvanceNight={onAdvanceNight}
            onPhase={onPhase}
          />
        ) : (
          <NarratorVotePanel room={room} t={t} onOpenVote={onOpenVote} onResolveVote={onResolveVote} />
        )}
      </View>

      <View style={styles.panel}>
        <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{t("doubleTapDead")}</Text>
        {players.filter((player) => !player.isNarrator).map((player) => {
          const role = roles.find((candidate) => candidate.key === player.roleKey);

          return (
            <Pressable
              key={player.id}
              onPress={() => handlePlayerTap(player)}
              style={[styles.narratorPlayer, !player.isAlive && styles.deadPlayerRow, isArabic && styles.reverseRow]}
            >
              <View style={[styles.playerIdentity, isArabic && styles.reverseRow]}>
                <RoleAvatar role={role} size={48} />
                <View style={styles.flex}>
                  <Text style={[styles.playerName, isArabic && styles.rtlText]}>{player.displayName}</Text>
                  <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{role?.name || t("roleMissing")}</Text>
                </View>
              </View>
              <Text style={styles.countPill}>{player.isAlive ? t("alive") : t("dead")}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NightGuide({ currentRolePlayers, isArabic, role, room, t, onAdvanceNight, onPhase }) {
  if (!role) {
    return (
      <View style={styles.stack}>
        <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("noNightRoles")}</Text>
        <PrimaryButton label={t("finishNight")} onPress={() => onPhase("day")} />
      </View>
    );
  }

  const isWakeTap = room.night?.tapCount === 0;

  return (
    <View style={styles.nightGuide}>
      <Text style={[styles.label, isArabic && styles.rtlText]}>{t("nightGuide")}</Text>
      <View style={[styles.roleMiniHeader, isArabic && styles.reverseRow]}>
        <RoleAvatar role={role} size={58} />
        <View style={styles.flex}>
          <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{role.name}</Text>
          <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>
            {room.night.stepIndex + 1}/{room.night.order.length}
          </Text>
        </View>
      </View>
      <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("playersWithRole")}</Text>
      {currentRolePlayers.map((player) => (
        <Text key={player.id} style={[styles.playerName, isArabic && styles.rtlText]}>
          {player.displayName}
        </Text>
      ))}
      <PrimaryButton label={isWakeTap ? t("wakeRole") : t("sleepRole")} onPress={onAdvanceNight} />
    </View>
  );
}

function NarratorVotePanel({ room, t, onOpenVote, onResolveVote }) {
  return (
    <View style={styles.stack}>
      <Text style={styles.countPill}>{room.voteOpen ? t("voteOpen") : t("day")}</Text>
      {room.voteOpen ? (
        <SecondaryButton label={t("resolveVote")} onPress={onResolveVote} />
      ) : (
        <PrimaryButton label={t("openVote")} onPress={onOpenVote} />
      )}
    </View>
  );
}

function PlayerGamePanel({ isArabic, player, players, role, roles, room, t, onCastVote }) {
  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("yourRole")}</Text>
        {role ? (
          <View style={styles.roleReveal}>
            <RoleAvatar role={role} size={136} />
            <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{role.name}</Text>
            <Text style={[styles.roleDescription, isArabic && styles.rtlText]}>{role.description}</Text>
            <Text style={styles.countPill}>{t("faction")}: {t(role.faction)}</Text>
          </View>
        ) : (
          <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("roleHidden")}</Text>
        )}
      </View>
      <View style={[styles.statusBand, room.phase === "night" ? styles.nightBand : styles.dayBand]}>
        <Text style={styles.statusText}>{t(room.phase)} {room.dayNumber || ""}</Text>
        <Text style={styles.statusSubText}>{player?.isAlive ? t("alive") : t("dead")}</Text>
      </View>
      {room.lastEliminated ? (
        <RevealPanel eliminated={room.lastEliminated} isArabic={isArabic} roles={roles} t={t} />
      ) : null}
      {room.phase === "day" && room.voteOpen && player?.isAlive ? (
        <PlayerVotePanel
          isArabic={isArabic}
          players={players}
          room={room}
          t={t}
          viewerPlayer={player}
          onCastVote={onCastVote}
        />
      ) : null}
    </View>
  );
}

function RevealPanel({ eliminated, isArabic, roles, t }) {
  const role = roles.find((candidate) => candidate.key === eliminated.roleKey);

  return (
    <View style={styles.panel}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("revealedRole")}</Text>
      <Text style={[styles.playerName, isArabic && styles.rtlText]}>{eliminated.displayName}</Text>
      <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{role?.name || t("roleMissing")}</Text>
    </View>
  );
}

function PlayerVotePanel({ isArabic, players, room, t, viewerPlayer, onCastVote }) {
  const candidates = players.filter((player) => !player.isNarrator && player.isAlive);

  return (
    <View style={styles.panel}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("vote")}</Text>
      <Text style={[styles.muted, isArabic && styles.rtlText]}>
        {room.viewerVoteTargetId ? t("voted") : t("voteOpen")}
      </Text>
      {candidates.map((candidate) => {
        const voteCount = room.voteCounts?.[candidate.id] || 0;
        const selected = room.viewerVoteTargetId === candidate.id;

        return (
          <Pressable
            key={candidate.id}
            disabled={selected}
            onPress={() => onCastVote(candidate.id)}
            style={[styles.voteRow, selected && styles.voteRowSelected, isArabic && styles.reverseRow]}
          >
            <View style={[styles.playerIdentity, isArabic && styles.reverseRow]}>
              <Avatar name={candidate.displayName} color={candidate.avatarColor} avatarKey={candidate.avatarKey} isDead={!candidate.isAlive} />
              <Text style={[styles.playerName, isArabic && styles.rtlText]}>
                {candidate.id === viewerPlayer.id ? `${candidate.displayName}` : candidate.displayName}
              </Text>
            </View>
            <Text style={styles.countPill}>{voteCount} {t("votes")}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function OfflineGameScreen({ isArabic, offlineGame, roles, setOfflineGame, t, onClose, onConfirm }) {
  if (offlineGame.step === "roles") {
    return <OfflineRolesPage game={offlineGame} isArabic={isArabic} roles={roles} setGame={setOfflineGame} t={t} />;
  }

  if (offlineGame.step === "reveal") {
    return <OfflineReveal game={offlineGame} isArabic={isArabic} roles={roles} setGame={setOfflineGame} t={t} />;
  }

  if (offlineGame.step === "narrator") {
    return <OfflineNarratorPanel game={offlineGame} isArabic={isArabic} roles={roles} setGame={setOfflineGame} t={t} onClose={onClose} onConfirm={onConfirm} />;
  }

  return <OfflinePlayersPage game={offlineGame} isArabic={isArabic} roles={roles} setGame={setOfflineGame} t={t} onClose={onClose} onConfirm={onConfirm} />;
}

function OfflinePlayersPage({ game, isArabic, roles, setGame, t, onClose, onConfirm }) {
  const [playerName, setPlayerName] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const dragRef = useRef(null);
  const visiblePlayers = game.players.filter((player) => player.name.trim());
  const roleTotal = Object.values(game.roleCounts || {}).reduce((total, count) => total + Number(count || 0), 0);

  function addPlayer() {
    const name = playerName.trim();

    if (!name) {
      return;
    }

    setGame((current) => ({
      ...current,
      players: [...current.players.filter((player) => player.name.trim()), { id: createLocalId(), name, isAlive: true, marked: false }]
    }));
    setPlayerName("");
  }

  function removePlayer(id) {
    setGame((current) => ({
      ...current,
      players: current.players.filter((player) => player.id !== id)
    }));
  }

  function movePlayerById(playerId, toVisibleIndex) {
    setGame((current) => {
      const players = current.players.filter((player) => player.name.trim());
      const fromIndex = players.findIndex((player) => player.id === playerId);
      const targetIndex = Math.max(0, Math.min(players.length - 1, toVisibleIndex));

      if (fromIndex < 0 || fromIndex === targetIndex) {
        return current;
      }

      const [moved] = players.splice(fromIndex, 1);
      players.splice(targetIndex, 0, moved);
      return { ...current, players };
    });
  }

  function beginDrag(player, index) {
    dragRef.current = { id: player.id, originIndex: index, currentIndex: index };
    setDraggingId(player.id);
    setGame((current) => ({ ...current, isReordering: true }));
  }

  function dragMove(player, gestureState) {
    const drag = dragRef.current;

    if (!drag || drag.id !== player.id) {
      return;
    }

    const rowHeight = 58;
    const steps = Math.trunc(gestureState.dy / rowHeight);

    if (steps === 0) {
      return;
    }

    const targetIndex = Math.max(0, Math.min(visiblePlayers.length - 1, drag.originIndex + steps));

    if (targetIndex !== drag.currentIndex) {
      movePlayerById(player.id, targetIndex);
      drag.currentIndex = targetIndex;
    }
  }

  function endDrag() {
    dragRef.current = null;
    setDraggingId(null);
    setGame((current) => ({ ...current, isReordering: false }));
  }

  function startReveal() {
    const cleanPlayers = visiblePlayers.map((player, index) => ({
      ...player,
      id: player.id || "offline-" + index,
      name: player.name.trim(),
      isAlive: true,
      marked: false
    }));

    if (cleanPlayers.length < 3 || roleTotal > cleanPlayers.length) {
      return;
    }

    const deck = buildOfflineDeck(game.roleCounts, cleanPlayers.length);
    setGame({
      ...game,
      step: "reveal",
      players: cleanPlayers.map((player, index) => ({ ...player, roleKey: deck[index] })),
      revealIndex: 0,
      revealVisible: false,
      phase: "night",
      nightStepIndex: 0,
      isReordering: false
    });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <View style={[styles.roleHeader, isArabic && styles.reverseRow]}>
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("offlineSetup")}</Text>
          <Text style={styles.countPill}>{visiblePlayers.length}</Text>
        </View>
        <View style={[styles.playerInputRow, isArabic && styles.reverseRow]}>
          <TextInput
            placeholder={t("playerName")}
            placeholderTextColor={theme.muted}
            value={playerName}
            onChangeText={setPlayerName}
            onSubmitEditing={addPlayer}
            style={[styles.input, styles.flexInput, isArabic && styles.rtlInput]}
          />
          <SmallButton label={t("addPlayer")} onPress={addPlayer} />
        </View>
        <View style={styles.offlinePlayerList}>
          {visiblePlayers.map((player, index) => (
            <OfflinePlayerOrderItem
              key={player.id}
              index={index}
              isArabic={isArabic}
              isDragging={draggingId === player.id}
              player={player}
              onDragEnd={endDrag}
              onDragMove={dragMove}
              onDragStart={beginDrag}
              onRemove={removePlayer}
            />
          ))}
        </View>
      </View>

      <View style={styles.homeActions}>
        <SecondaryButton label={t("rolesButton")} onPress={() => setGame((current) => ({ ...current, step: "roles" }))} />
        <PrimaryButton disabled={visiblePlayers.length < 3 || roleTotal > visiblePlayers.length} label={t("startGame")} onPress={startReveal} />
        <SecondaryButton label={t("endGame")} onPress={() => onConfirm(t("confirmTitle"), t("confirmEnd"), onClose)} />
      </View>
    </View>
  );
}

function OfflinePlayerOrderItem({ index, isArabic, isDragging, player, onDragEnd, onDragMove, onDragStart, onRemove }) {
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => onDragStart(player, index),
    onPanResponderMove: (_event, gestureState) => onDragMove(player, gestureState),
    onPanResponderRelease: onDragEnd,
    onPanResponderTerminate: onDragEnd
  }), [index, onDragEnd, onDragMove, onDragStart, player]);

  return (
    <View style={[styles.offlinePlayerOrderRow, isDragging && styles.draggingRow, isArabic && styles.reverseRow]}>
      <View {...panResponder.panHandlers} style={styles.playerNameDragHandle}>
        <Text style={[styles.playerName, isArabic && styles.rtlText]}>{index + 1}. {player.name}</Text>
      </View>
      <SmallButton danger label="X" onPress={() => onRemove(player.id)} />
    </View>
  );
}

function OfflineRolesPage({ game, isArabic, roles, setGame, t }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const activePlayerCount = game.players.filter((player) => player.name.trim()).length;
  const roleTotal = Object.values(game.roleCounts || {}).reduce((total, count) => total + Number(count || 0), 0);

  function changeRoleCount(role, delta) {
    setGame((current) => {
      const currentCount = Number(current.roleCounts?.[role.key] || 0);
      const nextCount = Math.max(0, Math.min(role.max || 50, currentCount + delta));
      const nextTotal = Object.entries(current.roleCounts || {}).reduce((total, [key, value]) => total + (key === role.key ? 0 : Number(value || 0)), 0) + nextCount;

      if (nextTotal > Math.max(activePlayerCount, 1)) {
        return current;
      }

      return { ...current, roleCounts: { ...current.roleCounts, [role.key]: nextCount } };
    });
  }

  return (
    <View style={styles.stack}>
      <View style={styles.roomCodeBand}>
        <View>
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("roleSetup")}</Text>
          <Text style={styles.roomCode}>{roleTotal}/{activePlayerCount || 0}</Text>
        </View>
      </View>
      <View style={styles.panel}>
        <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("autoVillagers")}</Text>
        <View style={styles.roleGrid}>
          {roles.map((role) => {
            const count = Number(game.roleCounts?.[role.key] || 0);
            return (
              <RoleCountCard
                key={role.key}
                count={count}
                disabled={false}
                plusDisabled={count >= role.max || roleTotal >= activePlayerCount}
                isArabic={isArabic}
                role={role}
                t={t}
                onMinus={() => changeRoleCount(role, -1)}
                onPlus={() => changeRoleCount(role, 1)}
                onRolePress={() => setSelectedRole(role)}
              />
            );
          })}
        </View>
      </View>
      <RoleDescriptionModal isArabic={isArabic} role={selectedRole} t={t} onClose={() => setSelectedRole(null)} />
    </View>
  );
}

function RoleDescriptionModal({ isArabic, role, t, onClose }) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(role)} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.roleModal}>
          {role ? <RoleAvatar role={role} size={92} /> : null}
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{role?.name}</Text>
          <Text style={[styles.muted, isArabic && styles.rtlText]}>{role?.description}</Text>
          <SecondaryButton label={t("cancel")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function OfflineReveal({ game, isArabic, roles, setGame, t }) {
  const player = game.players[game.revealIndex];
  const role = roles.find((candidate) => candidate.key === player?.roleKey);
  if (!player) {
    return null;
  }

  function handleCardTap() {
    if (!game.revealVisible) {
      setGame((current) => ({ ...current, revealVisible: true }));
      return;
    }

    const nextIndex = game.revealIndex + 1;
    setGame((current) => ({
      ...current,
      step: nextIndex >= current.players.length ? "narrator" : "reveal",
      revealIndex: nextIndex,
      revealVisible: false,
      phase: nextIndex >= current.players.length ? "night" : current.phase,
      nightStepIndex: nextIndex >= current.players.length ? 0 : current.nightStepIndex
    }));
  }

  return (
    <View style={styles.revealCenter}>
      <Pressable onPress={handleCardTap} style={({ pressed }) => [styles.revealTapCard, pressed && styles.pressed]}>
        {!game.revealVisible ? (
          <>
            <Text style={[styles.label, isArabic && styles.rtlText]}>{t("passPhone")}</Text>
            <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{player.name}</Text>
            <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{t("showRole")}</Text>
          </>
        ) : (
          <View style={styles.roleReveal}>
            <RoleAvatar role={role} size={136} />
            <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{role?.name || t("roleMissing")}</Text>
            <Text style={[styles.roleDescription, isArabic && styles.rtlText]}>{role?.description || ""}</Text>
            <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{t("nextPlayer")}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function OfflineNarratorPanel({ game, isArabic, roles, setGame, t, onClose, onConfirm }) {
  const [showPlayerList, setShowPlayerList] = useState(false);
  const nightOrder = getOfflineNightOrder(game.players, roles);
  const currentRoleKey = nightOrder[game.nightStepIndex];
  const wolfRole = roles.find((role) => role.faction === "wolves");
  const currentRole = currentRoleKey === "wolves" ? { key: "wolves", name: t("wolves"), description: t("wolvesWake"), faction: "wolves" } : roles.find((role) => role.key === currentRoleKey);
  const currentRolePlayers = currentRoleKey === "wolves"
    ? game.players.filter((player) => player.isAlive && isWolfRoleKey(player.roleKey, roles))
    : game.players.filter((player) => player.isAlive && player.roleKey === currentRoleKey);
  const alivePlayers = game.players.filter((player) => player.isAlive);
  const deadPlayers = game.players.filter((player) => !player.isAlive);

  function toggleLife(playerId) {
    setGame((current) => ({
      ...current,
      players: current.players.map((player) => player.id === playerId ? { ...player, isAlive: !player.isAlive } : player)
    }));
  }

  function toggleMark(playerId) {
    setGame((current) => ({
      ...current,
      players: current.players.map((player) => player.id === playerId ? { ...player, marked: !player.marked } : player)
    }));
  }

  function nextNightRole() {
    setGame((current) => {
      const order = getOfflineNightOrder(current.players, roles);
      const nextIndex = current.nightStepIndex + 1;

      if (nextIndex >= order.length) {
        return { ...current, phase: "day", nightStepIndex: 0 };
      }

      return { ...current, nightStepIndex: nextIndex };
    });
  }

  function startNight() {
    setGame((current) => ({ ...current, phase: "night", nightStepIndex: 0 }));
  }

  function resetSameNames() {
    setGame((current) => ({
      ...current,
      step: "roles",
      players: current.players.map((player) => ({ id: player.id, name: player.name, isAlive: true, marked: false })),
      revealIndex: 0,
      revealVisible: false,
      phase: "night",
      nightStepIndex: 0
    }));
  }

  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <View style={[styles.roleHeader, isArabic && styles.reverseRow]}>
          <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("narratorPanel")}</Text>
          <Text style={styles.countPill}>{t(game.phase)}</Text>
        </View>
        {game.phase === "night" ? (
          currentRole ? (
            <View style={styles.nightGuide}>
              <View style={[styles.roleMiniHeader, isArabic && styles.reverseRow]}>
                <RoleAvatar role={currentRoleKey === "wolves" ? wolfRole : currentRole} size={58} />
                <View style={styles.flex}>
                  <Text style={[styles.bigRoleName, isArabic && styles.rtlText]}>{currentRole.name}</Text>
                  <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{game.nightStepIndex + 1}/{nightOrder.length}</Text>
                </View>
              </View>
              <Text style={[styles.muted, isArabic && styles.rtlText]}>{currentRole.description}</Text>
              <PrimaryButton label={t("nextRole")} onPress={nextNightRole} />
            </View>
          ) : (
            <View style={styles.stack}>
              <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("noNightRoles")}</Text>
              <PrimaryButton label={t("day")} onPress={() => setGame((current) => ({ ...current, phase: "day" }))} />
            </View>
          )
        ) : (
          <View style={styles.stack}>
            <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("day")}</Text>
            <PrimaryButton label={t("night")} onPress={startNight} />
          </View>
        )}
      </View>

      <SecondaryButton label={showPlayerList ? t("hidePlayers") : t("showPlayers")} onPress={() => setShowPlayerList((current) => !current)} />
      {showPlayerList ? (
        <>
          <OfflinePlayerList title={t("alive")} players={alivePlayers} roles={roles} isArabic={isArabic} t={t} onToggleLife={toggleLife} onToggleMark={toggleMark} />
          <OfflinePlayerList title={t("dead")} players={deadPlayers} roles={roles} isArabic={isArabic} t={t} onToggleLife={toggleLife} onToggleMark={toggleMark} />
        </>
      ) : null}

      <PrimaryButton label={t("resetGame")} onPress={() => onConfirm(t("confirmTitle"), t("confirmReset"), resetSameNames)} />
      <SecondaryButton label={t("endGame")} onPress={() => onConfirm(t("confirmTitle"), t("confirmEnd"), onClose)} />
    </View>
  );
}

function OfflinePlayerList({ title, players, roles, isArabic, t, onToggleLife, onToggleMark }) {
  const tapRef = useRef({ playerId: null, timer: null });

  useEffect(() => () => {
    if (tapRef.current.timer) {
      clearTimeout(tapRef.current.timer);
    }
  }, []);

  function handlePlayerTap(playerId) {
    if (tapRef.current.playerId === playerId && tapRef.current.timer) {
      clearTimeout(tapRef.current.timer);
      tapRef.current = { playerId: null, timer: null };
      onToggleMark(playerId);
      return;
    }

    if (tapRef.current.timer) {
      clearTimeout(tapRef.current.timer);
    }

    const timer = setTimeout(() => {
      onToggleLife(playerId);
      tapRef.current = { playerId: null, timer: null };
    }, 320);

    tapRef.current = { playerId, timer };
  }

  if (!players.length) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{title}</Text>
      {players.map((player) => {
        const role = roles.find((candidate) => candidate.key === player.roleKey);
        return (
          <Pressable
            key={player.id}
            onPress={() => handlePlayerTap(player.id)}
            style={[styles.narratorPlayer, player.marked && styles.markedPlayerRow, !player.isAlive && styles.deadPlayerRow, isArabic && styles.reverseRow]}
          >
            <View style={[styles.playerIdentity, styles.flex, isArabic && styles.reverseRow]}>
              <RoleAvatar role={role} size={48} />
              <View style={styles.flex}>
                <Text style={[styles.playerName, isArabic && styles.rtlText]}>{player.name}</Text>
                <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{role?.name || t("roleMissing")}</Text>
              </View>
            </View>
            {player.marked ? <View style={styles.greenMarkDot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function EventLog({ events, isArabic, t }) {
  if (!events?.length) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("events")}</Text>
      {events.slice(-5).reverse().map((event) => (
        <Text key={`${event.type}-${event.createdAt}`} style={[styles.logLine, isArabic && styles.rtlText]}>
          {event.message}
        </Text>
      ))}
    </View>
  );
}

function Field({ children, isArabic, label }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, isArabic && styles.rtlText]}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.code}
          onPress={() => onChange(option.code)}
          style={[styles.segment, value === option.code && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === option.code && styles.segmentTextActive]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function PrimaryButton({ compact, disabled, label, onPress }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [
      styles.primaryButton,
      compact && styles.compactButton,
      disabled && styles.disabledButton,
      pressed && !disabled && styles.pressed
    ]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ compact, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.secondaryButton,
      compact && styles.compactButton,
      pressed && styles.pressed
    ]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ danger, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.smallButton,
      danger && styles.dangerButton,
      pressed && styles.pressed
    ]}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function RoundButton({ disabled, label, onPress }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [
      styles.roundButton,
      disabled && styles.disabledButton,
      pressed && !disabled && styles.pressed
    ]}>
      <Text style={styles.roundButtonText}>{label}</Text>
    </Pressable>
  );
}

function Avatar({ avatarKey, color = theme.green, isDead, name }) {
  const avatarLabel = {
    moon: "MO",
    crown: "CR",
    leaf: "LF",
    flame: "FL",
    eye: "EY",
    mask: "MS"
  }[avatarKey];
  const initial = avatarLabel || String(name || "?").trim().slice(0, 1).toUpperCase();

  return (
    <View style={[styles.avatar, { backgroundColor: color }, isDead && styles.deadAvatar]}>
      <Text style={styles.avatarText}>{isDead ? "DEAD" : initial}</Text>
    </View>
  );
}

function RoleAvatar({ role, size }) {
  const image = role ? ROLE_IMAGES[role.key] : null;
  const backgroundColor = role ? FACTION_COLORS[role.faction] || theme.purple : theme.panelLight;
  const initials = role?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

  if (image) {
    return <Image source={image} style={[styles.roleImage, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.roleFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.roleFallbackText, { fontSize: Math.max(14, size / 4) }]}>{initials}</Text>
    </View>
  );
}

const theme = {
  background: "#1b120d",
  panel: "#2a1b13",
  panelLight: "#3a261a",
  text: "#f6eadc",
  muted: "#c2ad98",
  gold: "#c99455",
  green: "#7c8456",
  red: "#8f4232",
  purple: "#9a7652",
  border: "rgba(246, 234, 220, 0.14)",
  ink: "#23150d",
  cream: "#f3dfc4"
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background
  },
  flex: {
    flex: 1
  },
  appShell: {
    flex: 1
  },
  fixedHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: theme.background,
    zIndex: 10,
    elevation: 8
  },
  scrollContent: {
    flexGrow: 1,
    padding: 18,
    paddingBottom: 110,
    gap: 14
  },
  homeScrollContent: {
    padding: 0,
    paddingBottom: 0,
    gap: 0
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  homeActions: {
    gap: 12
  },
  panel: {
    backgroundColor: theme.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 12
  },
  stack: {
    gap: 14
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "800"
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800"
  },
  muted: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22
  },
  smallMuted: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 16
  },
  warning: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "700"
  },
  error: {
    color: "#ffd6c9",
    backgroundColor: "rgba(143, 66, 50, 0.32)",
    borderColor: "rgba(255, 214, 201, 0.2)",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12
  },
  loader: {
    marginTop: 8
  },
  field: {
    gap: 7
  },
  label: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.panelLight,
    paddingHorizontal: 12,
    fontSize: 16
  },
  rtlInput: {
    textAlign: "right"
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl"
  },
  reverseRow: {
    flexDirection: "row-reverse"
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: theme.panelLight,
    borderRadius: 8,
    padding: 4,
    gap: 4
  },
  segment: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6
  },
  segmentActive: {
    backgroundColor: theme.gold
  },
  segmentText: {
    color: theme.muted,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: theme.ink
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: theme.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: theme.ink,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center"
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  compactButton: {
    minHeight: 40,
    paddingHorizontal: 12
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: theme.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    maxWidth: 150
  },
  dangerButton: {
    backgroundColor: theme.red
  },
  smallButtonText: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center"
  },
  disabledButton: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center"
  },
  deadAvatar: {
    opacity: 0.55,
    borderWidth: 2,
    borderColor: theme.red
  },
  avatarText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900"
  },
  avatarPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  avatarChoice: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 8,
    backgroundColor: theme.panelLight
  },
  avatarChoiceActive: {
    borderColor: theme.gold,
    backgroundColor: "rgba(201, 148, 85, 0.14)"
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.border
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: theme.cream
  },
  roomCodeBand: {
    backgroundColor: theme.cream,
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  roomCode: {
    color: theme.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0
  },
  playerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  offlinePlayerList: {
    gap: 8
  },
  offlinePlayerOrderRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelLight,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  playerNameDragHandle: {
    flex: 1,
    minHeight: 42,
    justifyContent: "center"
  },
  draggingRow: {
    borderColor: theme.gold,
    opacity: 0.78
  },
  flexInput: {
    flex: 1
  },
  hiddenRoleCard: {
    minHeight: 210,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelLight,
    padding: 18
  },
  revealCenter: {
    minHeight: 440,
    alignItems: "center",
    justifyContent: "center"
  },
  revealTapCard: {
    width: "100%",
    minHeight: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 14
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0, 0, 0, 0.62)"
  },
  roleModal: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 18,
    gap: 12,
    alignItems: "center"
  },
  fixedScrollTopButton: {
    position: "absolute",
    right: 18,
    bottom: 24,
    zIndex: 20,
    elevation: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.gold,
    borderWidth: 1,
    borderColor: "rgba(35, 21, 13, 0.18)"
  },
  scrollTopText: {
    color: theme.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  actionPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelLight,
    padding: 12,
    gap: 10
  },
  playerIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  playerName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800"
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(217, 164, 65, 0.16)",
    borderColor: "rgba(217, 164, 65, 0.35)",
    borderWidth: 1,
    borderRadius: 8,
    color: theme.gold,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  roleGrid: {
    gap: 10
  },
  descriptionPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelLight,
    alignItems: "center",
    padding: 14,
    gap: 10
  },
  roleCountCard: {
    backgroundColor: theme.panelLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    gap: 10
  },
  roleMiniHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  roleMiniText: {
    flex: 1
  },
  roleName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800"
  },
  roleImage: {
    borderWidth: 2,
    borderColor: theme.border
  },
  roleFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.border
  },
  roleFallbackText: {
    color: theme.text,
    fontWeight: "900"
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.gold,
    alignItems: "center",
    justifyContent: "center"
  },
  roundButtonText: {
    color: theme.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  stepperValue: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "900"
  },
  phaseRow: {
    flexDirection: "row",
    gap: 10
  },
  nightGuide: {
    gap: 12
  },
  narratorPlayer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  deadPlayerRow: {
    opacity: 0.62,
    backgroundColor: "rgba(143, 66, 50, 0.18)",
    borderRadius: 8,
    paddingHorizontal: 8
  },
  markedPlayerRow: {
    borderColor: "rgba(124, 132, 86, 0.95)",
    backgroundColor: "rgba(124, 132, 86, 0.14)"
  },
  greenMarkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.green,
    borderWidth: 2,
    borderColor: theme.cream
  },
  roleReveal: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12
  },
  bigRoleName: {
    color: theme.text,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center"
  },
  roleDescription: {
    color: theme.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  statusBand: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    gap: 4
  },
  nightBand: {
    backgroundColor: "#2d2018"
  },
  dayBand: {
    backgroundColor: "#8b704f"
  },
  statusText: {
    color: theme.text,
    fontSize: 26,
    fontWeight: "900"
  },
  statusSubText: {
    color: theme.text,
    fontWeight: "800"
  },
  voteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panelLight,
    padding: 10
  },
  voteRowSelected: {
    borderColor: theme.gold,
    backgroundColor: "rgba(201, 148, 85, 0.18)"
  },
  logLine: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 20
  }
});

