import { env } from "@/config/env";

import {
  budgetOptions,
  getBudgetOption,
  getDestinationImage,
  getTravellerOption,
  interestOptions,
} from "./travel-plan.data";
import type {
  PlannerAnswers,
  PlannerTurn,
  PlannerUi,
  TravelPlanActivity,
  TravelPlanDay,
  TravelPlanHotel,
  UserTravelPlan,
} from "./travel-plan.types";

type Translate = (key: string, options?: Record<string, unknown>) => string;

type RequestPlannerTurnInput = {
  answers: PlannerAnswers;
  expectedUi: PlannerUi;
  language: string;
  t: Translate;
};

type GenerateTravelPlanInput = {
  answers: Required<PlannerAnswers>;
  language: string;
  t: Translate;
};

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type RawCoordinates = {
  latitude?: number;
  longitude?: number;
};

type RawHotel = {
  hotel_name?: string;
  hotel_address?: string;
  price_per_night?: string;
  hotel_image_url?: string;
  geo_coordinates?: RawCoordinates;
  rating?: number;
  description?: string;
};

type RawActivity = {
  place_name?: string;
  place_details?: string;
  place_image_url?: string;
  geo_coordinates?: RawCoordinates;
  place_address?: string;
  ticket_pricing?: string;
  time_travel_each_location?: string;
  best_time_to_visit?: string;
};

type RawItineraryDay = {
  day?: number;
  day_plan?: string;
  best_time_to_visit_day?: string;
  activities?: RawActivity[];
};

type RawGeneratedPlan = {
  trip_plan?: {
    destination?: string;
    duration?: string;
    origin?: string;
    budget?: string;
    group_size?: string;
    hotels?: RawHotel[];
    itinerary?: RawItineraryDay[];
  };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 180000;

export const TRIP_PLANNER_PROMPT = `You are an AI Trip Planner Agent. Help the user plan a trip by asking exactly one relevant question at a time. Ask only for these details, in this order: 1) starting location, 2) destination city and country, 3) group size (solo, couple, family, friends), 4) budget (low, medium, high), 5) trip duration in days, 6) travel interests, 7) special requirements. Never ask multiple questions or unrelated questions. If an answer is missing or unclear, politely request clarification. Keep the tone conversational. Return strict JSON only with this schema: {"resp":"question text","ui":"origin|destination|groupSize|budget|tripDuration|interests|requirements|final"}. The ui value must identify the single generative UI control that should be displayed next. Use final only when all details are collected.`;

export const LAST_TRIP_PROMPT = `Generate a realistic travel plan from the supplied details. Include hotel options and a day-by-day itinerary. Every hotel must include hotel_name, hotel_address, price_per_night, hotel_image_url, geo_coordinates with numeric latitude and longitude, rating, and description. Every activity must include place_name, place_details, place_image_url, geo_coordinates with numeric latitude and longitude, place_address, ticket_pricing, time_travel_each_location, and best_time_to_visit. Return strict minified JSON only, without markdown or commentary, using this schema: {"trip_plan":{"destination":"string","duration":"string","origin":"string","budget":"string","group_size":"string","hotels":[{"hotel_name":"string","hotel_address":"string","price_per_night":"string","hotel_image_url":"string","geo_coordinates":{"latitude":0,"longitude":0},"rating":0,"description":"string"}],"itinerary":[{"day":1,"day_plan":"string","best_time_to_visit_day":"string","activities":[{"place_name":"string","place_details":"string","place_image_url":"string","geo_coordinates":{"latitude":0,"longitude":0},"place_address":"string","ticket_pricing":"string","time_travel_each_location":"string","best_time_to_visit":"string"}]}]}}`;

export async function requestPlannerTurn({
  answers,
  expectedUi,
  language,
  t,
}: RequestPlannerTurnInput): Promise<PlannerTurn> {
  const fallback = getFallbackTurn(expectedUi, answers, t);

  if (!env.openRouterApiKey) return fallback;

  try {
    const raw = await callOpenRouter(
      false,
      JSON.stringify({
        language,
        collectedDetails: answers,
        nextRequiredUi: expectedUi,
        instruction:
          "Ask only the question for nextRequiredUi. Keep the response short and return strict JSON.",
      }),
      420,
    );
    const parsed = parseJson(raw) as Partial<PlannerTurn>;

    return {
      resp: typeof parsed.resp === "string" && parsed.resp.trim() ? parsed.resp.trim() : fallback.resp,
      ui: parsed.ui === expectedUi ? parsed.ui : expectedUi,
    };
  } catch {
    return fallback;
  }
}

export async function generateTravelPlan({
  answers,
  language,
  t,
}: GenerateTravelPlanInput): Promise<UserTravelPlan> {
  const basePlan = buildBasePlan(answers, t);

  if (!env.openRouterApiKey) return buildFallbackPlan(basePlan, answers, t);

  try {
    const raw = await callOpenRouter(
      true,
      JSON.stringify({ language, tripDetails: answers }),
      5200,
    );
    const generated = (parseJson(raw) as RawGeneratedPlan).trip_plan;

    if (!generated) throw new Error("OpenRouter returned no trip_plan object");

    const fallback = buildFallbackPlan(basePlan, answers, t);
    const hotels = normalizeHotels(generated.hotels, fallback.hotels);
    const days = normalizeDays(generated.itinerary, fallback.days, answers.durationDays);

    return {
      ...basePlan,
      origin: generated.origin?.trim() || basePlan.origin,
      destination: generated.destination?.trim() || basePlan.destination,
      duration: generated.duration?.trim() || basePlan.duration,
      budget: generated.budget?.trim() || basePlan.budget,
      hotels,
      days,
      image: days[0]?.activities[0]?.placeImageUrl || hotels[0]?.hotelImageUrl || basePlan.image,
      model: env.openRouterModel,
      isAiGenerated: true,
    };
  } catch {
    return buildFallbackPlan(basePlan, answers, t);
  }
}

async function callOpenRouter(
  isLast: boolean,
  userContent: string,
  maxCompletionTokens: number,
) {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: isLast ? LAST_TRIP_PROMPT : TRIP_PLANNER_PROMPT,
    },
    { role: "user", content: userContent },
  ];
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.openRouterModel,
      messages,
      temperature: 0.55,
      max_completion_tokens: maxCompletionTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenRouter HTTP ${response.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content.trim();
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned);
}

