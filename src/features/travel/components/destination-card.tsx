import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
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
import { theme } from "@/theme/theme";

type DestinationCardProps = {
  destination: Destination;
  onPress: () => void;
  initiallyFavorite?: boolean;
};

export function DestinationCard({
  destination,
  onPress,
  initiallyFavorite = false,
}: DestinationCardProps) {
  const { t } = useTranslation();
  const [isFavorite, setIsFavorite] = useState(initiallyFavorite);
  const title = t(`travel.destinations.${destination.id}.title`);

  const handleFavoritePress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    setIsFavorite((current) => !current);
  };

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: destination.image }}
          style={styles.image}
          contentFit="cover"
        />
        <Pressable
          accessibilityLabel={t("travel.toggleFavorite", { title })}
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleFavoritePress}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={theme.colors.light.error[500]}
          />
        </Pressable>
      </View>

      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <View style={styles.rating}>
            <Ionicons
              name="star"
              size={14}
              color={theme.colors.light.warning}
            />
            <Text style={styles.ratingText}>{destination.rating}</Text>
          </View>
        </View>
        <View style={styles.locationRow}>
          <Ionicons
            name="location"
            size={15}
            color={theme.colors.light.accent}
          />
          <Text numberOfLines={1} style={styles.locationText}>
            {t(`travel.destinations.${destination.id}.location`)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
