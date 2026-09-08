import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { travelCities, type TravelCity } from "@/features/travel/city.data";
import {
  destinations,
  getCollection,
  getCollectionDestinations,
  getDestination,
  travelCollections,
  type Destination,
  type TravelCollection,
} from "@/features/travel/travel.data";
import {
  ApiError,
  apiPath,
  apiRequest,
  type DataEnvelope,
  type PageEnvelope,
} from "@/lib/api/client";
import { minorToMajor } from "@/lib/money";

export type CatalogCategory = "adventure" | "beach" | "culture" | "city" | "food";

export type DestinationDTO = {
  id: string;
  cityId: string | null;
  slug: string;
  title: string;
  location: {
    city: string;
    country: string;
    label: string;
    latitude: number | null;
    longitude: number | null;
  };
  description: string | null;
  category: CatalogCategory;
  tags: readonly string[];
  openingHours: string | null;
  tips: string | null;
  coverImageUrl: string;
  gallery: readonly string[];
  rating: { average: number; count: number };
  visitorCount: number;
  popularityRank: number | null;
  fromPrice: { amountMinor: number; currency: string; unit: "person" };
  pricingTiers: {
    local: {
      currency: string;
      adultMinor: number;
      childSeniorMinor?: number | null;
      notes?: string | null;
    };
    approxUsd?: {
      adultMinor: number;
      childSeniorMinor?: number | null;
    } | null;
  } | null;
  lastCuratedAt: string | null;
  isFeatured: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CityDTO = {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string | null;
  coverImageUrl: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CityListQuery = {
  featured?: boolean;
  q?: string;
  limit?: number;
};

type CityDetailDTO = CityDTO & { destinations: DestinationDTO[] };

export type CollectionDTO = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: "recommended" | "trending" | "seasonal" | "new";
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

type CollectionPage = PageEnvelope<DestinationDTO & { rank: number }, {
  collection: CollectionDTO;
}>;

export const catalogApi = {
  listCities: (query: CityListQuery = {}, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<CityDTO[]>>(apiPath("/api/cities", query), { signal }),
  getCity: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<CityDetailDTO>>(`/api/cities/${id}`, { signal }),
  listDestinations: (
    query: {
      q?: string;
      category?: CatalogCategory;
      cityId?: string;
      tag?: string;
      sort?: "recommended" | "rating" | "price_asc" | "price_desc" | "newest";
      cursor?: string;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) => apiRequest<PageEnvelope<DestinationDTO>>(apiPath("/api/destinations", query), { signal }),
  getDestination: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<DestinationDTO>>(`/api/destinations/${id}`, { signal }),
  listCollections: (signal?: AbortSignal) =>
    apiRequest<DataEnvelope<CollectionDTO[]>>(apiPath("/api/collections", { featured: true }), { signal }),
  getCollectionDestinations: (slug: string, signal?: AbortSignal) =>
    apiRequest<CollectionPage>(apiPath(`/api/collections/${slug}/destinations`, { limit: 50 }), { signal }),
};

export const favoritesApi = {
  list: (signal?: AbortSignal) =>
    apiRequest<DataEnvelope<(DestinationDTO & { favoritedAt: string })[]>>("/api/me/favorites", { signal }),
  save: (destinationId: string) =>
    apiRequest<DataEnvelope<{ destinationId: string; isFavorite: true; favoritedAt: string }>>(
      `/api/me/favorites/${destinationId}`,
      { method: "PUT" },
    ),
  remove: (destinationId: string) =>
    apiRequest<null>(`/api/me/favorites/${destinationId}`, { method: "DELETE" }),
};

export const travelQueryKeys = {
  home: ["catalog", "home"] as const,
  citySuggestions: (q: string) => ["catalog", "city-suggestions", q] as const,
  city: (id: string) => ["catalog", "city", id] as const,
  collection: (slug: string) => ["catalog", "collection", slug] as const,
  destination: (id: string) => ["catalog", "destination", id] as const,
  favorites: ["favorites"] as const,
  suggestions: ["catalog", "destination-suggestions"] as const,
};

export function useCitySuggestions(q = "") {
  const search = q.trim();
  return useQuery({
    queryKey: travelQueryKeys.citySuggestions(search),
    queryFn: ({ signal }) => catalogApi.listCities({ q: search || undefined, limit: 12 }, signal),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDestinationSuggestions() {
  return useQuery({
    queryKey: travelQueryKeys.suggestions,
    queryFn: ({ signal }) => catalogApi.listDestinations({ limit: 12 }, signal),
    select: (response) => response.data.map(mapDestination),
  });
}

export function useHomeCatalog() {
  const query = useQuery({
    queryKey: travelQueryKeys.home,
    queryFn: async ({ signal }) => {
      const [cityResponse, collectionResponse] = await Promise.all([
        catalogApi.listCities({ featured: true }, signal),
        catalogApi.listCollections(signal),
      ]);
      const collections = collectionResponse.data.length
        ? await Promise.all(
            collectionResponse.data.map((collection) =>
              catalogApi.getCollectionDestinations(collection.slug, signal).then(mapCollectionPage),
            ),
          )
        : await Promise.all(
            travelCollections.map((collection) =>
              catalogApi.listDestinations(
                { sort: collectionSort(collection.slug), limit: 3 },
                signal,
              ).then((response) => mapFallbackCollection(collection, response.data)),
            ),
          );

      return {
        cities: cityResponse.data.map(mapCity),
        collections,
      };
    },
  });

  return {
    ...query,
    cities: query.data?.cities.length ? query.data.cities : travelCities,
    collections: query.data?.collections.length ? query.data.collections : travelCollections,
  };
}

export function useCity(id: string | undefined) {
  const fallback = getTravelCityFallback(id);
  const query = useQuery({
    queryKey: travelQueryKeys.city(id ?? ""),
    enabled: Boolean(id && isUuid(id)),
    queryFn: ({ signal }) => catalogApi.getCity(id as string, signal),
    select: (response) => mapCity(response.data),
  });

  const city = query.data ?? fallback;
  const relatedDestinations = city.relatedDestinations ?? city.relatedDestinationIds
    .map((destinationId) => getDestination(destinationId))
    .filter((destination): destination is Destination => Boolean(destination));

  return { ...query, city: { ...city, relatedDestinations } };
}

export function useCollection(slug: string | undefined) {
  const fallbackCollection = getCollection(slug) ?? travelCollections[0];
  const query = useQuery({
    queryKey: travelQueryKeys.collection(slug ?? ""),
    enabled: Boolean(slug),
    queryFn: async ({ signal }) => {
      try {
        return mapCollectionPage(
          await catalogApi.getCollectionDestinations(slug as string, signal),
        );
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        const response = await catalogApi.listDestinations(
          { sort: collectionSort(slug as string), limit: 50 },
          signal,
        );
        return mapFallbackCollection(fallbackCollection, response.data);
      }
    },
  });

  return {
    ...query,
    collection: query.data ?? fallbackCollection,
    items: query.data?.items?.length
      ? query.data.items
      : getCollectionDestinations(fallbackCollection),
  };
}

export function useDestination(id: string | undefined) {
  const fallback = getDestination(id) ?? destinations[0];
  const query = useQuery({
    queryKey: travelQueryKeys.destination(id ?? ""),
    enabled: Boolean(id && isUuid(id)),
    queryFn: ({ signal }) => catalogApi.getDestination(id as string, signal),
    select: (response) => mapDestination(response.data),
  });

  return { ...query, destination: query.data ?? fallback };
}

export function useFavorites() {
  const query = useQuery({
    queryKey: travelQueryKeys.favorites,
    queryFn: ({ signal }) => favoritesApi.list(signal),
    select: (response) => response.data.map(mapDestination),
  });
  const fallbackIds = new Set(["haLongBay", "santorini", "swissAlps", "kyoto", "amalfiCoast"]);
  const fallback = destinations.filter((destination) => fallbackIds.has(destination.id));

  return { ...query, favorites: query.data?.length ? query.data : fallback };
}

export function useFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ destinationId, favorite }: { destinationId: string; favorite: boolean }) => {
      if (!isUuid(destinationId)) return Promise.resolve(null);
      return favorite ? favoritesApi.save(destinationId) : favoritesApi.remove(destinationId);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: travelQueryKeys.favorites }),
        queryClient.invalidateQueries({ queryKey: ["catalog"] }),
      ]);
    },
  });
}

