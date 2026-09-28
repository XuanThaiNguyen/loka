import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPath, apiRequest, type PageEnvelope, type DataEnvelope } from "@/lib/api/client";

export type GalleryPhoto = {
  id: string; accountId: string; tripId: number | null; caption: string;
  visibility: "public" | "private"; url: string; urlExpiresAt: string; createdAt: string;
};
export function useGallery(accountId?: string, tripId?: number) {
  return useInfiniteQuery({
    queryKey: ["gallery", accountId, tripId], enabled: Boolean(accountId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) => apiRequest<PageEnvelope<GalleryPhoto>>(apiPath("/api/instagram", { accountId, tripId, beforeId: pageParam }), { signal }),
    getNextPageParam: (page) => page.meta.hasMore ? page.meta.nextCursor ?? undefined : undefined,
    staleTime: 60_000,
    // Download URLs expire after five minutes. Refresh while the gallery is mounted.
    refetchInterval: 240_000,
  });
}
export function useUploadGalleryPhoto() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: FormData) => apiRequest<DataEnvelope<GalleryPhoto>>("/api/instagram", { method: "POST", body }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["gallery"] }),
  });
}
