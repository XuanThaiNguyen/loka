import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { useDestination } from "@/features/travel/services/travel-api-service";
import { useCreateBooking, useTrips } from "@/features/trips/services/trips-api-service";
import { theme } from "@/theme/theme";

const packages = ["standard", "flexible", "premium"] as const;

export function CreateBookingScreen() {
  const { destinationId } = useLocalSearchParams<{ destinationId: string }>();
  const { t } = useTranslation();
  const destinationQuery = useDestination(destinationId);
  const tripsQuery = useTrips();
  const mutation = useCreateBooking();
  const destination = destinationQuery.destination;
  const ownerTrips = (tripsQuery.data ?? []).filter((trip) => trip.accessRole === "owner");
  const [tripId, setTripId] = useState<number | null>(null);
  const selectedTrip = ownerTrips.find((trip) => trip.id === tripId);
  const [packageOptionId, setPackage] = useState<(typeof packages)[number]>("standard");
  const [startDateOverride, setStartDate] = useState<string | null>(null);
  const [endDateOverride, setEndDate] = useState<string | null>(null);
  const [travellerCount, setTravellerCount] = useState("2");
  const startDate = startDateOverride ?? selectedTrip?.startDate.slice(0, 10) ?? "";
  const endDate = endDateOverride ?? selectedTrip?.endDate.slice(0, 10) ?? "";
  const count = Number(travellerCount);
  const valid = Boolean(tripId && destination.apiBacked && isDateOnly(startDate) && isDateOnly(endDate) && endDate >= startDate && Number.isInteger(count) && count >= 1 && count <= 50);
  const submit = () => {
    if (!tripId || !valid) return;
    mutation.mutate({ tripId, destinationId: destination.id, packageOptionId, startDate, endDate, travellerCount: count }, {
      onSuccess: () => {
        Alert.alert(t("bookingCreate.successTitle"), t("bookingCreate.successDescription"), [{ text: t("bookingCreate.openTrip"), onPress: () => router.replace({ pathname: "/trip/[id]", params: { id: String(tripId) } }) }]);
      },
      onError: (error) => Alert.alert(t("bookingCreate.errorTitle"), error.message),
    });
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <TravelScreenHeader title={t("bookingCreate.header")} showBack />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.destinationCard}><Image source={{ uri: destination.image }} style={styles.image} contentFit="cover" /><View style={styles.flex}><Text selectable style={styles.title}>{destination.title ?? destination.location}</Text><Text selectable style={styles.meta}>{destination.location}</Text><Text selectable style={styles.price}>{new Intl.NumberFormat(undefined, { style: "currency", currency: destination.currency ?? "USD" }).format(destination.price)} / {t("travel.detail.person")}</Text></View></View>
        <View style={styles.form}>
          <Field label={t("bookingCreate.trip")}>
            {tripsQuery.isPending ? <ActivityIndicator color={theme.colors.light.accent} /> : ownerTrips.length ? <View style={styles.wrap}>{ownerTrips.map((trip) => <Choice key={trip.id} active={tripId === trip.id} label={trip.name} onPress={() => { setTripId(trip.id); setStartDate(null); setEndDate(null); }} />)}</View> : <View style={styles.empty}><Text style={styles.meta}>{t("bookingCreate.noTrips")}</Text><Pressable onPress={() => router.push("/trip/new")}><Text style={styles.link}>{t("trips.createTrip")}</Text></Pressable></View>}
          </Field>
          <Field label={t("tripDetail.package")}><View style={styles.wrap}>{packages.map((item) => <Choice key={item} active={packageOptionId === item} label={t(`tripDetail.packages.${item}`)} onPress={() => setPackage(item)} />)}</View></Field>
          <View style={styles.twoColumns}><Field label={t("travelPlan.workspace.startDate")}><TextInput value={startDate} onChangeText={setStartDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} /></Field><Field label={t("travelPlan.workspace.endDate")}><TextInput value={endDate} onChangeText={setEndDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} /></Field></View>
          <Field label={t("tripDetail.travellers")}><TextInput value={travellerCount} onChangeText={(value) => setTravellerCount(value.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={2} style={styles.input} /></Field>
          <View style={styles.estimate}><Text style={styles.meta}>{t("bookingCreate.estimate")}</Text><Text selectable style={styles.estimateValue}>{new Intl.NumberFormat(undefined, { style: "currency", currency: destination.currency ?? "USD" }).format(destination.price * Math.max(count || 1, 1))}</Text></View>
          <Pressable disabled={!valid || mutation.isPending} onPress={submit} style={[styles.submit, (!valid || mutation.isPending) && styles.disabled]}>{mutation.isPending ? <ActivityIndicator color={theme.colors.light.base.white} /> : <><Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.light.base.white} /><Text style={styles.submitText}>{t("bookingCreate.submit")}</Text></>}</Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}><Text numberOfLines={2} style={[styles.choiceLabel, active && styles.choiceLabelActive]}>{label}</Text></Pressable>; }
function isDateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background }, content: { paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[8], gap: theme.spacing[5] }, destinationCard: { padding: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface }, image: { width: 88, height: 88, borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] }, flex: { flex: 1, minWidth: 0, gap: 3 }, title: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "900" }, meta: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 16, fontWeight: "600" }, price: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 18, fontWeight: "900" }, form: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[4], backgroundColor: theme.colors.light.surface }, field: { gap: theme.spacing[2] }, label: { color: theme.colors.light.gray[800], fontSize: 12, lineHeight: 17, fontWeight: "900" }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] }, choice: { minHeight: 40, maxWidth: 180, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.background }, choiceActive: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] }, choiceLabel: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 15, fontWeight: "800", textAlign: "center" }, choiceLabelActive: { color: theme.colors.light.accent }, twoColumns: { flexDirection: "row", gap: theme.spacing[2] }, input: { flex: 1, minHeight: 48, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, backgroundColor: theme.colors.light.background }, estimate: { padding: theme.spacing[3], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.colors.light.gray[50] }, estimateValue: { color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 22, fontWeight: "900" }, submit: { minHeight: 52, borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent }, submitText: { color: theme.colors.light.base.white, fontSize: 14, lineHeight: 19, fontWeight: "900" }, disabled: { opacity: 0.45 }, empty: { minHeight: 80, alignItems: "center", justifyContent: "center", gap: theme.spacing[2] }, link: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "900" },
});
