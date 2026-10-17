import { getDestination, type KnownDestinationId } from "@/features/travel/travel.data";

// Design preview only: these are fictional profiles, not nearby account results.
export const demoTravelers = [
  { id: "yungs", name: "Yungs", country: "Singapore", flag: "🇸🇬", color: "#fff6be", coverId: "bali", destinationIds: ["bali", "singapore", "haLongBay"] },
  { id: "suben", name: "Suben M.", country: "Morocco", flag: "🇲🇦", color: "#d6eef9", coverId: "swissAlps", destinationIds: ["swissAlps", "cappadocia", "santorini"] },
  { id: "max", name: "Max Vessel", country: "Canada", flag: "🇨🇦", color: "#efdafa", coverId: "maldives", destinationIds: ["maldives", "kyoto", "amalfiCoast"] },
] satisfies { id: string; name: string; country: string; flag: string; color: string; coverId: KnownDestinationId; destinationIds: KnownDestinationId[] }[];

export function getDemoTraveler(id: string) {
  const traveler = demoTravelers.find((person) => person.id === id);
  if (!traveler) return undefined;
  return {
    ...traveler,
    cover: getDestination(traveler.coverId)?.image,
    destinations: traveler.destinationIds.map((destinationId) => getDestination(destinationId)).filter((destination) => destination !== undefined),
  };
}
