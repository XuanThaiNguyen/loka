import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  mapDestination,
  type DestinationDTO,
} from "@/features/travel/services/travel-api-service";
import {
  apiPath,
  apiRequest,
  type DataEnvelope,
  type PageEnvelope,
} from "@/lib/api/client";

export type TripStatus = "planning" | "confirmed" | "completed" | "cancelled";
export type BookingStatus = "upcoming" | "confirmed" | "completed" | "cancelled" | "no_show";

export type TripDTO = {
  id: number;
  name: string;
  description: string | null;
  status: TripStatus;
  startDate: string;
  endDate: string;
  accessRole: "owner" | "viewer" | "editor";
  createdAt: string;
  updatedAt: string;
};

export type TripDetailDTO = TripDTO & {
  owner: TripPersonDTO;
  companions: TripPersonDTO[];
  stops: TripStopDTO[];
  invitations: TripInvitationDTO[];
  plannerSessionId: string | null;
};

type TripPersonDTO = {
  membershipId: string | null;
  accountId: string;
  name: string;
  email: string;
  image: string | null;
  role: "owner" | "viewer" | "editor";
};

type TripStopDTO = {
  id: string;
  destinationId: string;
  position: number;
  arrivalDate: string;
  departureDate: string;
  destination: Pick<DestinationDTO, "id" | "title" | "slug" | "coverImageUrl"> & {
    location: { city: string; country: string; latitude?: number; longitude?: number };
  };
};

type TripInvitationDTO = {
  id: string;
  tripId: number;
  status: "pending" | "accepted" | "declined" | "revoked";
  invitee: Pick<TripPersonDTO, "accountId" | "name" | "email" | "image">;
  createdAt: string;
  updatedAt: string;
};

export type IncomingTripInvitationDTO = {
  id: string;
  status: TripInvitationDTO["status"];
  trip: Pick<TripDTO, "id" | "name" | "startDate" | "endDate">;
  invitedBy: Pick<TripPersonDTO, "accountId" | "name" | "email" | "image">;
  createdAt: string;
  updatedAt: string;
};

