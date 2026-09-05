import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { HomeSectionHeader } from "@/features/home/components/home-section-header";
import { RecentTripCard } from "@/features/travel-plan/components/recent-trip-card";
import { usePlannerSessions } from "@/features/travel-plan/services/planner-api-service";
import { useAvailableTravelPlans } from "@/features/travel-plan/services/travel-plan-api-service";
import { DestinationCard } from "@/features/travel/components/destination-card";
import {
  getCollectionDestinations,
  type TravelCollection,
} from "@/features/travel/travel.data";
import { useHomeCatalog } from "@/features/travel/services/travel-api-service";
import { type TripDTO, useTrips } from "@/features/trips/services/trips-api-service";
import { theme } from "@/theme/theme";

type HomeSheetContentProps = {
  bottomPadding: number;
};

export function HomeSheetContent({ bottomPadding }: HomeSheetContentProps) {
  const { t } = useTranslation();
  const { plans } = useAvailableTravelPlans();
  const [recentTrip] = plans;
  const { cities, collections } = useHomeCatalog();
  const tripsQuery = useTrips();
  const plannerQuery = usePlannerSessions();
  const [now] = useState(() => Date.now());
  const nextTrip = [...(tripsQuery.data ?? [])]
    .filter((trip) => new Date(trip.endDate).getTime() >= now)
    .sort((first, second) => new Date(first.startDate).getTime() - new Date(second.startDate).getTime())[0];

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      {nextTrip ? (
        <View style={styles.section}>
          <HomeSectionHeader title={t("home.nextTrip")} actionLabel={t("common.seeAll")} onActionPress={() => router.push("/trips")} />
          <HomeTripCard trip={nextTrip} />
        </View>
      ) : recentTrip ? (
        <View style={styles.section}>
          <HomeSectionHeader
            title={t("home.recentTrip")}
            actionLabel={t("common.seeAll")}
            onActionPress={() => router.push("/trips")}
          />
          <RecentTripCard trip={recentTrip} onPress={() => router.push("/trips")} />
        </View>
      ) : null}

      {(plannerQuery.data?.length ?? 0) > 0 ? (
        <Pressable onPress={() => router.push("/explore")} style={styles.plannerActivity}>
          <View style={styles.plannerIcon}><Ionicons name="sparkles" size={19} color={theme.colors.light.accent} /></View>
          <View style={styles.plannerText}><Text style={styles.plannerTitle}>{t("home.plannerWorkspaces")}</Text><Text selectable style={styles.plannerDescription}>{t("home.plannerWorkspaceCount", { count: plannerQuery.data?.length ?? 0 })}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.light.gray[400]} />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <HomeSectionHeader
          title={t("home.exploreCity")}
          actionLabel={t("common.viewAll")}
          onActionPress={() => router.push("/explore")}
          showLocationIcon
        />
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

      {collections.map((collection) => (
        <DestinationSection key={collection.slug} collection={collection} />
      ))}
    </BottomSheetScrollView>
  );
}

function HomeTripCard({ trip }: { trip: TripDTO }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={() => router.push({ pathname: "/trip/[id]", params: { id: String(trip.id) } })} style={styles.tripCard}>
      <View style={styles.tripIcon}><Ionicons name="airplane" size={22} color={theme.colors.light.accent} /></View>
      <View style={styles.plannerText}><Text selectable numberOfLines={1} style={styles.tripTitle}>{trip.name}</Text><Text selectable style={styles.tripDate}>{formatDateRange(trip.startDate, trip.endDate)}</Text><Text style={styles.tripRole}>{trip.accessRole === "owner" ? t("home.tripOwner") : t("home.tripShared")}</Text></View>
      <Ionicons name="chevron-forward" size={19} color={theme.colors.light.gray[400]} />
    </Pressable>
  );
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
}

function DestinationSection({ collection }: { collection: TravelCollection }) {
  const { t } = useTranslation();
  const items = getCollectionDestinations(collection);

  return (
    <View style={styles.section}>
      <HomeSectionHeader
        title={collection.title ?? t(`travel.collections.${collection.slug}`)}
        actionLabel={t("common.viewAll")}
        onActionPress={() =>
          router.push({
            pathname: "/collection/[slug]",
            params: { slug: collection.slug },
          })
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.destinationList}
      >
        {items.map((item) => (
          <DestinationCard
            key={item.id}
            destination={item}
            initiallyFavorite={item.isFavorite}
            onPress={() =>
              router.push({
                pathname: "/destination/[id]",
                params: { id: item.id },
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing[8],
  },
  section: {
    gap: theme.spacing[4],
    paddingHorizontal: theme.spacing[5],
  },
  cityList: {
    gap: theme.spacing[4],
    paddingRight: theme.spacing[5],
  },
  cityItem: {
    width: 68,
    alignItems: "center",
    gap: theme.spacing[2],
  },
  cityImage: {
    width: 68,
    height: 68,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.gray[100],
  },
  cityLabel: {
    width: "100%",
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  destinationList: {
    gap: theme.spacing[3],
    paddingRight: theme.spacing[5],
  },
  tripCard: {
    minHeight: 100,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.surface,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.orange[50],
  },
  tripTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "900",
  },
  tripDate: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  tripRole: {
    color: theme.colors.light.accent,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  plannerActivity: {
    marginHorizontal: theme.spacing[5],
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.orange[50],
  },
  plannerIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.base.white,
  },
  plannerText: { flex: 1, minWidth: 0, gap: 3 },
  plannerTitle: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "900" },
  plannerDescription: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "700" },
});
