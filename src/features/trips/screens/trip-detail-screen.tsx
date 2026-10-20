import { QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import { TaskEditorLayout } from "@/features/task-flow/task-chrome";
import { useTaskNavigation } from "@/features/task-flow/use-task-navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { JourneyHeader } from "@/components/ui/journey-header";
import {
  type CityDTO,
  useCitySuggestions,
  useDestinationSuggestions,
} from "@/features/travel/services/travel-api-service";
import type { Destination } from "@/features/travel/travel.data";
import {
  type BookingDTO,
  type TripBudgetPreference,
  type TripDetailDTO,
  type TripStatus,
  useBookings,
  useCancelBooking,
  useDeleteTrip,
  useInviteCompanion,
  useLeaveTrip,
  useRemoveCompanion,
  useReplaceTripStops,
  useRevokeInvitation,
  useTrip,
  useUpdateTrip,
} from "@/features/trips/services/trips-api-service";
import { ApiError } from "@/lib/api/client";
import { theme, travelSurfaces } from "@/theme/theme";

type EditDraft = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  cityId: string | null;
  crewNumber: number;
  budgetPreference: TripBudgetPreference | null;
};
type EditFormState = Omit<EditDraft, "cityId">;
type CityChoice = Pick<CityDTO, "id" | "name" | "country" | "coverImageUrl">;
type StopDraft = { destinationId: string; title: string; location: string; image: string };

const statuses: readonly TripStatus[] = ["planning", "confirmed", "completed", "cancelled"];

export function TripDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const tripQuery = useTrip(Number.isInteger(tripId) && tripId > 0 ? tripId : null);
  const refetchTrip = tripQuery.refetch;

  useFocusEffect(useCallback(() => {
    if (Number.isInteger(tripId) && tripId > 0) void refetchTrip();
  }, [tripId, refetchTrip]));

  if (!Number.isInteger(tripId) || tripId <= 0) return <ScreenState message={t("travelPlan.workspace.tripLoadError")} />;
  if (!tripQuery.data) return <ScreenState query={tripQuery} />;
  return <TripDetailContent trip={tripQuery.data} query={tripQuery} refreshing={tripQuery.isRefetching} onRefresh={() => void tripQuery.refetch()} />;
}

