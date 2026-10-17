import { useTranslation } from "react-i18next";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { catalogApi } from "@/features/travel/services/travel-api-service";

export function useDestinationSearch(query: string, enabled: boolean) {
  const { i18n } = useTranslation();
  const search = query.trim();
  return useInfiniteQuery({
    queryKey: ["catalog", "search", search, i18n.language],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) => catalogApi.listDestinations({
      q: search || undefined,
      sort: "recommended",
      limit: search ? 20 : 6,
      cursor: pageParam,
    }, signal),
    getNextPageParam: (page) => page.meta.hasMore ? page.meta.nextCursor ?? undefined : undefined,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCitySearch(query: string, enabled: boolean) {
  const { i18n } = useTranslation();
  const search = query.trim();
  return useQuery({
    queryKey: ["catalog", "city-search", search, i18n.language],
    enabled,
    queryFn: ({ signal }) => catalogApi.listCities({ q: search || undefined, limit: search ? 50 : 6 }, signal),
    select: (response) => response.data,
    staleTime: 60_000,
    retry: 1,
  });
}
