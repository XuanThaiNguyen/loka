import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "heroui-native";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-provider";
import { useCurrentAccount } from "@/features/profile/services/profile-api-service";
import { useGallery, useUploadGalleryPhoto, type GalleryPhoto } from "@/features/profile/services/gallery-api-service";
import { useTrips } from "@/features/trips/services/trips-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

const c = theme.colors.light;
type Visibility = "all" | "public" | "private";

export function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const account = useCurrentAccount();
  const user = account.data ?? session?.user;
  const tripsQuery = useTrips();
  const trips = tripsQuery.data ?? [];
  const ownedTrips = trips.filter((trip) => trip.accessRole === "owner");
  const [tripId, setTripId] = useState<number>();
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadTrip, setUploadTrip] = useState<number>();
  const [caption, setCaption] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<"public" | "private">("private");
  const [picking, setPicking] = useState(false);
  const gallery = useGallery(user?.id, tripId);
  const allPhotos = useGallery(user?.id);
  const upload = useUploadGalleryPhoto();
  const insets = useSafeAreaInsets();
  const bottom = useTabBottomPadding();
  const loaded = gallery.data?.pages.flatMap((page) => page.data) ?? [];
  const photos = loaded.filter((photo) => visibility === "all" || photo.visibility === visibility);
  const selectedPhoto = loaded.find((photo) => photo.id === selectedPhotoId);
  const totalLoaded = allPhotos.data?.pages.reduce((sum, page) => sum + page.data.length, 0) ?? 0;
  const name = user?.name?.trim() || t("profile.fallbackName");

  const choosePhoto = async () => {
    if (!ownedTrips.length) {
      Alert.alert(t("profileGallery.upload"), t("profileGallery.needTrip"));
      return;
    }
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible });
      if (result.canceled) return;
      const picked = result.assets[0];
      if (!picked || (picked.fileSize != null && picked.fileSize > 10 * 1024 * 1024)) throw new Error(t("profileGallery.fileLimit"));
      if (picked.mimeType && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(picked.mimeType)) throw new Error(t("profileGallery.fileLimit"));
      setAsset(picked);
      setUploadTrip(ownedTrips.some((trip) => trip.id === tripId) ? tripId : ownedTrips[0].id);
      setCaption("");
      setUploadVisibility("private");
    } catch (error) { Alert.alert(t("profileGallery.error"), error instanceof Error ? error.message : t("profileGallery.retry")); }
    finally { setPicking(false); }
  };
  const submitPhoto = () => {
    if (!asset || !uploadTrip || upload.isPending) return;
    const body = new FormData();
    if (asset.file) body.append("photo", asset.file);
    else body.append("photo", { uri: asset.uri, name: asset.fileName ?? "photo.jpg", type: asset.mimeType ?? "image/jpeg" } as unknown as Blob);
    body.append("tripId", String(uploadTrip));
    body.append("caption", caption.trim());
    body.append("visibility", uploadVisibility);
    upload.mutate(body, {
      onSuccess: () => { setAsset(null); setTripId(uploadTrip); setVisibility("all"); },
      onError: (error) => Alert.alert(t("profileGallery.error"), error.message),
    });
  };
  const retry = () => { void gallery.refetch(); void allPhotos.refetch(); void tripsQuery.refetch(); void account.refetch(); };

  return <View style={{ flex: 1, backgroundColor: c.background }}>
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: c.foreground }}>{t("profile.title")}</Text>
      <Button isIconOnly variant="secondary" accessibilityLabel={t("profileGallery.settings")} onPress={() => router.push("/settings")}><Ionicons name="settings-outline" size={23} color={c.foreground} /></Button>
    </View>
    <FlatList
      data={photos} numColumns={2} keyExtractor={(photo) => photo.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom, gap: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      refreshing={gallery.isRefetching || tripsQuery.isRefetching} onRefresh={retry}
      ListHeaderComponent={<View style={{ gap: 20, paddingBottom: 24 }}>
        <View style={{ gap: 16, padding: 24, borderRadius: 28, backgroundColor: c.surface }}>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            {user?.image ? <Image source={{ uri: user.image }} style={{ width: 76, height: 76, borderRadius: 38 }} /> : <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 28, fontWeight: "700", color: c.accent }}>{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View>}
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={{ fontSize: 22, lineHeight: 29, fontWeight: "800", color: c.foreground }}>{name}</Text>
              <Text style={{ color: c.accent, fontWeight: "600" }}>{t("profileGallery.yours")}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
            <Text style={{ color: c.foreground, fontWeight: "700" }}>{allPhotos.isError || !allPhotos.data ? "—" : totalLoaded + (allPhotos.hasNextPage ? "+" : "")} {t("profileGallery.photos")}</Text>
            <Text style={{ color: c.foreground, fontWeight: "700" }}>{tripsQuery.data ? trips.length : "—"} {t("profileGallery.trips")}</Text>
          </View>
          <Text style={{ color: c.muted, lineHeight: 21 }}>{t("profileGallery.description")}</Text>
          <Button isDisabled={picking || tripsQuery.isPending || tripsQuery.isError} onPress={() => void choosePhoto()}><Ionicons name="add" size={20} color={c.accentForeground} /><Button.Label>{t("profileGallery.upload")}</Button.Label></Button>
          {tripsQuery.isError || allPhotos.isError ? <Button variant="ghost" onPress={retry}><Button.Label>{t("profileGallery.retry")}</Button.Label></Button> : null}
        </View>
        <Button variant="secondary" onPress={() => setFilterOpen(true)}><Ionicons name="options-outline" size={18} color={c.accent} /><Button.Label>{trips.find((trip) => trip.id === tripId)?.name ?? t("profileGallery.allTrips")}</Button.Label></Button>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{(["all", "public", "private"] as const).map((value) => <Button key={value} size="sm" variant={visibility === value ? "primary" : "secondary"} accessibilityState={{ selected: visibility === value }} onPress={() => setVisibility(value)}><Button.Label>{t(`profileGallery.${value}`)}</Button.Label></Button>)}</ScrollView>
        {gallery.hasNextPage ? <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t("profileGallery.loadedHint")}</Text> : null}
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.caption || t("profileGallery.viewPhoto")} onPress={() => setSelectedPhotoId(item.id)} style={{ flex: 1, maxWidth: "48.5%", gap: 7 }}>
        <View style={{ borderRadius: 20, overflow: "hidden", backgroundColor: c.surfaceSecondary }}>
          <Image source={{ uri: item.url }} cachePolicy="none" style={{ width: "100%", aspectRatio: 0.85 }} contentFit="cover" />
          <View style={{ position: "absolute", right: 9, bottom: 9, backgroundColor: c.surface, borderRadius: 20, padding: 7 }}><Ionicons name={item.visibility === "private" ? "lock-closed-outline" : "earth-outline"} size={16} color={c.foreground} /></View>
        </View>
        {item.caption ? <Text numberOfLines={2} style={{ color: c.foreground, lineHeight: 19 }}>{item.caption}</Text> : null}
      </Pressable>}
      ListEmptyComponent={gallery.isPending ? <ActivityIndicator color={c.accent} /> : !gallery.isError ? <View style={{ padding: 32, alignItems: "center", gap: 14 }}><Ionicons name="images-outline" size={42} color={c.muted} /><Text style={{ color: c.muted, textAlign: "center", lineHeight: 22 }}>{t("profileGallery.empty")}</Text></View> : null}
      ListFooterComponent={<View style={{ paddingVertical: 16, gap: 12 }}>{gallery.isError ? <><Text style={{ color: c.danger }}>{t("profileGallery.error")}</Text><Button variant="secondary" onPress={() => void gallery.refetch()}><Button.Label>{t("profileGallery.retry")}</Button.Label></Button></> : null}{gallery.hasNextPage ? <Button variant="secondary" isDisabled={gallery.isFetchingNextPage} onPress={() => void gallery.fetchNextPage()}><Button.Label>{t("profileGallery.loadMore")}</Button.Label></Button> : null}</View>}
    />
    <GallerySheet visible={filterOpen} title={t("profileGallery.tripFilter")} onClose={() => setFilterOpen(false)}>
      <Button variant={tripId === undefined ? "primary" : "secondary"} onPress={() => { setTripId(undefined); setFilterOpen(false); }}><Button.Label>{t("profileGallery.allTrips")}</Button.Label></Button>
      {trips.map((trip) => <Button key={trip.id} variant={tripId === trip.id ? "primary" : "secondary"} onPress={() => { setTripId(trip.id); setFilterOpen(false); }}><Button.Label>{trip.name}</Button.Label></Button>)}
    </GallerySheet>
    <GallerySheet visible={asset !== null} title={t("profileGallery.upload")} onClose={() => { if (!upload.isPending) setAsset(null); }} busy={upload.isPending}>
      {asset ? <Image source={{ uri: asset.uri }} style={{ width: "100%", height: 220, borderRadius: 20 }} contentFit="contain" /> : null}
      <Text style={{ color: c.foreground, fontWeight: "700" }}>{t("profileGallery.tripFilter")}</Text>
      {ownedTrips.map((trip) => <Button key={trip.id} isDisabled={upload.isPending} variant={uploadTrip === trip.id ? "primary" : "secondary"} onPress={() => setUploadTrip(trip.id)}><Button.Label>{trip.name}</Button.Label></Button>)}
      <TextInput accessibilityLabel={t("profileGallery.caption")} editable={!upload.isPending} value={caption} onChangeText={setCaption} maxLength={2200} multiline placeholder={t("profileGallery.caption")} placeholderTextColor={c.muted} style={{ minHeight: 88, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 14, color: c.foreground, textAlignVertical: "top" }} />
      <View style={{ flexDirection: "row", gap: 8 }}>{(["private", "public"] as const).map((value) => <Button key={value} isDisabled={upload.isPending} variant={uploadVisibility === value ? "primary" : "secondary"} onPress={() => setUploadVisibility(value)}><Button.Label>{t(`profileGallery.${value}`)}</Button.Label></Button>)}</View>
      <Text style={{ color: c.muted, lineHeight: 20 }}>{t("profileGallery.privacyHint")}</Text>
      <Button isDisabled={!uploadTrip || upload.isPending} onPress={submitPhoto}><Button.Label>{t(upload.isPending ? "profileGallery.uploading" : "profileGallery.upload")}</Button.Label></Button>
    </GallerySheet>
    <GallerySheet visible={Boolean(selectedPhoto)} title={t("profileGallery.viewPhoto")} onClose={() => setSelectedPhotoId(null)}>
      {selectedPhoto ? <PhotoPreview photo={selectedPhoto} /> : null}
    </GallerySheet>
  </View>;
}

function PhotoPreview({ photo }: { photo: GalleryPhoto }) {
  const { t } = useTranslation();
  return <><Image source={{ uri: photo.url }} cachePolicy="none" style={{ width: "100%", height: 380 }} contentFit="contain" /><Text selectable style={{ color: c.foreground, lineHeight: 22 }}>{photo.caption}</Text><Text style={{ color: c.muted }}>{t(`profileGallery.${photo.visibility}`)}</Text></>;
}
function GallerySheet({ visible, title, onClose, children, busy = false }: { visible: boolean; title: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}><Text style={{ flex: 1, fontSize: 21, fontWeight: "700", color: c.foreground }}>{title}</Text><Button size="sm" variant="ghost" isDisabled={busy} onPress={onClose}><Button.Label>{t("detailGuide.close")}</Button.Label></Button></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </Modal>;
}
