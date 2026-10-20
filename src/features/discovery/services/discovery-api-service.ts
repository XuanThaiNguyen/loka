import { useIsFocused } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { useAuth } from "@/features/auth/auth-provider";
import { apiPath, apiRequest } from "@/lib/api/client";

export type DiscoveryImage =
  | { kind: "placeholder" }
  | { kind: "public-photo"; photoId: string; url: string; urlExpiresAt: string };
export type PublicTraveler = { accountId: string; displayName: string; avatarUrl: string | null };
export type RecentTrip = {
  id: number;
  completedAt: string;
  eligibleUntil: string;
  city: { id: string; name: string; country: string } | null;
};
export type RecentTraveler = {
  traveler: PublicTraveler;
  recentTrip: RecentTrip;
  image: DiscoveryImage;
  target: { kind: "traveler-profile"; accountId: string };
};
export type RecentTravelersResponse = { data: RecentTraveler[]; meta: { evaluatedAt: string } };
export type TravelerProfileResponse = {
  data: {
    traveler: PublicTraveler;
    photos: { id: string; image: DiscoveryImage }[];
    recentTrips: RecentTrip[];
  };
  meta: { hasMore: boolean; nextCursor: string | null };
};

export const discoveryApi = {
  recent: (signal?: AbortSignal) =>
    apiRequest<RecentTravelersResponse>("/api/around-me/recent-travelers", { signal }),
  profile: (accountId: string, beforeId?: string, signal?: AbortSignal) =>
    apiRequest<TravelerProfileResponse>(
      apiPath(`/api/travelers/${encodeURIComponent(accountId)}`, { beforeId }),
      { signal },
    ),
};

/** Poll only the visible screen while the app is active. Re-entry revalidates privacy. */
function useDiscoveryEnabled(enabled: boolean) {
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);
  return enabled && focused && foreground;
}

export function eligibleTravelers(response: RecentTravelersResponse | undefined, receivedAt: number, now: number, viewerId: string) {
  if (!response) return [];
  const serverNow = Date.parse(response.meta.evaluatedAt) + Math.max(0, now - receivedAt);
  const seen = new Set([viewerId]);
  return response.data.filter((card) => {
    if (seen.has(card.traveler.accountId) || Date.parse(card.recentTrip.eligibleUntil) <= serverNow) return false;
    seen.add(card.traveler.accountId);
    return true;
  }).slice(0, 6);
}

export function useRecentTravelers(enabled = true) {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  const active = useDiscoveryEnabled(enabled && Boolean(viewerId));
  const query = useQuery({
    queryKey: ["discovery", "recent", viewerId],
    queryFn: ({ signal }) => discoveryApi.recent(signal),
    enabled: active,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active || !query.data) return;
    const serverNow = Date.parse(query.data.meta.evaluatedAt) + Math.max(0, Date.now() - query.dataUpdatedAt);
    const deadlines = query.data.data.map((card) => Date.parse(card.recentTrip.eligibleUntil) - serverNow).filter((delay) => delay > 0);
    const timer = setTimeout(() => setNow(Date.now()), Math.max(1, Math.min(30_000, ...deadlines, Date.now() - now > 1000 ? 1 : 30_000)));
    return () => clearTimeout(timer);
  }, [active, query.data, query.dataUpdatedAt, now]);
  return { ...query, cards: query.isError || !viewerId ? [] : eligibleTravelers(query.data, query.dataUpdatedAt, now, viewerId) };
}

export function useTravelerProfile(accountId: string) {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  const active = useDiscoveryEnabled(Boolean(viewerId && accountId));
  return useInfiniteQuery({
    queryKey: ["discovery", "profile", viewerId, accountId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => discoveryApi.profile(accountId, pageParam, signal),
    getNextPageParam: (last) => last.meta.hasMore ? last.meta.nextCursor ?? undefined : undefined,
    enabled: active,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });
}
