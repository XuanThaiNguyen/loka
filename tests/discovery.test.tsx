import { act, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import type { ReactNode } from "react";

import { WhosAround } from "@/features/home/components/whos-around";
import { TravelerProfileScreen } from "@/features/profile/screens/traveler-profile-screen";
import { discoveryApi, eligibleTravelers, type RecentTravelersResponse, type TravelerProfileResponse } from "@/features/discovery/services/discovery-api-service";
import { ApiError, apiRequest } from "@/lib/api/client";

let mockViewerId = "viewer";
let mockAccountId = "real/account";
jest.mock("@/features/auth/auth-provider", () => ({ useAuth: () => ({ session: { user: { id: mockViewerId } } }) }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ id: mockAccountId }),
  useIsFocused: () => true,
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) => {
      const messages: Record<string, string> = {
        "home.whosAround": "Who’s around", "home.viewProfile": "View profile",
        "home.viewTraveler": `View ${values?.name}’s profile`, "common.retry": "Retry",
        "common.back": "Back", "discovery.empty": "No recently shared trips yet.",
        "discovery.unavailable": "Profile unavailable", "profileGallery.loadMore": "Load more photos",
        "profileGallery.viewPhoto": "View photo", "detailGuide.close": "Close",
        "loadingUi.content": "Loading content", "discovery.noPhotos": "No public photos yet.",
      };
      return messages[key] ?? key;
    },
  }),
}));
jest.mock("@/features/profile/components/profile-tabs", () => ({
  ProfileTabs: ({ children }: { children: ReactNode[] }) => <>{children}</>,
}));
jest.mock("@/lib/api/client", () => ({
  ApiError: class extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) { super(message); this.status = status; this.code = code; } },
  apiRequest: jest.fn(),
  apiPath: (path: string, values: Record<string, unknown>) => values.beforeId ? `${path}?beforeId=${values.beforeId}` : path,
}));

const response = (): RecentTravelersResponse => ({
  data: [{
    traveler: { accountId: "real/account", displayName: "Public traveler", avatarUrl: null },
    recentTrip: { id: 42, completedAt: "2026-10-19T00:00:00Z", eligibleUntil: "2026-10-29T00:00:00Z", city: null },
    image: { kind: "placeholder" },
    target: { kind: "traveler-profile", accountId: "real/account" },
  }],
  meta: { evaluatedAt: "2026-10-20T00:00:00Z" },
});
const profile = (hasMore = false): TravelerProfileResponse => ({
  data: {
    traveler: response().data[0].traveler,
    recentTrips: [response().data[0].recentTrip],
    photos: [{ id: "100", image: { kind: "public-photo", photoId: "100", url: "https://example.test/public.jpg", urlExpiresAt: "2099-01-01T00:00:00Z" } }],
  },
  meta: { hasMore, nextCursor: hasMore ? "100" : null },
});
const clients: QueryClient[] = [];
async function mount(element: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
  return client;
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
  jest.mocked(apiRequest).mockReset();
  jest.mocked(router.push).mockClear();
  mockViewerId = "viewer";
  mockAccountId = "real/account";
});

test("Discovery requests the real endpoints, forwards cancellation, and encodes account IDs and cursors", async () => {
  const controller = new AbortController();
  await discoveryApi.recent(controller.signal);
  expect(apiRequest).toHaveBeenLastCalledWith("/api/around-me/recent-travelers", { signal: controller.signal });
  await discoveryApi.profile("real/account", "100", controller.signal);
  expect(apiRequest).toHaveBeenLastCalledWith("/api/travelers/real%2Faccount?beforeId=100", { signal: controller.signal });
});

test("rail shows loading, honest empty data and retry recovery; tapping a result opens its real account ID", async () => {
  let reject!: (error: Error) => void;
  const recent = jest.spyOn(discoveryApi, "recent")
    .mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }))
    .mockResolvedValueOnce({ data: [], meta: response().meta })
    .mockResolvedValue(response());
  const client = await mount(<WhosAround />);
  expect(screen.getByRole("progressbar")).toBeOnTheScreen();
  expect(screen.queryByText("Yungs")).not.toBeOnTheScreen();
  await act(() => reject(new ApiError("Offline", 0, "NETWORK_ERROR")));
  expect(await screen.findByRole("alert")).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("No recently shared trips yet.")).toBeOnTheScreen();
  await act(() => client.invalidateQueries({ queryKey: ["discovery"] }));
  const card = await screen.findByRole("button", { name: "View Public traveler’s profile" });
  await userEvent.setup().press(card);
  expect(router.push).toHaveBeenCalledWith({ pathname: "/traveler/[id]", params: { id: "real/account" } });
  expect(recent).toHaveBeenCalledTimes(3);
});

