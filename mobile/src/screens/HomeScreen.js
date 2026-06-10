import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ROLE_IMAGES } from "../data/roleAssets";

const theme = {
  panelLight: "#3a261a",
  text: "#f6eadc",
  muted: "#c2ad98",
  gold: "#c99455",
  border: "rgba(246, 234, 220, 0.14)",
  ink: "#23150d"
};

export function HomeScreen({ hubMode, isArabic, joinCode, setHubMode, setJoinCode, t, onCreate, onOffline, onJoin }) {
  return (
    <ImageBackground source={ROLE_IMAGES.werewolf_background} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.scrim}>
        {hubMode === "join" ? (
          <View style={styles.joinPanel}>
            <Field label={t("roomCode")} isArabic={isArabic}>
              <TextInput
                autoCapitalize="characters"
                maxLength={6}
                placeholder={t("roomCodePlaceholder")}
                placeholderTextColor={theme.muted}
                value={joinCode}
                onChangeText={setJoinCode}
                style={[styles.input, isArabic && styles.rtlInput]}
              />
            </Field>
            <PrimaryButton label={t("joinRoom")} onPress={onJoin} />
          </View>
        ) : (
          <View style={styles.menuButtons}>
            <PrimaryButton label={t("hostRoom")} onPress={onCreate} />
            <SecondaryButton label={t("joinRoom")} onPress={() => setHubMode("join")} />
            <SecondaryButton label={t("offlineGame")} onPress={onOffline} />
          </View>
        )}
      </View>
    </ImageBackground>
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

function PrimaryButton({ disabled, label, onPress }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabledButton, pressed && !disabled && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    minHeight: "100%"
  },
  backgroundImage: {
    opacity: 0.9
  },
  scrim: {
    flex: 1,
    minHeight: 620,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
    backgroundColor: "rgba(27, 18, 13, 0.44)"
  },
  menuButtons: {
    width: "100%",
    maxWidth: 360,
    gap: 12
  },
  joinPanel: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "rgba(42, 27, 19, 0.9)",
    padding: 16,
    gap: 14
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
  disabledButton: {
    opacity: 0.45
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  rtlInput: {
    textAlign: "right"
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl"
  }
});
