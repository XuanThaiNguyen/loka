import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Destination } from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

type DestinationListItemProps = {
  destination: Destination;
  onPress: () => void;
};

export function DestinationListItem({
  destination,
  onPress,
}: DestinationListItemProps) {
  const { t } = useTranslation();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image
        source={{ uri: destination.image }}
        style={styles.image}
        contentFit="cover"
      />

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>
          {t(`travel.destinations.${destination.id}.title`)}
        </Text>
        <View style={styles.metadata}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.colors.light.gray[500]}
          />
          <Text numberOfLines={1} style={styles.metadataText}>
            {t(`travel.destinations.${destination.id}.location`)}
          </Text>
          <Ionicons
            name="star-outline"
            size={16}
            color={theme.colors.light.gray[500]}
          />
          <Text numberOfLines={1} style={styles.ratingText}>
            {destination.rating}
          </Text>
        </View>
        <Text style={styles.price}>
          {t("travel.priceFrom", { price: destination.price.toFixed(0) })}
        </Text>
      </View>

      <View style={styles.arrowButton}>
        <Ionicons
          name="arrow-forward"
          size={20}
          color={theme.colors.light.base.white}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    padding: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.surface,
  },
  image: {
    width: 96,
    height: 102,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: theme.spacing[2],
  },
  title: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  metadataText: {
    flexShrink: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  ratingText: {
    flexShrink: 0,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  price: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.accent,
  },
});