test("a failed privacy revalidation hides previously visible traveler cards", async () => {
  const recent = jest.spyOn(discoveryApi, "recent").mockResolvedValue(response());
  const client = await mount(<WhosAround />);
  expect(await screen.findByText("Public traveler")).toBeOnTheScreen();
  recent.mockRejectedValue(new ApiError("Unavailable", 500));
  await act(() => client.invalidateQueries({ queryKey: ["discovery"] }));
  expect(await screen.findByRole("alert")).toBeOnTheScreen();
  expect(screen.queryByText("Public traveler")).not.toBeOnTheScreen();
});

test("recommendations expire using server time, exclude the viewer, and deduplicate accounts", () => {
  const data = response();
  data.data.push(data.data[0]);
  expect(eligibleTravelers(data, 1000, 1000, "viewer")).toHaveLength(1);
  expect(eligibleTravelers(data, 1000, 1000, "real/account")).toEqual([]);
  expect(eligibleTravelers(data, 1000, 1000 + 9 * 86400000, "viewer")).toEqual([]);
});

test("a wall loads only public API data, paginates with the cursor and closes its photo preview", async () => {
  const next = profile();
  next.data.photos = [{ id: "99", image: { kind: "placeholder" } }];
  const load = jest.spyOn(discoveryApi, "profile").mockResolvedValueOnce(profile(true)).mockResolvedValue(next);
  await mount(<TravelerProfileScreen />);
  expect(await screen.findByText("Public traveler")).toBeOnTheScreen();
  expect(screen.queryByText("Yungs")).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Load more photos" }));
  await waitFor(() => expect(load).toHaveBeenLastCalledWith("real/account", "100", expect.anything()));
  await waitFor(() => expect(screen.getAllByRole("button", { name: "View photo" })).toHaveLength(2));
  await userEvent.setup().press(screen.getAllByRole("button", { name: "View photo" })[0]);
  expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("button", { name: "Close" })).not.toBeOnTheScreen();
});

test("an opted-out wall hides cached public content and offers safe back navigation", async () => {
  const load = jest.spyOn(discoveryApi, "profile").mockResolvedValue(profile());
  const client = await mount(<TravelerProfileScreen />);
  expect(await screen.findByText("Public traveler")).toBeOnTheScreen();
  load.mockRejectedValue(new ApiError("Private", 404, "TRAVELER_NOT_FOUND"));
  await act(() => client.invalidateQueries({ queryKey: ["discovery"] }));
  expect(await screen.findByText("Profile unavailable")).toBeOnTheScreen();
  expect(screen.queryByText("Public traveler")).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Back" }));
  expect(router.back).toHaveBeenCalled();
});

test("wall network errors have a retry path and recover to an honest empty gallery", async () => {
  const empty = profile();
  empty.data.photos = [];
  jest.spyOn(discoveryApi, "profile").mockRejectedValueOnce(new ApiError("Offline", 0, "NETWORK_ERROR")).mockResolvedValue(empty);
  await mount(<TravelerProfileScreen />);
  expect(await screen.findByRole("alert")).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("No public photos yet.")).toBeOnTheScreen();
});


test("switching viewers does not display cached recommendations from the previous account", async () => {
  const recent = jest.spyOn(discoveryApi, "recent").mockResolvedValueOnce(response());
  const client = await mount(<WhosAround />);
  expect(await screen.findByText("Public traveler")).toBeOnTheScreen();
  recent.mockImplementation(() => new Promise(() => {}));
  mockViewerId = "different-viewer";
  await screen.rerender(<QueryClientProvider client={client}><WhosAround /></QueryClientProvider>);
  expect(screen.queryByText("Public traveler")).not.toBeOnTheScreen();
  expect(screen.getByRole("progressbar")).toBeOnTheScreen();
});
