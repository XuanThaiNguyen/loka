export type KnownDestinationId =
  | "haLongBay"
  | "santorini"
  | "bali"
  | "swissAlps"
  | "parisEscape"
  | "newYork"
  | "sapporoWinter"
  | "maldives"
  | "cappadocia"
  | "kyoto"
  | "singapore"
  | "amalfiCoast";

export type DestinationId = string;

export type KnownCollectionSlug =
  | "recommended"
  | "trending"
  | "seasonal"
  | "new";

export type CollectionSlug = string;

export type Destination = {
  id: DestinationId;
  cityId?: string;
  title?: string;
  location?: string;
  description?: string;
  image: string;
  gallery?: readonly string[];
  rating: string;
  price: number;
  currency?: string;
  visitors: string;
  category: "adventure" | "beach" | "culture" | "city" | "food";
  tags?: readonly string[];
  openingHours?: string;
  tips?: string;
  popularityRank?: number;
  ratingCount?: number;
  latitude?: number;
  longitude?: number;
  lastCuratedAt?: string;
  isFavorite?: boolean;
  isFeatured?: boolean;
  apiBacked?: boolean;
};

export type TravelCollection = {
  slug: CollectionSlug;
  title?: string;
  rankingBasis: "personalized" | "recentGrowth" | "seasonal" | "addedAt" | "recommended" | "trending" | "new";
  destinationIds: readonly DestinationId[];
  items?: readonly Destination[];
  apiBacked?: boolean;
};

export const destinations: readonly Destination[] = [
  {
    id: "haLongBay",
    rating: "4.8",
    price: 64.5,
    visitors: "15K",
    category: "adventure",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "santorini",
    rating: "4.9",
    price: 92,
    visitors: "12K",
    category: "beach",
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "bali",
    rating: "4.7",
    price: 58,
    visitors: "18K",
    category: "beach",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "swissAlps",
    rating: "4.9",
    price: 110,
    visitors: "9K",
    category: "adventure",
    image:
      "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "parisEscape",
    rating: "4.8",
    price: 86,
    visitors: "21K",
    category: "city",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "newYork",
    rating: "4.7",
    price: 105,
    visitors: "24K",
    category: "city",
    image:
      "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "sapporoWinter",
    rating: "4.8",
    price: 78,
    visitors: "8K",
    category: "adventure",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "maldives",
    rating: "4.9",
    price: 145,
    visitors: "11K",
    category: "beach",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cappadocia",
    rating: "4.8",
    price: 74,
    visitors: "14K",
    category: "adventure",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "kyoto",
    rating: "4.7",
    price: 69,
    visitors: "7K",
    category: "culture",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "singapore",
    rating: "4.8",
    price: 88,
    visitors: "10K",
    category: "city",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "amalfiCoast",
    rating: "4.9",
    price: 120,
    visitors: "6K",
    category: "beach",
    image:
      "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?q=80&w=1200&auto=format&fit=crop",
  },
] as const;

export const travelCollections: readonly TravelCollection[] = [
  {
    slug: "recommended",
    rankingBasis: "personalized",
    destinationIds: ["haLongBay", "santorini", "bali"],
  },
  {
    slug: "trending",
    rankingBasis: "recentGrowth",
    destinationIds: ["swissAlps", "parisEscape", "newYork"],
  },
  {
    slug: "seasonal",
    rankingBasis: "seasonal",
    destinationIds: ["sapporoWinter", "maldives", "cappadocia"],
  },
  {
    slug: "new",
    rankingBasis: "addedAt",
    destinationIds: ["kyoto", "singapore", "amalfiCoast"],
  },
] as const;

export const galleryImages = [
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=700&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=700&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=700&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=700&auto=format&fit=crop",
] as const;

export function getDestination(id: string | undefined) {
  return destinations.find((destination) => destination.id === id);
}

export function getCollection(slug: string | undefined) {
  return travelCollections.find((collection) => collection.slug === slug);
}

export function getCollectionDestinations(collection: TravelCollection) {
  if (collection.items) return collection.items;

  return collection.destinationIds
    .map((id) => getDestination(id))
    .filter((destination): destination is Destination => Boolean(destination));
}
