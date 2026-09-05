import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import type { Destination } from "@/features/travel/travel.data";
import type { BookingStatus } from "@/features/trips/services/trips-api-service";
import { theme } from "@/theme/theme";

type TripCardProps = {
  destination: Destination;
  date: string;
  countdown: string;
  totalPrice?: number;
  currency?: string;
  travellerCount?: number;
  reminderEnabled?: boolean;
  status?: BookingStatus;
  onReminderChange?: (enabled: boolean) => Promise<unknown>;
};

export function TripCard({
  destination,
  date,
  countdown,
  totalPrice,
  currency = "USD",
  travellerCount = 4,
  reminderEnabled: initialReminderEnabled = true,
  status = "upcoming",
  onReminderChange,
}: TripCardProps) {
  const { t } = useTranslation();
  const [reminderEnabled, setReminderEnabled] = useState(initialReminderEnabled);
  const title = destination.title ?? t(`travel.destinations.${destination.id}.title`);
  const location = destination.location ?? t(`travel.destinations.${destination.id}.location`);
  const amount = totalPrice ?? destination.price * travellerCount;

  const handleReminderChange = (enabled: boolean) => {
    const previous = reminderEnabled;
    setReminderEnabled(enabled);
    onReminderChange?.(enabled).catch(() => setReminderEnabled(previous));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.reminder}>
          <Text style={styles.reminderLabel}>{t("trips.remindMe")}</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderChange}
            trackColor={{
              false: theme.colors.light.gray[300],
              true: theme.colors.light.accent,
            }}
            thumbColor={theme.colors.light.base.white}
          />
        </View>
      </View>

      <View style={styles.destinationRow}>
        <Image
          source={{ uri: destination.image }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.destinationInfo}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{t(`trips.bookingStatuses.${status}`)}</Text>
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <View style={styles.inlineMetadata}>
            <Ionicons
              name="location"
              size={14}
              color={theme.colors.light.gray[700]}
            />
            <Text numberOfLines={1} style={styles.metadataText}>
              {location}
            </Text>
            <Ionicons
              name="star"
              size={14}
              color={theme.colors.light.warning}
            />
            <Text style={styles.metadataText}>{destination.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.schedule}>
        <View style={styles.scheduleRow}>
          <Ionicons
            name="location"
            size={17}
            color={theme.colors.light.accent}
          />
          <Text numberOfLines={1} style={styles.scheduleText}>
            {location}
          </Text>
        </View>
        <View style={styles.scheduleRow}>
          <Ionicons
            name="calendar"
            size={17}
            color={theme.colors.light.accent}
          />
          <Text numberOfLines={1} style={styles.scheduleText}>
            {date}
          </Text>
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalPrice}>
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
          }).format(amount)}
          <Text style={styles.peopleText}> {t("trips.forPeople", { count: travellerCount })}</Text>
        </Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/destination/[id]",
              params: { id: destination.id },
            })
          }
          style={styles.detailButton}
        >
          <Text style={styles.detailButtonText}>{t("travel.detail.title")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.light.gray[200],
    borderRadius: theme.radius.md,
    gap: theme.spacing[4],
    backgroundColor: theme.colors.light.surface,
  },
  cardHeader: {
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  date: {
    flex: 1,
    color: theme.colors.light.gray[700],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "600",
  },
  reminder: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  reminderLabel: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.light.gray[100],
  },
  destinationInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderWidth: 1,
    borderColor: theme.colors.light.primary[500],
    borderRadius: theme.radius.sm,
  },
  statusText: {
    color: theme.colors.light.primary[600],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  title: {
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.md,
    fontWeight: "800",
  },
  inlineMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  metadataText: {
    flexShrink: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  schedule: {
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.gray[50],
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
  },
  scheduleText: {
    flex: 1,
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  countdownBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.light.accent,
  },
  countdownText: {
    color: theme.colors.light.accentForeground,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[3],
  },
  totalPrice: {
    flex: 1,
    color: theme.colors.light.gray[900],
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "900",
  },
  peopleText: {
    color: theme.colors.light.gray[500],
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "500",
  },
  detailButton: {
    minWidth: 112,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.light.accent,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  detailButtonText: {
    color: theme.colors.light.accent,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
    fontWeight: "700",
  },
});
