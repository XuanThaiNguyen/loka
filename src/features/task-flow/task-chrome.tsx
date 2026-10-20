import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, travelSurfaces } from "@/theme/theme";

export function TaskHeader({ title, back, step = 0, total, pending }: {
  title: string; back: () => void; step?: number; total?: number; pending?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return <View style={[s.header, { paddingTop: insets.top + 8 }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t(step > 0 ? "common.back" : "taskFlow.close")} accessibilityState={{ disabled: pending }} disabled={pending} onPress={back} style={s.exit}>
      <Ionicons name={step > 0 ? "arrow-back" : "close"} size={22} color={travelSurfaces.foreground} />
    </Pressable>
    <View style={s.heading}><Text accessibilityRole="header" style={s.title}>{title}</Text>
      {total ? <Text accessibilityLiveRegion="polite" style={s.progress}>{t("travelPlan.workspace.progressStep", { current: step + 1, total })}</Text> : null}
    </View>
  </View>;
}

export function TaskFooter({ label, onPress, pending, disabled }: { label: string; onPress: () => void; pending?: boolean; disabled?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: pending || disabled, busy: pending }} disabled={pending || disabled} onPress={onPress} style={[s.primary, (pending || disabled) && s.disabled]}>
      {pending ? <ActivityIndicator color={theme.colors.light.base.white} /> : null}
      <Text style={s.primaryText}>{pending ? t("taskFlow.saving") : label}</Text>
    </Pressable>
  </View>;
}

export function TaskEditorLayout({ title, back, pending, valid, save, children }: {
  title: string; back: () => void; pending: boolean; valid: boolean; save: () => void; children: ReactNode;
}) {
  const { t } = useTranslation();
  return <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={s.screen}>
    <TaskHeader title={title} back={back} pending={pending} />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>
    <TaskFooter label={t("common.save")} onPress={save} pending={pending} disabled={!valid} />
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: travelSurfaces.header },
  exit: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  heading: { flex: 1, gap: 2 }, title: { fontSize: 16, lineHeight: 22, fontWeight: "600", color: travelSurfaces.foreground },
  progress: { fontSize: 12, lineHeight: 18, color: travelSurfaces.secondary },
  content: { padding: 20, paddingBottom: 28, gap: 20 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.light.separator, backgroundColor: theme.colors.light.background },
  primary: { minHeight: 52, borderRadius: 28, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.light.accent },
  primaryText: { flexShrink: 1, textAlign: "center", fontSize: 14, lineHeight: 21, fontWeight: "600", color: theme.colors.light.base.white },
  disabled: { opacity: 0.45 },
});
