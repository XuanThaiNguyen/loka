import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/theme/theme";

import type { UserTravelPlan } from "../travel-plan.types";

type RecentTripCardProps = {
  trip: UserTravelPlan;
  onPress?: () => void;
};

export function RecentTripCard({ trip, onPress }: RecentTripCardProps) {
  const { t } = useTranslation();
  const isDemoTrip = trip.id === "demo-raja-ampat";
  const title = isDemoTrip ? t("travelPlan.demoTrip.name") : trip.name;
  const destination = isDemoTrip
    ? t("travelPlan.demoTrip.destination")
    : trip.destination;
  const date = isDemoTrip ? t("travelPlan.demoTrip.date") : trip.startDate;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image source={{ uri: trip.image }} style={styles.image} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {t(`travelPlan.status.${trip.status}`)}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.date}>
            {date}
          </Text>
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color={theme.colors.light.gray[400]}
          />
          <Text numberOfLines={1} style={styles.location}>
            {destination}
          </Text>
          <Ionicons name="star" size={14} color={theme.colors.light.warning} />
          <Text style={styles.rating}>{trip.rating}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.people}>
            {t("travelPlan.generated.peopleCount", { count: trip.totalPeople })}
          </Text>
          <Text style={styles.price}>${trip.estimatedCost.toFixed(0)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 128,
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
    height: 104,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "space-between",
    gap: theme.spacing[1],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[2],
  },
  statusPill: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.light.green[50],
  },
  statusText: {
    color: theme.colors.light.success,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "800",
  },
  date: {
    flexShrink: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  title: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "900",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  location: {
    flexShrink: 1,
    color: theme.colors.light.gray[400],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  rating: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[2],
  },
  people: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "800",
  },
  price: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "900",
  },
});
