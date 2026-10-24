import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryFeedback } from "@/components/ui/loading-skeleton";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { useTravelerPhoto, useTravelerVisit } from "@/features/discovery/services/discovery-api-service";
import { ApiError } from "@/lib/api/client";
import { theme } from "@/theme/theme";

function Back({ accountId }: { accountId: string }) {
 const { t } = useTranslation();
 return <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} style={styles.back} onPress={() => router.canGoBack() ? router.back() : accountId ? router.replace({ pathname: "/traveler/[id]", params: { id: accountId } }) : router.replace("/")}><Ionicons name="arrow-back" size={22} color={c.foreground} /><Text style={styles.body}>{t("common.back")}</Text></Pressable>;
}
export function TravelerVisitScreen() {
 const { id = "", tripId = "" } = useLocalSearchParams<{ id: string; tripId: string }>();
 const query = useTravelerVisit(id, tripId);
 const { t, i18n } = useTranslation();
 const insets = useSafeAreaInsets();
 const data = !query.isError ? query.data?.pages[0]?.data : undefined;
 const unavailable = !id || !tripId || query.error instanceof ApiError && query.error.status === 404;
 const photos = query.data?.pages.flatMap((page) => page.data.photos).filter((photo, index, all) => all.findIndex((item) => item.id === photo.id) === index) ?? [];
 return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
  <Back accountId={id} />
  {!data ? unavailable ? <Text style={styles.body}>{t("discovery.detailUnavailable")}</Text> : <QueryFeedback query={query} layout="detail" /> : <>
   <Text style={styles.title}>{t("discovery.visitDetails")}</Text><Text style={styles.body}>{data.traveler.displayName}</Text>
   <Text style={styles.title}>{data.visit.city ? `${data.visit.city.name}, ${data.visit.city.country}` : t("discovery.recentTrip")}</Text>
   <Text style={styles.body}>{t("discovery.completed", { date: new Date(data.visit.completedAt).toLocaleDateString(i18n.language) })}</Text>
   <Text style={styles.body}>{t("discovery.visitPrivacy")}</Text><QueryFeedback query={query} hasData />
   <View style={styles.grid}>{photos.length ? photos.map((photo) => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={t("profileGallery.viewPhoto")} disabled={photo.image.kind !== "public-photo"} style={styles.tile} onPress={() => router.push({ pathname: "/traveler/[id]/photo/[photoId]", params: { id, photoId: photo.id } })}><Image source={{ uri: photo.image.kind === "public-photo" ? photo.image.url : undefined }} style={styles.thumbnail} contentFit="cover" /></Pressable>) : <Text style={styles.body}>{t("discovery.noPhotos")}</Text>}</View>
   {query.hasNextPage ? <Pressable accessibilityRole="button" disabled={query.isFetchingNextPage} style={styles.back} onPress={() => void query.fetchNextPage()}><Text style={styles.body}>{t(query.isFetchingNextPage ? "loadingUi.content" : "profileGallery.loadMore")}</Text></Pressable> : null}
  </>}
 </ScrollView>;
}
export function TravelerPhotoScreen() {
 const { id = "", photoId = "" } = useLocalSearchParams<{ id: string; photoId: string }>();
 const query = useTravelerPhoto(id, photoId);
 const { t, i18n } = useTranslation();
 const insets = useSafeAreaInsets();
 const data = !query.isError ? query.data?.data : undefined;
 const unavailable = !id || !photoId || query.error instanceof ApiError && query.error.status === 404;
 return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
  <Back accountId={id} />
  {!data ? unavailable ? <Text style={styles.body}>{t("discovery.detailUnavailable")}</Text> : <QueryFeedback query={query} layout="detail" /> : <>
   <Text style={styles.title}>{t("discovery.photoDetails")}</Text><Text style={styles.body}>{data.traveler.displayName}</Text>
   {data.photo.image.kind === "public-photo" ? <Image accessibilityLabel={t("discovery.photoDetails")} source={{ uri: data.photo.image.url }} style={styles.photo} contentFit="contain" /> : <View><Text style={styles.body}>{t("discovery.photoUnavailable")}</Text><Pressable accessibilityRole="button" onPress={() => void query.refetch()} style={styles.back}><Text style={styles.body}>{t("common.retry")}</Text></Pressable></View>}
   {data.photo.caption ? <Text style={styles.body}>{data.photo.caption}</Text> : null}
   <Text style={styles.caption}>{new Date(data.photo.createdAt).toLocaleDateString(i18n.language)}</Text><QueryFeedback query={query} hasData />
  </>}
 </ScrollView>;
}
const c = theme.colors.light;
const styles = StyleSheet.create({
 screen: { flex: 1, backgroundColor: c.surface },
 back: { minHeight: 44, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
 title: { color: c.foreground, fontSize: 23, lineHeight: 30, fontWeight: "600", marginTop: 18 },
 body: { color: c.muted, fontSize: 15, lineHeight: 23, marginVertical: 8 },
 caption: { color: c.muted, fontSize: 12, lineHeight: 17, marginVertical: 8 },
 grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "3%", rowGap: 18, marginVertical: 20 },
 tile: { width: "31.33%" },
 thumbnail: { width: "100%", aspectRatio: 0.57, borderRadius: 13, backgroundColor: c.surfaceSecondary },
 photo: { width: "100%", aspectRatio: 0.75, borderRadius: 13, backgroundColor: c.surfaceSecondary, marginVertical: 20 },
});