function getFallbackTurn(
  expectedUi: PlannerUi,
  answers: PlannerAnswers,
  t: Translate,
): PlannerTurn {
  return {
    resp: t(`travelPlan.chat.questions.${expectedUi}`, {
      destination: answers.destination || "",
      days: answers.durationDays || 0,
    }),
    ui: expectedUi,
  };
}

function buildBasePlan(answers: Required<PlannerAnswers>, t: Translate): UserTravelPlan {
  const traveller = getTravellerOption(answers.travellerId);
  const budget = getBudgetOption(answers.budgetId);
  const interests = answers.interestIds.map((id) => {
    const option = interestOptions.find((item) => item.id === id);
    return option ? t(option.titleKey) : id;
  });

  return {
    id: `trip-${Date.now()}`,
    name: t("travelPlan.generated.defaultName", { destination: answers.destination }),
    origin: answers.origin,
    destination: answers.destination,
    destinationId: "custom",
    traveller: t(traveller.titleKey),
    travellerId: traveller.id,
    duration: t("travelPlan.chat.answer.days", { count: answers.durationDays }),
    durationId: `${answers.durationDays}Days`,
    budget: t(budget.titleKey),
    budgetId: budget.id,
    interests,
    specialRequirements: answers.specialRequirements,
    startDate: t("travelPlan.generated.startDate"),
    endDate: t("travelPlan.generated.endDate"),
    totalPeople: traveller.people,
    estimatedCost: estimateBudget(budget.id, traveller.people, answers.durationDays),
    rating: "4.8",
    status: "planned",
    image: getDestinationImage(answers.destination),
    summary: t("travelPlan.generated.fallbackSummary", { destination: answers.destination }),
    hotels: [],
    days: [],
    createdAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

function normalizeHotels(hotels: RawHotel[] | undefined, fallback: TravelPlanHotel[]) {
  if (!Array.isArray(hotels) || hotels.length === 0) return fallback;

  return hotels.slice(0, 5).map((hotel, index) => ({
    hotelName: String(hotel.hotel_name || fallback[index % fallback.length].hotelName),
    hotelAddress: String(hotel.hotel_address || fallback[index % fallback.length].hotelAddress),
    pricePerNight: String(hotel.price_per_night || fallback[index % fallback.length].pricePerNight),
    hotelImageUrl: String(hotel.hotel_image_url || fallback[index % fallback.length].hotelImageUrl),
    geoCoordinates: normalizeCoordinates(hotel.geo_coordinates),
    rating: Number(hotel.rating) || 4.5,
    description: String(hotel.description || fallback[index % fallback.length].description),
  }));
}

function normalizeDays(
  itinerary: RawItineraryDay[] | undefined,
  fallback: TravelPlanDay[],
  durationDays: number,
) {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return fallback;

  return itinerary.slice(0, Math.min(durationDays, 14)).map((day, index) => ({
    day: Number(day.day) || index + 1,
    title: String(day.day_plan || fallback[index % fallback.length].title),
    summary: String(day.day_plan || fallback[index % fallback.length].summary),
    bestTimeToVisitDay: String(
      day.best_time_to_visit_day || fallback[index % fallback.length].bestTimeToVisitDay,
    ),
    activities: normalizeActivities(
      day.activities,
      fallback[index % fallback.length].activities,
    ),
  }));
}

function normalizeActivities(
  activities: RawActivity[] | undefined,
  fallback: TravelPlanActivity[],
) {
  if (!Array.isArray(activities) || activities.length === 0) return fallback;

  return activities.slice(0, 6).map((activity, index) => {
    const defaultActivity = fallback[index % fallback.length];
    return {
      placeName: String(activity.place_name || defaultActivity.placeName),
      placeDetails: String(activity.place_details || defaultActivity.placeDetails),
      placeImageUrl: String(activity.place_image_url || defaultActivity.placeImageUrl),
      geoCoordinates: normalizeCoordinates(activity.geo_coordinates),
      placeAddress: String(activity.place_address || defaultActivity.placeAddress),
      ticketPricing: String(activity.ticket_pricing || defaultActivity.ticketPricing),
      travelTime: String(activity.time_travel_each_location || defaultActivity.travelTime),
      bestTimeToVisit: String(activity.best_time_to_visit || defaultActivity.bestTimeToVisit),
    };
  });
}

function normalizeCoordinates(coordinates?: RawCoordinates) {
  return {
    latitude: Number(coordinates?.latitude) || 0,
    longitude: Number(coordinates?.longitude) || 0,
  };
}

function buildFallbackPlan(
  plan: UserTravelPlan,
  answers: Required<PlannerAnswers>,
  t: Translate,
): UserTravelPlan {
  const hotelImage =
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop";
  const placeImages = [
    plan.image,
    "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000&auto=format&fit=crop",
  ];
  const hotels: TravelPlanHotel[] = [0, 1, 2].map((index) => ({
    hotelName: t("travelPlan.generated.fallbackHotel.name", { index: index + 1 }),
    hotelAddress: t("travelPlan.generated.fallbackHotel.address", {
      destination: answers.destination,
    }),
    pricePerNight: t("travelPlan.generated.fallbackHotel.price", {
      price: answers.budgetId === "premium" ? 220 + index * 45 : answers.budgetId === "balanced" ? 120 + index * 30 : 55 + index * 20,
    }),
    hotelImageUrl: hotelImage,
    geoCoordinates: { latitude: 0, longitude: 0 },
    rating: 4.5 + index * 0.1,
    description: t("travelPlan.generated.fallbackHotel.description"),
  }));

  const days = Array.from({ length: answers.durationDays }, (_, index) => {
    const fallbackIndex = index % 3;
    const activities = [0, 1, 2].map((activityIndex): TravelPlanActivity => ({
      placeName: t(`travelPlan.generated.fallbackDays.${fallbackIndex}.activity${activityIndex + 1}`),
      placeDetails: t("travelPlan.generated.fallbackActivity.details", {
        destination: answers.destination,
      }),
      placeImageUrl: placeImages[activityIndex],
      geoCoordinates: { latitude: 0, longitude: 0 },
      placeAddress: t("travelPlan.generated.fallbackActivity.address", {
        destination: answers.destination,
      }),
      ticketPricing: t("travelPlan.generated.fallbackActivity.ticket"),
      travelTime: t("travelPlan.generated.fallbackActivity.travelTime"),
      bestTimeToVisit: t("travelPlan.generated.fallbackActivity.bestTime"),
    }));

    return {
      day: index + 1,
      title: t(`travelPlan.generated.fallbackDays.${fallbackIndex}.title`),
      summary: t(`travelPlan.generated.fallbackDays.${fallbackIndex}.summary`, {
        destination: answers.destination,
      }),
      bestTimeToVisitDay: t("travelPlan.generated.fallbackActivity.bestTime"),
      activities,
    };
  });

  return { ...plan, hotels, days };
}

function estimateBudget(budgetId: string, people: number, days: number) {
  const option = budgetOptions.find((item) => item.id === budgetId);
  const perPersonPerDay = option?.id === "premium" ? 210 : option?.id === "balanced" ? 130 : 72;
  return perPersonPerDay * people * days;
}