export function mapDestination(dto: DestinationDTO): Destination {
  return {
    id: dto.id,
    cityId: dto.cityId ?? undefined,
    title: dto.title,
    location: dto.location.label,
    description: dto.description ?? "",
    image: dto.coverImageUrl,
    gallery: dto.gallery ?? [],
    rating: dto.rating.average.toFixed(1),
    price: minorToMajor(dto.fromPrice.amountMinor, dto.fromPrice.currency),
    currency: dto.fromPrice.currency,
    visitors: formatCount(dto.visitorCount),
    category: dto.category,
    tags: dto.tags ?? [],
    openingHours: dto.openingHours ?? undefined,
    tips: dto.tips ?? undefined,
    popularityRank: dto.popularityRank ?? undefined,
    ratingCount: dto.rating.count,
    latitude: dto.location.latitude ?? undefined,
    longitude: dto.location.longitude ?? undefined,
    lastCuratedAt: dto.lastCuratedAt ?? undefined,
    isFavorite: dto.isFavorite,
    isFeatured: dto.isFeatured,
    apiBacked: true,
  };
}

function mapCity(dto: CityDTO | CityDetailDTO): TravelCity {
  const related = "destinations" in dto ? dto.destinations.map(mapDestination) : [];
  const featured = related.find((destination) => destination.isFeatured) ?? related[0];
  const gallery = featured?.gallery?.length ? featured.gallery : [dto.coverImageUrl];

  return {
    id: dto.id,
    name: dto.name,
    country: dto.country,
    image: dto.coverImageUrl,
    featuredImage: featured?.image ?? dto.coverImageUrl,
    featuredTitle: featured?.title ?? dto.name,
    featuredRating: featured?.rating ?? "0.0",
    featuredPrice: featured?.price ?? 0,
    featuredCurrency: featured?.currency ?? "USD",
    gallery,
    relatedDestinationIds: related.map((destination) => destination.id),
    relatedDestinations: related,
    featuredDestination: featured,
    apiBacked: true,
  };
}

function mapCollectionPage(page: CollectionPage): TravelCollection {
  return {
    slug: page.meta.collection.slug,
    title: page.meta.collection.title,
    rankingBasis: page.meta.collection.type,
    destinationIds: page.data.map((destination) => destination.id),
    items: page.data.map(mapDestination),
    apiBacked: true,
  };
}

function mapFallbackCollection(
  collection: TravelCollection,
  items: DestinationDTO[],
): TravelCollection {
  const destinations = items.map(mapDestination);
  return {
    ...collection,
    destinationIds: destinations.map((destination) => destination.id),
    items: destinations,
    apiBacked: true,
  };
}

function collectionSort(slug: string) {
  if (slug === "new") return "newest" as const;
  if (slug === "trending") return "rating" as const;
  if (slug === "seasonal") return "recommended" as const;
  return "recommended" as const;
}

function getTravelCityFallback(id: string | undefined) {
  return travelCities.find((city) => city.id === id) ?? travelCities[0];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}
