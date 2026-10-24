import { act, cleanup, fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text } from "react-native";
import { router } from "expo-router";
import { plannerApi, usePlannerSession } from "@/features/travel-plan/services/planner-api-service";
import { profileApi, useCurrentAccount } from "@/features/profile/services/profile-api-service";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { ProfileTripsPanel } from "@/features/profile/components/profile-trips-panel";
import { tripsApi, useTrips, useTrip, useTripInvitations, type TripDTO } from "@/features/trips/services/trips-api-service";
import mockEn from "@/i18n/locales/en";
let mockViewer = "owner";
jest.mock("@/features/auth/auth-provider", () => ({ useAuth: () => ({ session: { user: { id: mockViewer } } }) }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() }, useIsFocused: () => true }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key.split(".").reduce((v: any, k) => v?.[k], mockEn) ?? key }) }));
jest.mock("@/lib/api/client", () => ({ apiRequest: jest.fn(), apiPath: jest.fn() }));
jest.mock("@/features/travel/services/travel-api-service", () => ({ mapDestination: jest.fn() }));
const trip = (id: number, name: string, accessRole: TripDTO["accessRole"]) => ({ id, name, accessRole, city: null } as TripDTO);
const refetch = jest.fn();
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); mockViewer = "owner"; });

test("Owned and Shared tabs separate server roles and navigate to the actual trip", async () => {
 await render(<ProfileTripsPanel query={{ data: [trip(1, "My itinerary", "owner"), trip(2, "Shared itinerary", "viewer")], refetch }} />);
 expect(screen.getByRole("tab", { name: "Owned", selected: true })).toBeOnTheScreen();
 expect(screen.getByText("My itinerary")).toBeOnTheScreen();
 expect(screen.queryByText("Shared itinerary")).not.toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("tab", { name: "Shared" }));
 expect(screen.queryByText("My itinerary")).not.toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("button", { name: "Shared itinerary" }));
 expect(router.push).toHaveBeenCalledWith({ pathname: "/trip/[id]", params: { id: 2 } });
 await userEvent.setup().press(screen.getByRole("tab", { name: "Owned" }));
 expect(screen.getByText("My itinerary")).toBeOnTheScreen();
});

test("Shared shows honest empty state, hides stale private records on failure and retries", async () => {
 await render(<ProfileTripsPanel query={{ data: [], refetch }} />);
 await userEvent.setup().press(screen.getByRole("tab", { name: "Shared" }));
 expect(screen.getByText(mockEn.profileLayout.emptySharedTrips)).toBeOnTheScreen();
 await screen.rerender(<ProfileTripsPanel query={{ data: [trip(2, "Removed membership", "viewer")], isError: true, refetch }} />);
 expect(screen.queryByText("Removed membership")).not.toBeOnTheScreen();
 expect(screen.queryByText(mockEn.profileLayout.emptySharedTrips)).not.toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("button", { name: mockEn.common.retry }));
 expect(refetch).toHaveBeenCalledTimes(1);
 await screen.rerender(<ProfileTripsPanel query={{ data: [], isPending: true, fetchStatus: "fetching", refetch }} />);
 expect(screen.queryByText(mockEn.profileLayout.emptySharedTrips)).not.toBeOnTheScreen();
});

function PrivateData() {
 const plan = usePlannerSession("private-session");
 const account = useCurrentAccount();
 const trips = useTrips(); const detail = useTrip(2); const invites = useTripInvitations();
 return <><Text>{plan.data?.origin ?? "No plan"}</Text><Text>{account.data?.email ?? "No account"}</Text><Text>{trips.data?.[0]?.name ?? "No trips"}</Text><Text>{detail.data?.name ?? "No detail"}</Text><Text>{invites.data?.[0]?.trip.name ?? "No invitations"}</Text></>;
}
test("account switch cannot reuse another user's profile, trips, detail or invitations", async () => {
 jest.spyOn(plannerApi, "getSession").mockResolvedValueOnce({ data: { id: "private-session", origin: "Private plan origin", accessRole: "viewer" } as any }).mockImplementation(() => new Promise(() => {}));
 jest.spyOn(profileApi, "getMe").mockResolvedValueOnce({ account: { id: "owner", name: "Owner", email: "owner@private.test", image: null } }).mockImplementation(() => new Promise(() => {}));
 jest.spyOn(tripsApi, "list").mockResolvedValueOnce({ data: [trip(2, "Private list", "viewer")] }).mockImplementation(() => new Promise(() => {}));
 jest.spyOn(tripsApi, "get").mockResolvedValueOnce({ data: { ...trip(2, "Private detail", "viewer"), owner: {}, companions: [], invitations: [], stops: [], plannerSessionId: null } as any }).mockImplementation(() => new Promise(() => {}));
 jest.spyOn(tripsApi, "listInvitations").mockResolvedValueOnce({ data: [{ id: "invite", trip: { name: "Private invitation" } } as any] }).mockImplementation(() => new Promise(() => {}));
 const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
 const tree = () => <QueryClientProvider client={client}><PrivateData /></QueryClientProvider>;
 await render(tree());
 expect(await screen.findByText("Private invitation")).toBeOnTheScreen();
 expect(screen.getByText("Private detail")).toBeOnTheScreen();
 expect(screen.getByText("Private plan origin")).toBeOnTheScreen();
 expect(screen.getByText("owner@private.test")).toBeOnTheScreen();
 mockViewer = "outsider";
 await screen.rerender(tree());
 expect(screen.queryByText("Private plan origin")).not.toBeOnTheScreen();
 expect(screen.queryByText("owner@private.test")).not.toBeOnTheScreen();
 expect(screen.queryByText("Private list")).not.toBeOnTheScreen();
 expect(screen.queryByText("Private detail")).not.toBeOnTheScreen();
 expect(screen.queryByText("Private invitation")).not.toBeOnTheScreen();
 await cleanup();
 await act(() => client.clear());
});


test("profile Trips, Photos and Saved tabs expose only the selected page and allow returning", async () => {
 const { root } = await render(<ProfileTabs><Text>Eligible visits</Text><Text>Public photos</Text><Text>Saved panel</Text></ProfileTabs>);
 await fireEvent(root!, "layout", { nativeEvent: { layout: { width: 390 } } });
 expect(screen.getByText("Eligible visits")).toBeOnTheScreen();
 expect(screen.queryByText("Public photos")).not.toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("tab", { name: mockEn.profileLayout.photos }));
 expect(screen.getByText("Public photos")).toBeOnTheScreen();
 expect(screen.queryByText("Eligible visits")).not.toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("tab", { name: mockEn.profileLayout.saved }));
 expect(screen.getByText("Saved panel")).toBeOnTheScreen();
 await userEvent.setup().press(screen.getByRole("tab", { name: mockEn.profileLayout.trips }));
 expect(screen.getByText("Eligible visits")).toBeOnTheScreen();
});
