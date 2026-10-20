import { QueryFeedback } from "@/components/ui/loading-skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DestinationCard } from "@/features/travel/components/destination-card";
import { DestinationListItem } from "@/features/travel/components/destination-list-item";
import { JourneyHeader } from "@/components/ui/journey-header";
import {
  type Destination,
} from "@/features/travel/travel.data";
import { useFavorites } from "@/features/travel/services/travel-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme, travelSurfaces } from "@/theme/theme";

type CategoryFilter = "all" | Destination["category"];

const categories: readonly {
  key: CategoryFilter;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "all", icon: "grid-outline" },
  { key: "adventure", icon: "bicycle-outline" },
  { key: "beach", icon: "water-outline" },
  { key: "culture", icon: "business-outline" },
  { key: "food", icon: "restaurant-outline" },
  { key: "city", icon: "map-outline" },
] as const;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const bottomPadding = useTabBottomPadding();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const favoritesQuery = useFavorites();
  const { favorites } = favoritesQuery;
  const [showAll, setShowAll] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const recentItems = favorites.slice(0, 3);

  const favoriteItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return favorites.filter((destination) => {
      if (category !== "all" && destination.category !== category) {
        return false;
      }

      const title = (
        destination.title ?? t(`travel.destinations.${destination.id}.title`)
      ).toLocaleLowerCase();
      return !normalizedQuery || title.includes(normalizedQuery);
    });
  }, [category, favorites, query, t]);

  const openDestination = (destination: Destination) => {
    router.push({
      pathname: "/destination/[id]",
      params: { id: destination.id },
    });
  };

  return (
    <View style={styles.screen}>
      <JourneyHeader title={t("favorites.title")} />

      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={favoritesQuery.isRefetching} onRefresh={() => void favoritesQuery.refetch()} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
      >
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={22}
            color={theme.colors.light.gray[400]}
          />
          <TextInput
            accessibilityLabel={t("favorites.searchPlaceholder")}
            value={query}
            onChangeText={setQuery}
            placeholder={t("favorites.searchPlaceholder")}
            placeholderTextColor={theme.colors.light.gray[400]}
            style={styles.searchInput}
          />

        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((item) => {
            const selected = category === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(item.key)}
                style={[styles.chip, selected ? styles.selectedChip : null]}
              >
                <Ionicons
                  name={item.icon}
                  size={17}
                  color={
                    selected
                      ? theme.colors.light.accentForeground
                      : theme.colors.light.gray[700]
                  }
                />
                <Text
                  style={[
                    styles.chipLabel,
                    selected ? styles.selectedChipLabel : null,
                  ]}
                >
                  {t(`detailGuide.categories.${item.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!showAll && recentItems.length > 0 ? <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("favorites.recentAdded")}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => { setShowAll(true); setQuery(""); setCategory("all"); scroll.current?.scrollTo({ y: 0, animated: true }); }}
            >
              <Text style={styles.viewAll}>{t("common.viewAll")}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {recentItems.map((destination) => (
              <DestinationCard
                variant="editorial"
                key={destination.id}
                destination={destination}
                initiallyFavorite={destination.isFavorite ?? true}
                onPress={() => openDestination(destination)}
              />
            ))}
          </ScrollView>
        </View> : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.paddedTitle]}>
            {t("favorites.favoriteList")}
          </Text>
          <View style={styles.verticalList}>
            {favoriteItems.map((destination) => (
              <DestinationListItem
                key={destination.id}
                destination={destination}
                onPress={() => openDestination(destination)}
              />
            ))}
            <QueryFeedback query={favoritesQuery} hasData={favoritesQuery.data !== undefined} layout="list" />
            {!favoritesQuery.isPending && !favoritesQuery.isError && favoritesQuery.fetchStatus !== "paused" && favoriteItems.length === 0 ? (
              <Text style={styles.emptyText}>{t("favorites.empty")}</Text>
            ) : null}
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
  content: { paddingTop: 20, gap: 24 },
  searchBox: { minHeight: 56, marginHorizontal: 20, paddingHorizontal: 18, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 28, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.light.surface },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 14, color: travelSurfaces.foreground, fontSize: 16, lineHeight: 24 },
  categoryList: { gap: 8, paddingHorizontal: 20 },
  chip: { minHeight: 48, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.light.surfaceSecondary },
  selectedChip: { backgroundColor: travelSurfaces.featured },
  chipLabel: {
    color: theme.colors.light.gray[700],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "600",
  },
  selectedChipLabel: {
    color: theme.colors.light.accentForeground,
  },
  section: {
    gap: theme.spacing[4],
  },
  sectionHeader: { paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { flexShrink: 1, color: travelSurfaces.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" },
  paddedTitle: {
    paddingHorizontal: theme.spacing[5],
  },
  viewAll: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  horizontalList: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  verticalList: { paddingHorizontal: 20, gap: 14 },
  emptyText: { padding: 24, borderRadius: 24, backgroundColor: travelSurfaces.info, color: travelSurfaces.secondary, fontSize: 14, lineHeight: 22, textAlign: "center" },
});
