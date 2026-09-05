import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CityFeaturedCard } from "@/features/travel/components/city-featured-card";
import { DestinationListItem } from "@/features/travel/components/destination-list-item";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { useCity } from "@/features/travel/services/travel-api-service";
import { theme } from "@/theme/theme";

export function CityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { city } = useCity(id);
  const relatedDestinations = city.relatedDestinations ?? [];
  const cityName = city.name ?? t(`travel.cities.${city.id}.name`);

  return (
    <View style={styles.screen}>
      <TravelScreenHeader
        title={cityName}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing[6] },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("travel.cityScreen.popularPlaces", {
                city: cityName,
              })}
            </Text>
            <View style={styles.pagination}>
              <View style={styles.activePage} />
              <View style={styles.pageDot} />
              <View style={styles.pageDot} />
            </View>
          </View>
          <CityFeaturedCard city={city} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("travel.cityScreen.galleries", {
                city: cityName,
              })}
            </Text>
            <Pressable>
              <Text style={styles.viewAll}>{t("common.viewAll")}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {city.gallery.map((image, index) => (
              <View key={`${image}-${index}`}>
                <Image
                  source={{ uri: image }}
                  style={styles.galleryImage}
                  contentFit="cover"
                />
                {index === city.gallery.length - 1 ? (
                  <View style={styles.galleryOverlay}>
                    <Text style={styles.galleryCount}>12+</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("travel.cityScreen.otherTrip")}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/collection/[slug]",
                  params: { slug: "recommended" },
                })
              }
            >
              <Text style={styles.viewAll}>{t("common.viewAll")}</Text>
            </Pressable>
          </View>
          <View style={styles.tripList}>
            {relatedDestinations.map((destination) => (
              <DestinationListItem
                key={destination.id}
                destination={destination}
                onPress={() =>
                  router.push({
                    pathname: "/destination/[id]",
                    params: { id: destination.id },
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[6],
  },
  section: {
    gap: theme.spacing[4],
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  activePage: {
    width: 28,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.accent,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[300],
  },
  viewAll: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  gallery: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[5],
  },
  galleryImage: {
    width: 104,
    height: 92,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  galleryOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 24, 40, 0.46)",
  },
  galleryCount: {
    color: theme.colors.light.base.white,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  tripList: {
    gap: theme.spacing[3],
  },
});
