import {
  apiPath,
  apiRequest,
  type DataEnvelope,
  type PageEnvelope,
} from "@/lib/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PlannerSessionStatus = "collecting" | "generating" | "completed";
export type PlannerGenerationStatus = "queued" | "generating" | "completed";

export type PlannerSessionDTO = {
  id: string;
  tripId: number | null;
  accessRole: "owner" | "viewer" | "editor";
  status: PlannerSessionStatus;
  origin: string;
  destination: string;
  travellerType: "solo" | "couple" | "family" | "friends";
  budgetType: "cheap" | "balanced" | "premium";
  durationDays: number;
  interestIds: string[];
  specialRequirements: string | null;
  budgetAmountMinor: number | null;
  currency: string;
  budgetScope: "person" | "group" | null;
  transportPreference: string | null;
  accommodationPreference: string | null;
  pace: "relaxed" | "balanced" | "packed" | null;
  mustDoActivities: string[];
  dietaryAccessibility: string | null;
  avoidances: string | null;
  notes: string | null;
  expiresAt: string | null;
  isDurable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlannerGenerationDTO = {
  id: string;
  sessionId: string;
  status: PlannerGenerationStatus;
  travelPlanId: string | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  session?: PlannerSessionDTO;
};

export type PlannerSessionInput = {
  tripId: number;
  origin: string;
  interestIds: string[];
  budgetAmountMinor?: number | null;
  currency?: string;
  budgetScope?: "person" | "group" | null;
  transportPreference?: string | null;
  accommodationPreference?: string | null;
  pace: "relaxed" | "balanced" | "packed";
  mustDoActivities?: string[];
  dietaryAccessibility?: string | null;
  avoidances?: string | null;
  notes?: string | null;
};

export const plannerApi = {
  listSessions: (status?: PlannerSessionStatus, signal?: AbortSignal) =>
    apiRequest<PageEnvelope<PlannerSessionDTO>>(
      apiPath("/api/travel-planner/sessions", { status, limit: 50 }),
      { signal },
    ),
  getSession: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<PlannerSessionDTO>>(`/api/travel-planner/sessions/${id}`, { signal }),
  createSession: (input: PlannerSessionInput) =>
    apiRequest<DataEnvelope<PlannerSessionDTO>>("/api/travel-planner/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateSession: (id: string, input: Partial<Omit<PlannerSessionInput, "tripId">>) =>
    apiRequest<DataEnvelope<PlannerSessionDTO>>(`/api/travel-planner/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  removeSession: (id: string) =>
    apiRequest<null>(`/api/travel-planner/sessions/${id}`, { method: "DELETE" }),
  startGeneration: (sessionId: string) =>
    apiRequest<DataEnvelope<PlannerGenerationDTO>>(
      `/api/travel-planner/sessions/${sessionId}/generations`,
      { method: "POST" },
    ),
  listGenerations: (
    query: { sessionId?: string; status?: PlannerGenerationStatus; cursor?: string; limit?: number } = {},
    signal?: AbortSignal,
  ) => apiRequest<PageEnvelope<PlannerGenerationDTO>>(
    apiPath("/api/travel-planner/generations", query),
    { signal },
  ),
  getGeneration: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<PlannerGenerationDTO>>(`/api/travel-planner/generations/${id}`, { signal }),
};

export const plannerQueryKeys = {
  sessions: ["planner", "sessions"] as const,
  session: (id: string) => ["planner", "sessions", id] as const,
};

export function usePlannerSession(id: string | null) {
  return useQuery({
    queryKey: plannerQueryKeys.session(id ?? ""),
    enabled: Boolean(id),
    queryFn: ({ signal }) => plannerApi.getSession(id as string, signal),
    select: (response) => response.data,
  });
}

export function usePlannerSessions() {
  return useQuery({
    queryKey: plannerQueryKeys.sessions,
    queryFn: ({ signal }) => plannerApi.listSessions(undefined, signal),
    select: (response) => response.data,
  });
}

export function useCreatePlannerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plannerApi.createSession,
    onSuccess: (response) => {
      queryClient.setQueryData(plannerQueryKeys.session(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: plannerQueryKeys.sessions });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdatePlannerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<PlannerSessionInput, "tripId">> }) => plannerApi.updateSession(id, input),
    onSuccess: (response) => {
      queryClient.setQueryData(plannerQueryKeys.session(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: plannerQueryKeys.sessions });
    },
  });
}

export function useDeletePlannerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plannerApi.removeSession,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: plannerQueryKeys.session(id) });
      void queryClient.invalidateQueries({ queryKey: plannerQueryKeys.sessions });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
