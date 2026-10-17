import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useFavoriteMutation } from "@/features/travel/services/travel-api-service";
import type { Destination } from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

export function SearchDestinationCard({ destination, onPress }: { destination: Destination; onPress: () => void }) {
  const { t } = useTranslation();
  const favorite = useFavoriteMutation();
  const [override, setOverride] = useState<boolean | null>(null);
  const saved = override ?? destination.isFavorite ?? false;
  const title = destination.title ?? t(`travel.destinations.${destination.id}.title`);
  const rated = (destination.ratingCount ?? 0) > 0;

  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.card}>
    <View style={styles.imageContainer}>
      <Image source={{ uri: destination.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(saved ? "searchScreen.unsave" : "travel.toggleFavorite", { title })}
        accessibilityState={{ selected: saved, disabled: favorite.isPending }}
        disabled={favorite.isPending}
        onPress={(event) => {
          event.stopPropagation();
          const previous = saved;
          setOverride(!saved);
          favorite.mutate({ destinationId: destination.id, favorite: !saved }, {
            onError: () => { setOverride(previous); Alert.alert(t("detailGuide.saveError")); },
          });
        }}
        style={styles.favorite}
      ><Ionicons name={saved ? "heart" : "heart-outline"} size={22} color={saved ? c.danger : c.surface} /></Pressable>
    </View>
    <View style={styles.details}>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      <Text numberOfLines={2} style={styles.location}>{destination.location}</Text>
      <View style={styles.rating}>
        <Ionicons name={rated ? "star" : "star-outline"} size={16} color={rated ? c.warning : c.muted} />
        <Text style={styles.ratingLabel}>{rated ? `${destination.rating} (${destination.ratingCount})` : t("detailGuide.unrated")}</Text>
      </View>
    </View>
  </Pressable>;
}

const c = theme.colors.light;
const styles = StyleSheet.create({
  card: { flexDirection: "row", minHeight: 156, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.separator, overflow: "hidden" },
  imageContainer: { width: "42%", minHeight: 156, backgroundColor: c.surfaceSecondary, borderRadius: 17, overflow: "hidden" },
  favorite: { position: "absolute", right: 8, bottom: 8, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#26323880" },
  details: { flex: 1, padding: 13, gap: 7 },
  title: { color: c.foreground, fontSize: 15, lineHeight: 21, fontWeight: "600" },
  location: { color: c.muted, fontSize: 12, lineHeight: 18 },
  rating: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingLabel: { flexShrink: 1, color: c.muted, fontSize: 12, lineHeight: 18 },
  price: { marginTop: "auto", paddingTop: 8, color: c.foreground, fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
