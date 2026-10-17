import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CityExpandableText } from "@/features/travel/components/city-editorial-sections";
import { CityGuideSections } from "@/features/travel/components/city-guide-sections";
import { CityDestinationBoard } from "@/features/travel/components/city-destination-board";
import {
  DetailAction,
  DetailSection,
  DetailState,
  GuideRows,
  openPlaceMap,
  PhotoGallery,
  detailStyles as s,
} from "@/features/travel/components/detail-ui";
import { ContentSources } from "@/features/travel/components/content-sources";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import {
  mapDestination,
  useCity,
  useCityDestinations,
} from "@/features/travel/services/travel-api-service";
import { theme } from "@/theme/theme";

const categories = [
  "all",
  "beach",
  "food",
  "culture",
  "adventure",
  "city",
] as const;
type Category = (typeof categories)[number];
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export function CityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CityContent key={id} id={id} />;
}

function CityContent({ id }: { id: string }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const query = useCity(id);
  const { city } = query;
  const destinationsQuery = useCityDestinations(
    city?.id,
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [topRated, setTopRated] = useState(false);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  if (!city) return <View style={{ flex: 1 }}><TravelScreenHeader title={t("detailGuide.city")} showBack /><DetailState loading={query.isFetching} onRetry={() => void query.refetch()} /></View>;
  const name = city.name ?? t(`travel.cities.${city.id}.name`);
  const places = [
    ...new Map(
      [
        ...(city.relatedDestinations ?? []),
        ...(destinationsQuery.data?.pages.flatMap((page) =>
          page.data.map(mapDestination),
        ) ?? []),
      ].map((place) => [place.id, place]),
    ).values(),
  ];
  const shown = places.filter((place) => {
    const title = place.title ?? t(`travel.destinations.${place.id}.title`);
    return (
      (category === "all" || place.category === category) &&
      (!topRated || Number(place.rating) >= 4) &&
      normalize(
        [title, place.location, ...(place.tags ?? [])].join(" "),
      ).includes(normalize(search.trim()))
    );
  });
  if (topRated) shown.sort((a, b) => Number(b.rating) - Number(a.rating));
  const isFiltering =
    Boolean(search.trim()) || category !== "all" || topRated;
  const visiblePlaces =
    showAllPlaces || isFiltering ? shown : shown.slice(0, 4);
  const unavailable = !query.data && city.id !== id;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.light.background }}>
      <TravelScreenHeader
        title={unavailable ? t("detailGuide.city") : name}
        showBack
      />
      {unavailable ? (
        <DetailState
          loading={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching || destinationsQuery.isRefetching}
              onRefresh={() => {
                void query.refetch();
                if (city.apiBacked) void destinationsQuery.refetch();
              }}
            />
          }
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            gap: 32,
          }}
        >
          <View style={{ gap: 18 }}>
            <Image source={{ uri: city.image }} fallbackHeight={80} style={{ width: "100%", aspectRatio: 1.78, borderRadius: 20 }} contentFit="cover" />
            <Text selectable accessibilityRole="header" style={s.title}>{name}</Text>
            <Text selectable style={s.body}>{city.country ?? t(`travel.cities.${city.id}.country`)} · {t("detailGuide.placeCount", { count: places.length })}</Text>
            {(city.contentGuide?.hook || city.description) ? (
              <CityExpandableText
                key={city.contentGuide?.hook ?? city.description}
                text={city.contentGuide?.hook || city.description || ""}
              />
            ) : null}
            <View style={s.wrap}>
              <DetailAction
                label={t("detailGuide.openMap")}
                icon="map-outline"
                onPress={() =>
                  openPlaceMap(
                    `${name}, ${city.country ?? ""}`,
                    t("detailGuide.mapError"),
                  )
                }
              />
              <DetailAction
                label={t("trips.createTrip")}
                icon="add-circle-outline"
                onPress={() => router.push({ pathname: "/trip/new", params: { cityId: city.id } })}
              />
            </View>
          </View>
          {city.contentGuide ? <CityGuideSections guide={city.contentGuide} cityId={city.id} /> : null}
          {city.guide ? (
            <DetailSection title={t("detailGuide.beforeYouGo")}>
              <GuideRows guide={city.guide} />
            </DetailSection>
          ) : null}
          <DetailSection title={t("detailGuide.exploreCity", { name })}>
            <TextInput
              accessibilityLabel={t("detailGuide.search")}
              value={search}
              onChangeText={setSearch}
              placeholder={t("detailGuide.search")}
              placeholderTextColor={theme.colors.light.gray[400]}
              returnKeyType="search"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.light.gray[200],
                borderRadius: 16,
                minHeight: 48,
                paddingHorizontal: 16,
                color: theme.colors.light.gray[900],
                fontSize: 15,
              }}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.row}
            >
              {categories
                .filter(
                  (value) =>
                    value === "all" ||
                    places.some((place) => place.category === value),
                )
                .map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === value }}
                    onPress={() => setCategory(value)}
                    style={[
                      s.action,
                      category === value && {
                        backgroundColor: theme.colors.light.accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.actionText,
                        category === value && { color: "white" },
                      ]}
                    >
                      {t(`detailGuide.categories.${value}`)}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
            <View style={s.wrap}>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: topRated }}
                onPress={() => setTopRated(!topRated)}
                style={s.action}
              >
                <Text style={s.actionText}>
                  {topRated ? "✓ " : ""}
                  {t("detailGuide.topRated")}
                </Text>
              </Pressable>
            </View>
            <Text selectable style={s.body}>
              {t("detailGuide.results", {
                shown: visiblePlaces.length,
                total: places.length,
              })}
            </Text>
              <CityDestinationBoard
                places={visiblePlaces}
                onSelect={(destination) =>
                  router.push({
                    pathname: "/destination/[id]",
                    params: { id: destination.id },
                  })
                }
              />
            {!isFiltering && shown.length > 4 ? (
              <DetailAction
                label={
                  showAllPlaces
                    ? t("cityEditorial.lessPlaces")
                    : t("cityEditorial.allPlaces", { count: shown.length })
                }
                icon={showAllPlaces ? "chevron-up" : "chevron-down"}
                onPress={() => setShowAllPlaces(!showAllPlaces)}
              />
            ) : null}
            {destinationsQuery.isError ? (
              <DetailState onRetry={() => void destinationsQuery.refetch()} />
            ) : null}
            {destinationsQuery.hasNextPage ? (
              <DetailAction
                label={t("visitKnowledge.loadMore")}
                icon="add"
                disabled={destinationsQuery.isFetchingNextPage}
                onPress={() => {
                  setShowAllPlaces(true);
                  void destinationsQuery.fetchNextPage();
                }}
              />
            ) : null}
            {destinationsQuery.hasNextPage ? (
              <Text style={s.body}>{t("visitKnowledge.loadedHint")}</Text>
            ) : null}
            {!shown.length ? (
              <View style={s.card}>
                <Text style={s.body}>{t("detailGuide.noResults")}</Text>
                {places.length > 0 && (
                  <DetailAction
                    label={t("detailGuide.resetFilters")}
                    icon="refresh"
                    onPress={() => {
                      setSearch("");
                      setCategory("all");
                      setTopRated(false);
                    }}
                  />
                )}
              </View>
            ) : null}
          </DetailSection>
          <PhotoGallery
            images={[city.image, ...city.gallery]}
            title={t("travel.detail.galleries")}
          />
          <ContentSources sources={city.sources} contentLocale={city.contentLocale} />
        </ScrollView>
      )}
    </View>
  );
}
