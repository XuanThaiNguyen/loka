import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { TravelScreenHeader } from "@/features/travel/components/travel-screen-header";
import { useDeleteTravelPlan, useTravelPlan, useUpdateTravelPlan } from "@/features/travel-plan/services/travel-plan-api-service";
import { theme } from "@/theme/theme";

export function TravelPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const planQuery = useTravelPlan(id ?? null);
  const updatePlan = useUpdateTravelPlan();
  const deletePlan = useDeleteTravelPlan();
  const [editing, setEditing] = useState(false);

  if (planQuery.isPending) return <State loading />;
  if (planQuery.isError || !planQuery.data) return <State message={planQuery.error instanceof Error ? planQuery.error.message : t("planDetail.loadError")} />;
  const plan = planQuery.data;
  const archive = () => updatePlan.mutate({ id: plan.id, input: { status: plan.apiStatus === "archived" ? "planning" : "archived" } });
  const remove = () => Alert.alert(t("planDetail.deleteTitle"), t("planDetail.deleteDescription", { name: plan.name }), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("common.delete"), style: "destructive", onPress: () => deletePlan.mutate(plan.id, { onSuccess: () => router.replace("/trips") }) },
  ]);

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <TravelScreenHeader title={t("planDetail.header")} showBack />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Image source={{ uri: plan.image }} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heading}>
          <View style={styles.status}><Text style={styles.statusText}>{t(`travelPlan.status.${plan.status}`)}</Text></View>
          <Text selectable style={styles.title}>{plan.name}</Text>
          <Text selectable style={styles.route}>{plan.origin} → {plan.destination}</Text>
          <Text selectable style={styles.summary}>{plan.summary}</Text>
          <View style={styles.actions}>
            <SmallButton icon="pencil-outline" label={t("common.edit")} onPress={() => setEditing((value) => !value)} />
            <SmallButton icon="archive-outline" label={t("planDetail.archive")} onPress={archive} />
            <SmallButton icon="trash-outline" label={t("common.delete")} onPress={remove} danger />
          </View>
        </View>
        {editing ? <PlanEditForm id={plan.id} name={plan.name} startDate={plan.rawStartDate?.slice(0, 10) ?? ""} endDate={plan.rawEndDate?.slice(0, 10) ?? ""} travellerCount={plan.totalPeople} pending={updatePlan.isPending} onDone={() => setEditing(false)} /> : null}
        <View style={styles.stats}>
          <Stat label={t("planDetail.duration")} value={plan.duration} />
          <Stat label={t("planDetail.travellers")} value={String(plan.totalPeople)} />
          <Stat label={t("planDetail.estimate")} value={new Intl.NumberFormat(undefined, { style: "currency", currency: plan.currency ?? "USD" }).format(plan.estimatedCost)} />
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{t("planDetail.hotels")}</Text>{plan.hotels.length ? plan.hotels.map((hotel) => <View key={`${hotel.hotelName}-${hotel.hotelAddress}`} style={styles.row}><Image source={{ uri: hotel.hotelImageUrl }} style={styles.rowImage} contentFit="cover" /><View style={styles.flex}><Text selectable style={styles.rowTitle}>{hotel.hotelName}</Text><Text selectable style={styles.rowMeta}>{hotel.hotelAddress}</Text><Text selectable style={styles.price}>{hotel.pricePerNight}</Text></View></View>) : <Empty text={t("planDetail.noHotels")} />}</View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{t("planDetail.itinerary")}</Text>{plan.days.length ? plan.days.map((day) => <View key={day.day} style={styles.day}><View style={styles.dayHeading}><View style={styles.dayBadge}><Text style={styles.dayBadgeText}>{day.day}</Text></View><View style={styles.flex}><Text selectable style={styles.rowTitle}>{day.title}</Text><Text selectable style={styles.rowMeta}>{day.summary}</Text></View></View>{day.activities.map((activity) => <View key={`${day.day}-${activity.placeName}`} style={styles.activity}><Image source={{ uri: activity.placeImageUrl }} style={styles.activityImage} contentFit="cover" /><View style={styles.flex}><Text selectable style={styles.rowTitle}>{activity.placeName}</Text><Text selectable numberOfLines={3} style={styles.rowMeta}>{activity.placeDetails}</Text><Text selectable style={styles.rowMeta}>{activity.bestTimeToVisit} · {activity.travelTime}</Text></View></View>)}</View>) : <Empty text={t("planDetail.noItinerary")} />}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PlanEditForm({ id, name: initialName, startDate: initialStart, endDate: initialEnd, travellerCount: initialCount, pending, onDone }: { id: string; name: string; startDate: string; endDate: string; travellerCount: number; pending: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const mutation = useUpdateTravelPlan();
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(initialStart === "—" ? "" : initialStart);
  const [endDate, setEndDate] = useState(initialEnd === "—" ? "" : initialEnd);
  const [travellerCount, setTravellerCount] = useState(String(initialCount));
  const count = Number(travellerCount);
  const datesValid = (!startDate && !endDate) || (isDateOnly(startDate) && isDateOnly(endDate) && endDate >= startDate);
  const valid = Boolean(name.trim() && datesValid && Number.isInteger(count) && count >= 1 && count <= 50);
  return <View style={styles.form}><Text style={styles.sectionTitle}>{t("planDetail.editTitle")}</Text><TextInput value={name} onChangeText={setName} maxLength={200} placeholder={t("travelPlan.workspace.tripName")} style={styles.input} /><View style={styles.twoColumns}><TextInput value={startDate} onChangeText={setStartDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} /><TextInput value={endDate} onChangeText={setEndDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} /></View><TextInput value={travellerCount} onChangeText={(value) => setTravellerCount(value.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={2} style={styles.input} /><View style={styles.actions}><SmallButton label={t("common.cancel")} onPress={onDone} /><Pressable disabled={!valid || pending} onPress={() => mutation.mutate({ id, input: { name: name.trim(), startDate: startDate || null, endDate: endDate || null, travellerCount: count } }, { onSuccess: onDone, onError: (error) => Alert.alert(t("planDetail.saveError"), error.message) })} style={[styles.saveButton, (!valid || pending) && styles.disabled]}>{pending ? <ActivityIndicator size="small" color={theme.colors.light.base.white} /> : <Text style={styles.saveButtonText}>{t("common.save")}</Text>}</Pressable></View></View>;
}

function SmallButton({ label, icon, danger, onPress }: { label: string; icon?: keyof typeof Ionicons.glyphMap; danger?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.smallButton, danger && styles.dangerButton]}>{icon ? <Ionicons name={icon} size={16} color={danger ? theme.colors.light.error[600] : theme.colors.light.gray[700]} /> : null}<Text style={[styles.smallButtonText, danger && styles.dangerText]}>{label}</Text></Pressable>; }
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text selectable numberOfLines={1} style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.rowMeta}>{text}</Text></View>; }
function State({ loading, message }: { loading?: boolean; message?: string }) { const { t } = useTranslation(); return <View style={styles.screen}><TravelScreenHeader title={t("planDetail.header")} showBack /><View style={styles.center}>{loading ? <ActivityIndicator size="large" color={theme.colors.light.accent} /> : <Text selectable style={styles.dangerText}>{message}</Text>}</View></View>; }
function isDateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background }, content: { paddingHorizontal: theme.spacing[5], paddingBottom: theme.spacing[8], gap: theme.spacing[5] }, heroImage: { width: "100%", aspectRatio: 1.8, borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] }, heading: { gap: theme.spacing[2] }, status: { alignSelf: "flex-start", paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[1], borderRadius: theme.radius.full, backgroundColor: theme.colors.light.green[50] }, statusText: { color: theme.colors.light.success, fontSize: 10, lineHeight: 14, fontWeight: "900" }, title: { color: theme.colors.light.gray[900], fontSize: 27, lineHeight: 34, fontWeight: "900" }, route: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 19, fontWeight: "800" }, summary: { color: theme.colors.light.gray[600], fontSize: 13, lineHeight: 20, fontWeight: "600" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] }, smallButton: { minHeight: 40, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[1], backgroundColor: theme.colors.light.surface }, smallButtonText: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 16, fontWeight: "800" }, dangerButton: { borderColor: theme.colors.light.error[200], backgroundColor: theme.colors.light.error[50] }, dangerText: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 18, fontWeight: "800" }, stats: { flexDirection: "row", gap: theme.spacing[2] }, stat: { flex: 1, minWidth: 0, minHeight: 76, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", gap: 2, backgroundColor: theme.colors.light.surface }, statValue: { color: theme.colors.light.gray[900], fontSize: 14, lineHeight: 19, fontWeight: "900" }, statLabel: { color: theme.colors.light.gray[500], fontSize: 9, lineHeight: 13, fontWeight: "700", textAlign: "center" }, section: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[3], backgroundColor: theme.colors.light.surface }, sectionTitle: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "900" }, row: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }, rowImage: { width: 72, height: 72, borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] }, flex: { flex: 1, minWidth: 0, gap: 2 }, rowTitle: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "900" }, rowMeta: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 15, fontWeight: "600" }, price: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "900" }, day: { paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], gap: theme.spacing[3] }, dayHeading: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }, dayBadge: { width: 34, height: 34, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent }, dayBadgeText: { color: theme.colors.light.base.white, fontSize: 13, lineHeight: 18, fontWeight: "900" }, activity: { minHeight: 84, flexDirection: "row", gap: theme.spacing[3] }, activityImage: { width: 76, alignSelf: "stretch", borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] }, empty: { minHeight: 90, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.gray[50] }, form: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.orange[200], borderRadius: theme.radius.md, gap: theme.spacing[3], backgroundColor: theme.colors.light.orange[50] }, input: { flex: 1, minHeight: 48, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, backgroundColor: theme.colors.light.surface }, twoColumns: { flexDirection: "row", gap: theme.spacing[2] }, saveButton: { minHeight: 40, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent }, saveButtonText: { color: theme.colors.light.base.white, fontSize: 12, lineHeight: 17, fontWeight: "900" }, disabled: { opacity: 0.45 }, center: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center" },
});
