import type { PlannerUi, TravelPlanOption } from "./travel-plan.types";

export const plannerStepOrder: readonly PlannerUi[] = [
  "origin",
  "destination",
  "groupSize",
  "budget",
  "tripDuration",
  "interests",
  "requirements",
  "final",
];

export const originSuggestionKeys = [
  "travelPlan.chat.suggestions.origins.hoChiMinhCity",
  "travelPlan.chat.suggestions.origins.hanoi",
  "travelPlan.chat.suggestions.origins.daNang",
] as const;

export const destinationSuggestionKeys = [
  "travelPlan.chat.suggestions.destinations.daNang",
  "travelPlan.chat.suggestions.destinations.tokyo",
  "travelPlan.chat.suggestions.destinations.bali",
] as const;

export const requirementSuggestionKeys = [
  "travelPlan.chat.suggestions.requirements.none",
  "travelPlan.chat.suggestions.requirements.children",
  "travelPlan.chat.suggestions.requirements.accessible",
] as const;

export const durationDayOptions = [3, 5, 7] as const;

export const destinationOptions: readonly (TravelPlanOption & {
  image: string;
  locationKey: string;
})[] = [
  {
    id: "indonesia",
    titleKey: "travelPlan.options.destinations.indonesia.title",
    subtitleKey: "travelPlan.options.destinations.indonesia.subtitle",
    locationKey: "travelPlan.options.destinations.indonesia.location",
    icon: "paper-plane-outline",
    image:
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "japan",
    titleKey: "travelPlan.options.destinations.japan.title",
    subtitleKey: "travelPlan.options.destinations.japan.subtitle",
    locationKey: "travelPlan.options.destinations.japan.location",
    icon: "map-outline",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "vietnam",
    titleKey: "travelPlan.options.destinations.vietnam.title",
    subtitleKey: "travelPlan.options.destinations.vietnam.subtitle",
    locationKey: "travelPlan.options.destinations.vietnam.location",
    icon: "leaf-outline",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
  },
] as const;

export const travellerOptions: readonly (TravelPlanOption & {
  people: number;
})[] = [
  {
    id: "solo",
    titleKey: "travelPlan.options.travellers.solo.title",
    subtitleKey: "travelPlan.options.travellers.solo.subtitle",
    icon: "person-outline",
    people: 1,
  },
  {
    id: "couple",
    titleKey: "travelPlan.options.travellers.couple.title",
    subtitleKey: "travelPlan.options.travellers.couple.subtitle",
    icon: "heart-outline",
    people: 2,
  },
  {
    id: "family",
    titleKey: "travelPlan.options.travellers.family.title",
    subtitleKey: "travelPlan.options.travellers.family.subtitle",
    icon: "people-outline",
    people: 4,
  },
  {
    id: "friends",
    titleKey: "travelPlan.options.travellers.friends.title",
    subtitleKey: "travelPlan.options.travellers.friends.subtitle",
    icon: "happy-outline",
    people: 3,
  },
] as const;

export const durationOptions: readonly TravelPlanOption[] = [
  {
    id: "threeDays",
    titleKey: "travelPlan.options.durations.threeDays.title",
    subtitleKey: "travelPlan.options.durations.threeDays.subtitle",
    icon: "calendar-outline",
  },
  {
    id: "fourDays",
    titleKey: "travelPlan.options.durations.fourDays.title",
    subtitleKey: "travelPlan.options.durations.fourDays.subtitle",
    icon: "today-outline",
  },
  {
    id: "oneWeek",
    titleKey: "travelPlan.options.durations.oneWeek.title",
    subtitleKey: "travelPlan.options.durations.oneWeek.subtitle",
    icon: "calendar-number-outline",
  },
] as const;

export const budgetOptions: readonly TravelPlanOption[] = [
  {
    id: "cheap",
    titleKey: "travelPlan.options.budgets.cheap.title",
    subtitleKey: "travelPlan.options.budgets.cheap.subtitle",
    icon: "cash-outline",
  },
  {
    id: "balanced",
    titleKey: "travelPlan.options.budgets.balanced.title",
    subtitleKey: "travelPlan.options.budgets.balanced.subtitle",
    icon: "wallet-outline",
  },
  {
    id: "premium",
    titleKey: "travelPlan.options.budgets.premium.title",
    subtitleKey: "travelPlan.options.budgets.premium.subtitle",
    icon: "diamond-outline",
  },
] as const;

export const interestOptions: readonly TravelPlanOption[] = [
  {
    id: "relaxing",
    titleKey: "travelPlan.options.interests.relaxing.title",
    subtitleKey: "travelPlan.options.interests.relaxing.subtitle",
    icon: "sunny-outline",
  },
  {
    id: "roadTrip",
    titleKey: "travelPlan.options.interests.roadTrip.title",
    subtitleKey: "travelPlan.options.interests.roadTrip.subtitle",
    icon: "car-outline",
  },
  {
    id: "historical",
    titleKey: "travelPlan.options.interests.historical.title",
    subtitleKey: "travelPlan.options.interests.historical.subtitle",
    icon: "business-outline",
  },
  {
    id: "foodTourism",
    titleKey: "travelPlan.options.interests.foodTourism.title",
    subtitleKey: "travelPlan.options.interests.foodTourism.subtitle",
    icon: "restaurant-outline",
  },
  {
    id: "backpacking",
    titleKey: "travelPlan.options.interests.backpacking.title",
    subtitleKey: "travelPlan.options.interests.backpacking.subtitle",
    icon: "trail-sign-outline",
  },
] as const;

export function getDestinationOption(id: string) {
  return destinationOptions.find((option) => option.id === id) ?? destinationOptions[0];
}

export function getTravellerOption(id: string) {
  return travellerOptions.find((option) => option.id === id) ?? travellerOptions[0];
}

export function getDurationOption(id: string) {
  return durationOptions.find((option) => option.id === id) ?? durationOptions[0];
}

export function getBudgetOption(id: string) {
  return budgetOptions.find((option) => option.id === id) ?? budgetOptions[0];
}

export function getDestinationImage(destination: string) {
  const normalized = destination.toLocaleLowerCase();

  if (normalized.includes("japan") || normalized.includes("nhật") || normalized.includes("tokyo")) {
    return destinationOptions[1].image;
  }

  if (normalized.includes("vietnam") || normalized.includes("việt") || normalized.includes("đà nẵng")) {
    return destinationOptions[2].image;
  }

  return destinationOptions[0].image;
}
