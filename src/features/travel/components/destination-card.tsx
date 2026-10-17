import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Destination } from "@/features/travel/travel.data";
import { useFavoriteMutation } from "@/features/travel/services/travel-api-service";
import { theme } from "@/theme/theme";

type DestinationCardProps = {
  destination: Destination;
  onPress: () => void;
  initiallyFavorite?: boolean;
  variant?: "default" | "editorial" | "compact";
};

export function DestinationCard({
  destination,
  onPress,
  initiallyFavorite = false,
  variant = "default",
}: DestinationCardProps) {
  const { t } = useTranslation();
  const editorial = variant !== "default";
  const compact = variant === "compact";
  const favoriteMutation = useFavoriteMutation();
  const sourceFavorite = destination.isFavorite ?? initiallyFavorite;
  const [favoriteOverride, setFavoriteOverride] = useState<{
    id: string;
    value: boolean;
  } | null>(null);
  const isFavorite = favoriteOverride?.id === destination.id
    ? favoriteOverride.value
    : sourceFavorite;
  const title = destination.title ?? t(`travel.destinations.${destination.id}.title`);

  const handleFavoritePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    const previous = isFavorite;
    const favorite = !previous;
    setFavoriteOverride({ id: destination.id, value: favorite });
    favoriteMutation.mutate(
      { destinationId: destination.id, favorite },
      { onError: () => setFavoriteOverride({ id: destination.id, value: previous }) },
    );
  };

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, editorial && styles.editorialCard, compact && styles.compactCard]}>
      <View style={[styles.imageContainer, editorial && styles.editorialImageContainer, compact && styles.compactImageContainer]}>
        <Image
          source={{ uri: destination.image }}
          style={[styles.image, editorial && styles.editorialImage]}
          contentFit="cover"
        />
        <Pressable
          accessibilityLabel={t(isFavorite ? "searchScreen.unsave" : "travel.toggleFavorite", { title })}
          accessibilityState={{ selected: isFavorite, disabled: favoriteMutation.isPending }}
          disabled={favoriteMutation.isPending}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleFavoritePress}
          style={[styles.favoriteButton, editorial && styles.editorialFavoriteButton]}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={theme.colors.light.error[500]}
          />
        </Pressable>
      </View>

      <View style={[styles.details, editorial && styles.editorialDetails]}>
        <View style={[styles.titleRow, editorial && styles.editorialTitleRow]}>
          <Text numberOfLines={1} style={[styles.title, editorial && styles.editorialTitle, compact && styles.compactTitle]}>
            {title}
          </Text>
          <View style={[styles.rating, compact && styles.compactMetadata]}>
            <Ionicons
              name="star"
              size={14}
              color={theme.colors.light.warning}
            />
            <Text style={styles.ratingText}>{destination.rating}</Text>
          </View>
        </View>
        <View style={[styles.locationRow, compact && styles.compactMetadata]}>
          <Ionicons
            name="location"
            size={15}
            color={theme.colors.light.accent}
          />
          <Text numberOfLines={1} style={[styles.locationText, editorial && styles.editorialLocation]}>
            {destination.location ?? t(`travel.destinations.${destination.id}.location`)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  editorialCard: { width: 202, padding: 0, borderWidth: 0, borderRadius: 0, backgroundColor: "transparent" },
  compactCard: { width: 132 },
  editorialImageContainer: { height: 206 },
  compactImageContainer: { height: 132 },
  editorialImage: { borderRadius: 16 },
  editorialFavoriteButton: { top: 10, right: 10, width: 32, height: 32, backgroundColor: "#fffffff0" },
  editorialDetails: { paddingHorizontal: 2, paddingTop: 10, paddingBottom: 0, gap: 6 },
  editorialTitleRow: { flexWrap: "wrap", rowGap: 5 },
  editorialTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  compactTitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  editorialLocation: { fontSize: 12, lineHeight: 18 },
  compactMetadata: { display: "none" },
  card: {
    width: 248,
    padding: theme.spacing[2],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.surface,
  },
  imageContainer: {
    height: 142,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing[2],
    right: theme.spacing[2],
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.base.white,
  },
  details: {
    gap: theme.spacing[1],
    paddingHorizontal: theme.spacing[1],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[1],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  title: {
    flex: 1,
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
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
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  locationText: {
    flex: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
});
