import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QueryFeedback } from "@/components/ui/loading-skeleton";
import { useTravelerProfile } from "@/features/discovery/services/discovery-api-service";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { ApiError } from "@/lib/api/client";
import { theme } from "@/theme/theme";

export function TravelerProfileScreen() {
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const query = useTravelerProfile(id);
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const goBack = () => router.canGoBack() ? router.back() : router.replace("/");
  const profile = query.data?.pages[0]?.data;
  const unavailable = query.error instanceof ApiError && query.error.status === 404;
  const back = <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={goBack} style={styles.backButton}><Ionicons name="arrow-back" size={22} color={c.foreground} /><Text>{t("common.back")}</Text></Pressable>;

  // Never keep a cached public wall visible after an authorization/visibility failure.
  if (!id || unavailable || query.isError || !profile) return <View style={[styles.empty, { paddingTop: insets.top + 20, flex: 1 }]}>
    {back}
    {!id || unavailable ? <Text style={styles.bio}>{t("discovery.unavailable")}</Text> : <QueryFeedback query={query} layout="detail" />}
  </View>;

  const photos = query.data!.pages.flatMap((page) => page.data.photos).filter((photo, index, all) => all.findIndex((item) => item.id === photo.id) === index);
  const cover = photos.find((photo) => photo.image.kind === "public-photo")?.image;
  const trips = query.data!.pages.flatMap((page) => page.data.recentTrips).filter((trip, index, all) => all.findIndex((item) => item.id === trip.id) === index);
  const date = (value: string) => new Date(value).toLocaleDateString(i18n.language);

  return <View style={styles.screen}>
    <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View style={{ height: insets.top + 190, backgroundColor: c.surfaceSecondary }}>
        <Image source={{ uri: cover?.kind === "public-photo" ? cover.url : profile.traveler.avatarUrl ?? undefined }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={goBack} style={[styles.backButton, styles.coverBack, { top: insets.top + 10 }]}><Ionicons name="arrow-back" size={22} color={c.foreground} /></Pressable>
      </View>
      <View style={styles.identity}>
        <View style={styles.avatarRing}><Image source={{ uri: profile.traveler.avatarUrl ?? undefined }} style={styles.avatar} contentFit="cover" /></View>
        <View style={styles.nameRow}><Text style={styles.name}>{profile.traveler.displayName}</Text></View>
        <Text style={styles.bio}>{t("discovery.publicMoments")}</Text>
        <View style={styles.stats}>
          {[{ value: profile.publicTripCount, label: t("profileLayout.trips") }, { value: profile.socialCounts?.followers, label: t("profileLayout.followers") }, { value: profile.socialCounts?.following, label: t("profileLayout.following") }].map((stat, index) => <View key={stat.label} style={[styles.stat, index > 0 && styles.statBorder]}>
            <Text style={styles.statValue}>{stat.value == null ? "—" : stat.value.toLocaleString(i18n.language)}</Text><Text style={styles.statLabel}>{stat.label}</Text>
          </View>)}
        </View>
        {!profile.socialCounts ? <Text style={styles.emptyText}>{t("discovery.countsUnavailable")}</Text> : null}
        <QueryFeedback query={query} hasData />
      </View>
      <ProfileTabs>
        <View style={styles.grid}>
          {trips.length ? trips.map((trip) => <Pressable key={trip.id} accessibilityRole="button" accessibilityLabel={t("discovery.viewVisit", { city: trip.city?.name ?? t("discovery.recentTrip") })} style={styles.tile} onPress={() => router.push({ pathname: "/traveler/[id]/visit/[tripId]", params: { id, tripId: String(trip.id) } })}>
            <View style={[styles.tileImage, { alignItems: "center", justifyContent: "center" }]}><Ionicons name="compass-outline" size={32} color={c.muted} /></View>
            <Text style={styles.tileLabel}>{trip.city ? `${trip.city.name}, ${trip.city.country}` : t("discovery.recentTrip")}</Text>
            <Text style={styles.tileLabel}>{t("discovery.completed", { date: date(trip.completedAt) })}</Text>
          </Pressable>) : <Text style={styles.emptyText}>{t("discovery.noTrips")}</Text>}
          {query.data!.pages.at(-1)?.meta.tripsHasMore ? <Pressable accessibilityRole="button" disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} style={styles.backButton}><Text style={styles.tileLabel}>{t(query.isFetchingNextPage ? "loadingUi.content" : "discovery.loadMoreVisits")}</Text></Pressable> : null}
        </View>
        <View>
          <View style={styles.grid}>
            {photos.length ? photos.map((photo) => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={t("profileGallery.viewPhoto")} disabled={photo.image.kind !== "public-photo"} style={styles.tile} onPress={() => router.push({ pathname: "/traveler/[id]/photo/[photoId]", params: { id, photoId: photo.id } })}>
              <Image source={{ uri: photo.image.kind === "public-photo" ? photo.image.url : undefined }} style={styles.tileImage} contentFit="cover" />
            </Pressable>) : <Text style={styles.emptyText}>{t("discovery.noPhotos")}</Text>}
          </View>
          {query.data!.pages.at(-1)?.meta.hasMore ? <Pressable accessibilityRole="button" accessibilityState={{ disabled: query.isFetchingNextPage }} disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} style={styles.backButton}>
            <Text style={styles.tileLabel}>{t(query.isFetchingNextPage ? "loadingUi.content" : "profileGallery.loadMore")}</Text>
          </Pressable> : null}
        </View>
        <View style={styles.empty}><Ionicons name="lock-closed-outline" size={30} color={c.muted} /><Text style={styles.emptyText}>{t("travelerProfile.savedPrivate")}</Text></View>
      </ProfileTabs>
    </ScrollView>

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
