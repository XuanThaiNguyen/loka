import { LoadingAnnouncement, QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "heroui-native";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSocialCounts } from "@/features/discovery/services/discovery-api-service";
import { ProfileTripsPanel } from "@/features/profile/components/profile-trips-panel";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { useAuth } from "@/features/auth/auth-provider";
import { useCurrentAccount } from "@/features/profile/services/profile-api-service";
import {
  useGallery,
  useUploadGalleryPhoto,
  type GalleryPhoto,
} from "@/features/profile/services/gallery-api-service";
import { useFavorites } from "@/features/travel/services/travel-api-service";
import { getDestination } from "@/features/travel/travel.data";
import { useTrips } from "@/features/trips/services/trips-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

const c = theme.colors.light;

export function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const account = useCurrentAccount();
  const social = useSocialCounts();
  const socialCounts = social.isError ? null : social.data?.data;
  const user = account.data ?? session?.user;
  const tripsQuery = useTrips();
  const trips = tripsQuery.isError ? [] : tripsQuery.data ?? [];
  const ownedTrips = trips.filter((trip) => trip.accessRole === "owner");
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadTrip, setUploadTrip] = useState<number>();
  const [caption, setCaption] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<
    "public" | "private"
  >("private");
  const [picking, setPicking] = useState(false);
  const gallery = useGallery(user?.id);
  const favoritesQuery = useFavorites();
  const upload = useUploadGalleryPhoto();
  const insets = useSafeAreaInsets();
  const bottom = useTabBottomPadding();
  const photos = gallery.data?.pages.flatMap((page) => page.data) ?? [];
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const name = user?.name?.trim() || t("profile.fallbackName");

  const choosePhoto = async () => {
    if (!ownedTrips.length) {
      Alert.alert(t("profileGallery.upload"), t("profileGallery.needTrip"));
      return;
    }
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled) return;
      const picked = result.assets[0];
      if (
        !picked ||
        (picked.fileSize != null && picked.fileSize > 10 * 1024 * 1024)
      )
        throw new Error(t("profileGallery.fileLimit"));
      if (
        picked.mimeType &&
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          picked.mimeType,
        )
      )
        throw new Error(t("profileGallery.fileLimit"));
      setAsset(picked);
      setUploadTrip(ownedTrips[0].id);
      setCaption("");
      setUploadVisibility("private");
    } catch (error) {
      Alert.alert(
        t("profileGallery.error"),
        error instanceof Error ? error.message : t("profileGallery.retry"),
      );
    } finally {
      setPicking(false);
    }
  };
  const submitPhoto = () => {
    if (!asset || !uploadTrip || upload.isPending) return;
    const body = new FormData();
    if (asset.file) body.append("photo", asset.file);
    else
      body.append("photo", {
        uri: asset.uri,
        name: asset.fileName ?? "photo.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
    body.append("tripId", String(uploadTrip));
    body.append("caption", caption.trim());
    body.append("visibility", uploadVisibility);
    upload.mutate(body, {
      onSuccess: () => {
        setAsset(null);
      },
      onError: (error) => Alert.alert(t("profileGallery.error"), error.message),
    });
  };
  const retry = () => {
    void gallery.refetch();
    void favoritesQuery.refetch();
    void tripsQuery.refetch();
    void account.refetch();
    void social.refetch();
  };
  const cover = getDestination("swissAlps")?.image;
  const saved = favoritesQuery.data ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: bottom }}
        refreshControl={
          <RefreshControl
            refreshing={
              gallery.isRefetching ||
              tripsQuery.isRefetching ||
              favoritesQuery.isRefetching ||
              account.isRefetching
            }
            onRefresh={retry}
            progressViewOffset={insets.top}
            tintColor={c.foreground}
          />
        }
      >
        <View style={[styles.cover, { height: insets.top + 190 }]}>
          <Image
            source={cover}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[styles.settings, { top: insets.top + 12 }]}>
            <Button
              isIconOnly
              variant="secondary"
              accessibilityLabel={t("profileGallery.settings")}
              onPress={() => router.push("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={c.foreground}
              />
            </Button>
          </View>
        </View>
        <View style={styles.identity}>
          <View style={styles.avatarRing}>
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.initials]}>
                <Text style={styles.initialsText}>
                  {name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.bio}>{t("profileLayout.noBio")}</Text>
          <View style={styles.stats}>
            <ProfileStat
              value={tripsQuery.data ? String(ownedTrips.length) : "—"}
              label={t("profileLayout.trips")}
            />
            <View style={styles.statDivider} />
            <ProfileStat value={socialCounts?.followers.toLocaleString() ?? "—"} label={t("profileLayout.followers")} />
            <View style={styles.statDivider} />
            <ProfileStat value={socialCounts?.following.toLocaleString() ?? "—"} label={t("profileLayout.following")} />
          </View>
          <QueryFeedback query={social} hasData={Boolean(social.data)} announce={false} />
          <QueryFeedback query={account} hasData={Boolean(user)} layout="card" announce={false} />
        </View>
        <LoadingAnnouncement loading={[account, tripsQuery, gallery, favoritesQuery].some((query) => query.isPending && query.fetchStatus === "fetching")} />
        <ProfileTabs>
          <ProfileTripsPanel query={tripsQuery} />
          <View style={styles.panel}>
            <ProfileContentState
              query={gallery}
              hasData={gallery.data !== undefined}
              empty={!photos.length}
              icon="images-outline"
              message={t("profileGallery.empty")}
            />
            <View style={styles.grid}>
              {photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  accessibilityRole="button"
                  accessibilityLabel={
                    photo.caption || t("profileGallery.viewPhoto")
                  }
                  onPress={() => setSelectedPhotoId(photo.id)}
                  style={styles.gridItem}
                >
                  <View style={styles.tile}>
                    <Image
                      source={{ uri: photo.url }}
                      cachePolicy="none"
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <View style={styles.privacyBadge}>
                      <Ionicons
                        name={
                          photo.visibility === "private"
                            ? "lock-closed-outline"
                            : "earth-outline"
                        }
                        size={13}
                        color={c.foreground}
                      />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
            {/* <Button
              variant="secondary"
              isDisabled={picking || tripsQuery.isPending || tripsQuery.isError}
              onPress={() => void choosePhoto()}
            >
              <Ionicons name="add" size={22} color={c.foreground} />
              <Button.Label>{t("profileGallery.upload")}</Button.Label>
            </Button> */}
            {gallery.hasNextPage ? (
              <Button
                variant="secondary"
                isDisabled={gallery.isFetchingNextPage}
                onPress={() => void gallery.fetchNextPage()}
              >
                <Button.Label>{t("profileGallery.loadMore")}</Button.Label>
              </Button>
            ) : null}
            {tripsQuery.isError ? (
              <Button variant="ghost" onPress={() => void tripsQuery.refetch()}>
                <Button.Label>{t("common.retry")}</Button.Label>
              </Button>
            ) : null}
          </View>
          <View style={styles.panel}>
            <ProfileContentState
              query={favoritesQuery}
              hasData={favoritesQuery.data !== undefined}
              empty={!saved.length}
              icon="bookmark-outline"
              message={t("profileLayout.emptySaved")}
            />
            <View style={styles.grid}>
              {saved.map((destination) => (
                <Pressable
                  key={destination.id}
                  accessibilityRole="button"
                  accessibilityLabel={destination.title}
                  onPress={() =>
                    router.push({
                      pathname: "/destination/[id]",
                      params: { id: destination.id },
                    })
                  }
                  style={styles.gridItem}
                >
                  <View style={styles.tile}>
                    <Image
                      source={{ uri: destination.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <View style={styles.privacyBadge}>
                      <Ionicons
                        name="bookmark"
                        size={13}
                        color={c.foreground}
                      />
                    </View>
                  </View>
                  <Text numberOfLines={2} style={styles.tileLabel}>
                    {destination.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ProfileTabs>
      </ScrollView>
      <GallerySheet
        visible={asset !== null}
        title={t("profileGallery.upload")}
        onClose={() => {
          if (!upload.isPending) setAsset(null);
        }}
        busy={upload.isPending}
      >
        {asset ? (
          <Image
            source={{ uri: asset.uri }}
            style={{ width: "100%", height: 220, borderRadius: 20 }}
            contentFit="contain"
          />
        ) : null}
        {/* <Text style={{ color: c.foreground, fontWeight: "700" }}>{t("profileGallery.tripFilter")}</Text> */}
        {ownedTrips.map((trip) => (
          <Button
            key={trip.id}
            isDisabled={upload.isPending}
            variant={uploadTrip === trip.id ? "primary" : "secondary"}
            onPress={() => setUploadTrip(trip.id)}
          >
            <Button.Label>{trip.name}</Button.Label>
          </Button>
        ))}
        <TextInput
          accessibilityLabel={t("profileGallery.caption")}
          editable={!upload.isPending}
          value={caption}
          onChangeText={setCaption}
          maxLength={2200}
          multiline
          placeholder={t("profileGallery.caption")}
          placeholderTextColor={c.muted}
          style={{
            minHeight: 88,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 16,
            padding: 14,
            color: c.foreground,
            textAlignVertical: "top",
          }}
        />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["private", "public"] as const).map((value) => (
            <Button
              key={value}
              isDisabled={upload.isPending}
              variant={uploadVisibility === value ? "primary" : "secondary"}
              onPress={() => setUploadVisibility(value)}
            >
              <Button.Label>{t(`profileGallery.${value}`)}</Button.Label>
            </Button>
          ))}
        </View>
        <Text style={{ color: c.muted, lineHeight: 20 }}>
          {t("profileGallery.privacyHint")}
        </Text>
        <Button
          isDisabled={!uploadTrip || upload.isPending}
          onPress={submitPhoto}
        >
          <Button.Label>
            {t(
              upload.isPending
                ? "profileGallery.uploading"
                : "profileGallery.upload",
            )}
          </Button.Label>
        </Button>
      </GallerySheet>
      <GallerySheet
        visible={Boolean(selectedPhoto)}
        title={t("profileGallery.viewPhoto")}
        onClose={() => setSelectedPhotoId(null)}
      >
        {selectedPhoto ? <PhotoPreview photo={selectedPhoto} /> : null}
      </GallerySheet>
    </View>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileContentState({ query, hasData, empty, icon, message }: {
  query: FeedbackQuery;
  hasData: boolean;
  empty: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  return <>
    <QueryFeedback query={query} hasData={hasData} layout="grid" announce={false} />
    {empty && !query.isPending && !query.isError && query.fetchStatus !== "paused" ? <View style={styles.empty}>
      <Ionicons name={icon} size={32} color={c.muted} />
      <Text style={styles.emptyText}>{message}</Text>
    </View> : null}
  </>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.surface },
  cover: { backgroundColor: c.surfaceSecondary },
  settings: { position: "absolute", right: 20 },
  identity: {
    marginTop: -24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: c.surface,
  },
  avatarRing: {
    marginTop: -49,
    marginLeft: 8,
    marginBottom: 18,
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 5,
    backgroundColor: c.surface,
  },
  avatar: { width: 94, height: 94, borderRadius: 47 },
  initials: {
    backgroundColor: c.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: 30, fontWeight: "600", color: c.accent },
  name: {
    color: c.foreground,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "600",
  },
  bio: {
    color: c.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 18,
    marginBottom: 26,
  },
  stats: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  stat: { flex: 1, alignItems: "center", gap: 7 },
  statValue: {
    color: c.foreground,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
  },
  statLabel: { color: c.muted, fontSize: 13, lineHeight: 18 },
  statDivider: { width: 1, height: 32, backgroundColor: c.separator },
  panel: { padding: 20, gap: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: "3%", rowGap: 18 },
  gridItem: { width: "31.33%", gap: 8 },
  tile: {
    width: "100%",
    aspectRatio: 0.57,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    color: c.foreground,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  privacyBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 14,
    padding: 6,
    backgroundColor: c.surface,
  },
  empty: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 14,
  },
  emptyText: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
});

function PhotoPreview({ photo }: { photo: GalleryPhoto }) {
  const { t } = useTranslation();
  return (
    <>
      <Image
        source={{ uri: photo.url }}
        cachePolicy="none"
        style={{ width: "100%", height: 380 }}
        contentFit="contain"
      />
      <Text selectable style={{ color: c.foreground, lineHeight: 22 }}>
        {photo.caption}
      </Text>
      <Text style={{ color: c.muted }}>
        {t(`profileGallery.${photo.visibility}`)}
      </Text>
    </>
  );
}
function GallerySheet({
  visible,
  title,
  onClose,
  children,
  busy = false,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.background }}
        behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 20,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 21,
              fontWeight: "700",
              color: c.foreground,
            }}
          >
            {title}
          </Text>
          <Button size="sm" variant="ghost" isDisabled={busy} onPress={onClose}>
            <Button.Label>{t("detailGuide.close")}</Button.Label>
          </Button>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
            gap: 16,
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
