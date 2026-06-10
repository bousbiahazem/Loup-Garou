import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const logoImage = require("../../assets/roles/logo.png");

const theme = {
  panelLight: "#3a261a",
  text: "#f6eadc",
  gold: "#c99455",
  border: "rgba(246, 234, 220, 0.14)",
  cream: "#f3dfc4",
  ink: "#23150d"
};

export function AppHeader({ canGoBack, showProfile, title, subtitle, onBackPress, onProfilePress }) {
  return (
    <View style={styles.header}>
      {canGoBack ? (
        <Pressable onPress={onBackPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Text style={styles.iconText}>{"\u2039"}</Text>
        </Pressable>
      ) : (
        <Image source={logoImage} style={styles.logo} />
      )}
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {showProfile ? (
        <Pressable onPress={onProfilePress} style={({ pressed }) => [styles.iconButton, styles.profileButton, pressed && styles.pressed]}>
          <Text style={[styles.iconText, styles.profileIconText]}>{"\u2699"}</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 8
  },
  headerText: {
    flex: 1
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelLight,
    borderWidth: 1,
    borderColor: theme.border
  },
  iconText: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30
  },
  profileButton: {
    backgroundColor: theme.gold,
    borderColor: theme.cream,
    borderWidth: 2,
    elevation: 6
  },
  profileIconText: {
    color: theme.ink,
    fontSize: 24,
    lineHeight: 28
  },
  spacer: {
    width: 44,
    height: 44
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: theme.cream,
    backgroundColor: theme.panelLight
  },
  title: {
    color: theme.text,
    fontSize: 34,
    fontWeight: "800"
  },
  subtitle: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  }
});
