import { useQuery } from "@tanstack/react-query";
import { apiRequest, type DataEnvelope } from "@/lib/api/client";

/** Mirrors GET /api/destinations/:id/visit-profile. Missing knowledge is null. */
export type VisitProfile = {
  destinationId: string;
  timezone: string;
  scheduleCoverage: "unknown" | "partial" | "complete";
  minimumVisitMinutes: number | null;
  maximumVisitMinutes: number | null;
  wheelchairAccess: "unknown" | "accessible" | "partial" | "inaccessible";
  weatherExposure: "unknown" | "indoor" | "outdoor" | "mixed";
  bookingPolicy: "unknown" | "not_required" | "recommended" | "required";
  advanceBookingMinutes: number | null;
  travelAdvice: string | null;
  verificationStatus: "unverified" | "verified";
  sourceName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  verifiedAt: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useVisitProfile(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["catalog", "destination", id, "visit-profile"],
    enabled,
    queryFn: ({ signal }) => apiRequest<DataEnvelope<VisitProfile | null>>(`/api/destinations/${id}/visit-profile`, { signal }),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
