import { QueryFeedback, type FeedbackQuery } from "@/components/ui/loading-skeleton";
import { TaskHeader, TaskFooter } from "@/features/task-flow/task-chrome";
import { closeTask, useTaskNavigation } from "@/features/task-flow/use-task-navigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type PlannerSessionDTO,
  useCreatePlannerSession,
  useDeletePlannerSession,
  usePlannerSession,
  useUpdatePlannerSession,
} from "@/features/travel-plan/services/planner-api-service";
import {
  interestOptions,
  originSuggestionKeys,
  requirementSuggestionKeys,
} from "@/features/travel-plan/travel-plan.data";
import {
  type TripDetailDTO,
  type TripDTO,
  type TripBudgetPreference,
  useCreateTrip,
  useTrip,
  useTrips,
} from "@/features/trips/services/trips-api-service";
import {
  type CityDTO,
  useCitySuggestions,
} from "@/features/travel/services/travel-api-service";
import { theme, travelSurfaces } from "@/theme/theme";
import { i18n } from "@/i18n";

type WizardForm = {
  origin: string;
  transportPreference: string;
  accommodationPreference: string;
  pace: "relaxed" | "balanced" | "packed";
  interestIds: string[];
  mustDoActivities: string;
  dietaryAccessibility: string;
  avoidances: string;
  notes: string;
};

const initialWizardForm: WizardForm = {
  origin: "",
  transportPreference: "",
  accommodationPreference: "",
  pace: "balanced",
  interestIds: [],
  mustDoActivities: "",
  dietaryAccessibility: "",
  avoidances: "",
  notes: "",
};

const paceOptions = ["relaxed", "balanced", "packed"] as const;
const transportSuggestionIds = ["train", "rentalCar", "flights"] as const;
const accommodationSuggestionIds = ["hotel", "homestay", "apartment"] as const;
const mustDoSuggestionIds = ["localFood", "sunsetViewpoint", "historicLandmarks"] as const;
const budgetPreferences = ["low", "medium", "luxury"] as const;
const maxTripCrew = 50;

