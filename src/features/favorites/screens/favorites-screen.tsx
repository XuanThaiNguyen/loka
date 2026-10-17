import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import {
  type Destination,
} from "@/features/travel/travel.data";
import { useFavorites } from "@/features/travel/services/travel-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

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
      <TravelScreenHeader title={t("favorites.title")} />

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
            {favoritesQuery.isPending ? <ActivityIndicator /> : favoritesQuery.isError ? <View style={styles.verticalList}><Text style={styles.emptyText}>{t("detailGuide.loadError")}</Text><Pressable accessibilityRole="button" onPress={() => void favoritesQuery.refetch()}><Text style={styles.viewAll}>{t("common.retry")}</Text></Pressable></View> : null}
            {!favoritesQuery.isPending && !favoritesQuery.isError && favoriteItems.length === 0 ? (
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
  content: {
    gap: theme.spacing[5],
  },
  searchBox: {
    minHeight: 52,
    marginHorizontal: theme.spacing[5],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.gray[50],
  },
  searchInput: {
    flex: 1,
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  categoryList: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  chip: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    backgroundColor: theme.colors.light.background,
  },
  selectedChip: {
    borderColor: theme.colors.light.accent,
    backgroundColor: theme.colors.light.accent,
  },
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
  sectionHeader: {
    paddingHorizontal: theme.spacing[5],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  paddedTitle: {
    paddingHorizontal: theme.spacing[5],
  },
  viewAll: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  horizontalList: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
  },
  verticalList: {
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[3],
  },
  emptyText: {
    paddingVertical: theme.spacing[8],
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: "center",
  },
});
