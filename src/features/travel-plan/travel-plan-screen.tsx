import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBottomPadding } from "@/hooks/use-tab-bottom-padding";
import { theme } from "@/theme/theme";

import { generateTravelPlan, requestPlannerTurn } from "./openrouter";
import {
  budgetOptions,
  destinationSuggestionKeys,
  durationDayOptions,
  getBudgetOption,
  getTravellerOption,
  interestOptions,
  originSuggestionKeys,
  plannerStepOrder,
  requirementSuggestionKeys,
  travellerOptions,
} from "./travel-plan.data";
import { addUserTravelPlan } from "./travel-plan.store";
import type {
  PlannerAnswers,
  PlannerChatMessage,
  PlannerUi,
  TravelPlanOption,
  UserTravelPlan,
} from "./travel-plan.types";

const REQUIRED_DETAIL_COUNT = 7;

export function TravelPlanScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBottomPadding();
  const scrollRef = useRef<ScrollView>(null);
  const messageSequence = useRef(0);
  const [messages, setMessages] = useState<PlannerChatMessage[]>([]);
  const [answers, setAnswers] = useState<PlannerAnswers>({});
  const [activeUi, setActiveUi] = useState<PlannerUi | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [durationDays, setDurationDays] = useState(3);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<UserTravelPlan | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  function makeMessage(
    role: PlannerChatMessage["role"],
    text: string,
    ui?: PlannerUi,
  ): PlannerChatMessage {
    messageSequence.current += 1;
    return { id: `planner-message-${messageSequence.current}`, role, text, ui };
  }

  async function appendAssistantTurn(nextAnswers: PlannerAnswers, expectedUi: PlannerUi) {
    setIsThinking(true);
    setActiveUi(null);
    setActiveMessageId(null);

    const turn = await requestPlannerTurn({
      answers: nextAnswers,
      expectedUi,
      language: i18n.language,
      t,
    });
    const assistantMessage = makeMessage("assistant", turn.resp, turn.ui);
    setMessages((current) => [...current, assistantMessage]);
    setActiveUi(turn.ui);
    setActiveMessageId(assistantMessage.id);
    setIsThinking(false);
  }

  async function startPlanner() {
    setMessages([]);
    setAnswers({});
    setDraft("");
    setDurationDays(3);
    setSelectedInterestIds([]);
    setGeneratedTrip(null);
    setShowDetail(false);
    await appendAssistantTurn({}, "origin");
  }

  async function submitAnswer(
    partial: Partial<PlannerAnswers>,
    displayText: string,
  ) {
    if (!activeUi || isThinking) return;

    const nextAnswers = { ...answers, ...partial };
    const currentIndex = plannerStepOrder.indexOf(activeUi);
    const expectedUi = plannerStepOrder[currentIndex + 1];

    setMessages((current) => [...current, makeMessage("user", displayText)]);
    setAnswers(nextAnswers);
    setDraft("");

    if (expectedUi) await appendAssistantTurn(nextAnswers, expectedUi);
  }

  async function submitTextAnswer(value = draft) {
    const text = value.trim();
    if (!text || !activeUi) return;

    if (activeUi === "origin") {
      await submitAnswer({ origin: text }, text);
    } else if (activeUi === "destination") {
      await submitAnswer({ destination: text }, text);
    } else if (activeUi === "requirements") {
      await submitAnswer({ specialRequirements: text }, text);
    }
  }

  async function handleGenerate() {
    if (!hasCompleteAnswers(answers)) return;

    setIsGenerating(true);
    const trip = await generateTravelPlan({
      answers,
      language: i18n.language,
      t,
    });
    addUserTravelPlan(trip);
    setGeneratedTrip(trip);
    setIsGenerating(false);
  }

  function resetPlanner() {
    setMessages([]);
    setAnswers({});
    setActiveUi(null);
    setActiveMessageId(null);
    setGeneratedTrip(null);
    setShowDetail(false);
    setDraft("");
    setDurationDays(3);
    setSelectedInterestIds([]);
    setIsThinking(false);
    setIsGenerating(false);
  }

  if (generatedTrip && showDetail) {
    return (
      <GeneratedTripDetail
        trip={generatedTrip}
        topInset={insets.top}
        bottomPadding={bottomPadding}
        onBack={() => setShowDetail(false)}
        onPlanAnother={resetPlanner}
      />
    );
  }

  const progressIndex = activeUi ? plannerStepOrder.indexOf(activeUi) : 0;
  const showComposer =
    activeUi === "origin" || activeUi === "destination" || activeUi === "requirements";

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={[styles.chatHeader, { paddingTop: insets.top + theme.spacing[2] }]}> 
        <View style={styles.brandMark}>
          <Ionicons name="sparkles" size={20} color={theme.colors.light.base.white} />
        </View>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>{t("travelPlan.chat.title")}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerStatus}>{t("travelPlan.chat.online")}</Text>
          </View>
        </View>
        {messages.length > 0 ? (
          <Pressable
            accessibilityLabel={t("travelPlan.chat.restart")}
            onPress={resetPlanner}
            style={styles.headerIconButton}
          >
            <Ionicons name="refresh-outline" size={22} color={theme.colors.light.gray[700]} />
          </Pressable>
        ) : (
          <View style={styles.headerIconButton} />
        )}
      </View>

      {messages.length > 0 || isThinking ? (
        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(Math.min(progressIndex, REQUIRED_DETAIL_COUNT) / REQUIRED_DETAIL_COUNT) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {t("travelPlan.chat.progress", {
              current: Math.min(progressIndex, REQUIRED_DETAIL_COUNT),
              total: REQUIRED_DETAIL_COUNT,
            })}
          </Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={[
          styles.chatContent,
          {
            paddingBottom:
              bottomPadding + (showComposer ? theme.spacing[3] : theme.spacing[6]),
          },
        ]}
      >
        {messages.length === 0 && !isThinking ? (
          <PlannerStarter onStart={startPlanner} />
        ) : null}

        {messages.map((message) => {
          const isActive = message.id === activeMessageId && !isThinking;

          if (message.role === "user") {
            return (
              <View key={message.id} style={styles.userMessageRow}>
                <View style={styles.userBubble}>
                  <Text selectable style={styles.userMessageText}>
                    {message.text}
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <View key={message.id} style={styles.assistantMessageGroup}>
              <View style={styles.assistantRow}>
                <View style={styles.assistantAvatar}>
                  <Ionicons name="sparkles" size={16} color={theme.colors.light.accent} />
                </View>
                <View style={styles.assistantBubble}>
                  <Text selectable style={styles.assistantMessageText}>
                    {message.text}
                  </Text>
                </View>
              </View>

              {message.ui ? (
                <PlannerControl
                  ui={message.ui}
                  active={isActive}
                  answers={answers}
                  durationDays={durationDays}
                  selectedInterestIds={selectedInterestIds}
                  generatedTrip={generatedTrip}
                  isGenerating={isGenerating}
                  onQuickText={submitTextAnswer}
                  onTraveller={(id, label) => submitAnswer({ travellerId: id }, label)}
                  onBudget={(id, label) => submitAnswer({ budgetId: id }, label)}
                  onDurationChange={setDurationDays}
                  onDurationConfirm={() =>
                    submitAnswer(
                      { durationDays },
                      t("travelPlan.chat.answer.days", { count: durationDays }),
                    )
                  }
                  onInterestToggle={(id) =>
                    setSelectedInterestIds((current) =>
                      current.includes(id)
                        ? current.filter((item) => item !== id)
                        : [...current, id],
                    )
                  }
                  onInterestConfirm={() => {
                    const labels = selectedInterestIds.map((id) => {
                      const option = interestOptions.find((item) => item.id === id);
                      return option ? t(option.titleKey) : id;
                    });
                    return submitAnswer({ interestIds: selectedInterestIds }, labels.join(", "));
                  }}
                  onGenerate={handleGenerate}
                  onViewTrip={() => setShowDetail(true)}
                />
              ) : null}
            </View>
          );
        })}

        {isThinking ? <ThinkingBubble /> : null}
      </ScrollView>

      {showComposer ? (
        <View style={styles.composerArea}>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => submitTextAnswer()}
              placeholder={t(`travelPlan.chat.placeholders.${activeUi}`)}
              placeholderTextColor={theme.colors.light.gray[400]}
              returnKeyType="send"
              style={styles.composerInput}
            />
            <Pressable
              accessibilityLabel={t("travelPlan.chat.send")}
              disabled={!draft.trim() || isThinking}
              onPress={() => submitTextAnswer()}
              style={({ pressed }) => [
                styles.sendButton,
                !draft.trim() || isThinking ? styles.disabledButton : null,
                pressed ? styles.pressedButton : null,
              ]}
            >
              <Ionicons name="arrow-up" size={20} color={theme.colors.light.base.white} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function PlannerStarter({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.starter}>
      <View style={styles.starterIcon}>
        <Ionicons name="map-outline" size={32} color={theme.colors.light.accent} />
      </View>
      <Text style={styles.starterTitle}>{t("travelPlan.chat.starter.title")}</Text>
      <Text style={styles.starterDescription}>{t("travelPlan.chat.starter.description")}</Text>
      <Pressable onPress={onStart} style={({ pressed }) => [styles.startButton, pressed && styles.pressedButton]}>
        <Ionicons name="add-circle-outline" size={22} color={theme.colors.light.base.white} />
        <Text style={styles.startButtonText}>{t("travelPlan.chat.starter.action")}</Text>
      </Pressable>
    </View>
  );
}

function ThinkingBubble() {
  const { t } = useTranslation();

  return (
    <View style={styles.assistantRow}>
      <View style={styles.assistantAvatar}>
        <Ionicons name="sparkles" size={16} color={theme.colors.light.accent} />
      </View>
      <View style={styles.thinkingBubble}>
        <ActivityIndicator size="small" color={theme.colors.light.accent} />
        <Text style={styles.thinkingText}>{t("travelPlan.chat.thinking")}</Text>
      </View>
    </View>
  );
}

type PlannerControlProps = {
  ui: PlannerUi;
  active: boolean;
  answers: PlannerAnswers;
  durationDays: number;
  selectedInterestIds: string[];
  generatedTrip: UserTravelPlan | null;
  isGenerating: boolean;
  onQuickText: (value: string) => void;
  onTraveller: (id: string, label: string) => void;
  onBudget: (id: string, label: string) => void;
  onDurationChange: (days: number) => void;
  onDurationConfirm: () => void;
  onInterestToggle: (id: string) => void;
  onInterestConfirm: () => void;
  onGenerate: () => void;
  onViewTrip: () => void;
};

function PlannerControl(props: PlannerControlProps) {
  const { t } = useTranslation();

  if (props.ui === "origin" || props.ui === "destination" || props.ui === "requirements") {
    const keys =
      props.ui === "origin"
        ? originSuggestionKeys
        : props.ui === "destination"
          ? destinationSuggestionKeys
          : requirementSuggestionKeys;

    return (
      <View style={styles.quickReplyWrap}>
        {keys.map((key) => {
          const label = t(key);
          return (
            <Pressable
              key={key}
              disabled={!props.active}
              onPress={() => props.onQuickText(label)}
              style={({ pressed }) => [
                styles.quickReply,
                !props.active && styles.inactiveControl,
                pressed && styles.selectedBorder,
              ]}
            >
              <Ionicons
                name={props.ui === "requirements" ? "options-outline" : "location-outline"}
                size={17}
                color={theme.colors.light.accent}
              />
              <Text style={styles.quickReplyText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (props.ui === "groupSize") {
    return (
      <OptionGrid
        options={travellerOptions}
        active={props.active}
        selectedId={props.answers.travellerId}
        onSelect={props.onTraveller}
      />
    );
  }

  if (props.ui === "budget") {
    return (
      <OptionGrid
        options={budgetOptions}
        active={props.active}
        selectedId={props.answers.budgetId}
        onSelect={props.onBudget}
      />
    );
  }

  if (props.ui === "tripDuration") {
    return (
      <View style={[styles.durationControl, !props.active && styles.inactiveControl]}>
        <Text style={styles.controlTitle}>{t("travelPlan.chat.controls.durationTitle")}</Text>
        <View style={styles.stepperRow}>
          <Pressable
            accessibilityLabel={t("travelPlan.chat.controls.decreaseDays")}
            disabled={!props.active || props.durationDays <= 1}
            onPress={() => props.onDurationChange(Math.max(1, props.durationDays - 1))}
            style={styles.stepperButton}
          >
            <Ionicons name="remove" size={22} color={theme.colors.light.gray[700]} />
          </Pressable>
          <Text style={styles.dayCount}>
            {t("travelPlan.chat.answer.days", { count: props.durationDays })}
          </Text>
          <Pressable
            accessibilityLabel={t("travelPlan.chat.controls.increaseDays")}
            disabled={!props.active || props.durationDays >= 14}
            onPress={() => props.onDurationChange(Math.min(14, props.durationDays + 1))}
            style={styles.stepperButton}
          >
            <Ionicons name="add" size={22} color={theme.colors.light.gray[700]} />
          </Pressable>
        </View>
        <View style={styles.durationPresets}>
          {durationDayOptions.map((days) => (
            <Pressable
              key={days}
              disabled={!props.active}
              onPress={() => props.onDurationChange(days)}
              style={[styles.presetChip, props.durationDays === days && styles.selectedChip]}
            >
              <Text style={[styles.presetText, props.durationDays === days && styles.selectedChipText]}>
                {t("travelPlan.chat.answer.days", { count: days })}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          disabled={!props.active}
          onPress={props.onDurationConfirm}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>{t("travelPlan.chat.confirm")}</Text>
        </Pressable>
      </View>
    );
  }

  if (props.ui === "interests") {
    return (
      <View style={[styles.interestControl, !props.active && styles.inactiveControl]}>
        <View style={styles.interestGrid}>
          {interestOptions.map((option) => {
            const selected = props.selectedInterestIds.includes(option.id);
            return (
              <Pressable
                key={option.id}
                disabled={!props.active}
                onPress={() => props.onInterestToggle(option.id)}
                style={[styles.interestChip, selected && styles.selectedChip]}
              >
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={17}
                  color={selected ? theme.colors.light.base.white : theme.colors.light.accent}
                />
                <Text style={[styles.interestText, selected && styles.selectedChipText]}>
                  {t(option.titleKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          disabled={!props.active || props.selectedInterestIds.length === 0}
          onPress={props.onInterestConfirm}
          style={[
            styles.confirmButton,
            props.selectedInterestIds.length === 0 && styles.disabledButton,
          ]}
        >
          <Text style={styles.confirmButtonText}>{t("travelPlan.chat.confirmInterests")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FinalPlanControl
      answers={props.answers}
      active={props.active}
      generatedTrip={props.generatedTrip}
      isGenerating={props.isGenerating}
      onGenerate={props.onGenerate}
      onViewTrip={props.onViewTrip}
    />
  );
}

function OptionGrid({
  options,
  active,
  selectedId,
  onSelect,
}: {
  options: readonly (TravelPlanOption & { people?: number })[];
  active: boolean;
  selectedId?: string;
  onSelect: (id: string, label: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.optionGrid}>
      {options.map((option) => {
        const selected = selectedId === option.id;
        return (
          <Pressable
            key={option.id}
            disabled={!active}
            onPress={() => onSelect(option.id, t(option.titleKey))}
            style={({ pressed }) => [
              styles.optionCard,
              selected && styles.selectedOptionCard,
              !active && styles.inactiveControl,
              pressed && styles.pressedButton,
            ]}
          >
            <View style={[styles.optionIcon, selected && styles.selectedOptionIcon]}>
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={21}
                color={selected ? theme.colors.light.base.white : theme.colors.light.accent}
              />
            </View>
            <Text style={styles.optionTitle}>{t(option.titleKey)}</Text>
            <Text numberOfLines={2} style={styles.optionSubtitle}>
              {t(option.subtitleKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FinalPlanControl({
  answers,
  active,
  generatedTrip,
  isGenerating,
  onGenerate,
  onViewTrip,
}: {
  answers: PlannerAnswers;
  active: boolean;
  generatedTrip: UserTravelPlan | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onViewTrip: () => void;
}) {
  const { t } = useTranslation();
  const traveller = getTravellerOption(answers.travellerId || "solo");
  const budget = getBudgetOption(answers.budgetId || "cheap");
  const rows = [
    { icon: "navigate-outline", label: t("travelPlan.chat.summary.route"), value: `${answers.origin || ""} → ${answers.destination || ""}` },
    { icon: "people-outline", label: t("travelPlan.chat.summary.group"), value: t(traveller.titleKey) },
    { icon: "wallet-outline", label: t("travelPlan.chat.summary.budget"), value: t(budget.titleKey) },
    { icon: "calendar-outline", label: t("travelPlan.chat.summary.duration"), value: t("travelPlan.chat.answer.days", { count: answers.durationDays || 0 }) },
  ];

  return (
    <View style={[styles.finalControl, !active && !generatedTrip && styles.inactiveControl]}>
      <View style={styles.summaryRows}>
        {rows.map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Ionicons
              name={row.icon as keyof typeof Ionicons.glyphMap}
              size={19}
              color={theme.colors.light.accent}
            />
            <View style={styles.summaryTextGroup}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text selectable style={styles.summaryValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {generatedTrip ? (
        <View style={styles.readyBlock}>
          <Ionicons name="checkmark-circle" size={27} color={theme.colors.light.success} />
          <View style={styles.readyTextGroup}>
            <Text style={styles.readyTitle}>{t("travelPlan.chat.ready.title")}</Text>
            <Text style={styles.readyDescription}>{t("travelPlan.chat.ready.description")}</Text>
          </View>
          <Pressable onPress={onViewTrip} style={styles.viewTripButton}>
            <Text style={styles.viewTripButtonText}>{t("travelPlan.chat.ready.action")}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.colors.light.base.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={!active || isGenerating}
          onPress={onGenerate}
          style={[styles.generateButton, isGenerating && styles.disabledButton]}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color={theme.colors.light.base.white} />
              <Text style={styles.generateButtonText}>{t("travelPlan.chat.generating")}</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={19} color={theme.colors.light.base.white} />
              <Text style={styles.generateButtonText}>{t("travelPlan.actions.generate")}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

function GeneratedTripDetail({
  trip,
  topInset,
  bottomPadding,
  onBack,
  onPlanAnother,
}: {
  trip: UserTravelPlan;
  topInset: number;
  bottomPadding: number;
  onBack: () => void;
  onPlanAnother: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: bottomPadding + theme.spacing[5] }}
    >
      <View style={[styles.detailHeader, { paddingTop: topInset + theme.spacing[2] }]}> 
        <Pressable accessibilityLabel={t("common.back")} onPress={onBack} style={styles.headerIconButton}>
          <Ionicons name="arrow-back" size={23} color={theme.colors.light.gray[800]} />
        </Pressable>
        <Text style={styles.detailHeaderTitle}>{t("travelPlan.generated.title")}</Text>
        <Pressable
          accessibilityLabel={t("travelPlan.actions.planAnother")}
          onPress={onPlanAnother}
          style={styles.headerIconButton}
        >
          <Ionicons name="add" size={24} color={theme.colors.light.gray[800]} />
        </Pressable>
      </View>

      <View style={styles.detailHero}>
        <Image source={{ uri: trip.image }} style={styles.detailImage} contentFit="cover" />
        <View style={styles.detailImageOverlay} />
        <View style={styles.detailHeroText}>
          <Text selectable style={styles.detailName}>{trip.name}</Text>
          <View style={styles.routeRow}>
            <Ionicons name="navigate-outline" size={17} color={theme.colors.light.base.white} />
            <Text selectable style={styles.routeText}>
              {trip.origin ? `${trip.origin} → ` : ""}{trip.destination}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailBody}>
        <Text selectable style={styles.detailSummary}>{trip.summary}</Text>
        <View style={styles.detailStats}>
          <DetailStat icon="calendar-outline" value={trip.duration} />
          <DetailStat icon="people-outline" value={t("travelPlan.generated.peopleCount", { count: trip.totalPeople })} />
          <DetailStat icon="wallet-outline" value={`$${trip.estimatedCost.toFixed(0)}`} />
        </View>

        {trip.hotels.length > 0 ? (
          <View style={styles.detailSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>{t("travelPlan.generated.hotels")}</Text>
              <Text style={styles.sectionCount}>{trip.hotels.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hotelList}>
              {trip.hotels.map((hotel) => (
                <View key={`${hotel.hotelName}-${hotel.hotelAddress}`} style={styles.hotelCard}>
                  <Image source={{ uri: hotel.hotelImageUrl }} style={styles.hotelImage} contentFit="cover" />
                  <View style={styles.hotelContent}>
                    <View style={styles.hotelTitleRow}>
                      <Text numberOfLines={1} style={styles.hotelName}>{hotel.hotelName}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color={theme.colors.light.warning} />
                        <Text style={styles.hotelRating}>{hotel.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.hotelAddress}>{hotel.hotelAddress}</Text>
                    <Text style={styles.hotelPrice}>{hotel.pricePerNight}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("travelPlan.generated.itinerary")}</Text>
          <View style={styles.itineraryList}>
            {trip.days.map((day) => (
              <View key={`${trip.id}-${day.day}`} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>{day.day}</Text>
                  </View>
                  <View style={styles.dayHeaderText}>
                    <Text style={styles.dayEyebrow}>{t("travelPlan.generated.day", { day: day.day })}</Text>
                    <Text selectable style={styles.dayTitle}>{day.title}</Text>
                    <Text style={styles.dayBestTime}>{day.bestTimeToVisitDay}</Text>
                  </View>
                </View>
                <Text selectable style={styles.daySummary}>{day.summary}</Text>
                <View style={styles.activityList}>
                  {day.activities.map((activity) => (
                    <View key={`${day.day}-${activity.placeName}`} style={styles.activityCard}>
                      <Image source={{ uri: activity.placeImageUrl }} style={styles.activityImage} contentFit="cover" />
                      <View style={styles.activityContent}>
                        <Text selectable style={styles.activityName}>{activity.placeName}</Text>
                        <Text numberOfLines={2} style={styles.activityDetails}>{activity.placeDetails}</Text>
                        <View style={styles.activityMetaRow}>
                          <Ionicons name="location-outline" size={14} color={theme.colors.light.gray[500]} />
                          <Text numberOfLines={1} style={styles.activityMetaText}>{activity.placeAddress}</Text>
                        </View>
                        <View style={styles.activityTags}>
                          <MetaTag icon="time-outline" text={activity.bestTimeToVisit} />
                          <MetaTag icon="ticket-outline" text={activity.ticketPricing} />
                          <MetaTag icon="car-outline" text={activity.travelTime} />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailStat({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.detailStat}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color={theme.colors.light.accent} />
      <Text numberOfLines={1} style={styles.detailStatText}>{value}</Text>
    </View>
  );
}

function MetaTag({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaTag}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13} color={theme.colors.light.gray[600]} />
      <Text numberOfLines={1} style={styles.metaTagText}>{text}</Text>
    </View>
  );
}

function hasCompleteAnswers(answers: PlannerAnswers): answers is Required<PlannerAnswers> {
  return Boolean(
    answers.origin &&
      answers.destination &&
      answers.travellerId &&
      answers.budgetId &&
      answers.durationDays &&
      answers.interestIds?.length &&
      answers.specialRequirements,
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.light.background },
  chatHeader: {
    minHeight: 74,
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.light.gray[200],
    backgroundColor: theme.colors.light.surface,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.light.accent,
  },
  headerTextGroup: { flex: 1 },
  headerTitle: { color: theme.colors.light.gray[900], fontSize: 18, lineHeight: 24, fontWeight: "900" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: theme.colors.light.success },
  headerStatus: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 16, fontWeight: "700" },
  headerIconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  progressArea: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    backgroundColor: theme.colors.light.surface,
  },
  progressTrack: { flex: 1, height: 4, borderRadius: 999, overflow: "hidden", backgroundColor: theme.colors.light.gray[200] },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: theme.colors.light.accent },
  progressText: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  chatContent: { flexGrow: 1, paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[5], gap: theme.spacing[4] },
  starter: { flex: 1, minHeight: 470, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing[4], gap: theme.spacing[3] },
  starterIcon: { width: 68, height: 68, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  starterTitle: { color: theme.colors.light.gray[900], fontSize: 24, lineHeight: 32, fontWeight: "900", textAlign: "center" },
  starterDescription: { maxWidth: 320, color: theme.colors.light.gray[500], fontSize: 15, lineHeight: 22, fontWeight: "600", textAlign: "center" },
  startButton: { minHeight: 52, marginTop: theme.spacing[3], paddingHorizontal: theme.spacing[5], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent },
  startButtonText: { color: theme.colors.light.base.white, fontSize: 16, lineHeight: 22, fontWeight: "900" },
  userMessageRow: { alignItems: "flex-end" },
  userBubble: { maxWidth: "84%", paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], borderRadius: theme.radius.md, backgroundColor: theme.colors.light.accent },
  userMessageText: { color: theme.colors.light.base.white, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  assistantMessageGroup: { gap: theme.spacing[3] },
  assistantRow: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing[2] },
  assistantAvatar: { width: 30, height: 30, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  assistantBubble: { maxWidth: "84%", paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[3], borderRadius: theme.radius.md, backgroundColor: theme.colors.light.gray[100] },
  assistantMessageText: { color: theme.colors.light.gray[800], fontSize: 15, lineHeight: 22, fontWeight: "600" },
  thinkingBubble: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.gray[100] },
  thinkingText: { color: theme.colors.light.gray[500], fontSize: 14, lineHeight: 20, fontWeight: "700" },
  quickReplyWrap: { paddingLeft: 38, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  quickReply: { minHeight: 42, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.surface },
  quickReplyText: { color: theme.colors.light.gray[800], fontSize: 14, lineHeight: 20, fontWeight: "800" },
  optionGrid: { paddingLeft: 38, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  optionCard: { width: "47%", minHeight: 132, padding: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[2], backgroundColor: theme.colors.light.surface },
  selectedOptionCard: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.orange[50] },
  optionIcon: { width: 38, height: 38, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.orange[50] },
  selectedOptionIcon: { backgroundColor: theme.colors.light.accent },
  optionTitle: { color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  optionSubtitle: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 17, fontWeight: "600" },
  durationControl: { marginLeft: 38, padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[4], backgroundColor: theme.colors.light.surface },
  controlTitle: { color: theme.colors.light.gray[900], fontSize: 16, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[5] },
  stepperButton: { width: 44, height: 44, borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.gray[50] },
  dayCount: { minWidth: 92, color: theme.colors.light.gray[900], fontSize: 20, lineHeight: 28, fontWeight: "900", textAlign: "center", fontVariant: ["tabular-nums"] },
  durationPresets: { flexDirection: "row", justifyContent: "center", gap: theme.spacing[2] },
  presetChip: { paddingHorizontal: theme.spacing[3], paddingVertical: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: 999, backgroundColor: theme.colors.light.surface },
  presetText: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 16, fontWeight: "800" },
  selectedChip: { borderColor: theme.colors.light.accent, backgroundColor: theme.colors.light.accent },
  selectedChipText: { color: theme.colors.light.base.white },
  confirmButton: { minHeight: 44, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  confirmButtonText: { color: theme.colors.light.base.white, fontSize: 14, lineHeight: 20, fontWeight: "900" },
  interestControl: { marginLeft: 38, gap: theme.spacing[3] },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing[2] },
  interestChip: { minHeight: 42, paddingHorizontal: theme.spacing[3], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: 999, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.surface },
  interestText: { color: theme.colors.light.gray[700], fontSize: 13, lineHeight: 18, fontWeight: "800" },
  finalControl: { marginLeft: 38, padding: theme.spacing[4], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, gap: theme.spacing[4], backgroundColor: theme.colors.light.surface },
  summaryRows: { gap: theme.spacing[3] },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[3] },
  summaryTextGroup: { flex: 1 },
  summaryLabel: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 15, fontWeight: "800", textTransform: "uppercase" },
  summaryValue: { color: theme.colors.light.gray[900], fontSize: 14, lineHeight: 20, fontWeight: "800" },
  generateButton: { minHeight: 50, borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.accent },
  generateButtonText: { color: theme.colors.light.base.white, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  readyBlock: { gap: theme.spacing[3], alignItems: "center" },
  readyTextGroup: { alignItems: "center", gap: theme.spacing[1] },
  readyTitle: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "900", textAlign: "center" },
  readyDescription: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "center" },
  viewTripButton: { minHeight: 46, alignSelf: "stretch", borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.gray[900] },
  viewTripButtonText: { color: theme.colors.light.base.white, fontSize: 14, lineHeight: 20, fontWeight: "900" },
  composerArea: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[2], paddingBottom: theme.spacing[3], borderTopWidth: 1, borderTopColor: theme.colors.light.gray[200], backgroundColor: theme.colors.light.surface },
  composer: { minHeight: 50, paddingLeft: theme.spacing[4], paddingRight: 5, borderWidth: 1, borderColor: theme.colors.light.gray[300], borderRadius: theme.radius.md, flexDirection: "row", alignItems: "center", gap: theme.spacing[2], backgroundColor: theme.colors.light.surface },
  composerInput: { flex: 1, minHeight: 46, color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "600" },
  sendButton: { width: 40, height: 40, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  disabledButton: { opacity: 0.45 },
  inactiveControl: { opacity: 0.58 },
  selectedBorder: { borderColor: theme.colors.light.accent },
  pressedButton: { opacity: 0.78 },
  detailHeader: { minHeight: 72, paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[3], flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.colors.light.surface },
  detailHeaderTitle: { color: theme.colors.light.gray[900], fontSize: 18, lineHeight: 24, fontWeight: "900" },
  detailHero: { height: 290, position: "relative", backgroundColor: theme.colors.light.gray[100] },
  detailImage: { width: "100%", height: "100%" },
  detailImageOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(12, 17, 29, 0.38)" },
  detailHeroText: { position: "absolute", left: theme.spacing[5], right: theme.spacing[5], bottom: theme.spacing[5], gap: theme.spacing[2] },
  detailName: { color: theme.colors.light.base.white, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  routeText: { flex: 1, color: theme.colors.light.base.white, fontSize: 14, lineHeight: 20, fontWeight: "800" },
  detailBody: { paddingHorizontal: theme.spacing[4], paddingTop: theme.spacing[5], gap: theme.spacing[6] },
  detailSummary: { color: theme.colors.light.gray[600], fontSize: 15, lineHeight: 23, fontWeight: "600" },
  detailStats: { flexDirection: "row", gap: theme.spacing[2] },
  detailStat: { flex: 1, minWidth: 0, minHeight: 62, paddingHorizontal: theme.spacing[2], borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", gap: theme.spacing[1], backgroundColor: theme.colors.light.surface },
  detailStatText: { maxWidth: "100%", color: theme.colors.light.gray[800], fontSize: 11, lineHeight: 15, fontWeight: "800", textAlign: "center" },
  detailSection: { gap: theme.spacing[3] },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: theme.colors.light.gray[900], fontSize: 20, lineHeight: 28, fontWeight: "900" },
  sectionCount: { color: theme.colors.light.gray[500], fontSize: 13, lineHeight: 18, fontWeight: "800" },
  hotelList: { gap: theme.spacing[3], paddingRight: theme.spacing[4] },
  hotelCard: { width: 276, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, backgroundColor: theme.colors.light.surface },
  hotelImage: { width: "100%", height: 132, backgroundColor: theme.colors.light.gray[100] },
  hotelContent: { padding: theme.spacing[3], gap: theme.spacing[2] },
  hotelTitleRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing[2] },
  hotelName: { flex: 1, color: theme.colors.light.gray[900], fontSize: 15, lineHeight: 20, fontWeight: "900" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  hotelRating: { color: theme.colors.light.gray[700], fontSize: 12, lineHeight: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
  hotelAddress: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 17, fontWeight: "600" },
  hotelPrice: { color: theme.colors.light.accent, fontSize: 14, lineHeight: 20, fontWeight: "900" },
  itineraryList: { gap: theme.spacing[6] },
  daySection: { gap: theme.spacing[3] },
  dayHeader: { flexDirection: "row", alignItems: "flex-start", gap: theme.spacing[3] },
  dayBadge: { width: 36, height: 36, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.light.accent },
  dayBadgeText: { color: theme.colors.light.base.white, fontSize: 15, lineHeight: 20, fontWeight: "900", fontVariant: ["tabular-nums"] },
  dayHeaderText: { flex: 1 },
  dayEyebrow: { color: theme.colors.light.accent, fontSize: 11, lineHeight: 15, fontWeight: "900", textTransform: "uppercase" },
  dayTitle: { color: theme.colors.light.gray[900], fontSize: 17, lineHeight: 23, fontWeight: "900" },
  dayBestTime: { color: theme.colors.light.gray[500], fontSize: 12, lineHeight: 17, fontWeight: "700" },
  daySummary: { color: theme.colors.light.gray[600], fontSize: 14, lineHeight: 21, fontWeight: "600" },
  activityList: { gap: theme.spacing[3] },
  activityCard: { minHeight: 132, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.light.gray[200], borderRadius: theme.radius.md, flexDirection: "row", backgroundColor: theme.colors.light.surface },
  activityImage: { width: 104, alignSelf: "stretch", backgroundColor: theme.colors.light.gray[100] },
  activityContent: { flex: 1, minWidth: 0, padding: theme.spacing[3], gap: theme.spacing[1] },
  activityName: { color: theme.colors.light.gray[900], fontSize: 14, lineHeight: 19, fontWeight: "900" },
  activityDetails: { color: theme.colors.light.gray[500], fontSize: 11, lineHeight: 16, fontWeight: "600" },
  activityMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  activityMetaText: { flex: 1, color: theme.colors.light.gray[500], fontSize: 10, lineHeight: 14, fontWeight: "700" },
  activityTags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  metaTag: { maxWidth: "100%", paddingHorizontal: 6, paddingVertical: 3, borderRadius: theme.radius.sm, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: theme.colors.light.gray[100] },
  metaTagText: { flexShrink: 1, color: theme.colors.light.gray[600], fontSize: 9, lineHeight: 12, fontWeight: "800" },
});
