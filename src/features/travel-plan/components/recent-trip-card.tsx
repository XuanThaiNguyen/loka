import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme, travelSurfaces } from "@/theme/theme";

import type { UserTravelPlan } from "../travel-plan.types";

type RecentTripCardProps = {
  trip: UserTravelPlan;
  onPress?: () => void;
  variant?: "default" | "home";
};

export function RecentTripCard({ trip, onPress, variant = "default" }: RecentTripCardProps) {
  const { t } = useTranslation();
  const home = variant === "home";
  const isDemoTrip = trip.id === "demo-raja-ampat";
  const title = isDemoTrip ? t("travelPlan.demoTrip.name") : trip.name;
  const destination = isDemoTrip
    ? t("travelPlan.demoTrip.destination")
    : trip.destination;
  const date = isDemoTrip ? t("travelPlan.demoTrip.date") : trip.startDate;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, home && styles.homeCard]}>
      <Image source={{ uri: trip.image }} style={[styles.image, home && styles.homeImage]} contentFit="cover" />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {t(`travelPlan.status.${trip.status}`)}
            </Text>
          </View>
          <Text numberOfLines={1} style={[styles.date, home && styles.homeMuted]}>
            {date}
          </Text>
        </View>

        <Text numberOfLines={1} style={[styles.title, home && styles.homeTitle]}>
          {title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color={theme.colors.light.gray[400]}
          />
          <Text numberOfLines={1} style={[styles.location, home && styles.homeMuted]}>
            {destination}
          </Text>
          <Ionicons name="star" size={14} color={theme.colors.light.warning} />
          <Text style={[styles.rating, home && styles.homeMuted]}>{trip.rating}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.people, home && styles.homeMuted]}>
            {t("travelPlan.generated.peopleCount", { count: trip.totalPeople })}
          </Text>

        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  homeCard: { padding: 18, minHeight: 178, borderRadius: 24, backgroundColor: travelSurfaces.featured, borderColor: travelSurfaces.featured, gap: 16 },
  homeImage: { width: 88, height: 132, borderRadius: 15 },
  homeTitle: { color: "#ffffff", fontWeight: "600" },
  homeMuted: { color: travelSurfaces.featuredSecondary, fontWeight: "400" },
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
    backgroundColor: travelSurfaces.positiveBackground,
  },
  statusText: {
    color: travelSurfaces.positiveForeground,
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
