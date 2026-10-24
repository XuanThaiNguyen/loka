import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router";

import { useAuth } from "@/features/auth/auth-provider";
import { apiRequest, type DataEnvelope } from "@/lib/api/client";

export type TripInvitationNotification = {
  id: string;
  type: "trip_invitation";
  invitationId: string;
  createdAt: string;
  expiresAt: string;
  trip: { id: number; name: string; startDate: string; endDate: string };
  invitedBy: { accountId: string; name: string; image: string | null };
};

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    apiRequest<DataEnvelope<TripInvitationNotification[]>>("/api/notifications", { signal }),
};

// Existing invitation response / trip mutations invalidate this shared trips prefix too.
export const notificationQueryKey = (viewerId: string) => ["trips", "notifications", viewerId] as const;

export function useNotifications() {
  const { session } = useAuth();
  const focused = useIsFocused();
  return useQuery({
    queryKey: notificationQueryKey(session?.user.id ?? ""),
    enabled: Boolean(session) && focused,
    queryFn: ({ signal }) => notificationsApi.list(signal),
    select: (response) => response.data,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: focused ? 30_000 : false,
    refetchOnWindowFocus: "always",
    retry: false,
  });
}