function TripDetailContent({ trip, query, refreshing, onRefresh }: { query: FeedbackQuery; trip: TripDetailDTO; refreshing: boolean; onRefresh: () => void }) {
  const { t } = useTranslation();
  const isOwner = trip.accessRole === "owner";
  const bookingsQuery = useBookings();
  const deleteTrip = useDeleteTrip();
  const leaveTrip = useLeaveTrip();
  const invite = useInviteCompanion();
  const revokeInvitation = useRevokeInvitation();
  const removeCompanion = useRemoveCompanion();
  const cancelBooking = useCancelBooking();
  const [email, setEmail] = useState("");
  const tripBookings = (bookingsQuery.data ?? []).filter((booking) => booking.tripId === trip.id);

  const confirmDelete = () => Alert.alert(t("tripDetail.deleteTitle"), t("tripDetail.deleteDescription", { name: trip.name }), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("tripDetail.delete"), style: "destructive", onPress: () => deleteTrip.mutate(trip.id, { onSuccess: () => router.replace("/trips"), onError: showMutationError }) },
  ]);
  const confirmLeave = () => Alert.alert(t("tripDetail.leaveTitle"), t("tripDetail.leaveDescription", { name: trip.name }), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("tripDetail.leave"), style: "destructive", onPress: () => leaveTrip.mutate(trip.id, { onSuccess: () => router.replace("/trips"), onError: showMutationError }) },
  ]);
  const submitInvite = () => {
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) return;
    invite.mutate({ tripId: trip.id, email: value }, { onSuccess: () => setEmail(""), onError: showMutationError });
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <JourneyHeader title={t("tripDetail.header")} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.light.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <QueryFeedback query={query} hasData />
        <View style={styles.hero}>
          <View style={styles.statusPill}><Text style={styles.statusText}>{t(`trips.filters.${trip.status}`)}</Text></View>
          <Text selectable style={styles.heroTitle}>{trip.name}</Text>
          <Text selectable style={styles.heroMeta}>{formatDateRange(trip.startDate, trip.endDate)} · {t("tripDetail.days", { count: durationDays(trip.startDate, trip.endDate) })}{trip.city ? ` · ${trip.city.name}, ${trip.city.country}` : ""}</Text>
          <Text selectable style={styles.heroDescription}>{trip.description || t("tripDetail.noDescription")}</Text>
          <View style={styles.actionRow}>
            <ActionButton icon="sparkles-outline" label={trip.plannerSessionId ? t("tripDetail.openPlan") : isOwner ? t("tripDetail.planTrip") : t("tripDetail.planningNotStarted")} onPress={() => router.push({ pathname: "/planner/[tripId]", params: { tripId: String(trip.id) } })} primary disabled={!isOwner && !trip.plannerSessionId} />
            {isOwner ? <ActionButton icon="pencil-outline" label={t("common.edit")} onPress={() => router.push({ pathname: "/trip/edit", params: { id: String(trip.id) } })} /> : null}
            <ActionButton icon={isOwner ? "trash-outline" : "exit-outline"} label={isOwner ? t("tripDetail.delete") : t("tripDetail.leave")} onPress={isOwner ? confirmDelete : confirmLeave} danger />
          </View>
        </View>



        <View style={styles.statsRow}>
          <Stat icon="location-outline" value={String(trip.stops.length)} label={t("tripDetail.destinations")} />
          <Stat icon="people-outline" value={String(trip.crewNumber ?? trip.companions.length + 1)} label={t("tripDetail.travellers")} />
          <Stat icon="receipt-outline" value={String(tripBookings.length)} label={t("tripDetail.bookings")} />
        </View>

        <Section title={t("tripDetail.routeTitle")} description={t("tripDetail.routeDescription")} action={isOwner ? t("common.edit") : undefined} onAction={isOwner ? () => router.push({ pathname: "/trip/route", params: { id: String(trip.id) } }) : undefined}>
          {trip.stops.length ? trip.stops.map((stop, index) => (
            <Pressable key={stop.id} onPress={() => router.push({ pathname: "/destination/[id]", params: { id: stop.destinationId } })} style={styles.stopRow}>
              <View style={styles.indexCircle}><Text style={styles.indexText}>{index + 1}</Text></View>
              <Image source={{ uri: stop.destination.coverImageUrl }} style={styles.stopImage} contentFit="cover" />
              <View style={styles.flexText}><Text selectable numberOfLines={1} style={styles.itemTitle}>{stop.destination.title}</Text><Text selectable numberOfLines={1} style={styles.itemMeta}>{stop.destination.location.city}, {stop.destination.location.country}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.light.gray[400]} />
            </Pressable>
          )) : <EmptyLine text={t("tripDetail.noStops")} />}
        </Section>

        <Section title={t("tripDetail.peopleTitle")} description={isOwner ? t("tripDetail.peopleOwnerDescription") : t("tripDetail.peopleSharedDescription")}>
          {[trip.owner, ...trip.companions].map((person) => (
            <View key={`${person.accountId}-${person.membershipId ?? "owner"}`} style={styles.personRow}>
              {person.image ? <Image source={{ uri: person.image }} style={styles.avatar} contentFit="cover" /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{person.name.slice(0, 1).toUpperCase()}</Text></View>}
              <View style={styles.flexText}><Text selectable style={styles.itemTitle}>{person.name}</Text><Text selectable style={styles.itemMeta}>{person.role === "owner" ? t("tripDetail.owner") : t("tripDetail.companion")}</Text></View>
              {isOwner && person.membershipId ? <Pressable disabled={removeCompanion.isPending} onPress={() => removeCompanion.mutate({ tripId: trip.id, membershipId: person.membershipId as string }, { onError: showMutationError })}><Text style={styles.dangerText}>{t("tripDetail.remove")}</Text></Pressable> : null}
            </View>
          ))}
          {isOwner ? <View style={styles.inlineForm}><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="friend@example.com" placeholderTextColor={theme.colors.light.gray[400]} style={[styles.input, styles.flexText]} /><Pressable disabled={invite.isPending || !/^\S+@\S+\.\S+$/.test(email.trim())} onPress={submitInvite} style={styles.compactPrimary}><Text style={styles.compactPrimaryText}>{t("tripDetail.invite")}</Text></Pressable></View> : null}
          {isOwner && trip.invitations.length ? <View style={styles.pendingList}><Text style={styles.label}>{t("tripDetail.pending")}</Text>{trip.invitations.map((invitation) => <View key={invitation.id} style={styles.personRow}><Text selectable numberOfLines={1} style={[styles.itemMeta, styles.flexText]}>{invitation.invitee.email}</Text><Pressable disabled={revokeInvitation.isPending} onPress={() => revokeInvitation.mutate({ tripId: trip.id, invitationId: invitation.id }, { onError: showMutationError })}><Text style={styles.dangerText}>{t("tripDetail.revoke")}</Text></Pressable></View>)}</View> : null}
        </Section>

        {isOwner ? (
          <Section title={t("tripDetail.bookingsTitle")} description={t("tripDetail.bookingsDescription")}>
            <QueryFeedback query={bookingsQuery} hasData={bookingsQuery.data !== undefined} layout="list" />
            {tripBookings.length ? tripBookings.map((booking) => <BookingRow key={booking.id} booking={booking} cancelling={cancelBooking.isPending} onCancel={() => cancelBooking.mutate(booking.id, { onError: showMutationError })} />) : !bookingsQuery.isPending && !bookingsQuery.isError && bookingsQuery.fetchStatus !== "paused" ? <EmptyLine text={t("tripDetail.noBookings")} /> : null}
          </Section>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function TripEditScreen() { return <TripEditorRoute />; }
export function TripRouteEditScreen() { return <TripEditorRoute routeOnly />; }
function TripEditorRoute({ routeOnly = false }: { routeOnly?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const tripId = Number(id);
  const validId = Number.isInteger(tripId) && tripId > 0;
  const query = useTrip(validId ? tripId : null);
  if (!validId) return <ScreenState message={t("travelPlan.workspace.tripLoadError")} />;
  if (!query.data) return <ScreenState query={query} />;
  if (query.data.accessRole !== "owner") return <ScreenState message={t("taskFlow.ownerOnly")} />;
  const done = () => router.dismissTo({ pathname: "/trip/[id]", params: { id: String(tripId) } });
  return routeOnly ? <RouteEditor query={query} key={tripId} trip={query.data} onDone={done} /> : <EditTripForm query={query} key={tripId} trip={query.data} onDone={done} />;
}

function EditTripForm({ trip, onDone, query }: { query: FeedbackQuery; trip: TripDetailDTO; onDone: () => void }) {
  const { t } = useTranslation();
  const citiesQuery = useCitySuggestions();
  const [selectedCity, setSelectedCity] = useState<CityChoice | null>(trip.city);
  const [draft, setDraft] = useState<EditFormState>({
    name: trip.name,
    description: trip.description ?? "",
    startDate: trip.startDate.slice(0, 10),
    endDate: trip.endDate.slice(0, 10),
    status: trip.status,
    crewNumber: trip.crewNumber ?? trip.companions.length + 1,
    budgetPreference: trip.budgetPreference,
  });
  const cityChoices: CityChoice[] = trip.city && !(citiesQuery.data ?? []).some((city) => city.id === trip.city?.id)
    ? [trip.city, ...(citiesQuery.data ?? [])]
    : citiesQuery.data ?? [];
  const [initial] = useState(draft);
  const mutation = useUpdateTrip();
  const submitLock = useRef(false);
  const task = useTaskNavigation({ dirty: JSON.stringify(draft) !== JSON.stringify(initial) || selectedCity?.id !== trip.city?.id, pending: mutation.isPending });
  const valid = Boolean(
    draft.name.trim()
    && isDateOnly(draft.startDate)
    && isDateOnly(draft.endDate)
    && draft.endDate >= draft.startDate
    && Number.isInteger(draft.crewNumber)
    && draft.crewNumber >= 1
    && draft.crewNumber <= 50,
  );
  const save = async () => {
    if (!valid || submitLock.current || task.leaving) return;
    submitLock.current = true;
    try {
      await mutation.mutateAsync({ id: trip.id, input: { ...draft, name: draft.name.trim(), description: draft.description.trim(), cityId: selectedCity?.id ?? null } });
      task.complete(onDone);
    } catch (error) { submitLock.current = false; Alert.alert(t("planDetail.saveError"), getErrorMessage(error)); }
  };

  return (
    <TaskEditorLayout title={t("tripDetail.editTitle")} back={task.back} pending={mutation.isPending || task.leaving} valid={valid} save={() => void save()}><QueryFeedback query={query} hasData />
      <Field label={t("travelPlan.workspace.tripName")}>
        <TextInput maxLength={200} value={draft.name} onChangeText={(name) => setDraft((value) => ({ ...value, name }))} style={styles.input} />
      </Field>
      <QueryFeedback query={citiesQuery} hasData={citiesQuery.data !== undefined} layout="cities" />
      {cityChoices.length ? (
        <Field label={t("travelPlan.workspace.cityOptional")}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
            {cityChoices.map((city) => (
              <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedCity?.id === city.id }} key={city.id} onPress={() => setSelectedCity(city)} style={[styles.destinationChoice, selectedCity?.id === city.id && styles.selectedChoice]}>
                <Image source={{ uri: city.coverImageUrl }} style={styles.choiceImage} contentFit="cover" />
                <Text numberOfLines={1} style={styles.choiceText}>{city.name}</Text>
                <Text numberOfLines={1} style={styles.itemMeta}>{city.country}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {selectedCity ? <Pressable onPress={() => setSelectedCity(null)}><Text style={styles.actionText}>{t("common.clear")}</Text></Pressable> : null}
        </Field>
      ) : null}
      <View style={styles.twoColumns}>
        <Field label={t("travelPlan.workspace.startDate")}><TextInput maxLength={10} value={draft.startDate} onChangeText={(startDate) => setDraft((value) => ({ ...value, startDate }))} placeholder="YYYY-MM-DD" style={styles.input} /></Field>
        <Field label={t("travelPlan.workspace.endDate")}><TextInput maxLength={10} value={draft.endDate} onChangeText={(endDate) => setDraft((value) => ({ ...value, endDate }))} placeholder="YYYY-MM-DD" style={styles.input} /></Field>
      </View>
      <Field label={t("travelPlan.workspace.crewSize")}>
        <TextInput keyboardType="number-pad" maxLength={2} value={String(draft.crewNumber)} onChangeText={(value) => setDraft((current) => ({ ...current, crewNumber: Number(value.replace(/\D/g, "")) }))} style={styles.input} />
      </Field>
      <Field label={t("travelPlan.workspace.budgetPreference")}><View style={styles.wrap}>{(["low", "medium", "luxury"] as const).map((value) => <Choice key={value} active={draft.budgetPreference === value} label={t(`travelPlan.workspace.budgetPreferences.${value}`)} onPress={() => setDraft((current) => ({ ...current, budgetPreference: current.budgetPreference === value ? null : value }))} />)}</View></Field>
      <Field label={t("tripDetail.status")}><View style={styles.wrap}>{statuses.map((status) => <Choice key={status} active={draft.status === status} label={t(`trips.filters.${status}`)} onPress={() => setDraft((value) => ({ ...value, status }))} />)}</View></Field>
      <Field label={t("travelPlan.workspace.tripNotes")}><TextInput multiline maxLength={5000} value={draft.description} onChangeText={(description) => setDraft((value) => ({ ...value, description }))} style={[styles.input, styles.textArea]} /></Field>
      {!valid ? <Text accessibilityLiveRegion="polite" style={styles.validation}>{t("taskFlow.invalidTrip")}</Text> : null}
    </TaskEditorLayout>
  );
}

function RouteEditor({ trip, onDone, query }: { query: FeedbackQuery; trip: TripDetailDTO; onDone: () => void }) {
  const { t } = useTranslation();
  const mutation = useReplaceTripStops();
  const suggestions = useDestinationSuggestions();
  const [stops, setStops] = useState<StopDraft[]>(() => trip.stops.map((stop) => ({ destinationId: stop.destinationId, title: stop.destination.title, location: `${stop.destination.location.city}, ${stop.destination.location.country}`, image: stop.destination.coverImageUrl })));
  const [initial] = useState(() => stops.map((stop) => stop.destinationId).join(","));
  const submitLock = useRef(false);
  const task = useTaskNavigation({ dirty: initial !== stops.map((stop) => stop.destinationId).join(","), pending: mutation.isPending });
  const save = async () => {
    if (!valid || submitLock.current || task.leaving) return;
    submitLock.current = true;
    try { await mutation.mutateAsync({ id: trip.id, stops: stops.map(({ destinationId }) => ({ destinationId })) }); task.complete(onDone); }
    catch (error) { submitLock.current = false; Alert.alert(t("planDetail.saveError"), getErrorMessage(error)); }
  };
  const available = (suggestions.data ?? []).filter((destination) => !stops.some((stop) => stop.destinationId === destination.id));
  const add = (destination: Destination) => setStops((current) => [...current, { destinationId: destination.id, title: destination.title ?? destination.location ?? destination.id, location: destination.location ?? "", image: destination.image }].slice(0, 5));
  const move = (index: number, direction: -1 | 1) => setStops((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const valid = stops.length <= 5 && new Set(stops.map((stop) => stop.destinationId)).size === stops.length;
  return <TaskEditorLayout title={t("tripDetail.routeTitle")} back={task.back} pending={mutation.isPending || task.leaving} valid={valid} save={() => void save()}><QueryFeedback query={query} hasData /><Text selectable style={styles.helper}>{t("tripDetail.routeHelper")}</Text><QueryFeedback query={suggestions} hasData={suggestions.data !== undefined} layout="destinations" />{stops.map((stop, index) => <View key={stop.destinationId} style={styles.stopEditor}><View style={styles.personRow}><Image source={{ uri: stop.image }} style={styles.stopImage} contentFit="cover" /><View style={[styles.flexText, styles.stopText]}><Text selectable numberOfLines={1} style={styles.itemTitle}>{index + 1}. {stop.title}</Text><Text selectable numberOfLines={1} style={styles.itemMeta}>{stop.location}</Text></View><Pressable disabled={index === 0} onPress={() => move(index, -1)}><Ionicons name="arrow-up" size={19} color={theme.colors.light.gray[600]} /></Pressable><Pressable disabled={index === stops.length - 1} onPress={() => move(index, 1)}><Ionicons name="arrow-down" size={19} color={theme.colors.light.gray[600]} /></Pressable><Pressable onPress={() => setStops((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Ionicons name="close-circle" size={20} color={theme.colors.light.error[500]} /></Pressable></View></View>)}{stops.length < 5 && available.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{available.slice(0, 8).map((destination) => <Pressable key={destination.id} onPress={() => add(destination)} style={styles.destinationChoice}><Image source={{ uri: destination.image }} style={styles.choiceImage} contentFit="cover" /><Text numberOfLines={1} style={styles.choiceText}>+ {destination.title}</Text></Pressable>)}</ScrollView> : null}{!valid ? <Text style={styles.validation}>{t("tripDetail.routeInvalid")}</Text> : null}</TaskEditorLayout>;
}

function BookingRow({ booking, cancelling, onCancel }: { booking: BookingDTO; cancelling: boolean; onCancel: () => void }) {
  const { t } = useTranslation();
  const cancellable = booking.status === "upcoming" || booking.status === "confirmed";
  return <View style={styles.bookingRow}><Image source={{ uri: booking.destination.coverImageUrl }} style={styles.stopImage} contentFit="cover" /><View style={styles.flexText}><Text selectable style={styles.itemTitle}>{booking.destination.title}</Text><Text selectable style={styles.itemMeta}>{formatDateRange(booking.startDate, booking.endDate)} · {t(`tripDetail.packages.${booking.packageOptionId}`, { defaultValue: booking.packageOptionId })}</Text></View>{cancellable ? <Pressable disabled={cancelling} onPress={() => Alert.alert(t("tripDetail.cancelBookingTitle"), t("tripDetail.cancelBookingDescription"), [{ text: t("common.cancel"), style: "cancel" }, { text: t("tripDetail.cancelBooking"), style: "destructive", onPress: onCancel }])}><Text style={styles.dangerText}>{t("tripDetail.cancelBooking")}</Text></Pressable> : <Text style={styles.itemMeta}>{booking.status}</Text>}</View>;
}

function Section({ title, description, action, onAction, children }: { title: string; description: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.flexText}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.helper}>{description}</Text></View>{action && onAction ? <Pressable onPress={onAction}><Text style={styles.actionText}>{action}</Text></Pressable> : null}</View>{children}</View>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.choice, active && styles.selectedChoice]}><Text style={[styles.choiceText, active && styles.selectedChoiceText]}>{label}</Text></Pressable>; }
function ActionButton({ label, icon, primary, danger, disabled, loading, onPress }: { label: string; icon?: keyof typeof Ionicons.glyphMap; primary?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.actionButton, primary && styles.primaryAction, danger && styles.dangerAction, disabled && styles.disabled]}>{loading ? <ActivityIndicator size="small" color={theme.colors.light.base.white} /> : icon ? <Ionicons name={icon} size={16} color={primary ? theme.colors.light.base.white : danger ? theme.colors.light.error[600] : theme.colors.light.gray[700]} /> : null}<Text style={[styles.actionButtonText, primary && styles.primaryActionText, danger && styles.dangerActionText]}>{label}</Text></Pressable>; }
function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) { return <View style={styles.stat}><Ionicons name={icon} size={18} color={theme.colors.light.accent} /><Text selectable style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function EmptyLine({ text }: { text: string }) { return <View style={styles.emptyLine}><Ionicons name="information-circle-outline" size={19} color={theme.colors.light.gray[400]} /><Text style={styles.helper}>{text}</Text></View>; }
function ScreenState({ query, message, onRetry }: { query?: FeedbackQuery; message?: string; onRetry?: () => void }) { const { t } = useTranslation(); return <View style={styles.screen}><JourneyHeader title={t("tripDetail.header")} showBack /><View style={{ padding: 20 }}>{query ? <QueryFeedback query={query} layout="detail" /> : <><Ionicons name="alert-circle-outline" size={34} color={theme.colors.light.error[500]} /><Text selectable style={styles.validation}>{message}</Text>{onRetry ? <Pressable onPress={onRetry}><Text style={styles.actionText}>{t("common.retry")}</Text></Pressable> : null}</>}</View></View>; }

function showMutationError(error: Error) { Alert.alert("Error", getErrorMessage(error)); }
function getErrorMessage(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : "Request failed"; }
function durationDays(start: string, end: string) { return Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1); }
function formatDateRange(start: string, end: string) { const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }); return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`; }
function isDateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }

const styles = StyleSheet.create({

  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 },
  hero: { padding: 20, borderRadius: 24, gap: 12, backgroundColor: travelSurfaces.featured },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: travelSurfaces.info },
  statusText: { color: travelSurfaces.featured, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  heroTitle: { color: theme.colors.light.base.white, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  heroMeta: { color: travelSurfaces.featuredSecondary, fontSize: 13, lineHeight: 20 },
  heroContext: { color: travelSurfaces.featuredSecondary, fontSize: 13, lineHeight: 20 },
  heroDescription: { color: travelSurfaces.featuredSecondary, fontSize: 14, lineHeight: 22 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  actionButton: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.colors.light.surface },
  actionButtonText: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 17, fontWeight: "600" },
  primaryAction: { borderWidth: 1, borderColor: travelSurfaces.secondary, backgroundColor: theme.colors.light.accent },
  primaryActionText: { color: theme.colors.light.base.white },
  dangerAction: { borderColor: theme.colors.light.error[200], backgroundColor: theme.colors.light.error[50] },
  dangerActionText: { color: theme.colors.light.error[600] },
  disabled: { opacity: 0.45 },
  statsRow: { flexDirection: "row", gap: theme.spacing[2] },
  stat: { flex: 1, minWidth: 0, minHeight: 96, padding: 12, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: travelSurfaces.header },
  statValue: { color: theme.colors.light.gray[900], fontSize: 19, lineHeight: 24, fontWeight: "600", fontVariant: ["tabular-nums"] },
  statLabel: { color: travelSurfaces.secondary, fontSize: 12, lineHeight: 17, textAlign: "center" },
  section: { padding: 20, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, gap: 16, backgroundColor: theme.colors.light.surface },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing[3] },
  sectionTitle: { color: travelSurfaces.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" },
  helper: { color: theme.colors.light.muted, fontSize: 13, lineHeight: 20 },
  actionText: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  flexText: { flex: 1, minWidth: 0 },
  stopRow: { minHeight: 88, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  indexCircle: { width: 26, height: 26, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info },
  indexText: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  stopImage: { width: 52, height: 68, borderRadius: 14, backgroundColor: theme.colors.light.surfaceSecondary },
  itemTitle: { color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  itemMeta: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  personRow: { minHeight: 60, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: theme.radius.full, backgroundColor: theme.colors.light.gray[100] },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info },
  avatarText: { color: theme.colors.light.accent, fontSize: 14, lineHeight: 18, fontWeight: "600" },
  dangerText: { color: theme.colors.light.error[600], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  inlineForm: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  input: { flex: 1, minHeight: 48, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.xl, color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "600", backgroundColor: theme.colors.light.background, borderCurve: "continuous" },
  compactPrimary: { minHeight: 44, paddingHorizontal: theme.spacing[3], borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  compactPrimaryText: { color: theme.colors.light.base.white, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  pendingList: { paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: theme.spacing[2] },
  label: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  formCard: { padding: 20, borderRadius: 24, gap: 16, backgroundColor: travelSurfaces.info },
  field: { flex: 1, gap: theme.spacing[2] },
  twoColumns: { flexDirection: "row", gap: theme.spacing[2] },
  textArea: { minHeight: 88, paddingTop: theme.spacing[3], textAlignVertical: "top" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  choice: { minHeight: 36, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  selectedChoice: { borderColor: theme.colors.light.accent, backgroundColor: travelSurfaces.info },
  choiceText: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "600" },
  selectedChoiceText: { color: theme.colors.light.accent },
  editor: { paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: theme.spacing[3] },
  stopEditor: { padding: theme.spacing[3], borderRadius: theme.radius.xl, gap: theme.spacing[2], backgroundColor: theme.colors.light.gray[50] },
  stopText: { gap: 2 },
  horizontal: { gap: theme.spacing[2], paddingRight: theme.spacing[3] },
  destinationChoice: { width: 128, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.xl, gap: theme.spacing[1], backgroundColor: theme.colors.light.surface },
  choiceImage: { width: "100%", height: 64, borderRadius: theme.radius.sm, backgroundColor: theme.colors.light.gray[100] },
  validation: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  bookingRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  price: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  emptyLine: { minHeight: 80, padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: travelSurfaces.info },
  center: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center", gap: theme.spacing[3] },
});
