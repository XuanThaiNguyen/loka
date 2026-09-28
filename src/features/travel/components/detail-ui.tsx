import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DetailGuide } from "@/features/travel/detail-guide";
import { theme } from "@/theme/theme";

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={detailStyles.section}><Text style={detailStyles.heading}>{title}</Text>{children}</View>;
}

export function DetailAction({ label, icon, onPress, disabled = false }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[detailStyles.action, disabled && { opacity: 0.45 }]}><Ionicons name={icon} size={19} color={theme.colors.light.accent} /><Text style={detailStyles.actionText}>{label}</Text></Pressable>;
}

export function DetailState({ loading, onRetry }: { loading?: boolean; onRetry?: () => void }) {
  const { t } = useTranslation();
  return <View style={detailStyles.card}>{loading ? <ActivityIndicator color={theme.colors.light.accent} /> : <><Text selectable style={detailStyles.body}>{t("detailGuide.loadError")}</Text>{onRetry && <DetailAction label={t("common.retry")} icon="refresh" onPress={onRetry} />}</>}</View>;
}

export function GuideRows({ guide }: { guide?: DetailGuide }) {
  const { t } = useTranslation();
  if (!guide) return null;
  const fields = ["visitDuration", "bestTimeOfDay", "bestSeason", "transport", "accessibility", "facilities", "bookingAdvice", "safetyNotes"] as const;
  return <>{fields.filter((key) => guide[key]).map((key) => <View key={key} style={detailStyles.card}><Text style={detailStyles.label}>{t(`detailGuide.${key}`)}</Text><Text selectable style={detailStyles.body}>{guide[key]}</Text></View>)}</>;
}

export function PhotoGallery({ images, title }: { images: readonly string[]; title: string }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<number | null>(null);
  const photos = [...new Set(images.filter(Boolean))];
  if (!photos.length) return null;
  return <DetailSection title={`${title} · ${photos.length}`}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detailStyles.row}>
      {photos.map((uri, index) => <Pressable accessibilityRole="button" accessibilityLabel={t("detailGuide.photo", { index: index + 1, count: photos.length })} key={uri} onPress={() => setSelected(index)}><Image source={{ uri }} style={detailStyles.thumbnail} contentFit="cover" /></Pressable>)}
    </ScrollView>
    <Modal visible={selected !== null} animationType="fade" onRequestClose={() => setSelected(null)}>
      <View style={{ flex: 1, backgroundColor: "#111827", paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={detailStyles.modalBar}><Text style={{ color: "white" }}>{(selected ?? 0) + 1} / {photos.length}</Text><DetailAction label={t("detailGuide.close")} icon="close" onPress={() => setSelected(null)} /></View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} maximumZoomScale={3} minimumZoomScale={1} centerContent key={selected}>
          <Image source={{ uri: photos[selected ?? 0] }} style={{ flex: 1, minHeight: 300, width: "100%" }} contentFit="contain" accessibilityLabel={title} />
        </ScrollView>
        <View style={detailStyles.modalBar}>
          <DetailAction label={t("common.back")} icon="arrow-back" disabled={selected === 0} onPress={() => setSelected((value) => Math.max(0, (value ?? 0) - 1))} />
          <DetailAction label={t("detailGuide.next")} icon="arrow-forward" disabled={selected === photos.length - 1} onPress={() => setSelected((value) => Math.min(photos.length - 1, (value ?? 0) + 1))} />
        </View>
      </View>
    </Modal>
  </DetailSection>;
}

export function openPlaceMap(query: string, errorMessage: string, coordinates?: { latitude?: number; longitude?: number }) {
  const lat = coordinates?.latitude;
  const lng = coordinates?.longitude;
  const precise = typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90 && typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180;
  const target = precise ? `${lat},${lng}` : query;
  const url = process.env.EXPO_OS === "ios"
    ? `https://maps.apple.com/?q=${encodeURIComponent(query)}${precise ? `&ll=${target}` : ""}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
  void Linking.openURL(url).catch(() => Alert.alert(errorMessage));
}

export const detailStyles = StyleSheet.create({
  section: { gap: 12 },
  heading: { color: theme.colors.light.gray[900], fontSize: 19, lineHeight: 26, fontWeight: "800" },
  title: { color: theme.colors.light.gray[900], fontSize: 28, lineHeight: 36, fontWeight: "900" },
  body: { color: theme.colors.light.gray[600], fontSize: 14, lineHeight: 22 },
  label: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 19, fontWeight: "800" },
  card: { padding: 16, gap: 8, borderRadius: 18, borderCurve: "continuous", backgroundColor: theme.colors.light.gray[50] },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: { minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: theme.colors.light.accentSoft },
  actionText: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 19, fontWeight: "800", flexShrink: 1 },
  thumbnail: { width: 124, height: 100, borderRadius: 16 },
  modalBar: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
