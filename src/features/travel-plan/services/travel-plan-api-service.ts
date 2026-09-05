import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getDestinationImage } from "@/features/travel-plan/travel-plan.data";
import { useUserTravelPlans } from "@/features/travel-plan/travel-plan.store";
import type {
  TravelPlanActivity,
  TravelPlanDay,
  TravelPlanHotel,
  UserTravelPlan,
} from "@/features/travel-plan/travel-plan.types";
import {
  apiPath,
  apiRequest,
  type DataEnvelope,
  type PageEnvelope,
} from "@/lib/api/client";

type TravelPlanStatus = "planning" | "archived";
type TravellerType = "solo" | "couple" | "family" | "friends";
type BudgetType = "cheap" | "balanced" | "premium";

type ApiHotel = {
  name: string;
  address?: string | null;
  imageUrl?: string | null;
  nightlyPriceMinor?: number | null;
  rating?: number | null;
};

type ApiActivity = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bestTime?: string | null;
  ticketPriceMinor?: number | null;
  travelTimeMinutes?: number | null;
};

type ApiDay = { day: number; title?: string | null; activities: ApiActivity[] };

export type TravelPlanSummaryDTO = {
  id: string;
  generationId: string | null;
  name: string;
  status: TravelPlanStatus;
  origin: string;
  destination: string;
  travellerType: TravellerType;
  travellerCount: number;
  budgetType: BudgetType;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  interestIds: string[];
  specialRequirements: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  estimatedCost: { amountMinor: number; currency: string } | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TravelPlanDTO = TravelPlanSummaryDTO & {
  itinerary: { hotels: ApiHotel[]; days: ApiDay[] };
};

export type TravelPlanCreateInput = {
  name: string;
  origin: string;
  destination: string;
  travellerType: TravellerType;
  travellerCount: number;
  budgetType: BudgetType;
  durationDays: number;
  startDate: string | null;
  endDate: string | null;
  interestIds: string[];
  specialRequirements?: string | null;
  summary?: string | null;
  coverImageUrl?: string | null;
  estimatedCostMinor?: number | null;
  currency?: string;
  rating?: number | null;
  itinerary?: { hotels: ApiHotel[]; days: ApiDay[] };
};

export const travelPlansApi = {
  list: (status?: TravelPlanStatus, signal?: AbortSignal) =>
    apiRequest<PageEnvelope<TravelPlanSummaryDTO>>(
      apiPath("/api/me/travel-plans", { status, limit: 50 }),
      { signal },
    ),
  get: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<TravelPlanDTO>>(`/api/me/travel-plans/${id}`, { signal }),
  create: (input: TravelPlanCreateInput) =>
    apiRequest<DataEnvelope<TravelPlanDTO>>("/api/me/travel-plans", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (
    id: string,
    input: Partial<Pick<TravelPlanCreateInput, "name" | "startDate" | "endDate" | "travellerCount">> & {
      status?: TravelPlanStatus;
    },
  ) => apiRequest<DataEnvelope<TravelPlanDTO>>(`/api/me/travel-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }),
  remove: (id: string) => apiRequest<null>(`/api/me/travel-plans/${id}`, { method: "DELETE" }),
};

export const travelPlanQueryKeys = {
  all: ["travel-plans"] as const,
  detail: (id: string) => ["travel-plans", id] as const,
};

export function useSavedTravelPlans() {
  return useQuery({
    queryKey: travelPlanQueryKeys.all,
    queryFn: ({ signal }) => travelPlansApi.list(undefined, signal),
    select: (response) => response.data.map(mapTravelPlanSummary),
  });
}

export function useTravelPlan(id: string | null) {
  return useQuery({
    queryKey: travelPlanQueryKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: ({ signal }) => travelPlansApi.get(id as string, signal),
    select: (response) => mapTravelPlan(response.data),
  });
}

export function useUpdateTravelPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof travelPlansApi.update>[1] }) => travelPlansApi.update(id, input),
    onSuccess: (response) => {
      queryClient.setQueryData(travelPlanQueryKeys.detail(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: travelPlanQueryKeys.all });
    },
  });
}

export function useDeleteTravelPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: travelPlansApi.remove,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: travelPlanQueryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: travelPlanQueryKeys.all });
    },
  });
}

export function useAvailableTravelPlans() {
  const localPlans = useUserTravelPlans();
  const serverQuery = useSavedTravelPlans();
  const ids = new Set(serverQuery.data?.map((plan) => plan.id) ?? []);
  const plans = [
    ...(serverQuery.data ?? []),
    ...localPlans.filter((plan) => !ids.has(plan.id)),
  ];

  return { ...serverQuery, plans };
}

export async function persistGeneratedTravelPlan(plan: UserTravelPlan) {
  const response = await travelPlansApi.create(toCreateInput(plan));
  return mapTravelPlan(response.data);
}

function mapTravelPlanSummary(plan: TravelPlanSummaryDTO): UserTravelPlan {
  return {
    id: plan.id,
    name: plan.name,
    origin: plan.origin,
    destination: plan.destination,
    destinationId: plan.destination,
    traveller: plan.travellerType,
    travellerId: plan.travellerType,
    duration: `${plan.durationDays} days`,
    durationId: String(plan.durationDays),
    budget: plan.budgetType,
    budgetId: plan.budgetType,
    interests: plan.interestIds,
    specialRequirements: plan.specialRequirements ?? undefined,
    startDate: plan.startDate ? formatDate(plan.startDate) : "—",
    endDate: plan.endDate ? formatDate(plan.endDate) : "—",
    rawStartDate: plan.startDate,
    rawEndDate: plan.endDate,
    totalPeople: plan.travellerCount,
    estimatedCost: (plan.estimatedCost?.amountMinor ?? 0) / 100,
    rating: (plan.rating ?? 0).toFixed(1),
    status: plan.status === "planning" ? "planned" : "completed",
    apiStatus: plan.status,
    currency: plan.estimatedCost?.currency ?? "USD",
    image: plan.coverImageUrl ?? getDestinationImage(plan.destination),
    summary: plan.summary ?? "",
    hotels: [],
    days: [],
    createdAt: plan.createdAt,
    isAiGenerated: Boolean(plan.generationId),
  };
}

function mapTravelPlan(plan: TravelPlanDTO): UserTravelPlan {
  return {
    ...mapTravelPlanSummary(plan),
    hotels: plan.itinerary.hotels.map(mapHotel),
    days: plan.itinerary.days.map(mapDay),
  };
}

function mapHotel(hotel: ApiHotel): TravelPlanHotel {
  return {
    hotelName: hotel.name,
    hotelAddress: hotel.address ?? "",
    pricePerNight: hotel.nightlyPriceMinor == null ? "—" : `$${(hotel.nightlyPriceMinor / 100).toFixed(0)}`,
    hotelImageUrl: hotel.imageUrl ?? getDestinationImage(hotel.name),
    geoCoordinates: { latitude: 0, longitude: 0 },
    rating: hotel.rating ?? 0,
    description: "",
  };
}

function mapDay(day: ApiDay): TravelPlanDay {
  return {
    day: day.day,
    title: day.title ?? `Day ${day.day}`,
    summary: "",
    bestTimeToVisitDay: "",
    activities: day.activities.map(mapActivity),
  };
}

function mapActivity(activity: ApiActivity): TravelPlanActivity {
  return {
    placeName: activity.name,
    placeDetails: activity.description ?? "",
    placeImageUrl: activity.imageUrl ?? getDestinationImage(activity.name),
    geoCoordinates: {
      latitude: activity.latitude ?? 0,
      longitude: activity.longitude ?? 0,
    },
    placeAddress: activity.address ?? "",
    ticketPricing: activity.ticketPriceMinor == null ? "—" : `$${(activity.ticketPriceMinor / 100).toFixed(0)}`,
    travelTime: activity.travelTimeMinutes == null ? "—" : `${activity.travelTimeMinutes} min`,
    bestTimeToVisit: activity.bestTime ?? "",
  };
}

function toCreateInput(plan: UserTravelPlan): TravelPlanCreateInput {
  return {
    name: plan.name,
    origin: plan.origin ?? "Unknown",
    destination: plan.destination,
    travellerType: toTravellerType(plan.travellerId),
    travellerCount: plan.totalPeople,
    budgetType: toBudgetType(plan.budgetId),
    durationDays: Number.parseInt(plan.durationId, 10) || plan.days.length || 1,
    startDate: null,
    endDate: null,
    interestIds: plan.interests.length ? plan.interests : ["general"],
    specialRequirements: plan.specialRequirements ?? null,
    summary: plan.summary,
    coverImageUrl: plan.image,
    estimatedCostMinor: Math.round(plan.estimatedCost * 100),
    currency: "USD",
    rating: Number(plan.rating) || null,
    itinerary: {
      hotels: plan.hotels.map((hotel) => ({
        name: hotel.hotelName,
        address: hotel.hotelAddress || null,
        imageUrl: hotel.hotelImageUrl || null,
        nightlyPriceMinor: moneyStringToMinor(hotel.pricePerNight),
        rating: hotel.rating || null,
      })),
      days: plan.days.map((day) => ({
        day: day.day,
        title: day.title || null,
        activities: day.activities.map((activity) => ({
          name: activity.placeName,
          description: activity.placeDetails || null,
          imageUrl: activity.placeImageUrl || null,
          address: activity.placeAddress || null,
          latitude: activity.geoCoordinates.latitude || null,
          longitude: activity.geoCoordinates.longitude || null,
          bestTime: activity.bestTimeToVisit || null,
          ticketPriceMinor: moneyStringToMinor(activity.ticketPricing),
          travelTimeMinutes: Number.parseInt(activity.travelTime, 10) || null,
        })),
      })),
    },
  };
}

function toTravellerType(value: string): TravellerType {
  return value === "couple" || value === "family" || value === "friends" ? value : "solo";
}

function toBudgetType(value: string): BudgetType {
  return value === "balanced" || value === "premium" ? value : "cheap";
}

function moneyStringToMinor(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
