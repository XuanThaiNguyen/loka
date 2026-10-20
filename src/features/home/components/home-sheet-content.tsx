import { LoadingAnnouncement } from "@/components/ui/loading-skeleton";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HomeSectionState } from "@/features/home/components/home-section-state";
import { WhosAround } from "@/features/home/components/whos-around";
import { HomeSectionHeader } from "@/features/home/components/home-section-header";
import { RecentTripCard } from "@/features/travel-plan/components/recent-trip-card";
import { usePlannerSessions } from "@/features/travel-plan/services/planner-api-service";
import { useSavedTravelPlans } from "@/features/travel-plan/services/travel-plan-api-service";
import { DestinationCard } from "@/features/travel/components/destination-card";
import type { Destination } from "@/features/travel/travel.data";
import { useQueryClient } from "@tanstack/react-query";
import { useCollection, useHomeCatalog, type CollectionDTO } from "@/features/travel/services/travel-api-service";
import {
  type TripDTO,
  useTrips,
} from "@/features/trips/services/trips-api-service";
import { theme, travelSurfaces } from "@/theme/theme";

type HomeSheetContentProps = {
  bottomPadding: number;
};

export function HomeSheetContent({ bottomPadding }: HomeSheetContentProps) {
  const { t } = useTranslation();
  const plansQuery = useSavedTravelPlans();
  const recentTrip = plansQuery.data?.[0];
  const { citiesQuery, recommendedQuery, collectionsQuery } = useHomeCatalog();
  const cities = citiesQuery.data ?? [];
  const tripsQuery = useTrips();
  const plannerQuery = usePlannerSessions();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const nextTrip = [...(tripsQuery.data ?? [])]
    .filter((trip) => trip.status !== "cancelled" && trip.status !== "completed" && trip.endDate.slice(0, 10) >= date)
    .sort((first, second) => first.startDate.localeCompare(second.startDate))[0];
  const refresh = useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["catalog", "home"] }),
    queryClient.invalidateQueries({ queryKey: ["catalog", "collection"] }),
    queryClient.invalidateQueries({ queryKey: ["trips"] }),
    queryClient.invalidateQueries({ queryKey: ["travel-plans"] }),
    queryClient.invalidateQueries({ queryKey: ["planner", "sessions"] }),
  ]), [queryClient]);
  // Admin edits become visible on return to Home, including a previously cached empty list.
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const personalEmpty = !nextTrip && !recentTrip;

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
        setRefreshing(true);
        void refresh().finally(() => setRefreshing(false));
      }} tintColor={theme.colors.light.accent} />}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      <LoadingAnnouncement loading={[tripsQuery, plansQuery, plannerQuery, citiesQuery, recommendedQuery, collectionsQuery].some((query) => query.isPending && query.fetchStatus === "fetching")} />
      {personalEmpty ? <View style={styles.section}>
        <HomeSectionHeader title={t("homeSections.trips")} actionLabel={t("common.seeAll")} onActionPress={() => router.push("/trips")} />
        <HomeSectionState queries={[tripsQuery, plansQuery]} hasData={tripsQuery.data !== undefined && plansQuery.data !== undefined} empty emptyLabel={t("homeSections.noTrips")} />
      </View> : null}
      
      {nextTrip ? (
        <View style={styles.section}>
          <HomeSectionHeader
            title={t("home.nextTrip")}
            actionLabel={t("common.seeAll")}
            onActionPress={() => router.push("/trips")}
          />
          <HomeSectionState queries={[tripsQuery, plansQuery]} hasData />
          <HomeTripCard trip={nextTrip} />
        </View>
      ) : recentTrip ? (
        <View style={styles.section}>
          <HomeSectionHeader
            title={t("home.recentTrip")}
            actionLabel={t("common.seeAll")}
            onActionPress={() => router.push("/trips")}
          />
          <HomeSectionState queries={[tripsQuery, plansQuery]} hasData />
          <RecentTripCard
            variant="home"
            trip={recentTrip}
            onPress={() => router.push("/trips")}
          />
        </View>
      ) : null}

      {plannerQuery.isPending || plannerQuery.isError || plannerQuery.isFetching || plannerQuery.fetchStatus === "paused" || !plannerQuery.data?.length ? <View style={styles.section}>
        <HomeSectionHeader title={t("home.plannerWorkspaces")} actionLabel={t("common.viewAll")} onActionPress={() => router.push("/planner")} />
        <HomeSectionState queries={[plannerQuery]} hasData={plannerQuery.data !== undefined} empty={!plannerQuery.data?.length} emptyLabel={t("homeSections.noWorkspaces")} />
      </View> : null}
      {(plannerQuery.data?.length ?? 0) > 0 ? (
        <Pressable
          onPress={() => router.push("/planner")}
          style={styles.plannerActivity}
        >
          <View style={styles.plannerIcon}>
            <Ionicons
              name="sparkles"
              size={19}
              color={theme.colors.light.accent}
            />
          </View>
          <View style={styles.plannerText}>
            <Text style={styles.plannerTitle}>
              {t("home.plannerWorkspaces")}
            </Text>
            <Text selectable style={styles.plannerDescription}>
              {t("home.plannerWorkspaceCount", {
                count: plannerQuery.data?.length ?? 0,
              })}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.light.gray[400]}
          />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <HomeSectionHeader
          title={t("home.exploreCity")}
          actionLabel={t("common.viewAll")}
          onActionPress={() =>
            router.push({ pathname: "/search", params: { scope: "cities" } })
          }
        />
        <HomeSectionState queries={[citiesQuery]} hasData={citiesQuery.data !== undefined} layout="cities" empty={!cities.length} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityList}
        >
          {cities.map((city) => (
            <Pressable
              key={city.id}
              onPress={() =>
                router.push({
                  pathname: "/city/[id]",
                  params: { id: city.id },
                })
              }
              style={styles.cityItem}
            >
              <Image
                source={{ uri: city.image }}
                style={styles.cityImage}
                contentFit="cover"
              />
              <Text numberOfLines={1} style={styles.cityLabel}>
                {city.name ?? t(`travel.cities.${city.id}.name`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <HomeSectionHeader title={t("travel.collections.recommended")} actionLabel={t("common.viewAll")} onActionPress={() => router.push({ pathname: "/search", params: { scope: "places" } })} />
        <HomeSectionState queries={[recommendedQuery]} hasData={recommendedQuery.data !== undefined} layout="destinations" empty={!recommendedQuery.data?.length} />
        <DestinationRail items={recommendedQuery.data ?? []} />
      </View>
      <View style={styles.section}>
        <HomeSectionHeader title={t("homeSections.collections")} />
        <HomeSectionState queries={[collectionsQuery]} hasData={collectionsQuery.data !== undefined} empty={!collectionsQuery.data?.length} emptyLabel={t("homeSections.noCollections")} />
      </View>
      {(collectionsQuery.data ?? []).map((collection) => <CollectionSection key={collection.id} collection={collection} />)}
      <WhosAround />
    </BottomSheetScrollView>
  );
}

function HomeTripCard({ trip }: { trip: TripDTO }) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trip.name}
      onPress={() =>
        router.push({ pathname: "/trip/[id]", params: { id: String(trip.id) } })
      }
      style={styles.tripCard}
    >
      <View style={styles.tripTop}>
        <View style={styles.tripIcon}>
          <Ionicons
            name="airplane-outline"
            size={28}
            color={theme.colors.light.base.white}
          />
          <Text style={styles.tripMonth}>
            {new Intl.DateTimeFormat(undefined, { month: "short" }).format(
              new Date(trip.startDate),
            )}
          </Text>
        </View>
        <View style={styles.plannerText}>
          <Text numberOfLines={2} style={styles.tripTitle}>
            {trip.name}
          </Text>
          <Text numberOfLines={2} style={styles.tripDate}>
            {trip.city ? `${trip.city.name}, ${trip.city.country} · ` : ""}
            {formatDateRange(trip.startDate, trip.endDate)}
          </Text>
          <View style={styles.tripRoleRow}>
            <View style={styles.tripStatusDot} />
            <Text style={styles.tripRole}>
              {trip.accessRole === "owner"
                ? t("home.tripOwner")
                : t("home.tripShared")}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.tripBottom}>
        <View style={styles.plannerText}>
          <Text style={styles.tripCaption}>{t("home.yourItinerary")}</Text>
          <View style={styles.itineraryButton}>
            <Text style={styles.itineraryLabel}>
              {t("home.browseItinerary")}
            </Text>
            <Ionicons
              name="arrow-up-right-box-outline"
              size={16}
              color={theme.colors.light.base.white}
            />
          </View>
        </View>
        {trip.city?.coverImageUrl ? (
          <View style={styles.postcardBack}>
            <Image
              source={{ uri: trip.city.coverImageUrl }}
              style={styles.postcard}
              contentFit="cover"
            />
          </View>
        ) : (
          <View style={styles.routeIllustration}>
            <Ionicons name="map-outline" size={36} color="#b9cdd4" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
}

function CollectionSection({ collection }: { collection: CollectionDTO }) {
  const { t } = useTranslation();
  const query = useCollection(collection.slug);
  return <View style={styles.section}>
    <LoadingAnnouncement loading={query.isPending && query.fetchStatus === "fetching"} />
    <HomeSectionHeader title={collection.title} actionLabel={t("common.viewAll")} onActionPress={() => router.push({ pathname: "/collection/[slug]", params: { slug: collection.slug } })} />
    <HomeSectionState queries={[query]} hasData={query.data !== undefined} layout="destinations" empty={!query.items.length} />
    <DestinationRail items={query.items} compact={collection.type === "trending"} />
  </View>;
}

function DestinationRail({ items, compact = false }: { items: readonly Destination[]; compact?: boolean }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationList}>
    {items.map((item) => <DestinationCard key={item.id} destination={item} initiallyFavorite={item.isFavorite} variant={compact ? "compact" : "editorial"} onPress={() => router.push({ pathname: "/destination/[id]", params: { id: item.id } })} />)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 12, gap: 28 },
  section: { gap: 14, paddingHorizontal: 20 },
  cityList: { gap: 12, paddingRight: 4 },
  cityItem: { width: 126, alignItems: "center", gap: 10 },
  cityImage: {
    width: "100%",
    height: 166,
    borderRadius: 15,
    backgroundColor: theme.colors.light.surfaceSecondary,
  },
  cityLabel: {
    width: "100%",
    color: theme.colors.light.foreground,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  destinationList: { gap: 16, paddingRight: 4 },
  tripCard: {
    padding: 16,
    gap: 18,
    borderRadius: 24,
    backgroundColor: travelSurfaces.featured,
    borderWidth: 1,
    borderColor: travelSurfaces.featured,
  },
  tripTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  tripIcon: {
    width: 62,
    minHeight: 76,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#64717b",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: travelSurfaces.featured,
  },
  tripMonth: {
    color: travelSurfaces.featuredSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tripTitle: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  tripDate: {
    color: travelSurfaces.featuredSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  tripRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  tripStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#76dfc1",
  },
  tripRole: { color: "#91e3cc", fontSize: 11, lineHeight: 16, flexShrink: 1 },
  tripBottom: {
    padding: 14,
    minHeight: 100,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#424c54",
    backgroundColor: travelSurfaces.featuredInset,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripCaption: {
    color: "#e9eef2",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  itineraryButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: travelSurfaces.featured,
  },
  itineraryLabel: {
    color: "#ffffff",
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
  },
  postcardBack: {
    width: 64,
    height: 68,
    padding: 3,
    borderRadius: 9,
    backgroundColor: "#eff7f6",
    transform: [{ rotate: "9deg" }],
  },
  postcard: { width: "100%", height: "100%", borderRadius: 6 },
  routeIllustration: { width: 56, alignItems: "center" },
  plannerActivity: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.light.separator,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: travelSurfaces.info,
  },
  plannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.surface,
  },
  plannerText: { flex: 1, minWidth: 0, gap: 3 },
  plannerTitle: {
    color: theme.colors.light.foreground,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  plannerDescription: {
    color: theme.colors.light.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