export function TravelPlanScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  const tripsQuery = useTrips();
  const ownerTrips = (tripsQuery.data ?? []).filter((trip) => trip.accessRole === "owner");

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <TaskHeader title={t("travelPlan.workspace.chooseTitle")} back={closeTask} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pageContent, { paddingBottom: bottomPadding }]}
      >
        <Text style={styles.stepDescription}>{t("travelPlan.workspace.chooseDescription")}</Text>

        <Pressable onPress={() => router.replace("/trip/new")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={21} color={theme.colors.light.base.white} />
          <Text style={styles.primaryButtonText}>{t("travelPlan.workspace.createTrip")}</Text>
        </Pressable>
        <QueryFeedback query={tripsQuery} hasData={tripsQuery.data !== undefined} layout="list" />
        {ownerTrips.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{t("travelPlan.workspace.yourTrips")}</Text>
              <Text style={styles.sectionCount}>{ownerTrips.length}</Text>
            </View>
            {ownerTrips.map((trip) => <TripChoiceCard key={trip.id} trip={trip} onPress={() => router.replace({ pathname: "/planner/[tripId]", params: { tripId: String(trip.id) } })} />)}
          </View>
        ) : !tripsQuery.isPending && !tripsQuery.isError && tripsQuery.fetchStatus !== "paused" ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={30} color={theme.colors.light.gray[400]} />
            <Text style={styles.emptyTitle}>{t("travelPlan.workspace.noTripsTitle")}</Text>
            <Text style={styles.emptyDescription}>{t("travelPlan.workspace.noTripsDescription")}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** One canonical task route per real Trip ID; planner session IDs never enter /plan/[id]. */
export function PlannerTaskScreen() {
  const { tripId, mode } = useLocalSearchParams<{ tripId: string; mode?: string }>();
  const { t } = useTranslation();
  const id = Number(tripId);
  const validId = Number.isInteger(id) && id > 0;
  const trip = useTrip(validId ? id : null);
  if (!validId) return <ErrorScreen message={t("travelPlan.workspace.tripLoadError")} onBack={closeTask} />;
  if (!trip.data) return <LoadingScreen query={trip} label={t("travelPlan.workspace.loadingTrip")} />;
  return <PlannerTaskContent key={id} trip={trip.data} tripQuery={trip} mode={mode} />;
}

function PlannerTaskContent({ trip, tripQuery, mode }: { trip: TripDetailDTO; tripQuery: FeedbackQuery; mode?: string }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Pin the entry snapshot: save invalidation must not replace/unmount an active guarded form.
  const [entryTrip] = useState(trip);
  const sessionId = entryTrip.plannerSessionId;
  const session = usePlannerSession(sessionId);
  const saved = () => router.dismissTo({ pathname: "/trip/[id]", params: { id: String(trip.id) } });
  if (sessionId && !session.data) return <LoadingScreen query={session} label={t("travelPlan.workspace.loadingTrip")} />;
  const feedback = <><QueryFeedback query={tripQuery} hasData />{sessionId ? <QueryFeedback query={session} hasData /> : null}</>;
  if (session.data) {
    if (mode === "edit" && session.data.accessRole !== "viewer") return <PlannerSessionEditor feedback={feedback} key={session.data.id} session={session.data} onCancel={closeTask} onSaved={saved} />;
    return <WorkspaceSummary feedback={feedback} session={session.data} bottomPadding={Math.max(insets.bottom, 12)} />;
  }
  if (trip.accessRole !== "owner") return <ErrorScreen message={t("tripDetail.planningNotStarted")} onBack={closeTask} />;
  return <PlannerWizard feedback={feedback} key={trip.id} trip={entryTrip} onBack={closeTask} onSaved={saved} />;
}

export function CreateTripScreen() {
  const { cityId: requestedCityId } = useLocalSearchParams<{ cityId?: string }>();
  const { t } = useTranslation();
  const citiesQuery = useCitySuggestions();
  const createTrip = useCreateTrip();
  const scrollRef = useRef<ScrollView>(null);
  const today = dateOnly(new Date());
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [enteredName, setName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(dateOnly(addDays(new Date(), 4)));
  const [description, setDescription] = useState("");
  const [cityOverride, setSelectedCity] = useState<CityDTO | null | undefined>();
  const selectedCity = cityOverride !== undefined ? cityOverride : citiesQuery.data?.find((city) => city.id === requestedCityId) ?? null;
  const name = enteredName ?? (selectedCity ? t("travelPlan.workspace.defaultTripName", { destination: selectedCity.name }) : "");
  const [crewNumber, setCrewNumber] = useState(2);
  const [budgetPreference, setBudgetPreference] = useState<TripBudgetPreference | null>(null);
  const [initialDates] = useState({ startDate, endDate });
  const submitLock = useRef(false);
  const task = useTaskNavigation({
    dirty: (enteredName !== null && enteredName !== (selectedCity ? t("travelPlan.workspace.defaultTripName", { destination: selectedCity.name }) : "")) || (cityOverride !== undefined && (cityOverride?.id ?? null) !== (requestedCityId ?? null)) || startDate !== initialDates.startDate || endDate !== initialDates.endDate || description !== "" || crewNumber !== 2 || budgetPreference !== null,
    pending: createTrip.isPending,
    step: stepIndex,
    previous: () => goToStep(stepIndex - 1, -1),
  });
  const dateError = !isDateOnly(startDate) || !isDateOnly(endDate)
    ? t("travelPlan.workspace.invalidDate")
    : endDate < startDate ? t("travelPlan.workspace.dateOrderError") : null;
  const tripContextValid = Number.isInteger(crewNumber)
    && crewNumber >= 1
    && crewNumber <= maxTripCrew;
  const canContinue = stepIndex === 0 ? Boolean(name.trim()) : stepIndex === 1 ? !dateError : tripContextValid;

  const selectCity = (city: CityDTO) => {
    setSelectedCity(city);
    if (!name.trim()) {
      setName(t("travelPlan.workspace.defaultTripName", { destination: city.name }));
    }
  };

  const goToStep = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setAttemptedStep(null);
    setStepIndex(nextStep);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const next = async () => {
    if (submitLock.current || task.leaving) return;
    if (!canContinue) {
      setAttemptedStep(stepIndex);
      return;
    }
    if (stepIndex < 2) {
      goToStep(stepIndex + 1, 1);
      return;
    }
    submitLock.current = true;
    try {
      const response = await createTrip.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        startDate,
        endDate,
        cityId: selectedCity?.id ?? null,
        crewNumber,
        budgetPreference,
        invitationEmails: [],
      });
      task.complete(() => router.replace({ pathname: "/planner/[tripId]", params: { tripId: String(response.data.id) } }));
    } catch (error) {
      submitLock.current = false;
      Alert.alert(t("travelPlan.workspace.saveErrorTitle"), getErrorMessage(error, t("travelPlan.workspace.tripCreateError")));
    }
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <TaskHeader title={t("travelPlan.workspace.createTrip")} back={task.back} step={stepIndex} total={3} pending={createTrip.isPending || task.leaving} />
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mobileStepContent}
      >
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            title={t(`travelPlan.workspace.quickSteps.${stepIndex}.title`)}
            hint={t(`travelPlan.workspace.quickSteps.${stepIndex}.hint`)}
          />

          {stepIndex === 0 ? (
            <View style={styles.mobileFormSection}>
              <FormField label={t("travelPlan.workspace.tripName")} required>
                <TextInput autoFocus maxLength={200} accessibilityLabel={t("travelPlan.workspace.tripName")} value={name} onChangeText={setName} placeholder={t("travelPlan.workspace.tripNamePlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} returnKeyType="done" style={styles.input} />
              </FormField>
              <QueryFeedback query={citiesQuery} hasData={Boolean(citiesQuery.data)} layout="cities" />
              {(citiesQuery.data?.length ?? 0) > 0 ? (
                <FormField label={t("travelPlan.workspace.cityOptional")}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                    {citiesQuery.data?.map((city) => {
                      const selected = selectedCity?.id === city.id;
                      return (
                        <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={city.id} onPress={() => selectCity(city)} style={[styles.destinationChip, selected && styles.selectedCard]}>
                          <Image source={{ uri: city.coverImageUrl }} style={styles.destinationChipImage} contentFit="cover" />
                          <View style={styles.destinationChipText}>
                            <Text numberOfLines={1} style={styles.chipTitle}>{city.name}</Text>
                            <Text numberOfLines={1} style={styles.chipSubtitle}>{city.country}</Text>
                          </View>
                          {selected ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.light.accent} /> : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  {selectedCity ? <Pressable onPress={() => setSelectedCity(null)}><Text style={styles.clearSelectionText}>{t("common.clear")}</Text></Pressable> : null}
                </FormField>
              ) : null}
              {attemptedStep === 0 && !name.trim() ? <Text selectable style={styles.errorText}>{t("travelPlan.workspace.tripNameRequired")}</Text> : null}
            </View>
          ) : null}

          {stepIndex === 1 ? (
            <View style={styles.mobileFormSection}>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              {attemptedStep === 1 && dateError ? <Text selectable style={styles.errorText}>{dateError}</Text> : null}
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <View style={styles.mobileStepBody}>
              <View style={styles.reviewCard}>
                <SummaryRow icon="airplane-outline" label={t("travelPlan.workspace.tripName")} value={name.trim()} />
                <View style={styles.summaryDivider} />
                <SummaryRow icon="calendar-outline" label={t("travelPlan.workspace.tripDates")} value={formatDateRange(startDate, endDate)} />
                {selectedCity ? <><View style={styles.summaryDivider} /><SummaryRow icon="location-outline" label={t("travelPlan.workspace.cityOptional")} value={`${selectedCity.name}, ${selectedCity.country}`} /></> : null}
              </View>
              <View style={styles.mobileFormSection}>
                <FormField label={t("travelPlan.workspace.crewSize")} description={t("travelPlan.workspace.crewSizeHint", { max: maxTripCrew })} required>
                  <NumberStepper value={crewNumber} min={1} max={maxTripCrew} onChange={setCrewNumber} />
                </FormField>
                <FormField label={t("travelPlan.workspace.budgetPreference")} description={t("travelPlan.workspace.budgetPreferenceHint")}>
                  <OptionRow values={[...budgetPreferences]} selected={budgetPreference ?? ""} label={(value) => t(`travelPlan.workspace.budgetPreferences.${value}`)} onSelect={(value) => setBudgetPreference(value as TripBudgetPreference)} />
                  {budgetPreference ? <Pressable accessibilityRole="button" onPress={() => setBudgetPreference(null)}><Text style={styles.clearSelectionText}>{t("common.clear")}</Text></Pressable> : null}
                </FormField>
                <FormField label={t("travelPlan.workspace.tripNotes")}>
                  <TextInput multiline maxLength={5000} accessibilityLabel={t("travelPlan.workspace.tripNotes")} value={description} onChangeText={setDescription} placeholder={t("travelPlan.workspace.tripNotesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
                </FormField>
                {attemptedStep === 2 && !tripContextValid ? <Text selectable style={styles.errorText}>{t("travelPlan.workspace.tripContextInvalid")}</Text> : null}
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <TaskFooter
        label={stepIndex === 2 ? t("travelPlan.workspace.createAndPlan") : t("travelPlan.actions.continue")}
        pending={createTrip.isPending}
        disabled={task.leaving}
        onPress={() => void next()}
      />
    </KeyboardAvoidingView>
  );
}

type DateField = "start" | "end";

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: { startDate: string; endDate: string; onStartDateChange: (value: string) => void; onEndDateChange: (value: string) => void }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const locale = i18n.resolvedLanguage?.startsWith("vi") ? "vi-VN" : "en-US";

  const openPicker = (field: DateField) => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setActiveField(field);
  };

  const selectDraftDate = (date: Date) => {
    const nextDate = dateOnly(date);
    if (activeField === "start") {
      setDraftStartDate(nextDate);
      if (draftEndDate < nextDate) setDraftEndDate(nextDate);
      setActiveField("end");
      return;
    }
    setDraftEndDate(nextDate);
  };

  const selectAndroidDate = (date: Date) => {
    const nextDate = dateOnly(date);
    if (activeField === "start") {
      onStartDateChange(nextDate);
      if (endDate < nextDate) onEndDateChange(nextDate);
    } else {
      onEndDateChange(nextDate);
    }
    setActiveField(null);
  };

  const confirmRange = () => {
    onStartDateChange(draftStartDate);
    onEndDateChange(draftEndDate < draftStartDate ? draftStartDate : draftEndDate);
    setActiveField(null);
  };

  const pickerValue = parseDateOnly(activeField === "end" ? draftEndDate : draftStartDate);
  const minimumDate = activeField === "end" ? parseDateOnly(draftStartDate) : undefined;

  return (
    <>
      <View style={styles.datePickerFields}>
        <DateSelectionButton
          label={t("travelPlan.workspace.startDate")}
          value={formatFriendlyDate(startDate, locale)}
          active={activeField === "start"}
          onPress={() => openPicker("start")}
        />
        <View style={styles.dateRangeConnector}><View style={styles.dateRangeLine} /><Ionicons name="arrow-down" size={16} color={theme.colors.light.gray[400]} /></View>
        <DateSelectionButton
          label={t("travelPlan.workspace.endDate")}
          value={formatFriendlyDate(endDate, locale)}
          active={activeField === "end"}
          onPress={() => openPicker("end")}
        />
      </View>

      {process.env.EXPO_OS === "ios" ? (
        <Modal
          visible={activeField !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onDismiss={() => setActiveField(null)}
          onRequestClose={() => setActiveField(null)}
        >
          <View style={styles.calendarModal}>
            <View style={styles.calendarModalHeader}>
              <Pressable hitSlop={8} onPress={() => setActiveField(null)} style={({ pressed }) => [styles.calendarHeaderAction, pressed && styles.pressed]}>
                <Text style={styles.calendarCancelText}>{t("common.cancel")}</Text>
              </Pressable>
              <Text style={styles.calendarModalTitle}>{t("travelPlan.workspace.datePickerTitle")}</Text>
              <View style={styles.calendarHeaderAction} />
            </View>

            <Text style={styles.calendarHint}>{t("travelPlan.workspace.datePickerHint")}</Text>
            <View style={styles.calendarRangeTabs}>
              <DateSelectionButton
                compact
                label={t("travelPlan.workspace.startDate")}
                value={formatFriendlyDate(draftStartDate, locale)}
                active={activeField === "start"}
                onPress={() => setActiveField("start")}
              />
              <DateSelectionButton
                compact
                label={t("travelPlan.workspace.endDate")}
                value={formatFriendlyDate(draftEndDate, locale)}
                active={activeField === "end"}
                onPress={() => setActiveField("end")}
              />
            </View>

            {activeField ? (
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                accentColor={theme.colors.light.accent}
                locale={locale.replace("-", "_")}
                themeVariant="light"
                onValueChange={(_, date) => selectDraftDate(date)}
                style={styles.nativeCalendar}
              />
            ) : null}
            <View style={[styles.calendarModalFooter, { paddingBottom: Math.max(insets.bottom, theme.spacing[4]) }]}>
              <Pressable onPress={confirmRange} style={({ pressed }) => [styles.calendarDoneButton, pressed && styles.pressed]}>
                <Ionicons name="checkmark" size={20} color={theme.colors.light.base.white} />
                <Text style={styles.calendarDoneButtonText}>{t("travelPlan.workspace.datePickerDone")}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : activeField ? (
        <DateTimePicker
          value={parseDateOnly(activeField === "end" ? endDate : startDate)}
          mode="date"
          display="calendar"
          minimumDate={activeField === "end" ? parseDateOnly(startDate) : undefined}
          accentColor={theme.colors.light.accent}
          positiveButton={{ label: t("travelPlan.workspace.datePickerDone") }}
          negativeButton={{ label: t("common.cancel") }}
          onValueChange={(_, date) => selectAndroidDate(date)}
          onDismiss={() => setActiveField(null)}
        />
      ) : null}
    </>
  );
}

function DateSelectionButton({ label, value, active, compact, onPress }: { label: string; value: string; active: boolean; compact?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.dateSelectionButton, compact && styles.dateSelectionButtonCompact, active && styles.dateSelectionButtonActive, pressed && styles.pressed]}
    >
      <View style={[styles.dateSelectionIcon, active && styles.dateSelectionIconActive]}>
        <Ionicons name="calendar-outline" size={19} color={active ? theme.colors.light.base.white : theme.colors.light.accent} />
      </View>
      <View style={styles.dateSelectionText}>
        <Text style={[styles.dateSelectionLabel, active && styles.dateSelectionLabelActive]}>{label}</Text>
        <Text style={styles.dateSelectionValue}>{value}</Text>
      </View>
      {!compact ? <Ionicons name="chevron-forward" size={18} color={theme.colors.light.gray[400]} /> : null}
    </Pressable>
  );
}

function PlannerWizard({ trip, onBack, onSaved, feedback }: { feedback?: ReactNode; trip: TripDetailDTO; onBack: () => void; onSaved: (session: PlannerSessionDTO) => void }) {
  const { t } = useTranslation();
  const createSession = useCreatePlannerSession();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [form, setForm] = useState<WizardForm>(initialWizardForm);
  const submitLock = useRef(false);
  const task = useTaskNavigation({ dirty: JSON.stringify(form) !== JSON.stringify(initialWizardForm), pending: createSession.isPending, step: stepIndex, previous: () => goToStep(stepIndex - 1, -1), exit: onBack });
  const patch = (values: Partial<WizardForm>) => setForm((current) => ({ ...current, ...values }));
  const canContinue = stepIndex === 0 ? Boolean(form.origin.trim()) : stepIndex === 2 ? form.interestIds.length > 0 : true;

  const goToStep = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setAttemptedStep(null);
    setStepIndex(nextStep);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const next = async () => {
    if (submitLock.current || task.leaving) return;
    if (!canContinue) { setAttemptedStep(stepIndex); return; }
    if (stepIndex < 3) { goToStep(stepIndex + 1, 1); return; }
    submitLock.current = true;
    try {
      const response = await createSession.mutateAsync({ tripId: trip.id, ...plannerInput(form) });
      task.complete(() => onSaved(response.data));
    } catch (error) {
      submitLock.current = false;
      Alert.alert(t("travelPlan.workspace.saveErrorTitle"), getErrorMessage(error, t("travelPlan.workspace.sessionCreateError")));
    }
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
        {feedback}
      <TaskHeader title={t("travelPlan.workspace.headerTitle")} back={task.back} step={stepIndex} total={4} pending={createSession.isPending || task.leaving} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileStepContent}>
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            title={t(`travelPlan.workspace.steps.${stepIndex}.title`)}
            hint={t(`travelPlan.workspace.steps.${stepIndex}.hint`)}
          />
          <View style={styles.mobileFormSection}>
            {stepIndex === 0 ? <RouteStep trip={trip} form={form} patch={patch} /> : null}
            {stepIndex === 1 ? <LogisticsStep form={form} patch={patch} /> : null}
            {stepIndex === 2 ? <ExperienceStep form={form} patch={patch} /> : null}
            {stepIndex === 3 ? <ConstraintsStep form={form} patch={patch} /> : null}
            {attemptedStep === stepIndex && !canContinue ? <Text selectable style={styles.errorText}>{stepIndex === 0 ? t("travelPlan.workspace.originRequired") : t("travelPlan.workspace.interestRequired")}</Text> : null}
          </View>
          {stepIndex === 3 ? (
            <View style={styles.aiNotice}>
              <View style={styles.noticeIcon}><Ionicons name="sparkles" size={18} color={theme.colors.light.accent} /></View>
              <View style={styles.noticeText}><Text style={styles.noticeTitle}>{t("travelPlan.workspace.aiSoonTitle")}</Text><Text style={styles.noticeDescription}>{t("travelPlan.workspace.aiSoonDescription")}</Text></View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <TaskFooter
        label={stepIndex === 3 ? t("travelPlan.workspace.saveWorkspace") : t("travelPlan.actions.continue")}
        pending={createSession.isPending}
        disabled={task.leaving}
        onPress={() => void next()}
      />
    </KeyboardAvoidingView>
  );
}

type StepProps = { form: WizardForm; patch: (values: Partial<WizardForm>) => void };

function RouteStep({ trip, form, patch }: StepProps & { trip: TripDetailDTO }) {
  const { t } = useTranslation();
  const route = trip.stops.length ? trip.stops.map((stop) => stop.destination.title).join(" → ") : t("travelPlan.workspace.destinationsLater");
  return (
    <View style={styles.fieldStack}>
      <View style={styles.tripSummary}>
        <View style={styles.tripSummaryIcon}><Ionicons name="airplane-outline" size={21} color={theme.colors.light.accent} /></View>
        <View style={styles.tripSummaryText}>
          <Text style={styles.tripSummaryName}>{trip.name}</Text>
          <Text style={styles.tripSummaryMeta}>{formatDateRange(trip.startDate, trip.endDate)} · {t("travelPlan.workspace.travellerCount", { count: trip.crewNumber ?? trip.companions.length + 1 })}</Text>
          <Text style={styles.tripSummaryRoute}>{route}</Text>
        </View>
      </View>
      <FormField label={t("travelPlan.workspace.originLabel")} required>
        <TextInput autoFocus maxLength={255} accessibilityLabel={t("travelPlan.workspace.originLabel")} value={form.origin} onChangeText={(origin) => patch({ origin })} placeholder={t("travelPlan.chat.placeholders.origin")} placeholderTextColor={theme.colors.light.gray[400]} returnKeyType="done" style={styles.input} />
        <SuggestionChips values={originSuggestionKeys.map((key) => t(key))} selected={form.origin} onSelect={(origin) => patch({ origin })} />
      </FormField>
    </View>
  );
}

function LogisticsStep({ form, patch }: StepProps) {
  const { t } = useTranslation();
  const transportSuggestions = transportSuggestionIds.map((id) => t(`travelPlan.workspace.suggestions.transport.${id}`));
  const accommodationSuggestions = accommodationSuggestionIds.map((id) => t(`travelPlan.workspace.suggestions.accommodation.${id}`));
  return (
    <View style={styles.fieldStack}>
      <FormField label={t("travelPlan.workspace.transportPreference")}>
        <TextInput maxLength={100} accessibilityLabel={t("travelPlan.workspace.transportPreference")} value={form.transportPreference} onChangeText={(transportPreference) => patch({ transportPreference })} placeholder={t("travelPlan.workspace.transportPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
        <SuggestionChips values={transportSuggestions} selected={form.transportPreference} onSelect={(transportPreference) => patch({ transportPreference })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.accommodationPreference")}>
        <TextInput maxLength={100} accessibilityLabel={t("travelPlan.workspace.accommodationPreference")} value={form.accommodationPreference} onChangeText={(accommodationPreference) => patch({ accommodationPreference })} placeholder={t("travelPlan.workspace.accommodationPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
        <SuggestionChips values={accommodationSuggestions} selected={form.accommodationPreference} onSelect={(accommodationPreference) => patch({ accommodationPreference })} />
      </FormField>
    </View>
  );
}

function ExperienceStep({ form, patch }: StepProps) {
  const { t } = useTranslation();
  const mustDoSuggestions = mustDoSuggestionIds.map((id) => t(`travelPlan.workspace.suggestions.mustDo.${id}`));
  return (
    <View style={styles.fieldStack}>
      <FormField label={t("travelPlan.workspace.pace")} required>
        <OptionRow values={paceOptions} selected={form.pace} label={(value) => t(`travelPlan.workspace.paces.${value}`)} onSelect={(pace) => patch({ pace: pace as WizardForm["pace"] })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.interests")} description={t("travelPlan.workspace.interestsHint", { count: form.interestIds.length })} required>
        <View style={styles.wrapRow}>
          {interestOptions.map((option) => {
            const selected = form.interestIds.includes(option.id);
            return (
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} key={option.id} onPress={() => patch({ interestIds: selected ? form.interestIds.filter((id) => id !== option.id) : [...form.interestIds, option.id].slice(0, 10) })} style={[styles.choiceChip, selected && styles.selectedChip]}>
                <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={17} color={selected ? theme.colors.light.base.white : theme.colors.light.gray[700]} />
                <Text style={[styles.choiceChipText, selected && styles.selectedChipText]}>{t(option.titleKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      <FormField label={t("travelPlan.workspace.mustDoActivities")}>
        <TextInput multiline maxLength={1200} accessibilityLabel={t("travelPlan.workspace.mustDoActivities")} value={form.mustDoActivities} onChangeText={(mustDoActivities) => patch({ mustDoActivities })} placeholder={t("travelPlan.workspace.mustDoPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
        <SuggestionChips values={mustDoSuggestions} selected="" onSelect={(value) => patch({ mustDoActivities: appendLine(form.mustDoActivities, value) })} />
      </FormField>
    </View>
  );
}

function ConstraintsStep({ form, patch }: StepProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.fieldStack}>
      <FormField label={t("travelPlan.workspace.accessibility")}>
        <TextInput multiline maxLength={2000} accessibilityLabel={t("travelPlan.workspace.accessibility")} value={form.dietaryAccessibility} onChangeText={(dietaryAccessibility) => patch({ dietaryAccessibility })} placeholder={t("travelPlan.workspace.accessibilityPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.shortTextArea]} />
        <SuggestionChips values={requirementSuggestionKeys.map((key) => t(key))} selected={form.dietaryAccessibility} onSelect={(dietaryAccessibility) => patch({ dietaryAccessibility })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.avoidances")}>
        <TextInput multiline maxLength={2000} accessibilityLabel={t("travelPlan.workspace.avoidances")} value={form.avoidances} onChangeText={(avoidances) => patch({ avoidances })} placeholder={t("travelPlan.workspace.avoidancesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.shortTextArea]} />
      </FormField>
      <FormField label={t("travelPlan.workspace.notes")}>
        <TextInput multiline maxLength={4000} accessibilityLabel={t("travelPlan.workspace.notes")} value={form.notes} onChangeText={(notes) => patch({ notes })} placeholder={t("travelPlan.workspace.notesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
      </FormField>
    </View>
  );
}

function WorkspaceSummary({ session, bottomPadding, feedback }: { feedback?: ReactNode; session: PlannerSessionDTO; bottomPadding: number }) {
  const { t } = useTranslation();
  const deleteSession = useDeletePlannerSession();

  return (
    <View style={styles.screen}>
      <TaskHeader title={t("travelPlan.workspace.headerTitle")} back={closeTask} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.wizardContent, { paddingBottom: bottomPadding }]}>
        {feedback}
        <View style={styles.successHero}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={theme.colors.light.base.white} /></View>
          <Text style={[styles.heroEyebrow, styles.savedDescription]}>{t("travelPlan.workspace.savedEyebrow")}</Text>
          <Text style={[styles.heroTitle, styles.savedTitle]}>{session.origin} → {session.destination}</Text>
          <Text style={[styles.heroDescription, styles.savedDescription]}>{t("travelPlan.workspace.savedDescription")}</Text>
        </View>
        <View style={styles.formCard}>
          <SummaryRow icon="speedometer-outline" label={t("travelPlan.workspace.pace")} value={session.pace ? t(`travelPlan.workspace.paces.${session.pace}`) : t("travelPlan.workspace.notSet")} />
          <SummaryRow icon="train-outline" label={t("travelPlan.workspace.transportPreference")} value={session.transportPreference || t("travelPlan.workspace.notSet")} />
          <SummaryRow icon="bed-outline" label={t("travelPlan.workspace.accommodationPreference")} value={session.accommodationPreference || t("travelPlan.workspace.notSet")} />
          <View style={styles.summaryDivider} />
          <Text style={styles.fieldLabel}>{t("travelPlan.workspace.interests")}</Text>
          <View style={styles.wrapRow}>{session.interestIds.map((interest) => { const option = interestOptions.find((item) => item.id === interest); return <View key={interest} style={styles.readOnlyChip}><Text style={styles.readOnlyChipText}>{option ? t(option.titleKey) : interest}</Text></View>; })}</View>
        </View>
        <View style={styles.aiNotice}>
          <View style={styles.noticeIcon}><Ionicons name="sparkles" size={18} color={theme.colors.light.accent} /></View>
          <View style={styles.noticeText}><Text style={styles.noticeTitle}>{t("travelPlan.workspace.aiSoonTitle")}</Text><Text style={styles.noticeDescription}>{t("travelPlan.workspace.savedAiDescription")}</Text></View>
        </View>
        <View style={styles.buttonRow}>
          {session.accessRole !== "viewer" ? <SecondaryButton label={t("common.edit")} onPress={() => router.setParams({ mode: "edit" })} /> : null}
          <PrimaryButton label={t("travelPlan.workspace.chooseAnother")} icon="map-outline" onPress={() => router.replace("/planner")} />
        </View>
        {session.accessRole === "owner" ? <Pressable disabled={deleteSession.isPending} onPress={() => Alert.alert(t("travelPlan.workspace.deleteTitle"), t("travelPlan.workspace.deleteDescription"), [{ text: t("common.cancel"), style: "cancel" }, { text: t("common.delete"), style: "destructive", onPress: () => deleteSession.mutate(session.id, { onSuccess: closeTask, onError: (error) => Alert.alert(t("travelPlan.workspace.saveErrorTitle"), error.message) }) }])} style={styles.deleteWorkspace}><Text style={styles.deleteWorkspaceText}>{t("travelPlan.workspace.deleteWorkspace")}</Text></Pressable> : null}
      </ScrollView>
    </View>
  );
}

function PlannerSessionEditor({ session, onCancel, onSaved, feedback }: { feedback?: ReactNode; session: PlannerSessionDTO; onCancel: () => void; onSaved: (session: PlannerSessionDTO) => void }) {
  const { t } = useTranslation();
  const mutation = useUpdatePlannerSession();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [form, setForm] = useState<WizardForm>({
    origin: session.origin,
    transportPreference: session.transportPreference ?? "",
    accommodationPreference: session.accommodationPreference ?? "",
    pace: session.pace ?? "balanced",
    interestIds: [...session.interestIds],
    mustDoActivities: session.mustDoActivities.join("\n"),
    dietaryAccessibility: session.dietaryAccessibility ?? "",
    avoidances: session.avoidances ?? "",
    notes: session.notes ?? "",
  });
  const [initial] = useState(form);
  const submitLock = useRef(false);
  const task = useTaskNavigation({ dirty: JSON.stringify(form) !== JSON.stringify(initial), pending: mutation.isPending, step: stepIndex, previous: () => goToStep(stepIndex - 1, -1), exit: onCancel });
  const patch = (values: Partial<WizardForm>) => setForm((current) => ({ ...current, ...values }));
  const canContinue = stepIndex === 0 ? Boolean(form.origin.trim()) : stepIndex === 2 ? form.interestIds.length > 0 : true;

  const goToStep = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setAttemptedStep(null);
    setStepIndex(nextStep);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const save = async () => {
    if (submitLock.current || task.leaving) return;
    submitLock.current = true;
    try {
      const response = await mutation.mutateAsync({ id: session.id, input: plannerInput(form) });
      task.complete(() => onSaved(response.data));
    } catch (error) {
      submitLock.current = false;
      Alert.alert(t("travelPlan.workspace.saveErrorTitle"), getErrorMessage(error, t("travelPlan.workspace.sessionCreateError")));
    }
  };

  const next = () => {
    if (!canContinue) {
      setAttemptedStep(stepIndex);
      return;
    }
    if (stepIndex < 3) {
      goToStep(stepIndex + 1, 1);
      return;
    }
    void save();
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
        {feedback}
      <TaskHeader title={t("travelPlan.workspace.editWorkspace")} back={task.back} step={stepIndex} total={4} pending={mutation.isPending || task.leaving} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileStepContent}>
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            title={t(`travelPlan.workspace.steps.${stepIndex}.title`)}
            hint={t(`travelPlan.workspace.steps.${stepIndex}.hint`)}
          />
          <View style={styles.mobileFormSection}>
            {stepIndex === 0 ? (
              <View style={styles.fieldStack}>
                <View style={styles.tripSummary}>
                  <View style={styles.tripSummaryIcon}><Ionicons name="location-outline" size={21} color={theme.colors.light.accent} /></View>
                  <View style={styles.tripSummaryText}><Text style={styles.tripSummaryName}>{session.destination}</Text><Text style={styles.tripSummaryMeta}>{t("travelPlan.workspace.savedDestination")}</Text></View>
                </View>
                <FormField label={t("travelPlan.workspace.originLabel")} required><TextInput autoFocus maxLength={255} accessibilityLabel={t("travelPlan.workspace.originLabel")} value={form.origin} onChangeText={(origin) => patch({ origin })} placeholder={t("travelPlan.chat.placeholders.origin")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} /></FormField>
              </View>
            ) : null}
            {stepIndex === 1 ? <LogisticsStep form={form} patch={patch} /> : null}
            {stepIndex === 2 ? <ExperienceStep form={form} patch={patch} /> : null}
            {stepIndex === 3 ? <ConstraintsStep form={form} patch={patch} /> : null}
            {attemptedStep === stepIndex && !canContinue ? <Text selectable style={styles.errorText}>{stepIndex === 0 ? t("travelPlan.workspace.originRequired") : t("travelPlan.workspace.interestRequired")}</Text> : null}
          </View>
        </Animated.View>
      </ScrollView>
      <TaskFooter
        label={stepIndex === 3 ? t("common.save") : t("travelPlan.actions.continue")}
        pending={mutation.isPending}
        disabled={task.leaving}
        onPress={next}
      />
    </KeyboardAvoidingView>
  );
}

function StepIntro({ title, hint }: { title: string; hint: string }) {
  return <View style={styles.mobileStepIntro}><Text accessibilityRole="header" style={styles.stepTitle}>{title}</Text><Text style={styles.stepDescription}>{hint}</Text></View>;
}

function TripChoiceCard({ trip, onPress }: { trip: TripDTO; onPress: () => void }) {
  const { t } = useTranslation();
  return <Pressable accessibilityRole="button" accessibilityLabel={trip.name} onPress={onPress} style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}><View style={styles.tripCardIcon}><Ionicons name="airplane" size={20} color={theme.colors.light.accent} /></View><View style={styles.tripCardContent}><Text numberOfLines={2} style={styles.tripCardTitle}>{trip.name}</Text><Text style={styles.tripCardDate}>{trip.city ? `${trip.city.name}, ${trip.city.country} · ` : ""}{formatDateRange(trip.startDate, trip.endDate)}</Text><Text style={styles.tripCardAction}>{t("travelPlan.workspace.planThisTrip")}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.colors.light.accent} /></Pressable>;
}

function FormField({ label, description, required, children, style }: { label: string; description?: string; required?: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.field, style]}><Text style={styles.fieldLabel}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>{description ? <Text style={styles.fieldDescription}>{description}</Text> : null}{children}</View>;
}

function SuggestionChips({ values, selected, onSelect }: { values: readonly string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.wrapRow}>{values.map((value) => { const active = selected === value; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={value} onPress={() => onSelect(value)} style={[styles.suggestionChip, active && styles.selectedSuggestion]}><Ionicons name={active ? "checkmark" : "add"} size={14} color={active ? theme.colors.light.base.white : theme.colors.light.accent} /><Text style={[styles.suggestionText, active && styles.selectedChipText]}>{value}</Text></Pressable>; })}</View>;
}

function OptionRow({ values, selected, label, onSelect }: { values: readonly string[]; selected: string; label: (value: string) => string; onSelect: (value: string) => void }) {
  return <View style={styles.optionRow}>{values.map((value) => { const active = selected === value; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: active }} key={value} onPress={() => onSelect(value)} style={[styles.optionButton, active && styles.selectedOption]}><Text style={[styles.optionButtonText, active && styles.selectedOptionText]}>{label(value)}</Text></Pressable>; })}</View>;
}

function NumberStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.numberStepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("taskFlow.fewerPeople")} disabled={value <= min} hitSlop={8} onPress={() => onChange(Math.max(min, value - 1))} style={[styles.numberStepperButton, value <= min && styles.disabled]}>
        <Ionicons name="remove" size={20} color={theme.colors.light.gray[700]} />
      </Pressable>
      <Text selectable style={styles.numberStepperValue}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("taskFlow.morePeople")} disabled={value >= max} hitSlop={8} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.numberStepperButton, value >= max && styles.disabled]}>
        <Ionicons name="add" size={20} color={theme.colors.light.gray[700]} />
      </Pressable>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, pending, disabled }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; pending?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, styles.flexButton, disabled && styles.disabled, pressed && styles.pressed]}>{pending ? <ActivityIndicator size="small" color={theme.colors.light.base.white} /> : icon ? <Ionicons name={icon} size={19} color={theme.colors.light.base.white} /> : null}<Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, styles.flexButton, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.summaryRow}><View style={styles.summaryIcon}><Ionicons name={icon} size={18} color={theme.colors.light.accent} /></View><View style={styles.summaryText}><Text style={styles.summaryLabel}>{label}</Text><Text selectable style={styles.summaryValue}>{value}</Text></View></View>;
}

function LoadingScreen({ label, query }: { label: string; query: FeedbackQuery }) {
  return <View style={styles.screen}><TaskHeader title={label} back={closeTask} /><View style={{ padding: 20 }}><QueryFeedback query={query} layout="form" /></View></View>;
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return <View style={styles.screen}><TaskHeader title={i18n.t("travelPlan.workspace.headerTitle")} back={onBack} /><View style={styles.centerState}><Ionicons name="alert-circle-outline" size={36} color={theme.colors.light.error[500]} /><Text selectable style={styles.stateText}>{message}</Text></View></View>;
}

function plannerInput(form: WizardForm) {
  return {
    origin: form.origin.trim(), transportPreference: emptyToNull(form.transportPreference),
    accommodationPreference: emptyToNull(form.accommodationPreference), pace: form.pace,
    interestIds: form.interestIds, mustDoActivities: splitList(form.mustDoActivities).slice(0, 10),
    dietaryAccessibility: emptyToNull(form.dietaryAccessibility), avoidances: emptyToNull(form.avoidances), notes: emptyToNull(form.notes),
  };
}

function emptyToNull(value: string) { return value.trim() || null; }
function splitList(value: string) { return value.split(/[\n,]/).map((item) => item.trim().slice(0, 120)).filter(Boolean); }
function appendLine(current: string, value: string) { const items = splitList(current); return items.includes(value) ? current : [...items, value].join("\n"); }
function formatDateRange(startDate: string, endDate: string) { const formatter = new Intl.DateTimeFormat(i18n.language, { day: "numeric", month: "short", year: "numeric" }); return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`; }
function formatFriendlyDate(value: string, locale: string) { return new Intl.DateTimeFormat(locale, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(parseDateOnly(value)); }
function parseDateOnly(value: string) { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day, 12); }
function dateOnly(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function getErrorMessage(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }

const styles = StyleSheet.create({
  savedTitle: { color: theme.colors.light.base.white },
  savedDescription: { color: travelSurfaces.featuredSecondary },

  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  pageContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  wizardContent: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  heroEyebrow: { color: travelSurfaces.secondary, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  heroTitle: { color: travelSurfaces.foreground, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  heroDescription: { color: travelSurfaces.secondary, fontSize: 14, lineHeight: 22 },
  section: { gap: theme.spacing[3] },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: travelSurfaces.foreground, fontSize: 19, lineHeight: 26, fontWeight: "600" },
  sectionCount: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, color: theme.colors.light.accent, fontSize: 12, lineHeight: 16, fontWeight: "600", textAlign: "center", backgroundColor: travelSurfaces.info, fontVariant: ["tabular-nums"] },
  tripCard: { minHeight: 104, padding: 16, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.colors.light.surface },
  tripCardIcon: { width: 52, height: 72, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.header },
  tripCardContent: { flex: 1, minWidth: 0, gap: 6 },
  tripCardTitle: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "600" },
  tripCardDate: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  tripCardAction: { color: theme.colors.light.accent, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  emptyCard: { minHeight: 190, padding: 24, borderRadius: 24, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: theme.colors.light.surface },
  emptyTitle: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "600", textAlign: "center" },
  emptyDescription: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  formCard: { padding: 20, borderWidth: 1, borderColor: theme.colors.light.separator, borderRadius: 24, gap: 20, backgroundColor: theme.colors.light.surface },
  fieldStack: { gap: theme.spacing[5] },
  field: { gap: theme.spacing[2] },
  fieldLabel: { color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  fieldDescription: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 19 },
  required: { color: theme.colors.light.error[500] },
  input: { minHeight: 54, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.light.border, borderRadius: 16, color: travelSurfaces.foreground, fontSize: 16, lineHeight: 22, backgroundColor: theme.colors.light.surface },
  datePickerFields: { gap: theme.spacing[1] },
  dateSelectionButton: { minHeight: 72, paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  dateSelectionButtonCompact: { flex: 1, minHeight: 76, paddingHorizontal: theme.spacing[2] },
  dateSelectionButtonActive: { borderColor: theme.colors.light.accent, backgroundColor: travelSurfaces.info },
  dateSelectionIcon: { width: 40, height: 40, borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info, borderCurve: "continuous" },
  dateSelectionIconActive: { backgroundColor: theme.colors.light.accent },
  dateSelectionText: { flex: 1, minWidth: 0, gap: 2 },
  dateSelectionLabel: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "600", textTransform: "uppercase" },
  dateSelectionLabelActive: { color: theme.colors.light.accent },
  dateSelectionValue: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 21, fontWeight: "600" },
  dateRangeConnector: { height: 24, paddingLeft: 31, flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  dateRangeLine: { width: 1, height: 20, backgroundColor: theme.colors.light.gray[300] },
  calendarModal: { flex: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3], gap: theme.spacing[4], backgroundColor: theme.colors.light.background },
  calendarModalHeader: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing[2] },
  calendarHeaderAction: { minWidth: 58, minHeight: 40, alignItems: "center", justifyContent: "center" },
  calendarModalTitle: { flex: 1, color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 22, fontWeight: "600", textAlign: "center" },
  calendarCancelText: { color: theme.colors.light.gray[600], fontSize: 15, lineHeight: 20, fontWeight: "700" },
  calendarHint: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  calendarRangeTabs: { flexDirection: "row", gap: theme.spacing[2] },
  nativeCalendar: { width: "100%", minHeight: 350 },
  calendarModalFooter: { flex: 1, justifyContent: "flex-end" },
  calendarDoneButton: { minHeight: 54, borderRadius: theme.radius.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent, borderCurve: "continuous" },
  calendarDoneButtonText: { color: theme.colors.light.base.white, fontSize: 15, lineHeight: 21, fontWeight: "600" },
  textArea: { minHeight: 108, paddingTop: theme.spacing[3] },
  shortTextArea: { minHeight: 82, paddingTop: theme.spacing[3] },
  suggestionRow: { gap: theme.spacing[2], paddingRight: theme.spacing[3] },
  destinationChip: { width: 240, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.xl, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.background },
  destinationChipImage: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.colors.light.gray[100] },
  destinationChipText: { flex: 1, minWidth: 0 },
  clearSelectionText: { alignSelf: "flex-start", color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  chipTitle: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "600" },
  chipSubtitle: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "600" },
  selectedCard: { borderColor: theme.colors.light.accent, backgroundColor: travelSurfaces.info },
  buttonRow: { flexDirection: "row", gap: theme.spacing[3] },
  flexButton: { flex: 1 },
  primaryButton: { minHeight: 52, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.light.accent },
  primaryButtonText: { flexShrink: 1, color: theme.colors.light.base.white, fontSize: 14, lineHeight: 21, fontWeight: "600", textAlign: "center" },
  secondaryButton: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surfaceSecondary },
  secondaryButtonText: { flexShrink: 1, color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "500", textAlign: "center" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.76 },
  mobileStepContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 },
  mobileStepBody: { gap: theme.spacing[5] },
  mobileStepIntro: { alignItems: "flex-start", gap: 8 },
  mobileFormSection: { padding: 20, borderRadius: 24, gap: 20, backgroundColor: theme.colors.light.surface },
  stepTitle: { color: travelSurfaces.foreground, fontSize: 23, lineHeight: 30, fontWeight: "600" },
  stepDescription: { color: travelSurfaces.secondary, fontSize: 14, lineHeight: 22 },
  tripSummary: { padding: 16, borderRadius: 20, flexDirection: "row", gap: 12, backgroundColor: travelSurfaces.info },
  tripSummaryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface },
  tripSummaryText: { flex: 1, minWidth: 0, gap: 5 },
  tripSummaryName: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "600" },
  tripSummaryMeta: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "700" },
  tripSummaryRoute: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 17, fontWeight: "700" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  suggestionChip: { minHeight: 44, maxWidth: "100%", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: travelSurfaces.info },
  suggestionText: { flexShrink: 1, color: theme.colors.light.accent, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  selectedSuggestion: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  optionButton: { flexGrow: 1, flexBasis: 90, minHeight: 48, paddingVertical: 12, paddingHorizontal: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.background },
  optionButtonText: { color: theme.colors.light.gray[600], fontSize: 12, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  selectedOption: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  selectedOptionText: { color: theme.colors.light.accentForeground },
  numberStepper: { alignSelf: "flex-start", minHeight: 48, padding: 4, borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.xl, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.background },
  numberStepperButton: { width: 40, height: 40, borderRadius: theme.radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.gray[100] },
  numberStepperValue: { minWidth: 28, color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 22, fontWeight: "600", textAlign: "center", fontVariant: ["tabular-nums"] },
  choiceChip: { minHeight: 48, maxWidth: "100%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.light.surfaceSecondary },
  choiceChipText: { flexShrink: 1, color: theme.colors.light.muted, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  selectedChip: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  selectedChipText: { color: theme.colors.light.base.white },
  aiNotice: { padding: 18, borderRadius: 24, flexDirection: "row", gap: 12, backgroundColor: travelSurfaces.info },
  noticeIcon: { width: 36, height: 36, borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.base.white },
  noticeText: { flex: 1, gap: 3 },
  noticeTitle: { color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  noticeDescription: { color: travelSurfaces.secondary, fontSize: 12, lineHeight: 19 },
  errorText: { color: theme.colors.light.error[500], fontSize: 12, lineHeight: 17, fontWeight: "700" },
  errorCard: { padding: theme.spacing[4], borderRadius: theme.radius.xl, alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.error[50] },
  errorMessage: { color: theme.colors.light.error[700], fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  retryText: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  centerState: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center", gap: theme.spacing[3] },
  stateText: { color: theme.colors.light.gray[600], fontSize: 14, lineHeight: 21, fontWeight: "700", textAlign: "center" },
  successHero: { alignItems: "flex-start", gap: 12, padding: 24, borderRadius: 24, backgroundColor: travelSurfaces.featured },
  successIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.featuredInset },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  summaryIcon: { width: 38, height: 38, borderRadius: theme.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: travelSurfaces.info },
  summaryText: { flex: 1, gap: 2 },
  summaryLabel: { color: theme.colors.light.muted, fontSize: 12, lineHeight: 18 },
  summaryValue: { color: travelSurfaces.foreground, fontSize: 14, lineHeight: 21, fontWeight: "500" },
  summaryDivider: { height: 1, backgroundColor: theme.colors.light.gray[200] },
  reviewCard: { padding: 20, borderRadius: 24, gap: 16, backgroundColor: travelSurfaces.info },
  readOnlyChip: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderRadius: 999, backgroundColor: theme.colors.light.gray[100] },
  readOnlyChipText: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 15, fontWeight: "600" },
  deleteWorkspace: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  deleteWorkspaceText: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
