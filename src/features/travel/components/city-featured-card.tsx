import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TravelCity } from "@/features/travel/city.data";
import { theme } from "@/theme/theme";

type CityFeaturedCardProps = {
  city: TravelCity;
};

export function CityFeaturedCard({ city }: CityFeaturedCardProps) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: city.featuredImage }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t("travel.cityScreen.popularPlace")}</Text>
        </View>
        <Pressable
          accessibilityLabel={t("travel.cityScreen.toggleFeaturedFavorite")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setIsFavorite((current) => !current)}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={theme.colors.light.error[500]}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {t(`travel.cities.${city.id}.featuredTitle`)}
        </Text>
        <View style={styles.details}>
          <Text style={styles.price}>
            ${city.featuredPrice}
            <Text style={styles.perPerson}>
              /{t("travel.cityScreen.person")}
            </Text>
          </Text>
          <View style={styles.location}>
            <Ionicons
              name="location"
              size={16}
              color={theme.colors.light.accent}
            />
            <Text numberOfLines={1} style={styles.locationText}>
              {t(`travel.cities.${city.id}.country`)}
            </Text>
          </View>
          <View style={styles.rating}>
            <Ionicons
              name="star"
              size={17}
              color={theme.colors.light.warning}
            />
            <Text style={styles.ratingText}>{city.featuredRating}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.surface,
  },
  imageContainer: {
    height: 194,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.light.gray[100],
  },
  badge: {
    position: "absolute",
    top: theme.spacing[4],
    left: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.success,
  },
  badgeText: {
    color: theme.colors.light.base.white,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing[3],
    right: theme.spacing[3],
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.base.white,
  },
  content: {
    padding: theme.spacing[4],
    gap: theme.spacing[2],
  },
  title: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "800",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  price: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "900",
  },
  perPerson: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "500",
  },
  location: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  locationText: {
    flex: 1,
    color: theme.colors.light.gray[600],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  ratingText: {
    color: theme.colors.light.gray[700],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
});
