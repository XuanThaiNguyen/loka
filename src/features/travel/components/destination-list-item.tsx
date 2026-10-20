import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Destination } from "@/features/travel/travel.data";
import { theme, travelSurfaces } from "@/theme/theme";

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
        <Text numberOfLines={2} style={styles.title}>
          {destination.title ?? t(`travel.destinations.${destination.id}.title`)}
        </Text>
        <View style={styles.metadata}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.colors.light.gray[500]}
          />
          <Text numberOfLines={1} style={styles.metadataText}>
            {destination.location ?? t(`travel.destinations.${destination.id}.location`)}
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

      </View>

      <View style={styles.arrowButton}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={travelSurfaces.featured}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({

  card: { minHeight: 126, padding: 12, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.light.surface },
  image: { width: 80, height: 104, borderRadius: 16, backgroundColor: theme.colors.light.surfaceSecondary },
  content: { flex: 1, minWidth: 0, justifyContent: "center", gap: 8 },
  title: { color: travelSurfaces.foreground, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  metadata: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
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
    fontWeight: "600",
  },
  arrowButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info },
});
