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
  plannerApi,
  type PlannerSessionDTO,
  type PlannerSessionInput,
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
  useCreateTrip,
  useTrip,
  useTrips,
} from "@/features/trips/services/trips-api-service";
import {
  type CityDTO,
  useCitySuggestions,
} from "@/features/travel/services/travel-api-service";
import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { ApiError } from "@/lib/api/client";
import { formatMoneyMinor, majorToMinor, minorToMajor } from "@/lib/money";
import { theme } from "@/theme/theme";

type WizardForm = {
  origin: string;
  budgetAmount: string;
  currency: string;
  budgetScope: "person" | "group";
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
  budgetAmount: "",
  currency: "USD",
  budgetScope: "group",
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
const tripBudgetPresets = [5_000_000, 10_000_000, 20_000_000, 50_000_000] as const;
const maxTripBudgetVnd = 1_000_000_000_000;
const maxTripCrew = 50;

export function TravelPlanScreen() {
  const { t } = useTranslation();
  const { tripId: requestedTripId } = useLocalSearchParams<{ tripId?: string }>();
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBottomPadding();
  const tripsQuery = useTrips();
  const requestedId = Number(requestedTripId);
  const requestedSelection = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : null;
  const [manualTripId, setManualTripId] = useState<number | null>(null);
  const selectedTripId = requestedSelection ?? manualTripId;
  const [savedSession, setSavedSession] = useState<PlannerSessionDTO | null>(null);
  const tripQuery = useTrip(selectedTripId);
  const existingSessionId = tripQuery.data?.plannerSessionId ?? null;
  const existingSessionQuery = usePlannerSession(existingSessionId);
  const ownerTrips = (tripsQuery.data ?? []).filter((trip) => trip.accessRole === "owner");

  const resetSelection = () => {
    router.setParams({ tripId: undefined });
    setManualTripId(null);
    setSavedSession(null);
  };

  if (savedSession || existingSessionQuery.data) {
    return (
      <WorkspaceSummary
        session={savedSession ?? (existingSessionQuery.data as PlannerSessionDTO)}
        topInset={insets.top}
        bottomPadding={bottomPadding}
        onChooseAnother={resetSelection}
        onSessionChange={setSavedSession}
      />
    );
  }

  if (selectedTripId !== null) {
    if (tripQuery.isPending || (existingSessionId !== null && existingSessionQuery.isPending)) {
      return <LoadingScreen topInset={insets.top} label={t("travelPlan.workspace.loadingTrip")} />;
    }
    if (tripQuery.isError || !tripQuery.data) {
      return <ErrorScreen topInset={insets.top} message={getErrorMessage(tripQuery.error, t("travelPlan.workspace.tripLoadError"))} onBack={resetSelection} />;
    }
    if (existingSessionId !== null && existingSessionQuery.isError) {
      return <ErrorScreen topInset={insets.top} message={getErrorMessage(existingSessionQuery.error, t("travelPlan.workspace.sessionLoadError"))} onBack={resetSelection} />;
    }
    return (
      <PlannerWizard
        key={tripQuery.data.id}
        trip={tripQuery.data}
        topInset={insets.top}
        bottomPadding={bottomPadding}
        onBack={resetSelection}
        onSaved={setSavedSession}
      />
    );
  }

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <PlannerHeader topInset={insets.top} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pageContent, { paddingBottom: bottomPadding }]}
      >
        <View style={styles.heroBlock}>
          <View style={styles.heroIcon}><Ionicons name="map-outline" size={30} color={theme.colors.light.accent} /></View>
          <Text style={styles.heroEyebrow}>{t("travelPlan.workspace.eyebrow")}</Text>
          <Text style={styles.heroTitle}>{t("travelPlan.workspace.chooseTitle")}</Text>
          <Text style={styles.heroDescription}>{t("travelPlan.workspace.chooseDescription")}</Text>
        </View>

        <Pressable onPress={() => router.push("/trip/new")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={21} color={theme.colors.light.base.white} />
          <Text style={styles.primaryButtonText}>{t("travelPlan.workspace.createTrip")}</Text>
        </Pressable>
        {tripsQuery.isPending ? (
          <ActivityIndicator color={theme.colors.light.accent} />
        ) : tripsQuery.isError ? (
          <InlineError message={getErrorMessage(tripsQuery.error, t("travelPlan.workspace.tripListError"))} onRetry={() => void tripsQuery.refetch()} />
        ) : ownerTrips.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>{t("travelPlan.workspace.yourTrips")}</Text>
              <Text style={styles.sectionCount}>{ownerTrips.length}</Text>
            </View>
            {ownerTrips.map((trip) => <TripChoiceCard key={trip.id} trip={trip} onPress={() => setManualTripId(trip.id)} />)}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={30} color={theme.colors.light.gray[400]} />
            <Text style={styles.emptyTitle}>{t("travelPlan.workspace.noTripsTitle")}</Text>
            <Text style={styles.emptyDescription}>{t("travelPlan.workspace.noTripsDescription")}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CreateTripScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topInset = insets.top;
  const bottomPadding = Math.max(insets.bottom, theme.spacing[3]);
  const citiesQuery = useCitySuggestions();
  const createTrip = useCreateTrip();
  const scrollRef = useRef<ScrollView>(null);
  const today = dateOnly(new Date());
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(dateOnly(addDays(new Date(), 4)));
  const [description, setDescription] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityDTO | null>(null);
  const [crewNumber, setCrewNumber] = useState(2);
  const [budgetVnd, setBudgetVnd] = useState("");
  const [budgetScope, setBudgetScope] = useState<"person" | "group">("person");
  const onCancel = () => router.back();
  const budgetValue = budgetVnd ? Number(budgetVnd) : null;
  const dateError = !isDateOnly(startDate) || !isDateOnly(endDate)
    ? t("travelPlan.workspace.invalidDate")
    : endDate < startDate ? t("travelPlan.workspace.dateOrderError") : null;
  const tripContextValid = Number.isInteger(crewNumber)
    && crewNumber >= 1
    && crewNumber <= maxTripCrew
    && (budgetValue === null || (Number.isInteger(budgetValue) && budgetValue >= 0 && budgetValue <= maxTripBudgetVnd));
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
    if (!canContinue) {
      setAttemptedStep(stepIndex);
      return;
    }
    if (stepIndex < 2) {
      goToStep(stepIndex + 1, 1);
      return;
    }
    try {
      const response = await createTrip.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        startDate,
        endDate,
        cityId: selectedCity?.id ?? null,
        crewNumber,
        budgetVnd: budgetValue,
        budgetScope: budgetValue === null ? null : budgetScope,
        invitationEmails: [],
      });
      router.replace({ pathname: "/explore", params: { tripId: String(response.data.id) } });
    } catch (error) {
      Alert.alert(t("travelPlan.workspace.saveErrorTitle"), getErrorMessage(error, t("travelPlan.workspace.tripCreateError")));
    }
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <PlannerHeader topInset={topInset} onBack={onCancel} />
      <MobileProgress current={stepIndex} total={3} />
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mobileStepContent}
      >
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            icon={stepIndex === 0 ? "location-outline" : stepIndex === 1 ? "calendar-outline" : "checkmark-circle-outline"}
            eyebrow={t("travelPlan.workspace.quickTripEyebrow")}
            title={t(`travelPlan.workspace.quickSteps.${stepIndex}.title`)}
            hint={t(`travelPlan.workspace.quickSteps.${stepIndex}.hint`)}
          />

          {stepIndex === 0 ? (
            <View style={styles.mobileFormSection}>
              <FormField label={t("travelPlan.workspace.tripName")} required>
                <TextInput autoFocus maxLength={200} value={name} onChangeText={setName} placeholder={t("travelPlan.workspace.tripNamePlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} returnKeyType="done" style={styles.input} />
              </FormField>
              {(citiesQuery.data?.length ?? 0) > 0 ? (
                <FormField label={t("travelPlan.workspace.cityOptional")}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
                    {citiesQuery.data?.map((city) => {
                      const selected = selectedCity?.id === city.id;
                      return (
                        <Pressable key={city.id} onPress={() => selectCity(city)} style={[styles.destinationChip, selected && styles.selectedCard]}>
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
                <FormField label={t("travelPlan.workspace.tripBudget")} description={t("travelPlan.workspace.tripBudgetHint")}>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={13}
                    value={budgetVnd}
                    onChangeText={(value) => setBudgetVnd(value.replace(/\D/g, "").slice(0, 13))}
                    placeholder={t("travelPlan.workspace.tripBudgetPlaceholder")}
                    placeholderTextColor={theme.colors.light.gray[400]}
                    style={styles.input}
                  />
                  <View style={styles.wrapRow}>
                    {tripBudgetPresets.map((amount) => (
                      <Pressable key={amount} onPress={() => setBudgetVnd(String(amount))} style={[styles.suggestionChip, budgetValue === amount && styles.selectedSuggestion]}>
                        <Text style={[styles.suggestionText, budgetValue === amount && styles.selectedChipText]}>{formatMoneyMinor(amount, "VND")}</Text>
                      </Pressable>
                    ))}
                    {budgetValue !== null ? (
                      <Pressable onPress={() => setBudgetVnd("")} style={styles.suggestionChip}>
                        <Text style={styles.suggestionText}>{t("common.clear")}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {budgetValue !== null ? (
                    <OptionRow values={["person", "group"]} selected={budgetScope} label={(value) => t(`travelPlan.workspace.budgetScopes.${value}`)} onSelect={(value) => setBudgetScope(value as "person" | "group")} />
                  ) : null}
                </FormField>
                <FormField label={t("travelPlan.workspace.tripNotes")}>
                  <TextInput multiline maxLength={5000} value={description} onChangeText={setDescription} placeholder={t("travelPlan.workspace.tripNotesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
                </FormField>
                {attemptedStep === 2 && !tripContextValid ? <Text selectable style={styles.errorText}>{t("travelPlan.workspace.tripContextInvalid")}</Text> : null}
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <MobileFooter
        bottomPadding={bottomPadding}
        backLabel={stepIndex === 0 ? t("common.cancel") : t("common.back")}
        nextLabel={stepIndex === 2 ? t("travelPlan.workspace.createAndPlan") : t("travelPlan.actions.continue")}
        nextIcon={stepIndex === 2 ? "checkmark" : "arrow-forward"}
        pending={createTrip.isPending}
        onBack={stepIndex === 0 ? onCancel : () => goToStep(stepIndex - 1, -1)}
        onNext={() => void next()}
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

function PlannerWizard({ trip, topInset, bottomPadding, onBack, onSaved }: { trip: TripDetailDTO; topInset: number; bottomPadding: number; onBack: () => void; onSaved: (session: PlannerSessionDTO) => void }) {
  const { t } = useTranslation();
  const createSession = useCreatePlannerSession();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [form, setForm] = useState<WizardForm>(() => trip.budgetVnd == null
    ? initialWizardForm
    : {
        ...initialWizardForm,
        budgetAmount: String(trip.budgetVnd),
        currency: "VND",
        budgetScope: trip.budgetScope ?? "person",
      });
  const patch = (values: Partial<WizardForm>) => setForm((current) => ({ ...current, ...values }));
  const budgetValue = form.budgetAmount.trim() ? Number(form.budgetAmount) : null;
  const currencyValid = /^[A-Za-z]{3}$/.test(form.currency.trim());
  const budgetValid = budgetValue === null || (Number.isFinite(budgetValue) && budgetValue >= 0);
  const canContinue = stepIndex === 0
    ? Boolean(form.origin.trim())
    : stepIndex === 1 ? currencyValid && budgetValid : stepIndex === 2 ? form.interestIds.length > 0 : true;

  const goToStep = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setAttemptedStep(null);
    setStepIndex(nextStep);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const next = async () => {
    if (!canContinue) {
      setAttemptedStep(stepIndex);
      return;
    }
    if (stepIndex < 3) {
      goToStep(stepIndex + 1, 1);
      return;
    }
    const input: PlannerSessionInput = {
      tripId: trip.id,
      origin: form.origin.trim(),
      budgetAmountMinor: budgetValue === null ? null : majorToMinor(budgetValue, form.currency),
      currency: form.currency.trim().toUpperCase(),
      budgetScope: budgetValue === null ? null : form.budgetScope,
      transportPreference: emptyToNull(form.transportPreference),
      accommodationPreference: emptyToNull(form.accommodationPreference),
      pace: form.pace,
      interestIds: form.interestIds,
      mustDoActivities: splitList(form.mustDoActivities).slice(0, 10),
      dietaryAccessibility: emptyToNull(form.dietaryAccessibility),
      avoidances: emptyToNull(form.avoidances),
      notes: emptyToNull(form.notes),
    };
    try {
      const response = await createSession.mutateAsync(input);
      onSaved(response.data);
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLANNER_SESSION_EXISTS" && trip.plannerSessionId) {
        const detail = await plannerApi.getSession(trip.plannerSessionId).catch(() => null);
        if (detail?.data) {
          onSaved(detail.data);
          return;
        }
      }
      Alert.alert(t("travelPlan.workspace.saveErrorTitle"), getErrorMessage(error, t("travelPlan.workspace.sessionCreateError")));
    }
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <PlannerHeader topInset={topInset} onBack={onBack} />
      <MobileProgress current={stepIndex} total={4} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileStepContent}>
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            icon={stepIndex === 0 ? "navigate-outline" : stepIndex === 1 ? "wallet-outline" : stepIndex === 2 ? "heart-outline" : "options-outline"}
            eyebrow={t("travelPlan.workspace.step", { current: stepIndex + 1 })}
            title={t(`travelPlan.workspace.steps.${stepIndex}.title`)}
            hint={t(`travelPlan.workspace.steps.${stepIndex}.hint`)}
          />
          <View style={styles.mobileFormSection}>
            {stepIndex === 0 ? <RouteStep trip={trip} form={form} patch={patch} /> : null}
            {stepIndex === 1 ? <LogisticsStep form={form} patch={patch} /> : null}
            {stepIndex === 2 ? <ExperienceStep form={form} patch={patch} /> : null}
            {stepIndex === 3 ? <ConstraintsStep form={form} patch={patch} /> : null}
            {attemptedStep === stepIndex && !canContinue ? <Text selectable style={styles.errorText}>{stepIndex === 0 ? t("travelPlan.workspace.originRequired") : stepIndex === 1 ? t("travelPlan.workspace.budgetInvalid") : t("travelPlan.workspace.interestRequired")}</Text> : null}
          </View>
          {stepIndex === 3 ? (
            <View style={styles.aiNotice}>
              <View style={styles.noticeIcon}><Ionicons name="sparkles" size={18} color={theme.colors.light.accent} /></View>
              <View style={styles.noticeText}><Text style={styles.noticeTitle}>{t("travelPlan.workspace.aiSoonTitle")}</Text><Text style={styles.noticeDescription}>{t("travelPlan.workspace.aiSoonDescription")}</Text></View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
      <MobileFooter
        bottomPadding={bottomPadding}
        backLabel={stepIndex === 0 ? t("common.cancel") : t("common.back")}
        nextLabel={stepIndex === 3 ? t("travelPlan.workspace.saveWorkspace") : t("travelPlan.actions.continue")}
        nextIcon={stepIndex === 3 ? "save-outline" : "arrow-forward"}
        pending={createSession.isPending}
        onBack={stepIndex === 0 ? onBack : () => goToStep(stepIndex - 1, -1)}
        onNext={() => void next()}
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
        <TextInput autoFocus maxLength={255} value={form.origin} onChangeText={(origin) => patch({ origin })} placeholder={t("travelPlan.chat.placeholders.origin")} placeholderTextColor={theme.colors.light.gray[400]} returnKeyType="done" style={styles.input} />
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
      <View style={styles.twoColumns}>
        <FormField label={t("travelPlan.workspace.budgetAmount")} style={styles.flexField}>
          <TextInput keyboardType="decimal-pad" value={form.budgetAmount} onChangeText={(budgetAmount) => patch({ budgetAmount: budgetAmount.replace(/[^0-9.]/g, "") })} placeholder="1500" placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
        </FormField>
        <FormField label={t("travelPlan.workspace.currency")} required style={styles.currencyField}>
          <TextInput autoCapitalize="characters" maxLength={3} value={form.currency} onChangeText={(currency) => patch({ currency: currency.toUpperCase().replace(/[^A-Z]/g, "") })} placeholder="USD" placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
        </FormField>
      </View>
      <FormField label={t("travelPlan.workspace.budgetScope")}>
        <OptionRow values={["group", "person"]} selected={form.budgetScope} label={(value) => t(`travelPlan.workspace.budgetScopes.${value}`)} onSelect={(budgetScope) => patch({ budgetScope: budgetScope as WizardForm["budgetScope"] })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.transportPreference")}>
        <TextInput maxLength={100} value={form.transportPreference} onChangeText={(transportPreference) => patch({ transportPreference })} placeholder={t("travelPlan.workspace.transportPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
        <SuggestionChips values={transportSuggestions} selected={form.transportPreference} onSelect={(transportPreference) => patch({ transportPreference })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.accommodationPreference")}>
        <TextInput maxLength={100} value={form.accommodationPreference} onChangeText={(accommodationPreference) => patch({ accommodationPreference })} placeholder={t("travelPlan.workspace.accommodationPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} />
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
              <Pressable key={option.id} onPress={() => patch({ interestIds: selected ? form.interestIds.filter((id) => id !== option.id) : [...form.interestIds, option.id].slice(0, 10) })} style={[styles.choiceChip, selected && styles.selectedChip]}>
                <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={17} color={selected ? theme.colors.light.base.white : theme.colors.light.gray[700]} />
                <Text style={[styles.choiceChipText, selected && styles.selectedChipText]}>{t(option.titleKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormField>
      <FormField label={t("travelPlan.workspace.mustDoActivities")}>
        <TextInput multiline maxLength={1200} value={form.mustDoActivities} onChangeText={(mustDoActivities) => patch({ mustDoActivities })} placeholder={t("travelPlan.workspace.mustDoPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
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
        <TextInput multiline maxLength={2000} value={form.dietaryAccessibility} onChangeText={(dietaryAccessibility) => patch({ dietaryAccessibility })} placeholder={t("travelPlan.workspace.accessibilityPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.shortTextArea]} />
        <SuggestionChips values={requirementSuggestionKeys.map((key) => t(key))} selected={form.dietaryAccessibility} onSelect={(dietaryAccessibility) => patch({ dietaryAccessibility })} />
      </FormField>
      <FormField label={t("travelPlan.workspace.avoidances")}>
        <TextInput multiline maxLength={2000} value={form.avoidances} onChangeText={(avoidances) => patch({ avoidances })} placeholder={t("travelPlan.workspace.avoidancesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.shortTextArea]} />
      </FormField>
      <FormField label={t("travelPlan.workspace.notes")}>
        <TextInput multiline maxLength={4000} value={form.notes} onChangeText={(notes) => patch({ notes })} placeholder={t("travelPlan.workspace.notesPlaceholder")} placeholderTextColor={theme.colors.light.gray[400]} textAlignVertical="top" style={[styles.input, styles.textArea]} />
      </FormField>
    </View>
  );
}

function WorkspaceSummary({ session, topInset, bottomPadding, onChooseAnother, onSessionChange }: { session: PlannerSessionDTO; topInset: number; bottomPadding: number; onChooseAnother: () => void; onSessionChange: (session: PlannerSessionDTO | null) => void }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const deleteSession = useDeletePlannerSession();
  const budget = session.budgetAmountMinor === null
    ? t("travelPlan.workspace.notSet")
    : `${formatMoneyMinor(session.budgetAmountMinor, session.currency)} · ${t(`travelPlan.workspace.budgetScopes.${session.budgetScope ?? "group"}`)}`;

  if (editing) {
    return (
      <PlannerSessionEditor
        session={session}
        topInset={topInset}
        bottomPadding={bottomPadding}
        onCancel={() => setEditing(false)}
        onSaved={(next) => {
          onSessionChange(next);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <PlannerHeader topInset={topInset} onBack={onChooseAnother} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.wizardContent, { paddingBottom: bottomPadding }]}>
        <View style={styles.successHero}>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={theme.colors.light.base.white} /></View>
          <Text style={styles.heroEyebrow}>{t("travelPlan.workspace.savedEyebrow")}</Text>
          <Text style={styles.heroTitle}>{session.origin} → {session.destination}</Text>
          <Text style={styles.heroDescription}>{t("travelPlan.workspace.savedDescription")}</Text>
        </View>
        <View style={styles.formCard}>
          <SummaryRow icon="wallet-outline" label={t("travelPlan.workspace.budgetAmount")} value={budget} />
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
          <SecondaryButton label={t("common.edit")} onPress={() => setEditing(true)} />
          <PrimaryButton label={t("travelPlan.workspace.chooseAnother")} icon="map-outline" onPress={onChooseAnother} />
        </View>
        <Pressable onPress={() => Alert.alert(t("travelPlan.workspace.deleteTitle"), t("travelPlan.workspace.deleteDescription"), [{ text: t("common.cancel"), style: "cancel" }, { text: t("common.delete"), style: "destructive", onPress: () => deleteSession.mutate(session.id, { onSuccess: () => { onSessionChange(null); onChooseAnother(); }, onError: (error) => Alert.alert(t("travelPlan.workspace.saveErrorTitle"), error.message) }) }])} style={styles.deleteWorkspace}><Text style={styles.deleteWorkspaceText}>{t("travelPlan.workspace.deleteWorkspace")}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function PlannerSessionEditor({ session, topInset, bottomPadding, onCancel, onSaved }: { session: PlannerSessionDTO; topInset: number; bottomPadding: number; onCancel: () => void; onSaved: (session: PlannerSessionDTO) => void }) {
  const { t } = useTranslation();
  const mutation = useUpdatePlannerSession();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [attemptedStep, setAttemptedStep] = useState<number | null>(null);
  const [form, setForm] = useState<WizardForm>({
    origin: session.origin,
    budgetAmount: session.budgetAmountMinor === null ? "" : String(minorToMajor(session.budgetAmountMinor, session.currency)),
    currency: session.currency,
    budgetScope: session.budgetScope ?? "group",
    transportPreference: session.transportPreference ?? "",
    accommodationPreference: session.accommodationPreference ?? "",
    pace: session.pace ?? "balanced",
    interestIds: [...session.interestIds],
    mustDoActivities: session.mustDoActivities.join("\n"),
    dietaryAccessibility: session.dietaryAccessibility ?? "",
    avoidances: session.avoidances ?? "",
    notes: session.notes ?? "",
  });
  const patch = (values: Partial<WizardForm>) => setForm((current) => ({ ...current, ...values }));
  const budgetValue = form.budgetAmount.trim() ? Number(form.budgetAmount) : null;
  const currencyValid = /^[A-Za-z]{3}$/.test(form.currency.trim());
  const budgetValid = budgetValue === null || (Number.isFinite(budgetValue) && budgetValue >= 0);
  const canContinue = stepIndex === 0
    ? Boolean(form.origin.trim())
    : stepIndex === 1 ? currencyValid && budgetValid : stepIndex === 2 ? form.interestIds.length > 0 : true;

  const goToStep = (nextStep: number, nextDirection: 1 | -1) => {
    setDirection(nextDirection);
    setAttemptedStep(null);
    setStepIndex(nextStep);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const save = () => mutation.mutate({
    id: session.id,
    input: {
      origin: form.origin.trim(),
      budgetAmountMinor: budgetValue === null ? null : majorToMinor(budgetValue, form.currency),
      currency: form.currency.trim().toUpperCase(),
      budgetScope: budgetValue === null ? null : form.budgetScope,
      transportPreference: emptyToNull(form.transportPreference),
      accommodationPreference: emptyToNull(form.accommodationPreference),
      pace: form.pace,
      interestIds: form.interestIds,
      mustDoActivities: splitList(form.mustDoActivities).slice(0, 10),
      dietaryAccessibility: emptyToNull(form.dietaryAccessibility),
      avoidances: emptyToNull(form.avoidances),
      notes: emptyToNull(form.notes),
    },
  }, { onSuccess: (response) => onSaved(response.data), onError: (error) => Alert.alert(t("travelPlan.workspace.saveErrorTitle"), error.message) });

  const next = () => {
    if (!canContinue) {
      setAttemptedStep(stepIndex);
      return;
    }
    if (stepIndex < 3) {
      goToStep(stepIndex + 1, 1);
      return;
    }
    save();
  };

  return (
    <KeyboardAvoidingView behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <PlannerHeader topInset={topInset} onBack={onCancel} />
      <MobileProgress current={stepIndex} total={4} />
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.mobileStepContent}>
        <Animated.View key={stepIndex} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)} style={styles.mobileStepBody}>
          <StepIntro
            icon={stepIndex === 0 ? "navigate-outline" : stepIndex === 1 ? "wallet-outline" : stepIndex === 2 ? "heart-outline" : "options-outline"}
            eyebrow={t("travelPlan.workspace.editWorkspace")}
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
                <FormField label={t("travelPlan.workspace.originLabel")} required><TextInput autoFocus maxLength={255} value={form.origin} onChangeText={(origin) => patch({ origin })} placeholder={t("travelPlan.chat.placeholders.origin")} placeholderTextColor={theme.colors.light.gray[400]} style={styles.input} /></FormField>
              </View>
            ) : null}
            {stepIndex === 1 ? <LogisticsStep form={form} patch={patch} /> : null}
            {stepIndex === 2 ? <ExperienceStep form={form} patch={patch} /> : null}
            {stepIndex === 3 ? <ConstraintsStep form={form} patch={patch} /> : null}
            {attemptedStep === stepIndex && !canContinue ? <Text selectable style={styles.errorText}>{stepIndex === 0 ? t("travelPlan.workspace.originRequired") : stepIndex === 1 ? t("travelPlan.workspace.budgetInvalid") : t("travelPlan.workspace.interestRequired")}</Text> : null}
          </View>
        </Animated.View>
      </ScrollView>
      <MobileFooter
        bottomPadding={bottomPadding}
        backLabel={stepIndex === 0 ? t("common.cancel") : t("common.back")}
        nextLabel={stepIndex === 3 ? t("common.save") : t("travelPlan.actions.continue")}
        nextIcon={stepIndex === 3 ? "save-outline" : "arrow-forward"}
        pending={mutation.isPending}
        onBack={stepIndex === 0 ? onCancel : () => goToStep(stepIndex - 1, -1)}
        onNext={next}
      />
    </KeyboardAvoidingView>
  );
}

function MobileProgress({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.mobileProgress}>
      <View style={styles.progressSegments}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            accessibilityLabel={t("travelPlan.workspace.progressStep", { current: index + 1, total })}
            style={[styles.progressSegment, index <= current && styles.progressSegmentActive]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>{t("travelPlan.workspace.progressStep", { current: current + 1, total })}</Text>
    </View>
  );
}

function StepIntro({ icon, eyebrow, title, hint }: { icon: keyof typeof Ionicons.glyphMap; eyebrow: string; title: string; hint: string }) {
  return (
    <View style={styles.mobileStepIntro}>
      <View style={styles.mobileStepIcon}><Ionicons name={icon} size={25} color={theme.colors.light.accent} /></View>
      <Text style={styles.stepEyebrow}>{eyebrow}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{hint}</Text>
    </View>
  );
}

function MobileFooter({ bottomPadding, backLabel, nextLabel, nextIcon, pending, onBack, onNext }: { bottomPadding: number; backLabel: string; nextLabel: string; nextIcon: keyof typeof Ionicons.glyphMap; pending?: boolean; onBack: () => void; onNext: () => void }) {
  return (
    <View style={[styles.mobileFooter, { paddingBottom: Math.max(bottomPadding, theme.spacing[3]) }]}>
      <Pressable disabled={pending} onPress={onBack} style={({ pressed }) => [styles.mobileBackButton, pending && styles.disabled, pressed && styles.pressed]}>
        <Ionicons name="arrow-back" size={19} color={theme.colors.light.gray[700]} />
        <Text style={styles.secondaryButtonText}>{backLabel}</Text>
      </Pressable>
      <PrimaryButton label={nextLabel} icon={nextIcon} pending={pending} disabled={pending} onPress={onNext} />
    </View>
  );
}

function PlannerHeader({ topInset, onBack }: { topInset: number; onBack?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.header, { paddingTop: topInset + theme.spacing[2] }]}>
      {onBack ? <Pressable accessibilityRole="button" hitSlop={8} onPress={onBack} style={styles.headerButton}><Ionicons name="arrow-back" size={22} color={theme.colors.light.gray[900]} /></Pressable> : <View style={styles.headerButton} />}
      <View style={styles.headerBrand}><View style={styles.brandMark}><Ionicons name="sparkles" size={18} color={theme.colors.light.base.white} /></View><View><Text style={styles.headerTitle}>{t("travelPlan.workspace.headerTitle")}</Text><Text style={styles.headerSubtitle}>{t("travelPlan.workspace.headerSubtitle")}</Text></View></View>
      <View style={styles.headerButton} />
    </View>
  );
}

function TripChoiceCard({ trip, onPress }: { trip: TripDTO; onPress: () => void }) {
  const { t } = useTranslation();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}><View style={styles.tripCardIcon}><Ionicons name="airplane" size={20} color={theme.colors.light.accent} /></View><View style={styles.tripCardContent}><Text numberOfLines={1} style={styles.tripCardTitle}>{trip.name}</Text><Text numberOfLines={1} style={styles.tripCardDate}>{trip.city ? `${trip.city.name}, ${trip.city.country} · ` : ""}{formatDateRange(trip.startDate, trip.endDate)}</Text></View><Text style={styles.tripCardAction}>{t("travelPlan.workspace.planThisTrip")}</Text><Ionicons name="chevron-forward" size={18} color={theme.colors.light.accent} /></Pressable>;
}

function FormField({ label, description, required, children, style }: { label: string; description?: string; required?: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.field, style]}><Text style={styles.fieldLabel}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>{description ? <Text style={styles.fieldDescription}>{description}</Text> : null}{children}</View>;
}

function SuggestionChips({ values, selected, onSelect }: { values: readonly string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.wrapRow}>{values.map((value) => { const active = selected === value; return <Pressable key={value} onPress={() => onSelect(value)} style={[styles.suggestionChip, active && styles.selectedSuggestion]}><Ionicons name={active ? "checkmark" : "add"} size={14} color={active ? theme.colors.light.base.white : theme.colors.light.accent} /><Text style={[styles.suggestionText, active && styles.selectedChipText]}>{value}</Text></Pressable>; })}</View>;
}

function OptionRow({ values, selected, label, onSelect }: { values: readonly string[]; selected: string; label: (value: string) => string; onSelect: (value: string) => void }) {
  return <View style={styles.optionRow}>{values.map((value) => { const active = selected === value; return <Pressable key={value} onPress={() => onSelect(value)} style={[styles.optionButton, active && styles.selectedOption]}><Text style={[styles.optionButtonText, active && styles.selectedOptionText]}>{label(value)}</Text></Pressable>; })}</View>;
}

function NumberStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.numberStepper}>
      <Pressable accessibilityRole="button" disabled={value <= min} hitSlop={8} onPress={() => onChange(Math.max(min, value - 1))} style={[styles.numberStepperButton, value <= min && styles.disabled]}>
        <Ionicons name="remove" size={20} color={theme.colors.light.gray[700]} />
      </Pressable>
      <Text selectable style={styles.numberStepperValue}>{value}</Text>
      <Pressable accessibilityRole="button" disabled={value >= max} hitSlop={8} onPress={() => onChange(Math.min(max, value + 1))} style={[styles.numberStepperButton, value >= max && styles.disabled]}>
        <Ionicons name="add" size={20} color={theme.colors.light.gray[700]} />
      </Pressable>
    </View>
  );
}

function PrimaryButton({ label, icon, onPress, pending, disabled }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; pending?: boolean; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, styles.flexButton, disabled && styles.disabled, pressed && styles.pressed]}>{pending ? <ActivityIndicator size="small" color={theme.colors.light.base.white} /> : icon ? <Ionicons name={icon} size={19} color={theme.colors.light.base.white} /> : null}<Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.secondaryButton, styles.flexButton, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>;
}

function SummaryRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.summaryRow}><View style={styles.summaryIcon}><Ionicons name={icon} size={18} color={theme.colors.light.accent} /></View><View style={styles.summaryText}><Text style={styles.summaryLabel}>{label}</Text><Text selectable style={styles.summaryValue}>{value}</Text></View></View>;
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return <View style={styles.errorCard}><Ionicons name="alert-circle-outline" size={24} color={theme.colors.light.error[500]} /><Text selectable style={styles.errorMessage}>{message}</Text><Pressable onPress={onRetry}><Text style={styles.retryText}>{t("common.retry")}</Text></Pressable></View>;
}

function LoadingScreen({ topInset, label }: { topInset: number; label: string }) {
  return <View style={styles.screen}><PlannerHeader topInset={topInset} /><View style={styles.centerState}><ActivityIndicator size="large" color={theme.colors.light.accent} /><Text style={styles.stateText}>{label}</Text></View></View>;
}

function ErrorScreen({ topInset, message, onBack }: { topInset: number; message: string; onBack: () => void }) {
  return <View style={styles.screen}><PlannerHeader topInset={topInset} onBack={onBack} /><View style={styles.centerState}><Ionicons name="alert-circle-outline" size={36} color={theme.colors.light.error[500]} /><Text selectable style={styles.stateText}>{message}</Text></View></View>;
}

function emptyToNull(value: string) { return value.trim() || null; }
function splitList(value: string) { return value.split(/[\n,]/).map((item) => item.trim().slice(0, 120)).filter(Boolean); }
function appendLine(current: string, value: string) { const items = splitList(current); return items.includes(value) ? current : [...items, value].join("\n"); }
function formatDateRange(startDate: string, endDate: string) { const formatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }); return `${formatter.format(new Date(startDate))} – ${formatter.format(new Date(endDate))}`; }
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
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  header: { minHeight: 76, paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[3], flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.colors.light.gray[200], backgroundColor: theme.colors.light.surface },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  brandMark: { width: 38, height: 38, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  headerTitle: { color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 21, fontWeight: "900", textAlign: "center" },
  headerSubtitle: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "700", textAlign: "center" },
  pageContent: { flexGrow: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[5], gap: theme.spacing[5] },
  wizardContent: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[5], gap: theme.spacing[4] },
  heroBlock: { alignItems: "flex-start", gap: theme.spacing[2] },
  heroIcon: { width: 56, height: 56, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  heroEyebrow: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  heroTitle: { color: theme.colors.light.gray[900], fontSize: 27, lineHeight: 34, fontWeight: "900" },
  heroDescription: { color: theme.colors.light.gray[500], fontSize: 14, lineHeight: 21, fontWeight: "600" },
  section: { gap: theme.spacing[3] },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: theme.colors.light.gray[900], fontSize: 18, lineHeight: 24, fontWeight: "900" },
  sectionCount: { minWidth: 28, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, color: theme.colors.light.accent, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlign: "center", backgroundColor: theme.colors.light.orange[50], fontVariant: ["tabular-nums"] },
  tripCard: { minHeight: 82, padding: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  tripCardIcon: { width: 42, height: 42, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  tripCardContent: { flex: 1, minWidth: 0, gap: 3 },
  tripCardTitle: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  tripCardDate: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "700" },
  tripCardAction: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900" },
  emptyCard: { minHeight: 190, padding: theme.spacing[5], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  emptyTitle: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "900", textAlign: "center" },
  emptyDescription: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  formCard: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.lg, gap: theme.spacing[5], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  formHeading: { gap: 2 },
  formEyebrow: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase" },
  formTitle: { color: theme.colors.light.gray[900], fontSize: 20, lineHeight: 27, fontWeight: "900" },
  fieldStack: { gap: theme.spacing[5] },
  field: { gap: theme.spacing[2] },
  flexField: { flex: 1 },
  currencyField: { width: 94 },
  fieldLabel: { color: theme.colors.light.gray[800], fontSize: 13, lineHeight: 18, fontWeight: "800" },
  fieldDescription: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  required: { color: theme.colors.light.error[500] },
  input: { minHeight: 54, paddingHorizontal: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 21, fontWeight: "600", backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  datePickerFields: { gap: theme.spacing[1] },
  dateSelectionButton: { minHeight: 72, paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  dateSelectionButtonCompact: { flex: 1, minHeight: 76, paddingHorizontal: theme.spacing[2] },
  dateSelectionButtonActive: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  dateSelectionIcon: { width: 40, height: 40, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  dateSelectionIconActive: { backgroundColor: theme.colors.light.accent },
  dateSelectionText: { flex: 1, minWidth: 0, gap: 2 },
  dateSelectionLabel: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "800", textTransform: "uppercase" },
  dateSelectionLabelActive: { color: theme.colors.light.accent },
  dateSelectionValue: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 21, fontWeight: "800" },
  dateRangeConnector: { height: 24, paddingLeft: 31, flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  dateRangeLine: { width: 1, height: 20, backgroundColor: theme.colors.light.gray[300] },
  calendarModal: { flex: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3], gap: theme.spacing[4], backgroundColor: theme.colors.light.background },
  calendarModalHeader: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing[2] },
  calendarHeaderAction: { minWidth: 58, minHeight: 40, alignItems: "center", justifyContent: "center" },
  calendarModalTitle: { flex: 1, color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  calendarCancelText: { color: theme.colors.light.gray[600], fontSize: 15, lineHeight: 20, fontWeight: "700" },
  calendarHint: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  calendarRangeTabs: { flexDirection: "row", gap: theme.spacing[2] },
  nativeCalendar: { width: "100%", minHeight: 350 },
  calendarModalFooter: { flex: 1, justifyContent: "flex-end" },
  calendarDoneButton: { minHeight: 54, borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent, borderCurve: "continuous" },
  calendarDoneButtonText: { color: theme.colors.light.base.white, fontSize: 15, lineHeight: 21, fontWeight: "900" },
  textArea: { minHeight: 108, paddingTop: theme.spacing[3] },
  shortTextArea: { minHeight: 82, paddingTop: theme.spacing[3] },
  twoColumns: { flexDirection: "row", gap: theme.spacing[3] },
  suggestionRow: { gap: theme.spacing[2], paddingRight: theme.spacing[3] },
  destinationChip: { width: 240, padding: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.background },
  destinationChipImage: { width: 44, height: 44, borderRadius: theme.radius.sm, backgroundColor: theme.colors.light.gray[100] },
  destinationChipText: { flex: 1, minWidth: 0 },
  clearSelectionText: { alignSelf: "flex-start", color: theme.colors.light.accent, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  chipTitle: { color: theme.colors.light.gray[900], fontSize: 13, lineHeight: 18, fontWeight: "900" },
  chipSubtitle: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "600" },
  selectedCard: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  buttonRow: { flexDirection: "row", gap: theme.spacing[3] },
  flexButton: { flex: 1 },
  primaryButton: { minHeight: 52, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent, borderCurve: "continuous" },
  primaryButtonText: { color: theme.colors.light.base.white, fontSize: 14, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  secondaryButton: { minHeight: 52, paddingHorizontal: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  secondaryButtonText: { color: theme.colors.light.gray[700], fontSize: 14, lineHeight: 20, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.76 },
  mobileProgress: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3], paddingBottom: theme.spacing[3], flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface },
  progressSegments: { flex: 1, flexDirection: "row", gap: 6 },
  progressSegment: { flex: 1, height: 5, borderRadius: 999, backgroundColor: theme.colors.light.gray[200] },
  progressSegmentActive: { backgroundColor: theme.colors.light.accent },
  progressText: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 16, fontWeight: "900", fontVariant: ["tabular-nums"] },
  mobileStepContent: { flexGrow: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[5], paddingBottom: theme.spacing[6] },
  mobileStepBody: { gap: theme.spacing[5] },
  mobileStepIntro: { alignItems: "flex-start", gap: 5 },
  mobileStepIcon: { width: 52, height: 52, borderRadius: theme.radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  mobileFormSection: { gap: theme.spacing[5] },
  mobileFooter: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, boxShadow: "0 -4px 18px rgba(16, 24, 40, 0.06)" },
  mobileBackButton: { minHeight: 52, paddingHorizontal: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.surface, borderCurve: "continuous" },
  stepEyebrow: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase" },
  stepTitle: { color: theme.colors.light.gray[900], fontSize: 28, lineHeight: 35, fontWeight: "900" },
  stepDescription: { color: theme.colors.light.gray[500], fontSize: 14, lineHeight: 21, fontWeight: "600" },
  tripSummary: { padding: theme.spacing[3], borderRadius: theme.radius.md, flexDirection: "row", gap: theme.spacing[3], backgroundColor: theme.colors.light.gray[50] },
  tripSummaryIcon: { width: 40, height: 40, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  tripSummaryText: { flex: 1, gap: 3 },
  tripSummaryName: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  tripSummaryMeta: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "700" },
  tripSummaryRoute: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 17, fontWeight: "700" },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  suggestionChip: { minHeight: 34, paddingHorizontal: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.orange[200], borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: theme.colors.light.orange[50] },
  suggestionText: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "800" },
  selectedSuggestion: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  optionRow: { flexDirection: "row", gap: theme.spacing[2] },
  optionButton: { flex: 1, minHeight: 44, paddingHorizontal: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.background },
  optionButtonText: { color: theme.colors.light.gray[600], fontSize: 12, lineHeight: 17, fontWeight: "800", textAlign: "center" },
  selectedOption: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  selectedOptionText: { color: theme.colors.light.accent },
  numberStepper: { alignSelf: "flex-start", minHeight: 48, padding: 4, borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[3], backgroundColor: theme.colors.light.background },
  numberStepperButton: { width: 40, height: 40, borderRadius: theme.radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.gray[100] },
  numberStepperValue: { minWidth: 28, color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 22, fontWeight: "900", textAlign: "center", fontVariant: ["tabular-nums"] },
  choiceChip: { minHeight: 42, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: 999, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.background },
  choiceChipText: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 17, fontWeight: "800" },
  selectedChip: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  selectedChipText: { color: theme.colors.light.base.white },
  aiNotice: { padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.orange[200], borderRadius: theme.radius.md, flexDirection: "row", gap: theme.spacing[3], backgroundColor: theme.colors.light.orange[50], borderCurve: "continuous" },
  noticeIcon: { width: 36, height: 36, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.base.white },
  noticeText: { flex: 1, gap: 3 },
  noticeTitle: { color: theme.colors.light.accent, fontSize: 14, lineHeight: 19, fontWeight: "900" },
  noticeDescription: { color: theme.colors.light.gray[600], fontSize: 11, lineHeight: 17, fontWeight: "600" },
  persistenceNote: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 15, fontWeight: "600", textAlign: "center" },
  errorText: { color: theme.colors.light.error[500], fontSize: 12, lineHeight: 17, fontWeight: "700" },
  errorCard: { padding: theme.spacing[4], borderRadius: theme.radius.md, alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.error[50] },
  errorMessage: { color: theme.colors.light.error[700], fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  retryText: { color: theme.colors.light.accent, fontSize: 13, lineHeight: 18, fontWeight: "900" },
  centerState: { flex: 1, padding: theme.spacing[6], alignItems: "center", justifyContent: "center", gap: theme.spacing[3] },
  stateText: { color: theme.colors.light.gray[600], fontSize: 14, lineHeight: 21, fontWeight: "700", textAlign: "center" },
  successHero: { alignItems: "center", gap: theme.spacing[2], paddingVertical: theme.spacing[3] },
  successIcon: { width: 68, height: 68, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.success },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  summaryIcon: { width: 38, height: 38, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  summaryText: { flex: 1, gap: 2 },
  summaryLabel: { color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "800", textTransform: "uppercase" },
  summaryValue: { color: theme.colors.light.gray[900], fontSize: 14, lineHeight: 19, fontWeight: "800" },
  summaryDivider: { height: 1, backgroundColor: theme.colors.light.gray[200] },
  reviewCard: { padding: theme.spacing[4], borderRadius: theme.radius.lg, gap: theme.spacing[3], backgroundColor: theme.colors.light.surface, borderCurve: "continuous", boxShadow: "0 2px 12px rgba(16, 24, 40, 0.06)" },
  readOnlyChip: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderRadius: 999, backgroundColor: theme.colors.light.gray[100] },
  readOnlyChipText: { color: theme.colors.light.gray[700], fontSize: 11, lineHeight: 15, fontWeight: "800" },
  deleteWorkspace: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  deleteWorkspaceText: { color: theme.colors.light.error[600], fontSize: 12, lineHeight: 17, fontWeight: "800" },
});
