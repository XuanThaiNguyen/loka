import type { DestinationId } from "@/features/travel/travel.data";

export type CityId = string;

export type TravelCity = {
  id: CityId;
  name?: string;
  country?: string;
  image: string;
  featuredImage: string;
  featuredTitle?: string;
  featuredRating: string;
  featuredPrice: number;
  featuredCurrency?: string;
  gallery: readonly string[];
  relatedDestinationIds: readonly DestinationId[];
  relatedDestinations?: readonly import("@/features/travel/travel.data").Destination[];
  featuredDestination?: import("@/features/travel/travel.data").Destination;
  apiBacked?: boolean;
};

export const travelCities: readonly TravelCity[] = [
  {
    id: "tokyo",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=500&auto=format&fit=crop",
    featuredImage:
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?q=80&w=1200&auto=format&fit=crop",
    featuredRating: "4.9",
    featuredPrice: 18,
    gallery: [
      "https://images.unsplash.com/photo-1542931287-023b922fa89b?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=500&auto=format&fit=crop",
    ],
    relatedDestinationIds: ["kyoto", "sapporoWinter", "singapore"],
  },
  {
    id: "kyoto",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop",
    featuredImage:
      "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?q=80&w=1200&auto=format&fit=crop",
    featuredRating: "4.8",
    featuredPrice: 22,
    gallery: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?q=80&w=500&auto=format&fit=crop",
    ],
    relatedDestinationIds: ["kyoto", "sapporoWinter", "cappadocia"],
  },
  {
    id: "paris",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=500&auto=format&fit=crop",
    featuredImage:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1200&auto=format&fit=crop",
    featuredRating: "4.8",
    featuredPrice: 28,
    gallery: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1431274172761-fca41d930114?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=500&auto=format&fit=crop",
    ],
    relatedDestinationIds: ["parisEscape", "swissAlps", "amalfiCoast"],
  },
  {
    id: "singapore",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=500&auto=format&fit=crop",
    featuredImage:
      "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?q=80&w=1200&auto=format&fit=crop",
    featuredRating: "4.9",
    featuredPrice: 26,
    gallery: [
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1496939376851-89342e90adcd?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?q=80&w=500&auto=format&fit=crop",
    ],
    relatedDestinationIds: ["singapore", "bali", "maldives"],
  },
  {
    id: "seoul",
    image:
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=500&auto=format&fit=crop",
    featuredImage:
      "https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=1200&auto=format&fit=crop",
    featuredRating: "4.7",
    featuredPrice: 20,
    gallery: [
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?q=80&w=500&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525762867061-21c9fb70b15a?q=80&w=500&auto=format&fit=crop",
    ],
    relatedDestinationIds: ["singapore", "kyoto", "newYork"],
  },
] as const;

export function getTravelCity(id: string | undefined) {
  return travelCities.find((city) => city.id === id);
}
