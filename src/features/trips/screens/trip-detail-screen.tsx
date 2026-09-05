import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { useDestinationSuggestions } from "@/features/travel/services/travel-api-service";
import type { Destination } from "@/features/travel/travel.data";
import {
  type BookingDTO,
  type TripDetailDTO,
  type TripStatus,
  useBookings,
  useCancelBooking,
  useCreateBooking,
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
import { theme } from "@/theme/theme";

type EditDraft = { name: string; description: string; startDate: string; endDate: string; status: TripStatus };
type StopDraft = { destinationId: string; title: string; location: string; image: string; arrivalDate: string; departureDate: string };

const statuses: readonly TripStatus[] = ["planning", "confirmed", "completed", "cancelled"];
const packages = ["standard", "flexible", "premium"] as const;

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);
  const tripQuery = useTrip(Number.isInteger(tripId) && tripId > 0 ? tripId : null);
  const refetchTrip = tripQuery.refetch;

  useFocusEffect(useCallback(() => {
    if (Number.isInteger(tripId) && tripId > 0) void refetchTrip();
  }, [tripId, refetchTrip]));

  if (tripQuery.isPending) return <ScreenState loading />;
  if (tripQuery.isError || !tripQuery.data) return <ScreenState message={getErrorMessage(tripQuery.error)} onRetry={() => void tripQuery.refetch()} />;
  return <TripDetailContent trip={tripQuery.data} refreshing={tripQuery.isRefetching} onRefresh={() => void tripQuery.refetch()} />;
}

