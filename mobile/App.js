import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
import { FACTION_COLORS, ROLE_IMAGES } from "./src/data/roleAssets";
import { LANGUAGES, translate } from "./src/i18n/translations";

const PROFILE_KEY = "loup-garou.profile";
const AVATAR_COLORS = ["#c99455", "#8b704f", "#7c8456", "#8f4232", "#b58a5a", "#6f5b45"];
const AVATAR_KEYS = ["moon", "crown", "leaf", "flame", "eye", "mask"];

export default function App() {
  const [language, setLanguage] = useState("en");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [avatarKey, setAvatarKey] = useState(AVATAR_KEYS[0]);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [roles, setRoles] = useState([]);
  const [room, setRoom] = useState(null);
  const [roomMode, setRoomMode] = useState("room");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

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

        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          setProfile(parsedProfile);
          setDisplayName(parsedProfile.displayName || "");
          setLanguage(parsedProfile.language || "en");
          setAvatarColor(parsedProfile.avatarColor || AVATAR_COLORS[0]);
          setAvatarKey(parsedProfile.avatarKey || AVATAR_KEYS[0]);
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

  async function saveProfile() {
    await run(async () => {
      const payload = {
        displayName,
        language,
        avatarColor,
        avatarKey
      };
      const response = profile ? await api.updateUser(profile._id, payload) : await api.createUser(payload);

      setProfile(response.user);
      setEditingProfile(false);
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(response.user));
    });
  }

  async function createRoom() {
    await run(async () => {
      const response = await api.createRoom(profile._id);
      setRoom(response.room);
      setRoomMode("room");
      watchRoom(response.room.code);
    });
  }

  async function joinRoom() {
    await run(async () => {
      const response = await api.joinRoom(joinCode, profile._id);
      setRoom(response.room);
      setRoomMode("room");
      setJoinCode("");
      watchRoom(response.room.code);
    });
  }

  function watchRoom(code) {
    socketRef.current?.disconnect();
    const socket = createRoomSocket(apiUrl, code, profile._id);
    socketRef.current = socket;
    socket.on("room:update", (nextRoom) => setRoom(nextRoom));
    socket.on("room:error", (payload) => setError(t(`error_${payload.error}`)));
  }

  async function updateRoleCount(roleKey, delta) {
    if (!room || !isHost) {
      return;
    }

    const currentCount = Number(room.roleCounts?.[roleKey] || 0);
    const role = roles.find((candidate) => candidate.key === roleKey);
    const nextCount = Math.max(0, Math.min(role?.max || 50, currentCount + delta));

    await run(async () => {
      const response = await api.updateRoles(room.code, profile._id, {
        ...room.roleCounts,
        [roleKey]: nextCount
      });
      setRoom(response.room);
    });
  }

  async function chooseNarrator(playerId) {
    await run(async () => {
      const response = await api.setNarrator(room.code, profile._id, playerId);
      setRoom(response.room);
    });
  }

  async function kickPlayer(playerId) {
    await run(async () => {
      const response = await api.kickPlayer(room.code, profile._id, playerId);
      setRoom(response.room);
    });
  }

  async function startGame() {
    await run(async () => {
      const response = await api.startGame(room.code, profile._id);
      setRoom(response.room);
    });
  }

  async function restartGame() {
    await run(async () => {
      const response = await api.restartGame(room.code, profile._id);
      setRoom(response.room);
      setRoomMode("room");
    });
  }

  async function setPhase(phase) {
    await run(async () => {
      const response = await api.setPhase(room.code, profile._id, phase);
      setRoom(response.room);
    });
  }

  async function advanceNight() {
    await run(async () => {
      const response = await api.advanceNight(room.code, profile._id);
      setRoom(response.room);
    });
  }

  async function openVote() {
    await run(async () => {
      const response = await api.openVote(room.code, profile._id);
      setRoom(response.room);
    });
  }

  async function castVote(targetPlayerId) {
    await run(async () => {
      const response = await api.castVote(room.code, profile._id, targetPlayerId);
      setRoom(response.room);
    });
  }

  async function resolveVote() {
    await run(async () => {
      const response = await api.resolveVote(room.code, profile._id);
      setRoom(response.room);
    });
  }

  async function setLife(player, isAlive) {
    await run(async () => {
      const response = await api.setLife(room.code, profile._id, player.id, isAlive);
      setRoom(response.room);
    });
  }

  async function leaveRoom() {
    await run(async () => {
      if (room && profile) {
        await api.leaveRoom(room.code, profile._id);
      }

      socketRef.current?.disconnect();
      socketRef.current = null;
      setRoom(null);
      setRoomMode("room");
      setJoinCode("");
      setError("");
    });
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Header title={t("appTitle")} subtitle={room ? `${t(room.phase)} ${room.dayNumber || ""}`.trim() : undefined} />

          {!profile || editingProfile ? (
            <ProfileScreen
              avatarColor={avatarColor}
              avatarKey={avatarKey}
              displayName={displayName}
              hasProfile={Boolean(profile)}
              isArabic={isArabic}
              language={language}
              setAvatarColor={setAvatarColor}
              setAvatarKey={setAvatarKey}
              setDisplayName={setDisplayName}
              setLanguage={setLanguage}
              t={t}
              onCancel={() => setEditingProfile(false)}
              onSubmit={saveProfile}
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
              onRoleCount={updateRoleCount}
              onOpenRoleSetup={() => setRoomMode("roles")}
              onRestart={restartGame}
              onStart={startGame}
            />
          ) : (
            <HubScreen
              isArabic={isArabic}
              joinCode={joinCode}
              profile={profile}
              setJoinCode={setJoinCode}
              t={t}
              onCreate={createRoom}
              onEditProfile={() => setEditingProfile(true)}
              onJoin={joinRoom}
            />
          )}

          {error ? <Text style={[styles.error, isArabic && styles.rtlText]}>{error}</Text> : null}
          {busy ? <ActivityIndicator color={theme.gold} style={styles.loader} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <View style={styles.moon} />
      <View>
        <Text style={styles.appTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ProfileScreen({
  avatarColor,
  avatarKey,
  displayName,
  hasProfile,
  isArabic,
  language,
  setAvatarColor,
  setAvatarKey,
  setDisplayName,
  setLanguage,
  t,
  onCancel,
  onSubmit
}) {
  return (
    <View style={styles.panel}>
      <Text style={[styles.title, isArabic && styles.rtlText]}>{t("profileTitle")}</Text>
      <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("profileSubtitle")}</Text>
      <Field label={t("displayName")} isArabic={isArabic}>
        <TextInput
          placeholder={t("displayNamePlaceholder")}
          placeholderTextColor={theme.muted}
          value={displayName}
          onChangeText={setDisplayName}
          style={[styles.input, isArabic && styles.rtlInput]}
        />
      </Field>
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
      <PrimaryButton label={t("saveProfile")} onPress={onSubmit} />
      {hasProfile ? <SecondaryButton label={t("cancel")} onPress={onCancel} /> : null}
    </View>
  );
}

function HubScreen({ isArabic, joinCode, profile, setJoinCode, t, onCreate, onEditProfile, onJoin }) {
  return (
    <View style={styles.panel}>
      <View style={[styles.profileRow, isArabic && styles.reverseRow]}>
        <Avatar name={profile.displayName} color={profile.avatarColor} avatarKey={profile.avatarKey} />
        <View style={styles.flex}>
          <Text style={[styles.title, isArabic && styles.rtlText]}>{t("roomHub")}</Text>
          <Text style={[styles.muted, isArabic && styles.rtlText]}>{profile.displayName}</Text>
        </View>
      </View>
      <SecondaryButton label={t("editProfile")} onPress={onEditProfile} />
      <PrimaryButton label={t("createRoom")} onPress={onCreate} />
      <Field label={t("roomCode")} isArabic={isArabic}>
        <TextInput
          autoCapitalize="characters"
          maxLength={6}
          placeholder={t("roomCodePlaceholder")}
          placeholderTextColor={theme.muted}
          value={joinCode}
          onChangeText={setJoinCode}
          style={styles.input}
        />
      </Field>
      <SecondaryButton label={t("joinRoom")} onPress={onJoin} />
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
  onRoleCount,
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
        onRoleCount={onRoleCount}
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

function RoleSetupPage({ activePlayerCount, isArabic, roleCount, roles, room, t, onClose, onRoleCount }) {
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <View style={styles.stack}>
      <View style={styles.roomCodeBand}>
        <View>
          <Text style={[styles.label, isArabic && styles.rtlText]}>{t("roleSetup")}</Text>
          <Text style={styles.roomCode}>{room.code}</Text>
        </View>
        <SecondaryButton compact label={t("closeRoleSetup")} onPress={onClose} />
      </View>
      <View style={styles.panel}>
      <View style={[styles.roleHeader, isArabic && styles.reverseRow]}>
        <Text style={[styles.sectionTitle, isArabic && styles.rtlText]}>{t("roleSetup")}</Text>
        <Text style={styles.countPill}>
          {t("deckTotal")}: {roleCount}/{activePlayerCount}
        </Text>
      </View>
      <Text style={[styles.muted, isArabic && styles.rtlText]}>{t("autoVillagers")}</Text>
      <View style={styles.roleGrid}>
        {roles.map((role) => (
          <RoleCountCard
            key={role.key}
            count={Number(room.roleCounts?.[role.key] || 0)}
            disabled={false}
            isArabic={isArabic}
            role={role}
            t={t}
            onMinus={() => onRoleCount(role.key, -1)}
            onPlus={() => onRoleCount(role.key, 1)}
            onRolePress={() => setSelectedRole(role)}
          />
        ))}
      </View>
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

function RoleCountCard({ count, disabled, isArabic, role, t, onMinus, onPlus, onRolePress }) {
  return (
    <View style={styles.roleCountCard}>
      <View style={[styles.roleMiniHeader, isArabic && styles.reverseRow]}>
        <Pressable onPress={onRolePress}>
          <RoleAvatar role={role} size={42} />
        </Pressable>
        <View style={styles.roleMiniText}>
          <Text style={[styles.roleName, isArabic && styles.rtlText]} numberOfLines={2}>{role.name}</Text>
          <Text style={[styles.smallMuted, isArabic && styles.rtlText]}>{t(role.faction)}</Text>
        </View>
      </View>
      <View style={styles.stepper}>
        <RoundButton disabled={disabled} label="-" onPress={onMinus} />
        <Text style={styles.stepperValue}>{count}</Text>
        <RoundButton disabled={disabled || count >= role.max} label="+" onPress={onPlus} />
      </View>
    </View>
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
        <SecondaryButton label={t("restartGame")} onPress={onRestart} />
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
  scrollContent: {
    padding: 18,
    paddingBottom: 36,
    gap: 14
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 8
  },
  moon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.gold,
    borderWidth: 5,
    borderColor: theme.cream
  },
  appTitle: {
    color: theme.text,
    fontSize: 34,
    fontWeight: "800"
  },
  headerSubtitle: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase"
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
