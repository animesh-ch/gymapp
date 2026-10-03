import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/theme";

export function Screen({
  children,
  scroll = false,
  includeTop = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  includeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = includeTop ? insets.top + 28 : 8;
  const paddingBottom = insets.bottom + 28;
  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.scrollContent, { paddingTop, paddingBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.screen, styles.body, { paddingTop, paddingBottom }]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "solid",
}: {
  label: string;
  onPress: PressableProps["onPress"];
  disabled?: boolean;
  variant?: "solid" | "outline" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "solid" ? styles.buttonSolid : variant === "danger" ? styles.buttonDanger : styles.buttonOutline,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === "solid" ? styles.buttonLabelSolid : variant === "danger" ? styles.buttonLabelDanger : styles.buttonLabelOutline,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export function Notice({ message, tone = "muted" }: { message: string; tone?: "muted" | "danger" }) {
  return <Text style={[styles.notice, tone === "danger" ? styles.noticeDanger : null]}>{message}</Text>;
}

export function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogBody}>{body}</Text>
          <View style={styles.dialogActions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.dialogCancel}>
              <Text style={styles.dialogCancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.dialogConfirm}>
              <Text style={[styles.dialogConfirmLabel, destructive ? styles.buttonLabelDanger : null]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  body: {
    paddingHorizontal: 20,
    gap: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonSolid: {
    backgroundColor: theme.accent,
  },
  buttonOutline: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  buttonDanger: {
    backgroundColor: theme.dangerSurface,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  buttonLabelSolid: {
    color: theme.accentInk,
  },
  buttonLabelOutline: {
    color: theme.text,
  },
  buttonLabelDanger: {
    color: theme.danger,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  chipLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "600",
  },
  chipLabelSelected: {
    color: theme.accentInk,
  },
  fieldLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  notice: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeDanger: {
    color: theme.danger,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.surfaceRaised,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.line,
  },
  dialogTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "700",
  },
  dialogBody: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 8,
  },
  dialogCancel: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dialogCancelLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "600",
  },
  dialogConfirm: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dialogConfirmLabel: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "700",
  },
});
