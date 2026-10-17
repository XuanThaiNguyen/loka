import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { getDemoTraveler } from "@/features/profile/demo-travelers";
import { theme } from "@/theme/theme";

export function TravelerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const traveler = getDemoTraveler(id);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(null);
  const goBack = () => router.canGoBack() ? router.back() : router.replace("/");

  if (!traveler) return <View style={[styles.empty, { paddingTop: insets.top, flex: 1 }]}>
    <Text style={styles.bio}>{t("travelerProfile.notFound")}</Text>
    <Pressable accessibilityRole="button" onPress={goBack} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={c.foreground} /><Text>{t("common.back")}</Text></Pressable>
  </View>;

  return <View style={styles.screen}>
    <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View style={{ height: insets.top + 190, backgroundColor: traveler.color }}>
        <Image source={{ uri: traveler.cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={goBack} style={[styles.backButton, styles.coverBack, { top: insets.top + 10 }]}><Ionicons name="arrow-back" size={22} color={c.foreground} /></Pressable>
      </View>
      <View style={styles.identity}>
        <View style={styles.avatarRing}><Image source={{ uri: traveler.cover }} style={styles.avatar} contentFit="cover" /></View>
        <View style={styles.nameRow}><Text style={styles.name}>{traveler.name}</Text><View style={styles.demoBadge}><Text style={styles.demoText}>{t("home.demo")}</Text></View></View>
        <Text style={styles.country}>{traveler.flag} {traveler.country}</Text>
        <Text style={styles.bio}>{t(`travelerProfile.bios.${traveler.id}`)}</Text>
        <Text style={styles.demoNote}>{t("travelerProfile.demoNotice")}</Text>
        <View style={styles.stats}>
          {(["trips", "followers", "following"] as const).map((key, index) => <View key={key} style={[styles.stat, index > 0 && styles.statBorder]}><Text style={styles.statValue}>{key === "trips" ? traveler.destinations.length : "—"}</Text><Text style={styles.statLabel}>{t(`profileLayout.${key}`)}</Text></View>)}
        </View>
      </View>
      <ProfileTabs>
        <View style={styles.grid}>
          {traveler.destinations.map((destination) => <Pressable key={destination.id} accessibilityRole="button" accessibilityLabel={t(`travel.destinations.${destination.id}.title`)} style={styles.tile} onPress={() => router.push({ pathname: "/destination/[id]", params: { id: destination.id } })}>
            <Image source={{ uri: destination.image }} style={styles.tileImage} contentFit="cover" />
            <Text numberOfLines={2} style={styles.tileLabel}>{t(`travel.destinations.${destination.id}.title`)}</Text>
          </Pressable>)}
        </View>
        <View style={styles.grid}>
          {traveler.destinations.map((destination) => <Pressable key={destination.id} accessibilityRole="button" accessibilityLabel={t("profileGallery.viewPhoto")} style={styles.tile} onPress={() => setPhoto(destination.image)}><Image source={{ uri: destination.image }} style={styles.tileImage} contentFit="cover" /></Pressable>)}
        </View>
        <View style={styles.empty}><Ionicons name="lock-closed-outline" size={30} color={c.muted} /><Text style={styles.emptyText}>{t("travelerProfile.savedPrivate")}</Text></View>
      </ProfileTabs>
    </ScrollView>
    <Modal visible={photo !== null} animationType="fade" onRequestClose={() => setPhoto(null)}>
      <View style={[styles.photoPreview, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("detailGuide.close")} onPress={() => setPhoto(null)} style={styles.closeButton}><Ionicons name="close" size={26} color="#ffffff" /></Pressable>
        {photo ? <Image source={{ uri: photo }} style={{ flex: 1, width: "100%" }} contentFit="contain" /> : null}
      </View>
    </Modal>
  </View>;
}

const c = theme.colors.light;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  backButton: { minWidth: 44, minHeight: 44, padding: 10, borderRadius: 24, backgroundColor: c.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  coverBack: { position: "absolute", left: 20 },
  identity: { marginTop: -24, paddingHorizontal: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: c.surface },
  avatarRing: { marginTop: -49, marginLeft: 8, marginBottom: 18, width: 104, height: 104, borderRadius: 52, padding: 5, backgroundColor: c.surface },
  avatar: { width: 94, height: 94, borderRadius: 47 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { flexShrink: 1, color: c.foreground, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  demoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: c.surfaceSecondary },
  demoText: { color: c.muted, fontSize: 11 },
  country: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },
  bio: { color: c.muted, fontSize: 15, lineHeight: 23, marginTop: 18 },
  demoNote: { color: c.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  stats: { flexDirection: "row", marginVertical: 24 },
  stat: { flex: 1, alignItems: "center", gap: 7 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: c.separator },
  statValue: { color: c.foreground, fontSize: 18, fontWeight: "700" },
  statLabel: { color: c.muted, fontSize: 13 },
  grid: { padding: 20, flexDirection: "row", flexWrap: "wrap", columnGap: "3%", rowGap: 18 },
  tile: { width: "31.33%", gap: 8 },
  tileImage: { width: "100%", aspectRatio: 0.57, borderRadius: 13, backgroundColor: c.surfaceSecondary },
  tileLabel: { color: c.foreground, fontSize: 12, lineHeight: 17, fontWeight: "500" },
  empty: { padding: 32, alignItems: "center", justifyContent: "center", gap: 14 },
  emptyText: { color: c.muted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  photoPreview: { flex: 1, backgroundColor: "#15191d" },
  closeButton: { alignSelf: "flex-end", padding: 14, marginRight: 8 },
});
