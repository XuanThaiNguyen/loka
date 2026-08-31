import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { RecentTripCard } from "@/features/travel-plan/components/recent-trip-card";
import { useUserTravelPlans } from "@/features/travel-plan/travel-plan.store";
import { getDestination } from "@/features/travel/travel.data";
import { TripCard } from "@/features/trips/components/trip-card";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

const bookings = [
  {
    id: "haLongBay",
  },
  {
    id: "parisEscape",
  },
] as const;

export function TripsScreen() {
  const { t } = useTranslation();
  const bottomPadding = useTabBottomPadding();
  const userPlans = useUserTravelPlans();
  const [activeTab, setActiveTab] = useState<"booking" | "planning">("booking");

  return (
    <View style={styles.screen}>
      <TravelScreenHeader title={t("trips.title")} />

      <View style={styles.segment}>
        {(["booking", "planning"] as const).map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setActiveTab(tab)}
              style={[styles.segmentButton, selected ? styles.selectedSegment : null]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  selected ? styles.selectedSegmentLabel : null,
                ]}
              >
                {t(`trips.tabs.${tab}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
      >
        {activeTab === "booking" ? (
          bookings.map((booking) => {
            const destination = getDestination(booking.id);
            return destination ? (
              <TripCard
                key={booking.id}
                destination={destination}
                date={t(`trips.bookings.${booking.id}.date`)}
                countdown={t(`trips.bookings.${booking.id}.countdown`)}
              />
            ) : null;
          })
        ) : userPlans.length > 0 ? (
          <View style={styles.userPlanList}>
            <Text style={styles.userPlanTitle}>{t("trips.userPlans")}</Text>
            {userPlans.map((plan) => (
              <RecentTripCard key={plan.id} trip={plan} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("trips.planningTitle")}</Text>
            <Text style={styles.emptyDescription}>
              {t("trips.planningDescription")}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.light.background,
  },
  segment: {
    height: 52,
    marginHorizontal: theme.spacing[5],
    marginBottom: theme.spacing[5],
    padding: theme.spacing[1],
    borderRadius: theme.radius.full,
    flexDirection: "row",
    backgroundColor: theme.colors.light.gray[50],
  },
  segmentButton: {
    flex: 1,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSegment: {
    backgroundColor: theme.colors.light.accent,
  },
  segmentLabel: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
  selectedSegmentLabel: {
    color: theme.colors.light.accentForeground,
  },
  content: {
    paddingHorizontal: theme.spacing[5],
    gap: theme.spacing[4],
  },
  userPlanList: {
    gap: theme.spacing[3],
  },
  userPlanTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "900",
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
  },
  emptyTitle: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "800",
  },
  emptyDescription: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    textAlign: "center",
  },
});
