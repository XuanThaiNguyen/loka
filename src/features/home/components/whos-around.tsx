import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useRecentTravelers } from "@/features/discovery/services/discovery-api-service";
import { DiscoveryState } from "@/features/discovery/components/discovery-state";
import { theme } from "@/theme/theme";

export function WhosAround() {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const query = useRecentTravelers();
  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text style={styles.title}>{t("home.whosAround")}</Text>
    </View>
    <Text style={[styles.country, { paddingHorizontal: 20 }]}>{t("discovery.description")}</Text>
    <DiscoveryState query={query} empty={!query.cards.length} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {query.cards.map((card) => <Pressable
        key={card.traveler.accountId}
        accessibilityRole="button"
        accessibilityLabel={t("home.viewTraveler", { name: card.traveler.displayName })}
        onPress={() => router.push({ pathname: "/traveler/[id]", params: { id: card.traveler.accountId } })}
        style={[styles.card, fontScale > 1.2 && { width: 170 }]}
      >
        <View style={[styles.person, { backgroundColor: c.surfaceSecondary }]}>
          <Image source={{ uri: card.traveler.avatarUrl ?? undefined }} style={styles.avatar} contentFit="cover" />
          <Text numberOfLines={2} style={styles.name}>{card.traveler.displayName}</Text>
          <View style={styles.countryPill}><Text numberOfLines={2} style={styles.country}>{card.recentTrip.city?.name ?? t("discovery.recentTrip")}</Text></View>
        </View>
        <View style={styles.profileButton}><Text style={styles.profileLabel}>{t("home.viewProfile")}</Text></View>
      </Pressable>)}
    </ScrollView>
  </View>;
}

const c = theme.colors.light;
const styles = StyleSheet.create({
  section: { gap: 14 },
  heading: { paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { flex: 1, color: c.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { width: 116, gap: 7 },
  person: { padding: 12, borderRadius: 15, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#ffffffaa" },
  name: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: c.foreground },
  countryPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: "#ffffffdd" },
  country: { flex: 1, fontSize: 10, lineHeight: 15, color: c.muted },
  flag: { fontSize: 11 },
  profileButton: { minHeight: 48, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 24, backgroundColor: "#232c33", alignItems: "center", justifyContent: "center" },
  profileLabel: { color: "#ffffff", fontSize: 11, lineHeight: 16, fontWeight: "500", textAlign: "center" },
});
