import { LoadingAnnouncement, QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RecentTripCard } from "@/features/travel-plan/components/recent-trip-card";
import { CatalogImage } from "@/features/travel/components/catalog-image";
import { useSavedTravelPlans } from "@/features/travel-plan/services/travel-plan-api-service";
import { JourneyHeader } from "@/components/ui/journey-header";
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
import { theme, travelSurfaces } from "@/theme/theme";

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
  const refetchInvitations = invitationsQuery.refetch;
  const [now] = useState(() => Date.now());

  useFocusEffect(useCallback(() => {
    void refetchTrips();
    void refetchInvitations();
  }, [refetchTrips, refetchInvitations]));

  const trips = useMemo(() => [...(tripsQuery.isError ? [] : tripsQuery.data ?? [])].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [tripsQuery.data, tripsQuery.isError]);
  const visibleTrips = tripFilter === "all" ? trips : trips.filter((trip) => trip.status === tripFilter);
  const upcomingCount = trips.filter((trip) => new Date(trip.endDate).getTime() >= now).length;
  const activeQuery = activeTab === "trips" ? tripsQuery : activeTab === "booking" ? bookingsQuery : plansQuery;
  const refreshing = activeTab === "trips" ? tripsQuery.isRefetching : activeTab === "booking" ? bookingsQuery.isRefetching : plansQuery.isRefetching;
  const refresh = () => {
    if (activeTab === "trips") void Promise.all([tripsQuery.refetch(), invitationsQuery.refetch()]);
    if (activeTab === "booking") void bookingsQuery.refetch();
    if (activeTab === "planning") void plansQuery.refetch();
  };

  return (
    <View style={styles.screen}>
      <JourneyHeader title={t("trips.title")} />
      <View accessibilityRole="tablist" style={styles.segment}>
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
        <LoadingAnnouncement loading={(activeQuery.isPending && activeQuery.fetchStatus === "fetching") || (activeTab === "trips" && invitationsQuery.isPending && invitationsQuery.fetchStatus === "fetching")} />
        {activeTab !== "trips" ? <QueryFeedback query={activeQuery} hasData={activeQuery.data !== undefined} layout="list" announce={false} /> : null}
        {activeTab === "trips" ? (
          <TripsWorkspace
            trips={visibleTrips}
            allTrips={trips}
            upcomingCount={upcomingCount}
            now={now}
            filter={tripFilter}
            onFilter={setTripFilter}
            query={tripsQuery}
            hasData={tripsQuery.data !== undefined}
            invitationsQuery={invitationsQuery}
            invitations={invitationsQuery.isError ? [] : invitationsQuery.data ?? []}
            invitationPending={respondInvitation.isPending}
            onInvitation={(invitationId, action) => respondInvitation.mutate({ invitationId, action }, { onError: (error) => Alert.alert(t("tripDetail.error"), error.message) })}
          />
        ) : activeTab === "booking" ? (
          (bookingsQuery.data?.length ?? 0) > 0 ? (
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
          ) : !bookingsQuery.isPending && !bookingsQuery.isError && bookingsQuery.fetchStatus !== "paused" ? <EmptyState icon="receipt-outline" title={t("trips.emptyBookingsTitle")} description={t("trips.emptyBookingsDescription")} /> : null
        ) : (plansQuery.data?.length ?? 0) > 0 ? (
          <View style={styles.list}>
            {plansQuery.data?.map((plan) => <RecentTripCard variant="home" key={plan.id} trip={plan} onPress={() => router.push({ pathname: "/plan/[id]", params: { id: plan.id } })} />)}
          </View>
        ) : !plansQuery.isPending && !plansQuery.isError && plansQuery.fetchStatus !== "paused" ? <EmptyState icon="sparkles-outline" title={t("trips.planningTitle")} description={t("trips.planningDescription")} action={t("trips.createPlan")} onAction={() => router.push("/planner")} /> : null}
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
  query: FeedbackQuery;
  hasData: boolean;
  invitationsQuery: FeedbackQuery & { data?: unknown };
  invitations: IncomingTripInvitationDTO[];
  invitationPending: boolean;
  onInvitation: (id: string, action: "accept" | "decline") => void;
};