export type BookingDTO = {
  id: string;
  tripId: number;
  destination: DestinationDTO;
  packageOptionId: string;
  startDate: string;
  endDate: string;
  travellerCount: number;
  total: { amountMinor: number; currency: string };
  status: BookingStatus;
  reminderEnabled: boolean;
  reminderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TripWrite = {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status?: TripStatus;
  stops?: { destinationId: string; arrivalDate: string; departureDate: string }[];
  invitationEmails?: string[];
};

export const tripsApi = {
  list: (status?: TripStatus, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<TripDTO[]>>(apiPath("/api/trips", { status }), { signal }),
  get: (id: number, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<TripDetailDTO>>(`/api/trips/${id}`, { signal }),
  create: (input: TripWrite) =>
    apiRequest<DataEnvelope<TripDetailDTO>>("/api/trips", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: number, input: Partial<Omit<TripWrite, "stops" | "invitationEmails">>) =>
    apiRequest<DataEnvelope<TripDetailDTO>>(`/api/trips/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  replaceStops: (id: number, stops: NonNullable<TripWrite["stops"]>) =>
    apiRequest<DataEnvelope<TripDetailDTO>>(`/api/trips/${id}/stops`, {
      method: "PUT",
      body: JSON.stringify({ stops }),
    }),
  remove: (id: number) => apiRequest<null>(`/api/trips/${id}`, { method: "DELETE" }),
  invite: (id: number, email: string) =>
    apiRequest<DataEnvelope<{ accepted: true }>>(`/api/trips/${id}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  revokeInvitation: (tripId: number, invitationId: string) =>
    apiRequest<null>(`/api/trips/${tripId}/invitations/${invitationId}`, { method: "DELETE" }),
  removeCompanion: (tripId: number, membershipId: string) =>
    apiRequest<null>(`/api/trips/${tripId}/companions/${membershipId}`, { method: "DELETE" }),
  leave: (tripId: number) => apiRequest<null>(`/api/trips/${tripId}/leave`, { method: "POST" }),
  listInvitations: (status?: TripInvitationDTO["status"], signal?: AbortSignal) =>
    apiRequest<DataEnvelope<IncomingTripInvitationDTO[]>>(apiPath("/api/trips/invitations", { status }), { signal }),
  respondToInvitation: (invitationId: string, action: "accept" | "decline") =>
    apiRequest<null>(`/api/trips/invitations/${invitationId}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
};

export const bookingsApi = {
  list: (status?: BookingStatus, signal?: AbortSignal) =>
    apiRequest<PageEnvelope<BookingDTO>>(apiPath("/api/me/bookings", { status, limit: 50 }), { signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiRequest<DataEnvelope<BookingDTO>>(`/api/me/bookings/${id}`, { signal }),
  create: (input: {
    tripId: number;
    destinationId: string;
    packageOptionId: string;
    startDate: string;
    endDate: string;
    travellerCount: number;
  }) => apiRequest<DataEnvelope<BookingDTO>>("/api/me/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  setReminder: (id: string, reminderEnabled: boolean, reminderAt?: string | null) =>
    apiRequest<DataEnvelope<BookingDTO>>(`/api/me/bookings/${id}/reminder`, {
      method: "PATCH",
      body: JSON.stringify({ reminderEnabled, reminderAt }),
    }),
  cancel: (id: string) =>
    apiRequest<DataEnvelope<BookingDTO>>(`/api/me/bookings/${id}/cancel`, { method: "POST" }),
};

export const tripQueryKeys = {
  trips: ["trips"] as const,
  trip: (id: number) => ["trips", id] as const,
  invitations: ["trips", "invitations"] as const,
  bookings: ["bookings"] as const,
  booking: (id: string) => ["bookings", id] as const,
};

export function useTrips() {
  return useQuery({
    queryKey: tripQueryKeys.trips,
    queryFn: ({ signal }) => tripsApi.list(undefined, signal),
    select: (response) => response.data,
  });
}

export function useTrip(id: number | null) {
  return useQuery({
    queryKey: tripQueryKeys.trip(id ?? 0),
    enabled: id !== null && id > 0,
    queryFn: ({ signal }) => tripsApi.get(id as number, signal),
    select: (response) => response.data,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: (response) => {
      queryClient.setQueryData(tripQueryKeys.trip(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
    },
  });
}

export function useTripInvitations() {
  return useQuery({
    queryKey: tripQueryKeys.invitations,
    queryFn: ({ signal }) => tripsApi.listInvitations("pending", signal),
    select: (response) => response.data,
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Omit<TripWrite, "stops" | "invitationEmails">> }) => tripsApi.update(id, input),
    onSuccess: (response) => {
      queryClient.setQueryData(tripQueryKeys.trip(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
    },
  });
}

export function useReplaceTripStops() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stops }: { id: number; stops: NonNullable<TripWrite["stops"]> }) => tripsApi.replaceStops(id, stops),
    onSuccess: (response) => {
      queryClient.setQueryData(tripQueryKeys.trip(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.remove,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: tripQueryKeys.trip(id) });
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.bookings });
    },
  });
}

export function useInviteCompanion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, email }: { tripId: number; email: string }) => tripsApi.invite(tripId, email),
    onSuccess: (_, { tripId }) => void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trip(tripId) }),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, invitationId }: { tripId: number; invitationId: string }) => tripsApi.revokeInvitation(tripId, invitationId),
    onSuccess: (_, { tripId }) => void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trip(tripId) }),
  });
}

export function useRemoveCompanion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, membershipId }: { tripId: number; membershipId: string }) => tripsApi.removeCompanion(tripId, membershipId),
    onSuccess: (_, { tripId }) => void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trip(tripId) }),
  });
}

export function useLeaveTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsApi.leave,
    onSuccess: (_, tripId) => {
      queryClient.removeQueries({ queryKey: tripQueryKeys.trip(tripId) });
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
    },
  });
}

export function useRespondToTripInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId, action }: { invitationId: string; action: "accept" | "decline" }) => tripsApi.respondToInvitation(invitationId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.invitations });
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.trips });
    },
  });
}

export function useBookings() {
  return useQuery({
    queryKey: tripQueryKeys.bookings,
    queryFn: ({ signal }) => bookingsApi.list(undefined, signal),
    select: (response) => response.data.map((booking) => ({
      ...booking,
      destinationView: mapDestination(booking.destination),
    })),
  });
}

export function useBooking(id: string | null) {
  return useQuery({
    queryKey: tripQueryKeys.booking(id ?? ""),
    enabled: Boolean(id),
    queryFn: ({ signal }) => bookingsApi.get(id as string, signal),
    select: (response) => response.data,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: (response) => {
      queryClient.setQueryData(tripQueryKeys.booking(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.bookings });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: (response) => {
      queryClient.setQueryData(tripQueryKeys.booking(response.data.id), response);
      void queryClient.invalidateQueries({ queryKey: tripQueryKeys.bookings });
    },
  });
}

export function useBookingReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      bookingsApi.setReminder(id, enabled),
    onSuccess: (response) => {
      queryClient.setQueryData<PageEnvelope<BookingDTO>>(
        tripQueryKeys.bookings,
        (current) => current && ({
          ...current,
          data: current.data.map((booking) =>
            booking.id === response.data.id ? response.data : booking,
          ),
        }),
      );
    },
  });
}
