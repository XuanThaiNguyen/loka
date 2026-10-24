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
export type SocialCounts = { followers: number; following: number } | null;
export type PublicPhoto = { id: string; image: DiscoveryImage; caption: string; createdAt: string };
export type TravelerVisitResponse = { data: { traveler: PublicTraveler; visit: RecentTrip; photos: PublicPhoto[] }; meta: { hasMore: boolean; nextCursor: string | null } };
export type TravelerPhotoResponse = { data: { traveler: PublicTraveler; photo: PublicPhoto } };
export type TravelerProfileResponse = {
  data: {
    traveler: PublicTraveler;
    socialCounts?: SocialCounts;
    publicTripCount?: number;
    photos: { id: string; image: DiscoveryImage }[];
    recentTrips: RecentTrip[];
  };
  meta: { hasMore: boolean; nextCursor: string | null; tripsHasMore?: boolean; nextTripCursor?: number | null };
};

export const discoveryApi = {
  recent: (signal?: AbortSignal) =>
    apiRequest<RecentTravelersResponse>("/api/around-me/recent-travelers", { signal }),
  profile: (accountId: string, beforeId?: string, signal?: AbortSignal, beforeTripId?: number) =>
    apiRequest<TravelerProfileResponse>(
      apiPath(`/api/travelers/${encodeURIComponent(accountId)}`, { beforeId, beforeTripId }),
      { signal },
    ),
  socialCounts: (signal?: AbortSignal) => apiRequest<{ data: SocialCounts }>("/api/me/social-counts", { signal }),
  visit: (accountId: string, tripId: string, beforeId?: string, signal?: AbortSignal) => apiRequest<TravelerVisitResponse>(apiPath(`/api/travelers/${encodeURIComponent(accountId)}/visits/${encodeURIComponent(tripId)}`, { beforeId }), { signal }),
  photo: (accountId: string, photoId: string, signal?: AbortSignal) => apiRequest<TravelerPhotoResponse>(`/api/travelers/${encodeURIComponent(accountId)}/photos/${encodeURIComponent(photoId)}`, { signal }),
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
    initialPageParam: undefined as { photo?: string; trip?: number } | undefined,
    queryFn: ({ pageParam, signal }) => pageParam?.trip === undefined ? discoveryApi.profile(accountId, pageParam?.photo, signal) : discoveryApi.profile(accountId, pageParam.photo, signal, pageParam.trip),
    getNextPageParam: (last) => last.meta.hasMore || last.meta.tripsHasMore ? { photo: last.meta.nextCursor ?? undefined, trip: last.meta.nextTripCursor ?? undefined } : undefined,
    enabled: active,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });
}

export function useSocialCounts() {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  const enabled = useDiscoveryEnabled(Boolean(viewerId));
  return useQuery({ queryKey: ["discovery", "social-counts", viewerId], queryFn: ({ signal }) => discoveryApi.socialCounts(signal), enabled, staleTime: 0, gcTime: 0, refetchInterval: 30_000 });
}

export function useTravelerVisit(accountId: string, tripId: string) {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  const enabled = useDiscoveryEnabled(Boolean(viewerId && accountId && tripId));
  return useInfiniteQuery({ queryKey: ["discovery", "visit", viewerId, accountId, tripId], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => discoveryApi.visit(accountId, tripId, pageParam, signal),
    getNextPageParam: (last) => last.meta.hasMore ? last.meta.nextCursor ?? undefined : undefined,
    enabled, staleTime: 0, gcTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: "always" });
}

export function useTravelerPhoto(accountId: string, photoId: string) {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  const enabled = useDiscoveryEnabled(Boolean(viewerId && accountId && photoId));
  return useQuery({ queryKey: ["discovery", "photo", viewerId, accountId, photoId], queryFn: ({ signal }) => discoveryApi.photo(accountId, photoId, signal),
    enabled, staleTime: 0, gcTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: "always" });
}
