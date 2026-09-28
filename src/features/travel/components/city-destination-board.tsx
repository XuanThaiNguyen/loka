import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, useWindowDimensions } from "react-native";

import type { Destination } from "@/features/travel/travel.data";
import { theme } from "@/theme/theme";

const c = theme.colors.light;

export function CityDestinationBoard({ places, onSelect }: { places: readonly Destination[]; onSelect: (place: Destination) => void }) {
  const { t } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.3 ? 1 : 2;
  return <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
    {Array.from({ length: columns }, (_, column) => <View key={column} style={{ flex: 1, gap: 20, paddingTop: column === 1 ? 28 : 0 }}>
      {places.filter((_, index) => index % columns === column).map((place, index) => {
        const title = place.title ?? t(`travel.destinations.${place.id}.title`);
        const rating = Number(place.rating);
        return <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={title} onPress={() => onSelect(place)} style={({ pressed }) => ({ gap: 9, opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <View style={{ borderRadius: 24, overflow: "hidden", borderCurve: "continuous", backgroundColor: c.surfaceSecondary }}>
            <Image source={{ uri: place.image }} contentFit="cover" transition={180} style={{ width: "100%", aspectRatio: columns === 1 ? 1.35 : (index + column) % 2 ? 0.93 : 0.72 }} />
            {Number.isFinite(rating) && rating > 0 ? <View style={{ position: "absolute", bottom: 12, left: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: c.surface }}><Text style={{ color: c.foreground, fontSize: 12, fontWeight: "700" }}>★ {place.rating}</Text></View> : null}
          </View>
          <View style={{ paddingHorizontal: 4, gap: 5 }}>
            <Text numberOfLines={2} style={{ color: c.foreground, fontSize: 16, lineHeight: 22, fontWeight: "700" }}>{title}</Text>
            <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>{t(`detailGuide.categories.${place.category}`)}</Text>
            {Number.isFinite(place.price) && place.price >= 0 ? <Text style={{ color: c.accent, fontSize: 12, lineHeight: 18, fontWeight: "600" }}>{place.price === 0 ? t("detailGuide.free") : t("travel.priceFrom", { price: formatPrice(place.price, place.currency) })}</Text> : null}
          </View>
        </Pressable>;
      })}
    </View>)}
  </View>;
}

function formatPrice(price: number, currency = "USD") {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(price); }
  catch { return `${price.toLocaleString()} ${currency}`; }
}
