import { QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import { TaskEditorLayout } from "@/features/task-flow/task-chrome";
import { useTaskNavigation } from "@/features/task-flow/use-task-navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CatalogImage as Image } from "@/features/travel/components/catalog-image";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { JourneyHeader } from "@/components/ui/journey-header";
import { useDeleteTravelPlan, useTravelPlan, useUpdateTravelPlan } from "@/features/travel-plan/services/travel-plan-api-service";
import { theme, travelSurfaces } from "@/theme/theme";

export function TravelPlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const planQuery = useTravelPlan(id ?? null);
  const updatePlan = useUpdateTravelPlan();
  const deletePlan = useDeleteTravelPlan();

  if (!planQuery.data) return <State query={planQuery} />;
  const plan = planQuery.data;
  const archive = () => updatePlan.mutate({ id: plan.id, input: { status: plan.apiStatus === "archived" ? "planning" : "archived" } });
  const remove = () => Alert.alert(t("planDetail.deleteTitle"), t("planDetail.deleteDescription", { name: plan.name }), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("common.delete"), style: "destructive", onPress: () => deletePlan.mutate(plan.id, { onSuccess: () => router.replace("/trips") }) },
  ]);

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <JourneyHeader title={t("planDetail.header")} showBack />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <QueryFeedback query={planQuery} hasData />
        <Image source={{ uri: plan.image }} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heading}>
          <View style={styles.status}><Text style={styles.statusText}>{t(`travelPlan.status.${plan.status}`)}</Text></View>
          <Text selectable style={styles.title}>{plan.name}</Text>
          <Text selectable style={styles.route}>{plan.origin} → {plan.destination}</Text>
          <Text selectable style={styles.summary}>{plan.summary}</Text>
          <View style={styles.actions}>
            <SmallButton icon="pencil-outline" label={t("common.edit")} onPress={() => router.push({ pathname: "/plan/edit", params: { id: plan.id } })} />
            <SmallButton icon="archive-outline" label={t("planDetail.archive")} onPress={archive} />
            <SmallButton icon="trash-outline" label={t("common.delete")} onPress={remove} danger />
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label={t("planDetail.duration")} value={plan.duration} />
          <Stat label={t("planDetail.travellers")} value={String(plan.totalPeople)} />
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{t("planDetail.hotels")}</Text>{plan.hotels.length ? plan.hotels.map((hotel) => <View key={`${hotel.hotelName}-${hotel.hotelAddress}`} style={styles.row}><Image source={{ uri: hotel.hotelImageUrl }} style={styles.rowImage} contentFit="cover" /><View style={styles.flex}><Text selectable style={styles.rowTitle}>{hotel.hotelName}</Text><Text selectable style={styles.rowMeta}>{hotel.hotelAddress}</Text></View></View>) : <Empty text={t("planDetail.noHotels")} />}</View>
        <View style={styles.section}><Text style={styles.sectionTitle}>{t("planDetail.itinerary")}</Text>{plan.days.length ? plan.days.map((day) => <View key={day.day} style={styles.day}><View style={styles.dayHeading}><View style={styles.dayBadge}><Text style={styles.dayBadgeText}>{day.day}</Text></View><View style={styles.flex}><Text selectable style={styles.rowTitle}>{day.title}</Text><Text selectable style={styles.rowMeta}>{day.summary}</Text></View></View>{day.activities.map((activity) => <View key={`${day.day}-${activity.placeName}`} style={styles.activity}><Image source={{ uri: activity.placeImageUrl }} style={styles.activityImage} contentFit="cover" /><View style={styles.flex}><Text selectable style={styles.rowTitle}>{activity.placeName}</Text><Text selectable numberOfLines={3} style={styles.rowMeta}>{activity.placeDetails}</Text><Text selectable style={styles.rowMeta}>{activity.bestTimeToVisit} · {activity.travelTime}</Text></View></View>)}</View>) : <Empty text={t("planDetail.noItinerary")} />}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function TravelPlanEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useTravelPlan(id ?? null);
  if (!query.data) return <State query={query} />;
  const plan = query.data;
  return <PlanEditForm query={query} key={plan.id} id={plan.id} name={plan.name} startDate={plan.rawStartDate?.slice(0, 10) ?? ""} endDate={plan.rawEndDate?.slice(0, 10) ?? ""} travellerCount={plan.totalPeople} />;
}

