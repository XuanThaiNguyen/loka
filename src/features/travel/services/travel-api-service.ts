import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "react-i18next";
import type { TravelCity } from "@/features/travel/city.data";
import type { Destination, TravelCollection } from "@/features/travel/travel.data";
import {
  apiPath,
  apiRequest,
  type DataEnvelope,
  type PageEnvelope,
} from "@/lib/api/client";

export type CatalogCategory = "adventure" | "beach" | "culture" | "city" | "food";

export type DestinationDTO = {
  editorialSections?: import("../city-guide").CityGuideSection[];
  contentUpdatedAt?: string;
  sources?: { label: string; url: string; checkedOn: string }[];
  contentLocale?: "en" | "vi";
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
  fromPrice?: { amountMinor: number; currency: string; unit: "person" } | null;
  pricingTiers?: {
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
  hasPublishedContent?: boolean;
  contentUpdatedAt?: string;
  sources?: { label: string; url: string; checkedOn: string }[];
  contentLocale?: "en" | "vi";
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

type CityDetailDTO = CityDTO & { destinations: DestinationDTO[]; guide?: import("../city-guide").CityGuide | null };

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
  const { i18n } = useTranslation();
  const search = q.trim();
  return useQuery({
    queryKey: [...travelQueryKeys.citySuggestions(search), i18n.language],
    queryFn: ({ signal }) => catalogApi.listCities({ q: search || undefined, limit: 12 }, signal),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDestinationSuggestions() {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: [...travelQueryKeys.suggestions, i18n.language],
    queryFn: ({ signal }) => catalogApi.listDestinations({ limit: 12 }, signal),
    select: (response) => response.data.map(mapDestination),
  });
}

/** Independent queries keep a failed/empty collection from suppressing cities or recommendations. */
export function useHomeCatalog() {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith("vi") ? "vi" : "en";
  const citiesQuery = useQuery({
    queryKey: [...travelQueryKeys.home, "cities", locale],
    queryFn: ({ signal }) => catalogApi.listCities({ featured: true }, signal),
    // Home promotes published editorial guides. Legacy cities remain available in Search/admin.
    select: (response) => response.data.filter((city) => city.hasPublishedContent === true).map(mapCity),
  });
  const recommendedQuery = useQuery({
    queryKey: [...travelQueryKeys.home, "recommended", locale],
    queryFn: ({ signal }) => catalogApi.listDestinations({ sort: "recommended", limit: 12 }, signal),
    select: (response) => response.data.map(mapDestination),
  });
  const collectionsQuery = useQuery({
    queryKey: [...travelQueryKeys.home, "collections", locale],
    queryFn: ({ signal }) => catalogApi.listCollections(signal),
    select: (response) => response.data,
  });
  return { citiesQuery, recommendedQuery, collectionsQuery };
}

export function useCity(id: string | undefined) {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: [...travelQueryKeys.city(id ?? ""), i18n.language],
    enabled: Boolean(id && isUuid(id)),
    queryFn: ({ signal }) => catalogApi.getCity(id as string, signal),
    select: (response) => mapCity(response.data),
  });

  return { ...query, city: query.data ?? null };
}

export function useCityDestinations(id: string | undefined) {
  const { i18n } = useTranslation();
  return useInfiniteQuery({
    queryKey: ["catalog", "city", id, "destinations", i18n.language],
    enabled: Boolean(id && isUuid(id)),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) => catalogApi.listDestinations({ cityId: id, limit: 50, cursor: pageParam }, signal),
    getNextPageParam: (page) => page.meta.hasMore ? page.meta.nextCursor ?? undefined : undefined,
  });
}

export function useCollection(slug: string | undefined) {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: [...travelQueryKeys.collection(slug ?? ""), i18n.language],
    enabled: Boolean(slug),
    queryFn: async ({ signal }) => mapCollectionPage(await catalogApi.getCollectionDestinations(slug as string, signal)),
  });
  return { ...query, collection: query.data ?? null, items: query.data?.items ?? [] };
}

export function useDestination(id: string | undefined) {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: [...travelQueryKeys.destination(id ?? ""), i18n.language],
    enabled: Boolean(id && isUuid(id)),
    queryFn: ({ signal }) => catalogApi.getDestination(id as string, signal),
    select: (response) => mapDestination(response.data),
  });

  return { ...query, destination: query.data ?? null };
}

export function useFavorites() {
  const { i18n } = useTranslation();
  const query = useQuery({
    queryKey: [...travelQueryKeys.favorites, i18n.language],
    queryFn: ({ signal }) => favoritesApi.list(signal),
    select: (response) => response.data.map(mapDestination),
  });
  return { ...query, favorites: query.data ?? [] };
}

export function useFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ destinationId, favorite }: { destinationId: string; favorite: boolean }) => {
      if (!isUuid(destinationId)) return Promise.reject(new Error("Invalid destination"));
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
    sources: dto.sources,
    contentLocale: dto.contentLocale,
    editorialSections: dto.editorialSections,
    contentUpdatedAt: dto.contentUpdatedAt,
    visitors: formatCount(dto.visitorCount),
    visitorCount: dto.visitorCount,
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
    sources: dto.sources,
    contentLocale: dto.contentLocale,
    contentGuide: "guide" in dto ? dto.guide ?? null : null,
    country: dto.country,
    description: dto.description ?? undefined,
    isFeatured: dto.isFeatured,
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(value);
}