function TripDetailContent({ trip, refreshing, onRefresh }: { trip: TripDetailDTO; refreshing: boolean; onRefresh: () => void }) {
  const { t } = useTranslation();
  const isOwner = trip.accessRole === "owner";
  const bookingsQuery = useBookings();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const leaveTrip = useLeaveTrip();
  const invite = useInviteCompanion();
  const revokeInvitation = useRevokeInvitation();
  const removeCompanion = useRemoveCompanion();
  const cancelBooking = useCancelBooking();
  const [editing, setEditing] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
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
      <TravelScreenHeader title={t("tripDetail.header")} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.light.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.statusPill}><Text style={styles.statusText}>{t(`trips.filters.${trip.status}`)}</Text></View>
          <Text selectable style={styles.heroTitle}>{trip.name}</Text>
          <Text selectable style={styles.heroMeta}>{formatDateRange(trip.startDate, trip.endDate)} · {t("tripDetail.days", { count: durationDays(trip.startDate, trip.endDate) })}</Text>
          <Text selectable style={styles.heroDescription}>{trip.description || t("tripDetail.noDescription")}</Text>
          <View style={styles.actionRow}>
            <ActionButton icon="sparkles-outline" label={trip.plannerSessionId ? t("tripDetail.openPlan") : isOwner ? t("tripDetail.planTrip") : t("tripDetail.planningNotStarted")} onPress={() => router.push({ pathname: "/explore", params: { tripId: String(trip.id) } })} primary disabled={!isOwner && !trip.plannerSessionId} />
            {isOwner ? <ActionButton icon="pencil-outline" label={t("common.edit")} onPress={() => setEditing((value) => !value)} /> : null}
            <ActionButton icon={isOwner ? "trash-outline" : "exit-outline"} label={isOwner ? t("tripDetail.delete") : t("tripDetail.leave")} onPress={isOwner ? confirmDelete : confirmLeave} danger />
          </View>
        </View>

        {editing && isOwner ? <EditTripForm trip={trip} pending={updateTrip.isPending} onCancel={() => setEditing(false)} onSave={(input) => updateTrip.mutate({ id: trip.id, input }, { onSuccess: () => setEditing(false), onError: showMutationError })} /> : null}

        <View style={styles.statsRow}>
          <Stat icon="location-outline" value={String(trip.stops.length)} label={t("tripDetail.destinations")} />
          <Stat icon="people-outline" value={String(trip.companions.length + 1)} label={t("tripDetail.travellers")} />
          <Stat icon="receipt-outline" value={String(tripBookings.length)} label={t("tripDetail.bookings")} />
        </View>

        <Section title={t("tripDetail.routeTitle")} description={t("tripDetail.routeDescription")} action={isOwner ? t("common.edit") : undefined} onAction={isOwner ? () => setEditingRoute((value) => !value) : undefined}>
          {editingRoute && isOwner ? <RouteEditor trip={trip} onDone={() => setEditingRoute(false)} /> : trip.stops.length ? trip.stops.map((stop, index) => (
            <Pressable key={stop.id} onPress={() => router.push({ pathname: "/destination/[id]", params: { id: stop.destinationId } })} style={styles.stopRow}>
              <View style={styles.indexCircle}><Text style={styles.indexText}>{index + 1}</Text></View>
              <Image source={{ uri: stop.destination.coverImageUrl }} style={styles.stopImage} contentFit="cover" />
              <View style={styles.flexText}><Text selectable numberOfLines={1} style={styles.itemTitle}>{stop.destination.title}</Text><Text selectable numberOfLines={1} style={styles.itemMeta}>{stop.destination.location.city}, {stop.destination.location.country}</Text><Text selectable style={styles.itemMeta}>{formatDateRange(stop.arrivalDate, stop.departureDate)}</Text></View>
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
          <Section title={t("tripDetail.bookingsTitle")} description={t("tripDetail.bookingsDescription")} action={t("tripDetail.addBooking")} onAction={() => setCreatingBooking((value) => !value)}>
            {creatingBooking ? <BookingForm trip={trip} onDone={() => setCreatingBooking(false)} /> : null}
            {bookingsQuery.isPending ? <ActivityIndicator color={theme.colors.light.accent} /> : tripBookings.length ? tripBookings.map((booking) => <BookingRow key={booking.id} booking={booking} cancelling={cancelBooking.isPending} onCancel={() => cancelBooking.mutate(booking.id, { onError: showMutationError })} />) : <EmptyLine text={t("tripDetail.noBookings")} />}
          </Section>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EditTripForm({ trip, pending, onCancel, onSave }: { trip: TripDetailDTO; pending: boolean; onCancel: () => void; onSave: (input: EditDraft) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<EditDraft>({ name: trip.name, description: trip.description ?? "", startDate: trip.startDate.slice(0, 10), endDate: trip.endDate.slice(0, 10), status: trip.status });
  const valid = Boolean(draft.name.trim() && isDateOnly(draft.startDate) && isDateOnly(draft.endDate) && draft.endDate >= draft.startDate);
  return <View style={styles.formCard}><Text style={styles.sectionTitle}>{t("tripDetail.editTitle")}</Text><Field label={t("travelPlan.workspace.tripName")}><TextInput maxLength={200} value={draft.name} onChangeText={(name) => setDraft((value) => ({ ...value, name }))} style={styles.input} /></Field><View style={styles.twoColumns}><Field label={t("travelPlan.workspace.startDate")}><TextInput maxLength={10} value={draft.startDate} onChangeText={(startDate) => setDraft((value) => ({ ...value, startDate }))} placeholder="YYYY-MM-DD" style={styles.input} /></Field><Field label={t("travelPlan.workspace.endDate")}><TextInput maxLength={10} value={draft.endDate} onChangeText={(endDate) => setDraft((value) => ({ ...value, endDate }))} placeholder="YYYY-MM-DD" style={styles.input} /></Field></View><Field label={t("tripDetail.status") }><View style={styles.wrap}>{statuses.map((status) => <Choice key={status} active={draft.status === status} label={t(`trips.filters.${status}`)} onPress={() => setDraft((value) => ({ ...value, status }))} />)}</View></Field><Field label={t("travelPlan.workspace.tripNotes")}><TextInput multiline maxLength={5000} value={draft.description} onChangeText={(description) => setDraft((value) => ({ ...value, description }))} style={[styles.input, styles.textArea]} /></Field><FormActions pending={pending} valid={valid} onCancel={onCancel} onSave={() => onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() })} /></View>;
}

function RouteEditor({ trip, onDone }: { trip: TripDetailDTO; onDone: () => void }) {
  const { t } = useTranslation();
  const mutation = useReplaceTripStops();
  const suggestions = useDestinationSuggestions();
  const [stops, setStops] = useState<StopDraft[]>(() => trip.stops.map((stop) => ({ destinationId: stop.destinationId, title: stop.destination.title, location: `${stop.destination.location.city}, ${stop.destination.location.country}`, image: stop.destination.coverImageUrl, arrivalDate: stop.arrivalDate.slice(0, 10), departureDate: stop.departureDate.slice(0, 10) })));
  const available = (suggestions.data ?? []).filter((destination) => !stops.some((stop) => stop.destinationId === destination.id));
  const add = (destination: Destination) => setStops((current) => [...current, { destinationId: destination.id, title: destination.title ?? destination.location ?? destination.id, location: destination.location ?? "", image: destination.image, arrivalDate: current.at(-1)?.departureDate ?? trip.startDate.slice(0, 10), departureDate: trip.endDate.slice(0, 10) }].slice(0, 5));
  const move = (index: number, direction: -1 | 1) => setStops((current) => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const valid = stops.every((stop, index) => isDateOnly(stop.arrivalDate) && isDateOnly(stop.departureDate) && stop.arrivalDate >= trip.startDate.slice(0, 10) && stop.departureDate <= trip.endDate.slice(0, 10) && stop.departureDate >= stop.arrivalDate && (index === 0 || stop.arrivalDate >= stops[index - 1].departureDate));
  return <View style={styles.editor}><Text selectable style={styles.helper}>{t("tripDetail.routeHelper")}</Text>{stops.map((stop, index) => <View key={stop.destinationId} style={styles.stopEditor}><View style={styles.personRow}><Image source={{ uri: stop.image }} style={styles.stopImage} contentFit="cover" /><Text selectable numberOfLines={1} style={[styles.itemTitle, styles.flexText]}>{index + 1}. {stop.title}</Text><Pressable disabled={index === 0} onPress={() => move(index, -1)}><Ionicons name="arrow-up" size={19} color={theme.colors.light.gray[600]} /></Pressable><Pressable disabled={index === stops.length - 1} onPress={() => move(index, 1)}><Ionicons name="arrow-down" size={19} color={theme.colors.light.gray[600]} /></Pressable><Pressable onPress={() => setStops((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Ionicons name="close-circle" size={20} color={theme.colors.light.error[500]} /></Pressable></View><View style={styles.twoColumns}><TextInput value={stop.arrivalDate} onChangeText={(arrivalDate) => setStops((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, arrivalDate } : item))} maxLength={10} style={styles.input} /><TextInput value={stop.departureDate} onChangeText={(departureDate) => setStops((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, departureDate } : item))} maxLength={10} style={styles.input} /></View></View>)}{stops.length < 5 && available.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{available.slice(0, 8).map((destination) => <Pressable key={destination.id} onPress={() => add(destination)} style={styles.destinationChoice}><Image source={{ uri: destination.image }} style={styles.choiceImage} contentFit="cover" /><Text numberOfLines={1} style={styles.choiceText}>+ {destination.title}</Text></Pressable>)}</ScrollView> : null}{!valid ? <Text style={styles.validation}>{t("tripDetail.routeInvalid")}</Text> : null}<FormActions pending={mutation.isPending} valid={valid} onCancel={onDone} onSave={() => mutation.mutate({ id: trip.id, stops: stops.map(({ destinationId, arrivalDate, departureDate }) => ({ destinationId, arrivalDate, departureDate })) }, { onSuccess: onDone, onError: showMutationError })} /></View>;
}

function BookingForm({ trip, onDone }: { trip: TripDetailDTO; onDone: () => void }) {
  const { t } = useTranslation();
  const suggestions = useDestinationSuggestions();
  const mutation = useCreateBooking();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [packageOptionId, setPackage] = useState<(typeof packages)[number]>("standard");
  const [startDate, setStartDate] = useState(trip.startDate.slice(0, 10));
  const [endDate, setEndDate] = useState(trip.endDate.slice(0, 10));
  const [travellerCount, setTravellerCount] = useState(String(trip.companions.length + 1));
  const destinations = useMemo(() => suggestions.data ?? [], [suggestions.data]);
  const count = Number(travellerCount);
  const valid = Boolean(destination?.apiBacked && isDateOnly(startDate) && isDateOnly(endDate) && endDate >= startDate && Number.isInteger(count) && count >= 1 && count <= 50);
  return <View style={styles.editor}><Field label={t("tripDetail.chooseDestination")}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>{destinations.map((item) => <Pressable key={item.id} onPress={() => setDestination(item)} style={[styles.destinationChoice, destination?.id === item.id && styles.selectedChoice]}><Image source={{ uri: item.image }} style={styles.choiceImage} contentFit="cover" /><Text numberOfLines={1} style={styles.choiceText}>{item.title}</Text></Pressable>)}</ScrollView></Field><Field label={t("tripDetail.package")}><View style={styles.wrap}>{packages.map((item) => <Choice key={item} active={packageOptionId === item} label={t(`tripDetail.packages.${item}`)} onPress={() => setPackage(item)} />)}</View></Field><View style={styles.twoColumns}><Field label={t("travelPlan.workspace.startDate")}><TextInput value={startDate} onChangeText={setStartDate} maxLength={10} style={styles.input} /></Field><Field label={t("travelPlan.workspace.endDate")}><TextInput value={endDate} onChangeText={setEndDate} maxLength={10} style={styles.input} /></Field></View><Field label={t("tripDetail.travellers")}><TextInput keyboardType="number-pad" value={travellerCount} onChangeText={(value) => setTravellerCount(value.replace(/\D/g, ""))} maxLength={2} style={styles.input} /></Field><FormActions pending={mutation.isPending} valid={valid} onCancel={onDone} onSave={() => { if (!destination) return; mutation.mutate({ tripId: trip.id, destinationId: destination.id, packageOptionId, startDate, endDate, travellerCount: count }, { onSuccess: onDone, onError: showMutationError }); }} /></View>;
}

function BookingRow({ booking, cancelling, onCancel }: { booking: BookingDTO; cancelling: boolean; onCancel: () => void }) {
  const { t } = useTranslation();
  const cancellable = booking.status === "upcoming" || booking.status === "confirmed";
  return <View style={styles.bookingRow}><Image source={{ uri: booking.destination.coverImageUrl }} style={styles.stopImage} contentFit="cover" /><View style={styles.flexText}><Text selectable style={styles.itemTitle}>{booking.destination.title}</Text><Text selectable style={styles.itemMeta}>{formatDateRange(booking.startDate, booking.endDate)} · {t(`tripDetail.packages.${booking.packageOptionId}`, { defaultValue: booking.packageOptionId })}</Text><Text selectable style={styles.price}>{formatMoney(booking.total.amountMinor, booking.total.currency)}</Text></View>{cancellable ? <Pressable disabled={cancelling} onPress={() => Alert.alert(t("tripDetail.cancelBookingTitle"), t("tripDetail.cancelBookingDescription"), [{ text: t("common.cancel"), style: "cancel" }, { text: t("tripDetail.cancelBooking"), style: "destructive", onPress: onCancel }])}><Text style={styles.dangerText}>{t("tripDetail.cancelBooking")}</Text></Pressable> : <Text style={styles.itemMeta}>{booking.status}</Text>}</View>;
}

function Section({ title, description, action, onAction, children }: { title: string; description: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return <View style={styles.section}><View style={styles.sectionHeader}><View style={styles.flexText}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.helper}>{description}</Text></View>{action && onAction ? <Pressable onPress={onAction}><Text style={styles.actionText}>{action}</Text></Pressable> : null}</View>{children}</View>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.selectedChoice]}><Text style={[styles.choiceText, active && styles.selectedChoiceText]}>{label}</Text></Pressable>; }
function FormActions({ pending, valid, onCancel, onSave }: { pending: boolean; valid: boolean; onCancel: () => void; onSave: () => void }) { const { t } = useTranslation(); return <View style={styles.actionRow}><ActionButton label={t("common.cancel")} onPress={onCancel} /><ActionButton label={t("common.save")} onPress={onSave} primary disabled={!valid || pending} loading={pending} /></View>; }
function ActionButton({ label, icon, primary, danger, disabled, loading, onPress }: { label: string; icon?: keyof typeof Ionicons.glyphMap; primary?: boolean; danger?: boolean; disabled?: boolean; loading?: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.actionButton, primary && styles.primaryAction, danger && styles.dangerAction, disabled && styles.disabled]}>{loading ? <ActivityIndicator size="small" color={theme.colors.light.base.white} /> : icon ? <Ionicons name={icon} size={16} color={primary ? theme.colors.light.base.white : danger ? theme.colors.light.error[600] : theme.colors.light.gray[700]} /> : null}<Text style={[styles.actionButtonText, primary && styles.primaryActionText, danger && styles.dangerActionText]}>{label}</Text></Pressable>; }
function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) { return <View style={styles.stat}><Ionicons name={icon} size={18} color={theme.colors.light.accent} /><Text selectable style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function EmptyLine({ text }: { text: string }) { return <View style={styles.emptyLine}><Ionicons name="information-circle-outline" size={19} color={theme.colors.light.gray[400]} /><Text style={styles.helper}>{text}</Text></View>; }
function ScreenState({ loading, message, onRetry }: { loading?: boolean; message?: string; onRetry?: () => void }) { const { t } = useTranslation(); return <View style={styles.screen}><TravelScreenHeader title={t("tripDetail.header")} showBack /><View style={styles.center}>{loading ? <ActivityIndicator size="large" color={theme.colors.light.accent} /> : <><Ionicons name="alert-circle-outline" size={34} color={theme.colors.light.error[500]} /><Text selectable style={styles.validation}>{message}</Text>{onRetry ? <Pressable onPress={onRetry}><Text style={styles.actionText}>{t("common.retry")}</Text></Pressable> : null}</>}</View></View>; }

function showMutationError(error: Error) { Alert.alert("Error", getErrorMessage(error)); }
function getErrorMessage(error: unknown) { return error instanceof ApiError || error instanceof Error ? error.message : "Request failed"; }
function durationDays(start: string, end: string) { return Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1); }
function formatDateRange(start: string, end: string) { const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }); return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`; }
function formatMoney(amountMinor: number, currency: string) { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountMinor / 100); }
function isDateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  content: { paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[8], gap: theme.spacing[5] },
  hero: { gap: theme.spacing[2] },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[1], borderRadius: theme.radius.full, backgroundColor: theme.colors.light.green[50] },
  statusText: { color: theme.colors.light.success, fontSize: 10, lineHeight: 14, fontWeight: "900" },
  heroTitle: { color: theme.colors.light.gray[900], fontSize: 28, lineHeight: 35, fontWeight: "900" },
  heroMeta: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 18, fontWeight: "800" },
  heroDescription: { color: theme.colors.light.gray[600], fontSize: 13, lineHeight: 20, fontWeight: "600" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  actionButton: { minHeight: 42, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[1], backgroundColor: theme.colors.light.surface },
  actionButtonText: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 17, fontWeight: "800" },
  primaryAction: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  primaryActionText: { color: theme.colors.light.base.white },
  dangerAction: { borderColor: theme.colors.light.error[200], backgroundColor: theme.colors.light.error[50] },
  dangerActionText: { color: theme.colors.light.error[600] },
  disabled: { opacity: 0.45 },
  statsRow: { flexDirection: "row", gap: theme.spacing[2] },
  stat: { flex: 1, minHeight: 88, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  statValue: { color: theme.colors.light.gray[900], fontSize: 19, lineHeight: 24, fontWeight: "900", fontVariant: ["tabular-nums"] },
  statLabel: { color: theme.colors.light.gray[500], fontSize: 9, lineHeight: 13, fontWeight: "700", textAlign: "center" },
  section: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing[3] },
  sectionTitle: { color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 22, fontWeight: "900" },
  helper: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  actionText: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "900" },
  flexText: { flex: 1, minWidth: 0 },
  stopRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  indexCircle: { width: 26, height: 26, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  indexText: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900" },
  stopImage: { width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] },
  itemTitle: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "900" },
  itemMeta: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 15, fontWeight: "600" },
  personRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  avatar: { width: 38, height: 38, borderRadius: theme.radius.full, backgroundColor: theme.colors.light.gray[100] },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[100] },
  avatarText: { color: theme.colors.light.accent, fontSize: 14, lineHeight: 18, fontWeight: "900" },
  dangerText: { color: theme.colors.light.error[600], fontSize: 11, lineHeight: 16, fontWeight: "800" },
  inlineForm: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  input: { flex: 1, minHeight: 48, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "600", backgroundColor: theme.colors.light.background, borderCurve: "continuous" },
  compactPrimary: { minHeight: 44, paddingHorizontal: theme.spacing[3], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  compactPrimaryText: { color: theme.colors.light.base.white, fontSize: 11, lineHeight: 16, fontWeight: "900" },
  pendingList: { paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: theme.spacing[2] },
  label: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 16, fontWeight: "900" },
  formCard: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.orange[200], borderRadius: theme.radius.md, gap: theme.spacing[3], backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  field: { flex: 1, gap: theme.spacing[2] },
  twoColumns: { flexDirection: "row", gap: theme.spacing[2] },
  textArea: { minHeight: 88, paddingTop: theme.spacing[3], textAlignVertical: "top" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  choice: { minHeight: 36, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  selectedChoice: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  choiceText: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "800" },
  selectedChoiceText: { color: theme.colors.light.accent },
  editor: { paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: theme.spacing[3] },
  stopEditor: { padding: theme.spacing[3], borderRadius: theme.radius.md, gap: theme.spacing[2], backgroundColor: theme.colors.light.gray[50] },
  horizontal: { gap: theme.spacing[2], paddingRight: theme.spacing[3] },
  destinationChoice: { width: 128, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[1], backgroundColor: theme.colors.light.surface },
  choiceImage: { width: "100%", height: 64, borderRadius: theme.radius.sm, backgroundColor: theme.colors.light.gray[100] },
  validation: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center" },
  bookingRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  price: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "900" },
  emptyLine: { minHeight: 70, padding: theme.spacing[3], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.gray[50] },
  center: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center", gap: theme.spacing[3] },
});
