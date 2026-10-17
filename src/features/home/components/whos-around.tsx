import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { demoTravelers } from "@/features/profile/demo-travelers";
import { getDestination } from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

export function WhosAround() {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  return <View style={styles.section}>
    <View style={styles.heading}>
      <Text style={styles.title}>{t("home.whosAround")}</Text>
      <View style={styles.demoBadge}><Text style={styles.demoLabel}>{t("home.demo")}</Text></View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {demoTravelers.map((person) => <Pressable
        key={person.id}
        accessibilityRole="button"
        accessibilityLabel={t("home.viewTraveler", { name: person.name })}
        onPress={() => router.push({ pathname: "/traveler/[id]", params: { id: person.id } })}
        style={[styles.card, fontScale > 1.2 && { width: 170 }]}
      >
        <View style={[styles.person, { backgroundColor: person.color }]}>
          <Image source={{ uri: getDestination(person.coverId)?.image }} style={styles.avatar} contentFit="cover" />
          <Text numberOfLines={2} style={styles.name}>{person.name}</Text>
          <View style={styles.countryPill}><Text numberOfLines={1} style={styles.country}>{person.country}</Text><Text style={styles.flag}>{person.flag}</Text></View>
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
  demoBadge: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 20, backgroundColor: c.surfaceTertiary },
  demoLabel: { color: c.muted, fontSize: 11, fontWeight: "500" },
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