function PlanEditForm({ id, name: initialName, startDate: initialStart, endDate: initialEnd, travellerCount: initialCount, query }: { query: FeedbackQuery; id: string; name: string; startDate: string; endDate: string; travellerCount: number }) {
  const { t } = useTranslation();
  const mutation = useUpdateTravelPlan();
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(initialStart === "—" ? "" : initialStart);
  const [endDate, setEndDate] = useState(initialEnd === "—" ? "" : initialEnd);
  const [travellerCount, setTravellerCount] = useState(String(initialCount));
  const [initial] = useState(() => JSON.stringify([name, startDate, endDate, travellerCount]));
  const submitLock = useRef(false);
  const task = useTaskNavigation({ dirty: JSON.stringify([name, startDate, endDate, travellerCount]) !== initial, pending: mutation.isPending });
  const count = Number(travellerCount);
  const datesValid = (!startDate && !endDate) || (isDateOnly(startDate) && isDateOnly(endDate) && endDate >= startDate);
  const valid = Boolean(name.trim() && datesValid && Number.isInteger(count) && count >= 1 && count <= 50);
  const save = async () => {
    if (!valid || submitLock.current || task.leaving) return;
    submitLock.current = true;
    try {
      await mutation.mutateAsync({ id, input: { name: name.trim(), startDate: startDate || null, endDate: endDate || null, travellerCount: count } });
      task.complete(() => router.dismissTo({ pathname: "/plan/[id]", params: { id } }));
    } catch (error) { submitLock.current = false; Alert.alert(t("planDetail.saveError"), error instanceof Error ? error.message : t("planDetail.loadError")); }
  };
  return <TaskEditorLayout title={t("planDetail.editTitle")} back={task.back} pending={mutation.isPending || task.leaving} valid={valid} save={() => void save()}>
    <QueryFeedback query={query} hasData />
    <Text style={styles.rowTitle}>{t("travelPlan.workspace.tripName")}</Text><TextInput accessibilityLabel={t("travelPlan.workspace.tripName")} value={name} onChangeText={setName} maxLength={200} style={styles.input} />
    <Text style={styles.rowTitle}>{t("travelPlan.workspace.startDate")}</Text><TextInput accessibilityLabel={t("travelPlan.workspace.startDate")} value={startDate} onChangeText={setStartDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} />
    <Text style={styles.rowTitle}>{t("travelPlan.workspace.endDate")}</Text><TextInput accessibilityLabel={t("travelPlan.workspace.endDate")} value={endDate} onChangeText={setEndDate} maxLength={10} placeholder="YYYY-MM-DD" style={styles.input} />
    <Text style={styles.rowTitle}>{t("travelPlan.workspace.crewSize")}</Text><TextInput accessibilityLabel={t("travelPlan.workspace.crewSize")} value={travellerCount} onChangeText={(value) => setTravellerCount(value.replace(/\D/g, ""))} keyboardType="number-pad" maxLength={2} style={styles.input} />
    {!valid ? <Text accessibilityLiveRegion="polite" style={styles.dangerText}>{t("taskFlow.invalidTrip")}</Text> : null}
  </TaskEditorLayout>;
}

