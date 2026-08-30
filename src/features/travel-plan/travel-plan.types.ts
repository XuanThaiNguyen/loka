export type TravelPlanOption = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
};

export type PlannerUi =
  | "origin"
  | "destination"
  | "groupSize"
  | "budget"
  | "tripDuration"
  | "interests"
  | "requirements"
  | "final";

export type PlannerAnswers = {
  origin?: string;
  destination?: string;
  travellerId?: string;
  budgetId?: string;
  durationDays?: number;
  interestIds?: string[];
  specialRequirements?: string;
};

export type PlannerTurn = {
  resp: string;
  ui: PlannerUi;
};

export type PlannerChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  ui?: PlannerUi;
};

export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type TravelPlanHotel = {
  hotelName: string;
  hotelAddress: string;
  pricePerNight: string;
  hotelImageUrl: string;
  geoCoordinates: GeoCoordinates;
  rating: number;
  description: string;
};

export type TravelPlanActivity = {
  placeName: string;
  placeDetails: string;
  placeImageUrl: string;
  geoCoordinates: GeoCoordinates;
  placeAddress: string;
  ticketPricing: string;
  travelTime: string;
  bestTimeToVisit: string;
};

export type TravelPlanDay = {
  day: number;
  title: string;
  summary: string;
  bestTimeToVisitDay: string;
  activities: TravelPlanActivity[];
};

export type UserTravelPlan = {
  id: string;
  name: string;
  origin?: string;
  destination: string;
  destinationId: string;
  traveller: string;
  travellerId: string;
  duration: string;
  durationId: string;
  budget: string;
  budgetId: string;
  interests: string[];
  specialRequirements?: string;
  startDate: string;
  endDate: string;
  totalPeople: number;
  estimatedCost: number;
  rating: string;
  status: "planned" | "completed";
  image: string;
  summary: string;
  hotels: TravelPlanHotel[];
  days: TravelPlanDay[];
  createdAt: string;
  model?: string;
  isAiGenerated: boolean;
};
