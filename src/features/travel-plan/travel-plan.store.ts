import { useSyncExternalStore } from "react";

import type { UserTravelPlan } from "./travel-plan.types";

const initialPlans: UserTravelPlan[] = [
  {
    id: "demo-raja-ampat",
    name: "Raja Ampat Islands",
    destination: "Indonesia",
    destinationId: "indonesia",
    traveller: "2 Person",
    travellerId: "couple",
    duration: "3 days / 2 nights",
    durationId: "threeDays",
    budget: "Cheap",
    budgetId: "cheap",
    interests: ["Relaxing", "Food Tourism"],
    startDate: "20 May, 2024",
    endDate: "22 May, 2024",
    totalPeople: 2,
    estimatedCost: 235,
    rating: "4.9",
    status: "completed",
    image:
      "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=800&auto=format&fit=crop",
    summary:
      "Island viewpoints, gentle snorkeling, and local seafood paced for a relaxed short escape.",
    hotels: [],
    days: [
      {
        day: 1,
        title: "Arrival and island view",
        summary: "Settle in and catch the first sunset over the islands.",
        bestTimeToVisitDay: "Afternoon",
        activities: [
          {
            placeName: "Arrive at Waisai",
            placeDetails: "Transfer from the harbor and settle into the island pace.",
            placeImageUrl:
              "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?q=80&w=800&auto=format&fit=crop",
            geoCoordinates: { latitude: 0, longitude: 0 },
            placeAddress: "Waisai, Raja Ampat",
            ticketPricing: "Free",
            travelTime: "30 minutes",
            bestTimeToVisit: "Afternoon",
          },
        ],
      },
    ],
    createdAt: "2024-05-20T09:00:00.000Z",
    isAiGenerated: false,
  },
];

let userTravelPlans: UserTravelPlan[] = initialPlans;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function addUserTravelPlan(plan: UserTravelPlan) {
  userTravelPlans = [plan, ...userTravelPlans.filter((item) => item.id !== plan.id)];
  emitChange();
}

export function getUserTravelPlans() {
  return userTravelPlans;
}

export function useUserTravelPlans() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getUserTravelPlans,
    getUserTravelPlans,
  );
}