function TripsWorkspace({ trips, allTrips, upcomingCount, now, filter, onFilter, query, hasData, invitationsQuery, invitations, invitationPending, onInvitation }: TripsWorkspaceProps) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.overview}>
      <View style={styles.workspaceHeading}>
        <View style={styles.workspaceHeadingText}>
          <Text style={styles.eyebrow}>{t("trips.workspaceEyebrow")}</Text>
          <Text style={styles.workspaceTitle}>{t("trips.workspaceTitle")}</Text>
          <Text style={styles.workspaceDescription}>{t("trips.workspaceDescription")}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("trips.createTrip")} onPress={() => router.push("/trip/new")} style={styles.addButton}>
          <Ionicons name="add" size={21} color={theme.colors.light.base.white} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Stat value={allTrips.length} label={t("trips.stats.total")} />
        <Stat value={upcomingCount} label={t("trips.stats.upcoming")} />
        <Stat value={allTrips.filter((trip) => trip.accessRole !== "owner").length} label={t("trips.stats.shared")} />
      </View>
      </View>

      <QueryFeedback query={invitationsQuery} hasData={invitationsQuery.data !== undefined} layout="card" announce={false} />
      {invitations.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t("trips.invitations.title")}</Text>
          {invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationRow}>
              <View style={styles.flexText}>
                <Text selectable numberOfLines={1} style={styles.itemTitle}>{invitation.trip.name}</Text>
                <Text selectable style={styles.itemMeta}>{invitation.invitedBy.name} · {formatDateRange(invitation.trip.startDate, invitation.trip.endDate)}</Text>
              </View>
              <Pressable accessibilityRole="button" disabled={invitationPending} onPress={() => onInvitation(invitation.id, "decline")} style={styles.textButton}><Text style={styles.textButtonLabel}>{t("trips.invitations.decline")}</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={invitationPending} onPress={() => onInvitation(invitation.id, "accept")} style={styles.compactButton}><Text style={styles.compactButtonLabel}>{t("trips.invitations.accept")}</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {tripFilters.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => onFilter(item)} style={[styles.filterChip, filter === item && styles.selectedFilter]}><Text style={[styles.filterLabel, filter === item && styles.selectedFilterLabel]}>{t(`trips.filters.${item}`)}</Text></Pressable>)}
      </ScrollView>

      <QueryFeedback query={query} hasData={hasData} layout="list" announce={false} />
      {trips.length > 0 ? (
        <View style={styles.list}>{trips.map((trip) => <TripWorkspaceCard key={trip.id} trip={trip} now={now} />)}</View>
      ) : !query.isPending && !query.isError && query.fetchStatus !== "paused" ? <EmptyState icon="map-outline" title={filter === "all" ? t("trips.emptyTripsTitle") : t("trips.emptyFilteredTitle")} description={t("trips.emptyTripsDescription")} action={t("trips.createTrip")} onAction={() => router.push("/trip/new")} /> : null}
    </>
  );
}

