import { act, cleanup, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert } from "react-native";
import { router } from "expo-router";
import { TripsScreen } from "@/features/trips/screens/trips-screen";
import { tripsApi, bookingsApi, type IncomingTripInvitationDTO, type TripDTO } from "@/features/trips/services/trips-api-service";
import mockEn from "@/i18n/locales/en";
jest.mock("@/features/auth/auth-provider", () => ({ useAuth: () => ({ session: { user: { id: "recipient" } } }) }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() }, useIsFocused: () => true, useFocusEffect: () => {} }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key.split(".").reduce((v: any, k) => v?.[k], mockEn) ?? key }) }));
jest.mock("@/lib/api/client", () => ({ apiRequest: jest.fn(), apiPath: jest.fn() }));
jest.mock("@/features/travel/services/travel-api-service", () => ({ mapDestination: jest.fn() }));
jest.mock("@/features/travel-plan/services/travel-plan-api-service", () => ({ useSavedTravelPlans: () => ({ data: [], refetch: jest.fn() }) }));
jest.mock("@/features/travel-plan/components/recent-trip-card", () => ({ RecentTripCard: () => null }));
jest.mock("@/features/trips/components/trip-card", () => ({ TripCard: () => null }));
jest.mock("@/components/ui/journey-header", () => ({ JourneyHeader: () => null }));
jest.mock("@/hooks/use-tab-bottom-padding", () => ({ useTabBottomPadding: () => 0 }));
const invitation = { id: "invitation-1", status: "pending", trip: { id: 2, name: "Together in Da Nang", startDate: "2026-11-01", endDate: "2026-11-04" }, invitedBy: { name: "Owner" } } as IncomingTripInvitationDTO;
let client: QueryClient;
beforeEach(() => {
 jest.spyOn(Alert, "alert").mockImplementation(() => {});
 jest.spyOn(bookingsApi, "list").mockResolvedValue({ data: [], meta: { hasMore: false, nextCursor: null } });
 jest.spyOn(tripsApi, "list").mockResolvedValue({ data: [] });
 jest.spyOn(tripsApi, "listInvitations").mockResolvedValue({ data: [invitation] });
 // MutationCache.clear() does not cancel detached mutations' five-minute GC timers.
 // This isolated client is explicitly cleared after unmount, so no timed GC is needed.
 client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false, gcTime: Infinity } } });
});
afterEach(async () => { await cleanup(); client.clear(); jest.restoreAllMocks(); jest.clearAllMocks(); });
const mount = () => render(<QueryClientProvider client={client}><TripsScreen /></QueryClientProvider>);

test("recipient acceptance disables duplicate taps, reports failure, retries, then exposes shared trip navigation", async () => {
 let reject!: (error: Error) => void;
 const respond = jest.spyOn(tripsApi, "respondToInvitation").mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; })).mockResolvedValue(null);
 await mount();
 await userEvent.setup().press(await screen.findByRole("button", { name: "Accept" }));
 expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
 await act(() => reject(new Error("Connection failed")));
 await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(mockEn.tripDetail.error, "Connection failed"));
 expect(screen.getByText(invitation.trip.name)).toBeOnTheScreen();
 await waitFor(() => expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled());
 jest.mocked(tripsApi.listInvitations).mockResolvedValue({ data: [] });
 jest.mocked(tripsApi.list).mockResolvedValue({ data: [{ ...invitation.trip, accessRole: "viewer", status: "planning", city: null } as TripDTO] });
 await userEvent.setup().press(screen.getByRole("button", { name: "Accept" }));
 expect(await screen.findByRole("button", { name: invitation.trip.name })).toBeOnTheScreen();
 expect(screen.queryByRole("button", { name: "Accept" })).not.toBeOnTheScreen();
 expect(respond).toHaveBeenLastCalledWith("invitation-1", "accept");
 await userEvent.setup().press(screen.getByRole("button", { name: invitation.trip.name }));
 expect(router.push).toHaveBeenCalledWith({ pathname: "/trip/[id]", params: { id: "2" } });
});

test("declining removes the invitation without adding a shared trip", async () => {
 const respond = jest.spyOn(tripsApi, "respondToInvitation").mockResolvedValue(null);
 await mount();
 const decline = await screen.findByRole("button", { name: "Decline" });
 jest.mocked(tripsApi.listInvitations).mockResolvedValue({ data: [] });
 await userEvent.setup().press(decline);
 await waitFor(() => expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen());
 expect(respond).toHaveBeenCalledWith("invitation-1", "decline");
 expect(screen.queryByRole("button", { name: invitation.trip.name })).not.toBeOnTheScreen();
});
