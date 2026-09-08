import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RecentTripCard } from "@/features/travel-plan/components/recent-trip-card";
import { useSavedTravelPlans } from "@/features/travel-plan/services/travel-plan-api-service";
import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { TripCard } from "@/features/trips/components/trip-card";
import {
  type IncomingTripInvitationDTO,
  type TripDTO,
  type TripStatus,
  useBookingReminderMutation,
  useBookings,
  useRespondToTripInvitation,
  useTripInvitations,
  useTrips,
} from "@/features/trips/services/trips-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { minorToMajor } from "@/lib/money";
import { theme } from "@/theme/theme";

type WorkspaceTab = "trips" | "booking" | "planning";
type TripFilter = "all" | TripStatus;

const workspaceTabs: readonly WorkspaceTab[] = ["trips", "booking", "planning"];
const tripFilters: readonly TripFilter[] = ["all", "planning", "confirmed", "completed", "cancelled"];

export function TripsScreen() {
  const { t } = useTranslation();
  const bottomPadding = useTabBottomPadding();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("trips");
  const [tripFilter, setTripFilter] = useState<TripFilter>("all");
  const tripsQuery = useTrips();
  const invitationsQuery = useTripInvitations();
  const bookingsQuery = useBookings();
  const plansQuery = useSavedTravelPlans();
  const reminderMutation = useBookingReminderMutation();
  const respondInvitation = useRespondToTripInvitation();
  const refetchTrips = tripsQuery.refetch;
  const [now] = useState(() => Date.now());

  useFocusEffect(useCallback(() => {
    void refetchTrips();
  }, [refetchTrips]));

  const trips = useMemo(() => [...(tripsQuery.data ?? [])].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [tripsQuery.data]);
  const visibleTrips = tripFilter === "all" ? trips : trips.filter((trip) => trip.status === tripFilter);
  const upcomingCount = trips.filter((trip) => new Date(trip.endDate).getTime() >= now).length;
  const refreshing = activeTab === "trips" ? tripsQuery.isRefetching : activeTab === "booking" ? bookingsQuery.isRefetching : plansQuery.isRefetching;
  const refresh = () => {
    if (activeTab === "trips") void Promise.all([tripsQuery.refetch(), invitationsQuery.refetch()]);
    if (activeTab === "booking") void bookingsQuery.refetch();
    if (activeTab === "planning") void plansQuery.refetch();
  };

  return (
    <View style={styles.screen}>
      <TravelScreenHeader title={t("trips.title")} />
      <View style={styles.segment}>
        {workspaceTabs.map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setActiveTab(tab)} style={[styles.segmentButton, selected && styles.selectedSegment]}>
              <Text style={[styles.segmentLabel, selected && styles.selectedSegmentLabel]}>{t(`trips.tabs.${tab}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.light.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      >
        {activeTab === "trips" ? (
          <TripsWorkspace
            trips={visibleTrips}
            allTrips={trips}
            upcomingCount={upcomingCount}
            now={now}
            filter={tripFilter}
            onFilter={setTripFilter}
            isPending={tripsQuery.isPending}
            error={tripsQuery.error}
            invitations={invitationsQuery.data ?? []}
            invitationPending={respondInvitation.isPending}
            onInvitation={(invitationId, action) => respondInvitation.mutate({ invitationId, action })}
            onRetry={() => void tripsQuery.refetch()}
          />
        ) : activeTab === "booking" ? (
          bookingsQuery.isPending ? <LoadingState /> : bookingsQuery.isError ? <ErrorState message={errorMessage(bookingsQuery.error, t("trips.errors.bookings"))} onRetry={() => void bookingsQuery.refetch()} /> : (bookingsQuery.data?.length ?? 0) > 0 ? (
            bookingsQuery.data?.map((booking) => (
              <TripCard
                key={booking.id}
                destination={booking.destinationView}
                date={formatDateRange(booking.startDate, booking.endDate)}
                countdown={formatCountdown(booking.startDate)}
                totalPrice={minorToMajor(booking.total.amountMinor, booking.total.currency)}
                currency={booking.total.currency}
                travellerCount={booking.travellerCount}
                reminderEnabled={booking.reminderEnabled}
                status={booking.status}
                onReminderChange={(enabled) => reminderMutation.mutateAsync({ id: booking.id, enabled })}
              />
            ))
          ) : <EmptyState icon="receipt-outline" title={t("trips.emptyBookingsTitle")} description={t("trips.emptyBookingsDescription")} />
        ) : plansQuery.isPending ? <LoadingState /> : plansQuery.isError ? <ErrorState message={errorMessage(plansQuery.error, t("trips.errors.plans"))} onRetry={() => void plansQuery.refetch()} /> : (plansQuery.data?.length ?? 0) > 0 ? (
          <View style={styles.list}>
            {plansQuery.data?.map((plan) => <RecentTripCard key={plan.id} trip={plan} onPress={() => router.push({ pathname: "/plan/[id]", params: { id: plan.id } })} />)}
          </View>
        ) : <EmptyState icon="sparkles-outline" title={t("trips.planningTitle")} description={t("trips.planningDescription")} action={t("trips.createPlan")} onAction={() => router.push("/explore")} />}
      </ScrollView>
    </View>
  );
}

type TripsWorkspaceProps = {
  trips: TripDTO[];
  allTrips: TripDTO[];
  upcomingCount: number;
  now: number;
  filter: TripFilter;
  onFilter: (filter: TripFilter) => void;
  isPending: boolean;
  error: Error | null;
  invitations: IncomingTripInvitationDTO[];
  invitationPending: boolean;
  onInvitation: (id: string, action: "accept" | "decline") => void;
  onRetry: () => void;
};

function TripsWorkspace({ trips, allTrips, upcomingCount, now, filter, onFilter, isPending, error, invitations, invitationPending, onInvitation, onRetry }: TripsWorkspaceProps) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.workspaceHeading}>
        <View style={styles.workspaceHeadingText}>
          <Text style={styles.eyebrow}>{t("trips.workspaceEyebrow")}</Text>
          <Text style={styles.workspaceTitle}>{t("trips.workspaceTitle")}</Text>
          <Text style={styles.workspaceDescription}>{t("trips.workspaceDescription")}</Text>
        </View>
        <Pressable accessibilityLabel={t("trips.createTrip")} onPress={() => router.push("/trip/new")} style={styles.addButton}>
          <Ionicons name="add" size={21} color={theme.colors.light.base.white} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Stat value={allTrips.length} label={t("trips.stats.total")} />
        <Stat value={upcomingCount} label={t("trips.stats.upcoming")} />
        <Stat value={allTrips.filter((trip) => trip.accessRole !== "owner").length} label={t("trips.stats.shared")} />
      </View>

      {invitations.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("trips.invitations.title")}</Text>
          {invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationRow}>
              <View style={styles.flexText}>
                <Text selectable numberOfLines={1} style={styles.itemTitle}>{invitation.trip.name}</Text>
                <Text selectable style={styles.itemMeta}>{invitation.invitedBy.name} · {formatDateRange(invitation.trip.startDate, invitation.trip.endDate)}</Text>
              </View>
              <Pressable disabled={invitationPending} onPress={() => onInvitation(invitation.id, "decline")} style={styles.textButton}><Text style={styles.textButtonLabel}>{t("trips.invitations.decline")}</Text></Pressable>
              <Pressable disabled={invitationPending} onPress={() => onInvitation(invitation.id, "accept")} style={styles.compactButton}><Text style={styles.compactButtonLabel}>{t("trips.invitations.accept")}</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {tripFilters.map((item) => <Pressable key={item} onPress={() => onFilter(item)} style={[styles.filterChip, filter === item && styles.selectedFilter]}><Text style={[styles.filterLabel, filter === item && styles.selectedFilterLabel]}>{t(`trips.filters.${item}`)}</Text></Pressable>)}
      </ScrollView>

      {isPending ? <LoadingState /> : error ? <ErrorState message={errorMessage(error, t("trips.errors.trips"))} onRetry={onRetry} /> : trips.length > 0 ? (
        <View style={styles.list}>{trips.map((trip) => <TripWorkspaceCard key={trip.id} trip={trip} now={now} />)}</View>
      ) : <EmptyState icon="map-outline" title={filter === "all" ? t("trips.emptyTripsTitle") : t("trips.emptyFilteredTitle")} description={t("trips.emptyTripsDescription")} action={t("trips.createTrip")} onAction={() => router.push("/trip/new")} />}
    </>
  );
}

function TripWorkspaceCard({ trip, now }: { trip: TripDTO; now: number }) {
  const { t } = useTranslation();
  const phase = getTripPhase(trip, now);
  return (
    <Pressable onPress={() => router.push({ pathname: "/trip/[id]", params: { id: String(trip.id) } })} style={({ pressed }) => [styles.tripWorkspaceCard, pressed && styles.pressed]}>
      <View style={styles.tripIcon}><Ionicons name={phase === "past" ? "checkmark" : phase === "ongoing" ? "navigate" : "airplane"} size={21} color={theme.colors.light.accent} /></View>
      <View style={styles.flexText}>
        <View style={styles.itemTitleRow}><Text selectable numberOfLines={1} style={styles.itemTitle}>{trip.name}</Text><View style={styles.statusPill}><Text style={styles.statusText}>{t(`trips.filters.${trip.status}`)}</Text></View></View>
        <Text selectable numberOfLines={1} style={styles.itemMeta}>{trip.city ? `${trip.city.name}, ${trip.city.country} · ` : ""}{formatDateRange(trip.startDate, trip.endDate)} · {t(`trips.phases.${phase}`)}</Text>
        {trip.description ? <Text selectable numberOfLines={2} style={styles.itemDescription}>{trip.description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={19} color={theme.colors.light.gray[400]} />
    </Pressable>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text selectable style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function LoadingState() { return <View style={styles.state}><ActivityIndicator color={theme.colors.light.accent} /></View>; }

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return <View style={styles.errorCard}><Ionicons name="alert-circle-outline" size={26} color={theme.colors.light.error[500]} /><Text selectable style={styles.errorText}>{message}</Text><Pressable onPress={onRetry}><Text style={styles.retry}>{t("common.retry")}</Text></Pressable></View>;
}

function EmptyState({ icon, title, description, action, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; action?: string; onAction?: () => void }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name={icon} size={28} color={theme.colors.light.accent} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyDescription}>{description}</Text>{action && onAction ? <Pressable onPress={onAction} style={styles.primaryButton}><Text style={styles.primaryButtonLabel}>{action}</Text></Pressable> : null}</View>;
}

function getTripPhase(trip: TripDTO, now: number): "upcoming" | "ongoing" | "past" {
  if (new Date(trip.startDate).getTime() > now) return "upcoming";
  if (new Date(trip.endDate).getTime() >= now) return "ongoing";
  return "past";
}

function formatDateRange(startDate: string, endDate: string) {
  const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`;
}

function formatCountdown(startDate: string) {
  const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(days, "day");
}

function errorMessage(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  segment: { height: 52, marginHorizontal: theme.spacing[5], marginBottom: theme.spacing[4], padding: theme.spacing[1], borderRadius: theme.radius.full, flexDirection: "row", backgroundColor: theme.colors.light.gray[50] },
  segmentButton: { flex: 1, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center" },
  selectedSegment: { backgroundColor: theme.colors.light.accent },
  segmentLabel: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "700" },
  selectedSegmentLabel: { color: theme.colors.light.accentForeground },
  content: { paddingHorizontal: theme.spacing[5], gap: theme.spacing[4] },
  workspaceHeading: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  workspaceHeadingText: { flex: 1, gap: 3 },
  eyebrow: { color: theme.colors.light.accent, fontSize: 10, lineHeight: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  workspaceTitle: { color: theme.colors.light.gray[900], fontSize: 24, lineHeight: 31, fontWeight: "900" },
  workspaceDescription: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 18, fontWeight: "600" },
  addButton: { width: 48, height: 48, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  statsRow: { flexDirection: "row", gap: theme.spacing[2] },
  stat: { flex: 1, minHeight: 74, padding: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, justifyContent: "center", gap: 2, backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  statValue: { color: theme.colors.light.gray[900], fontSize: 20, lineHeight: 25, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statLabel: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "700" },
  sectionCard: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.orange[200], borderRadius: theme.radius.md, gap: theme.spacing[3], backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  sectionTitle: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  invitationRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  flexText: { flex: 1, minWidth: 0, gap: 3 },
  textButton: { paddingHorizontal: theme.spacing[2], paddingVertical: theme.spacing[2] },
  textButtonLabel: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "800" },
  compactButton: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderRadius: theme.radius.full, backgroundColor: theme.colors.light.accent },
  compactButtonLabel: { color: theme.colors.light.base.white, fontSize: 11, lineHeight: 15, fontWeight: "800" },
  filterRow: { gap: theme.spacing[2], paddingRight: theme.spacing[5] },
  filterChip: { minHeight: 36, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  selectedFilter: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  filterLabel: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "800" },
  selectedFilterLabel: { color: theme.colors.light.accent },
  list: { gap: theme.spacing[3] },
  tripWorkspaceCard: { minHeight: 104, padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  tripIcon: { width: 44, height: 44, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  itemTitle: { flex: 1, color: theme.colors.light.gray[900], fontSize: 14, lineHeight: 19, fontWeight: "900" },
  itemMeta: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 15, fontWeight: "700" },
  itemDescription: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  statusPill: { paddingHorizontal: theme.spacing[2], paddingVertical: 3, borderRadius: theme.radius.full, backgroundColor: theme.colors.light.green[50] },
  statusText: { color: theme.colors.light.success, fontSize: 9, lineHeight: 12, fontWeight: "900" },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  errorCard: { minHeight: 180, padding: theme.spacing[5], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.error[50] },
  errorText: { color: theme.colors.light.error[700], fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  retry: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  empty: { minHeight: 250, padding: theme.spacing[5], alignItems: "center", justifyContent: "center", gap: theme.spacing[2] },
  emptyIcon: { width: 60, height: 60, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  emptyTitle: { color: theme.colors.light.gray[900], fontSize: 18, lineHeight: 24, fontWeight: "900", textAlign: "center" },
  emptyDescription: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 18, fontWeight: "600", textAlign: "center" },
  primaryButton: { marginTop: theme.spacing[2], minHeight: 44, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  primaryButtonLabel: { color: theme.colors.light.base.white, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  pressed: { opacity: 0.75 },
});