function SmallButton({ label, icon, danger, onPress }: { label: string; icon?: keyof typeof Ionicons.glyphMap; danger?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.smallButton, danger && styles.dangerButton]}>{icon ? <Ionicons name={icon} size={16} color={danger ? theme.colors.light.error[600] : theme.colors.light.gray[700]} /> : null}<Text style={[styles.smallButtonText, danger && styles.dangerText]}>{label}</Text></Pressable>; }
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text selectable style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Empty({ text }: { text: string }) { return <View style={styles.empty}><Text style={styles.rowMeta}>{text}</Text></View>; }
function State({ query }: { query: FeedbackQuery }) { const { t } = useTranslation(); return <View style={styles.screen}><JourneyHeader title={t("planDetail.header")} showBack /><View style={{ padding: 20 }}><QueryFeedback query={query} layout="detail" /></View></View>; }

function isDateOnly(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }

const styles = StyleSheet.create({

  screen: { flex: 1, backgroundColor: theme.colors.light.background }, content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 20 }, heroImage: { width: "100%", aspectRatio: 1.78, borderRadius: 24, backgroundColor: theme.colors.light.surfaceSecondary }, heading: { padding: 20, borderRadius: 24, gap: 12, backgroundColor: travelSurfaces.featured }, status: { alignSelf: "flex-start", paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[1], borderRadius: theme.radius.full, backgroundColor: theme.colors.light.green[50] }, statusText: { color: travelSurfaces.positiveForeground, fontSize: 12, lineHeight: 17, fontWeight: "600" }, title: { color: theme.colors.light.base.white, fontSize: 23, lineHeight: 30, fontWeight: "600" }, route: { color: travelSurfaces.featuredSecondary, fontSize: 13, lineHeight: 20, fontWeight: "500" }, summary: { color: travelSurfaces.featuredSecondary, fontSize: 14, lineHeight: 22 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] }, smallButton: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: theme.colors.light.surface }, smallButtonText: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 16, fontWeight: "600" }, dangerButton: { borderColor: theme.colors.light.error[200], backgroundColor: theme.colors.light.error[50] }, dangerText: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 18, fontWeight: "600" }, stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { flexGrow: 1, flexBasis: 100, minWidth: 0, minHeight: 88, padding: 12, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: travelSurfaces.header }, statValue: { color: travelSurfaces.foreground, fontSize: 16, lineHeight: 23, fontWeight: "600", textAlign: "center" }, statLabel: { color: travelSurfaces.secondary, fontSize: 12, lineHeight: 17, textAlign: "center" }, section: { padding: 20, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, gap: 16, backgroundColor: theme.colors.light.surface }, sectionTitle: { color: travelSurfaces.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" }, row: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }, rowImage: { width: 72, height: 72, borderRadius: theme.radius.xl, backgroundColor: theme.colors.light.gray[100] }, flex: { flex: 1, minWidth: 0, gap: 2 }, rowTitle: { color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "600" }, rowMeta: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 19 }, price: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "600" }, day: { paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.light.separator, gap: 16 }, dayHeading: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] }, dayBadge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.featured }, dayBadgeText: { color: theme.colors.light.base.white, fontSize: 13, lineHeight: 18, fontWeight: "600" }, activity: { minHeight: 88, padding: 12, borderRadius: 16, backgroundColor: travelSurfaces.info, flexDirection: "row", gap: 12 }, activityImage: { width: 60, height: 80, borderRadius: 12, backgroundColor: theme.colors.light.surfaceSecondary }, empty: { minHeight: 90, padding: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info }, form: { padding: 20, borderRadius: 24, gap: 16, backgroundColor: travelSurfaces.info }, input: { flex: 1, minHeight: 48, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.xl, color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, backgroundColor: theme.colors.light.surface }, twoColumns: { flexDirection: "row", gap: theme.spacing[2] }, saveButton: { minHeight: 48, paddingHorizontal: 20, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent }, saveButtonText: { color: theme.colors.light.base.white, fontSize: 12, lineHeight: 17, fontWeight: "600" }, disabled: { opacity: 0.45 }, center: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center" },
});
