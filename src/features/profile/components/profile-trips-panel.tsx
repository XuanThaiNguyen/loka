import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import type { TripDTO } from "@/features/trips/services/trips-api-service";
import { theme } from "@/theme/theme";

export function ProfileTripsPanel({ query }: { query: FeedbackQuery & { data?: TripDTO[] } }) {
  const { t } = useTranslation();
  const [scope, setScope] = useState<"owned" | "shared">("owned");
  const trips = query.isError ? [] : (query.data ?? []).filter((trip) => scope === "owned" ? trip.accessRole === "owner" : trip.accessRole === "viewer" || trip.accessRole === "editor");
  return <View style={styles.panel}>
    <View accessibilityRole="tablist" style={styles.scopes}>
      {(["owned", "shared"] as const).map((value) => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: scope === value }} onPress={() => setScope(value)} style={[styles.scope, scope === value && styles.selected]}><Text style={styles.label}>{t(`profileLayout.${value}Trips`)}</Text></Pressable>)}
    </View>
    <QueryFeedback query={query} hasData={query.data !== undefined && !query.isError} layout="card" announce={false} />
    {!query.isPending && !query.isError && query.fetchStatus !== "paused" && query.data !== undefined && !trips.length ? <Text style={styles.empty}>{t(scope === "owned" ? "profileLayout.emptyTrips" : "profileLayout.emptySharedTrips")}</Text> : null}
    <View style={styles.grid}>{trips.map((trip) => <Pressable key={trip.id} accessibilityRole="button" accessibilityLabel={trip.name} onPress={() => router.push({ pathname: "/trip/[id]", params: { id: trip.id } })} style={styles.gridItem}>
      <View style={styles.tile}>{trip.city?.coverImageUrl ? <Image source={{ uri: trip.city.coverImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="compass-outline" size={32} color={theme.colors.light.muted} />}</View>
      <Text numberOfLines={2} style={styles.tileLabel}>{trip.name}</Text>
    </Pressable>)}</View>
  </View>;
}
const c = theme.colors.light;
const styles = StyleSheet.create({
  panel: { padding: 20, gap: 16 }, scopes: { flexDirection: "row", gap: 12 },
  scope: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: c.separator },
  selected: { backgroundColor: c.gray[100] }, label: { color: c.foreground, fontSize: 13, lineHeight: 18 },
  empty: { color: c.muted, fontSize: 13, lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "3%", rowGap: 18 }, gridItem: { width: "31.33%", gap: 8 },
  tile: { width: "100%", aspectRatio: 0.57, borderRadius: 13, backgroundColor: c.surfaceSecondary, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  tileLabel: { color: c.foreground, fontSize: 12, lineHeight: 17, fontWeight: "500" },
});