function TripWorkspaceCard({ trip, now }: { trip: TripDTO; now: number }) {
  const { t } = useTranslation();
  const phase = getTripPhase(trip, now);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={trip.name} onPress={() => router.push({ pathname: "/trip/[id]", params: { id: String(trip.id) } })} style={({ pressed }) => [styles.tripWorkspaceCard, pressed && styles.pressed]}>
      {trip.city?.coverImageUrl ? <CatalogImage source={{ uri: trip.city.coverImageUrl }} style={styles.tripImage} contentFit="cover" /> : <View style={styles.tripIcon}><Ionicons name={phase === "past" ? "checkmark" : phase === "ongoing" ? "navigate" : "airplane"} size={26} color={travelSurfaces.featured} /></View>}
      <View style={styles.flexText}>
        <View style={styles.statusPill}><Text style={styles.statusText}>{t(`trips.filters.${trip.status}`)}</Text></View>
        <Text numberOfLines={2} style={styles.itemTitle}>{trip.name}</Text>
        <Text style={styles.itemMeta}>{trip.city ? `${trip.city.name}, ${trip.city.country} · ` : ""}{formatDateRange(trip.startDate, trip.endDate)}</Text>
        <Text style={styles.itemPhase}>{t(`trips.phases.${phase}`)}</Text>
        {trip.description ? <Text selectable numberOfLines={2} style={styles.itemDescription}>{trip.description}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={19} color={theme.colors.light.gray[400]} />
    </Pressable>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text selectable style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
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



const styles = StyleSheet.create({
  overview: { padding: 20, borderRadius: 24, gap: 20, backgroundColor: travelSurfaces.featured },
  tripImage: { width: 64, height: 96, borderRadius: 16 },
  itemPhase: { color: travelSurfaces.featured, fontSize: 11, lineHeight: 16, fontWeight: "500" },

  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  segment: { marginHorizontal: 20, marginBottom: 4, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.colors.light.separator },
  segmentButton: { flex: 1, minHeight: 52, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: "transparent", alignItems: "center", justifyContent: "center" },
  selectedSegment: { borderBottomColor: travelSurfaces.foreground },
  segmentLabel: { color: theme.colors.light.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  selectedSegmentLabel: { color: travelSurfaces.foreground, fontWeight: "600" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  workspaceHeading: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  workspaceHeadingText: { flex: 1, gap: 8 },
  eyebrow: { color: travelSurfaces.featuredSecondary, fontSize: 11, lineHeight: 16, fontWeight: "500" },
  workspaceTitle: { color: theme.colors.light.base.white, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  workspaceDescription: { color: travelSurfaces.featuredSecondary, fontSize: 13, lineHeight: 20 },
  addButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.featuredInset },
  statsRow: { flexDirection: "row", gap: theme.spacing[2] },
  stat: { flex: 1, minWidth: 0, minHeight: 76, padding: 10, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: travelSurfaces.featuredInset },
  statValue: { color: theme.colors.light.base.white, fontSize: 20, lineHeight: 26, fontWeight: "600", fontVariant: ["tabular-nums"] },
  statLabel: { color: travelSurfaces.featuredSecondary, fontSize: 11, lineHeight: 16, textAlign: "center" },
  sectionCard: { padding: 18, borderRadius: 24, gap: 16, backgroundColor: travelSurfaces.info },
  sectionTitle: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "600" },
  invitationRow: { gap: 10, paddingVertical: 8 },
  flexText: { flex: 1, minWidth: 0, gap: 6 },
  textButton: { paddingHorizontal: theme.spacing[2], paddingVertical: theme.spacing[2] },
  textButtonLabel: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "600" },
  compactButton: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderRadius: theme.radius.full, backgroundColor: theme.colors.light.accent },
  compactButtonLabel: { color: theme.colors.light.base.white, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  filterRow: { gap: theme.spacing[2], paddingRight: theme.spacing[5] },
  filterChip: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surfaceSecondary },
  selectedFilter: { backgroundColor: travelSurfaces.featured },
  filterLabel: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  selectedFilterLabel: { color: theme.colors.light.base.white },
  list: { gap: theme.spacing[3] },
  tripWorkspaceCard: { padding: 16, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.colors.light.surface },
  tripIcon: { width: 64, height: 96, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.header },
  itemTitle: { color: travelSurfaces.foreground, fontSize: 16, lineHeight: 22, fontWeight: "600" },
  itemMeta: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  itemDescription: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: travelSurfaces.info },
  statusText: { color: travelSurfaces.featured, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  errorCard: { minHeight: 180, padding: theme.spacing[5], borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.error[50] },
  errorText: { color: theme.colors.light.error[700], fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  retry: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  empty: { minHeight: 250, padding: 24, borderRadius: 24, backgroundColor: theme.colors.light.surface, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { width: 60, height: 60, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info },
  emptyTitle: { color: theme.colors.light.gray[900], fontSize: 18, lineHeight: 24, fontWeight: "600", textAlign: "center" },
  emptyDescription: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 18, fontWeight: "600", textAlign: "center" },
  primaryButton: { marginTop: 8, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  primaryButtonLabel: { color: theme.colors.light.base.white, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
