import { useAuth } from "@/features/auth/auth-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";

export type AccountDTO = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

type AccountEnvelope = { account: AccountDTO };

export const profileApi = {
  getMe: (signal?: AbortSignal) => apiRequest<AccountEnvelope>("/api/me", { signal }),
  updateMe: (input: { name?: string; image?: string | null }) =>
    apiRequest<AccountEnvelope>("/api/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};

export function useCurrentAccount() {
  const { session } = useAuth();
  const viewerId = session?.user.id ?? "";
  return useQuery({
    queryKey: ["account", "me", viewerId],
    enabled: Boolean(viewerId),
    queryFn: ({ signal }) => profileApi.getMe(signal),
    select: (response) => response.account,
  });
}

export function useUpdateCurrentAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: (response) => queryClient.setQueryData(["account", "me", response.account.id], response),
  });
}
