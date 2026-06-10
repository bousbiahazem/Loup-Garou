import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const theme = {
  panel: "#2a1b13",
  panelLight: "#3a261a",
  text: "#f6eadc",
  muted: "#c2ad98",
  gold: "#c99455",
  red: "#8f4232",
  border: "rgba(246, 234, 220, 0.14)",
  ink: "#23150d"
};

export function ConfirmDialog({ cancelLabel, confirmLabel, dialog, isArabic, onCancel, onConfirm }) {
  return (
    <Modal animationType="fade" transparent visible={Boolean(dialog)} onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[styles.title, isArabic && styles.rtlText]}>{dialog?.title}</Text>
          <Text style={[styles.message, isArabic && styles.rtlText]}>{dialog?.message}</Text>
          <View style={[styles.actions, isArabic && styles.reverseRow]}>
            <Pressable onPress={onCancel} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.secondaryText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0, 0, 0, 0.66)"
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.panel,
    padding: 18,
    gap: 14
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  message: {
    color: theme.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    gap: 10
  },
  reverseRow: {
    flexDirection: "row-reverse"
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.panelLight,
    paddingHorizontal: 12
  },
  confirmButton: {
    borderColor: "rgba(201, 148, 85, 0.45)",
    backgroundColor: theme.gold
  },
  secondaryText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800"
  },
  confirmText: {
    color: theme.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl"
  }
});
