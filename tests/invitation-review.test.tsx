import { act, cleanup, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "expo-router";
import { InvitationScreen } from "@/features/trips/screens/invitation-screen";
import { tripsApi, type InvitationReviewDTO } from "@/features/trips/services/trips-api-service";
import mockEn from "@/i18n/locales/en";
let mockViewer: string | null = "recipient";
const mockId = "11111111-1111-4111-8111-111111111111";
jest.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({ session: mockViewer ? { user: { id: mockViewer } } : null }),
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({ id: mockId }),
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key.split(".").reduce((v: any, k) => v?.[k], mockEn) ?? key,
  }),
}));
jest.mock("@/features/auth/screens/sign-in-screen", () => ({
  SignInScreen: ({ returnTo }: { returnTo: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require("react-native");
    return <Text>{`Sign in then ${returnTo}`}</Text>;
  },
}));
jest.mock("@/lib/api/client", () => ({ apiRequest: jest.fn(), apiPath: jest.fn() }));
jest.mock("@/features/travel/services/travel-api-service", () => ({ mapDestination: jest.fn() }));
const invitation = {
  id: mockId,
  status: "pending",
  trip: { id: 7, name: "Private trip" },
  invitedBy: { name: "Owner" },
  expiresAt: "2030-01-01T00:00:00Z",
} as InvitationReviewDTO;
let client: QueryClient;
beforeEach(() => {
  mockViewer = "recipient";
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  jest.spyOn(tripsApi, "getInvitation").mockResolvedValue({ data: invitation });
  jest.spyOn(tripsApi, "respondToInvitation").mockResolvedValue(null);
});
afterEach(async () => {
  await cleanup();
  client.clear();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
const mount = () =>
  render(
    <QueryClientProvider client={client}>
      <InvitationScreen />
    </QueryClientProvider>,
  );
test("signed-out link retains invitation destination and does not fetch or mutate", async () => {
  mockViewer = null;
  await mount();
  expect(screen.getByText(`Sign in then /invitation/${mockId}`)).toBeOnTheScreen();
  expect(tripsApi.getInvitation).not.toHaveBeenCalled();
  expect(tripsApi.respondToInvitation).not.toHaveBeenCalled();
});
test("GET review never responds; explicit acceptance refreshes status and opens trip", async () => {
  await mount();
  const accept = await screen.findByRole("button", { name: "Accept" });
  expect(tripsApi.respondToInvitation).not.toHaveBeenCalled();
  jest
    .mocked(tripsApi.getInvitation)
    .mockResolvedValue({ data: { ...invitation, status: "accepted" } });
  await userEvent.setup().press(accept);
  expect(tripsApi.respondToInvitation).toHaveBeenCalledWith(mockId, "accept");
  await userEvent.setup().press(await screen.findByRole("button", { name: "Open trip" }));
  expect(router.push).toHaveBeenCalledWith({ pathname: "/trip/[id]", params: { id: "7" } });
});
test.each(["expired", "revoked", "declined"] as const)(
  "%s shows terminal state without response controls",
  async (status) => {
    jest.mocked(tripsApi.getInvitation).mockResolvedValue({ data: { ...invitation, status } });
    await mount();
    expect(await screen.findByText(mockEn.invitationReview[status])).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeOnTheScreen();
    expect(tripsApi.respondToInvitation).not.toHaveBeenCalled();
  },
);
test("loading, private/wrong-account error, retry and safe back do not expose cached details", async () => {
  let reject!: (reason: Error) => void;
  jest.mocked(tripsApi.getInvitation).mockImplementationOnce(
    () =>
      new Promise((_ok, fail) => {
        reject = fail;
      }),
  );
  await mount();
  expect(screen.getByLabelText("Loading invitation")).toBeOnTheScreen();
  await act(() => reject(new Error("Not found")));
  expect(await screen.findByText(mockEn.invitationReview.unavailable)).toBeOnTheScreen();
  expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole("button", { name: "Back" }));
  expect(router.replace).toHaveBeenCalledWith("/");
});
test("decline failure shows feedback, disables duplicate actions, then allows retry", async () => {
  let reject!: (reason: Error) => void;
  jest.mocked(tripsApi.respondToInvitation).mockImplementationOnce(
    () =>
      new Promise((_ok, fail) => {
        reject = fail;
      }),
  );
  await mount();
  await userEvent.setup().press(await screen.findByRole("button", { name: "Decline" }));
  expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
  await act(() => reject(new Error("Network")));
  expect(await screen.findByText(mockEn.invitationReview.responseError)).toBeOnTheScreen();
  await waitFor(() => expect(screen.getByRole("button", { name: "Decline" })).toBeEnabled());
  jest
    .mocked(tripsApi.getInvitation)
    .mockResolvedValue({ data: { ...invitation, status: "declined" } });
  await userEvent.setup().press(screen.getByRole("button", { name: "Decline" }));
  expect(await screen.findByText(mockEn.invitationReview.declined)).toBeOnTheScreen();
});
