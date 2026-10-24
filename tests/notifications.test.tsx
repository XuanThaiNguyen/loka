import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance, type i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { router } from 'expo-router';
import type { SharedValue } from 'react-native-reanimated';
import { NotificationsScreen } from '@/features/notifications/screens/notifications-screen';
import { HomeHeader } from '@/features/home/components/home-header';
import { notificationsApi, notificationQueryKey, type TripInvitationNotification } from '@/features/notifications/services/notifications-api-service';
import { tripsApi } from '@/features/trips/services/trips-api-service';
import { resources } from '@/i18n/resources';

let mockViewer: string | null = 'recipient';
let mockFocused = true;
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: mockViewer ? { user: { id: mockViewer, name: 'Jamie', email: 'jamie@example.test' } } : null }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }, useIsFocused: () => mockFocused }));
jest.mock('@/lib/api/client', () => ({ apiRequest: jest.fn(), apiPath: jest.fn() }));
jest.mock('@/features/travel/services/travel-api-service', () => ({ mapDestination: jest.fn() }));
jest.mock('@/features/auth/screens/sign-in-screen', () => ({ SignInScreen: ({ returnTo }: { returnTo: string }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text>{`Sign in then ${returnTo}`}</Text>;
} }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: jest.requireActual('react-native').View, Text: jest.requireActual('react-native').Text, createAnimatedComponent: (component: unknown) => component },
  useAnimatedStyle: () => ({}), interpolateColor: () => '#000000',
}));
const invitation: TripInvitationNotification = {
  id: '11111111-1111-4111-8111-111111111111', invitationId: '11111111-1111-4111-8111-111111111111',
  type: 'trip_invitation', createdAt: '2026-10-24T00:00:00Z', expiresAt: '2099-01-01T00:00:00Z',
  trip: { id: 9, name: 'Weekend in Ninh Binh', startDate: '2026-11-01', endDate: '2026-11-04' },
  invitedBy: { accountId: 'owner', name: 'Alex', image: null },
};
let client: QueryClient;
let language: i18n;
beforeEach(async () => {
  mockViewer = 'recipient'; mockFocused = true;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  language = createInstance();
  await language.init({ resources, lng: 'en', interpolation: { escapeValue: false } });
  jest.spyOn(notificationsApi, 'list').mockResolvedValue({ data: [invitation] });
  jest.spyOn(tripsApi, 'respondToInvitation').mockResolvedValue(null);
});
afterEach(() => { client.clear(); onlineManager.setOnline(true); jest.restoreAllMocks(); jest.clearAllMocks(); });
const tree = (header = false) => <I18nextProvider i18n={language}><QueryClientProvider client={client}>
  {header ? <HomeHeader tintProgress={{ value: 0 } as SharedValue<number>} topInset={0} /> : <NotificationsScreen />}
</QueryClientProvider></I18nextProvider>;
const mount = (header = false) => render(tree(header));

test('Home bell navigates to notifications and reports the real pending count', async () => {
  await mount(true);
  await userEvent.setup().press(await screen.findByRole('button', { name: 'Notifications, 1 pending invitations' }));
  expect(router.push).toHaveBeenCalledWith('/notifications');
  expect(tripsApi.respondToInvitation).not.toHaveBeenCalled();
});

test('Home bell has no fake notification count when the API is empty', async () => {
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await mount(true);
  await waitFor(() => expect(client.getQueryState(notificationQueryKey('recipient'))?.status).toBe('success'));
  expect(await screen.findByRole('button', { name: 'Notifications' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /pending invitations/ })).not.toBeOnTheScreen();
});

test.each(['en', 'vi'] as const)('%s fetches invitation cards without responding and accepts explicitly', async (locale) => {
  await language.changeLanguage(locale);
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  await mount();
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
  expect(screen.getByText(language.t('notifications.from', { name: 'Alex' }))).toBeOnTheScreen();
  expect(tripsApi.respondToInvitation).not.toHaveBeenCalled();
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await userEvent.setup().press(screen.getByRole('button', { name: language.t('notifications.accept') }));
  expect(tripsApi.respondToInvitation).toHaveBeenCalledWith(invitation.invitationId, 'accept');
  expect(await screen.findByText(language.t('notifications.accepted'))).toBeOnTheScreen();
  expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen();
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['trips'] });
  await userEvent.setup().press(screen.getByRole('button', { name: language.t('invitationReview.openTrip') }));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: '9' } });
});

test('Reject maps to decline, dismisses the card, and offers no shared-trip navigation', async () => {
  await mount();
  const reject = await screen.findByRole('button', { name: 'Reject' });
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await userEvent.setup().press(reject);
  expect(tripsApi.respondToInvitation).toHaveBeenCalledWith(invitation.invitationId, 'decline');
  expect(await screen.findByText(language.t('notifications.rejected'))).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Open trip' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeOnTheScreen();
});

test('loading and fetch failure show recovery; retry and safe back work', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(notificationsApi.list).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await mount();
  expect(screen.getByLabelText(language.t('notifications.loading'))).toBeOnTheScreen();
  await act(() => reject(new Error('offline')));
  expect(await screen.findByText(language.t('notifications.loadError'))).toBeOnTheScreen();
  expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Back' }));
  expect(router.replace).toHaveBeenCalledWith('/');
});

test('duplicate responses are disabled; a failed response is reconciled before retry', async () => {
  let reject!: (error: Error) => void;
  jest.mocked(tripsApi.respondToInvitation).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  await mount();
  const user = userEvent.setup();
  await user.press(await screen.findByRole('button', { name: 'Accept' }));
  expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
  await user.press(screen.getByRole('button', { name: 'Accept' }));
  expect(tripsApi.respondToInvitation).toHaveBeenCalledTimes(1);
  await act(() => reject(new Error('network')));
  expect(await screen.findByText(language.t('notifications.responseError'))).toBeOnTheScreen();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled());
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await user.press(screen.getByRole('button', { name: 'Accept' }));
  expect(await screen.findByText(language.t('notifications.accepted'))).toBeOnTheScreen();
});

test('revocation during a response removes a stale card after server refusal', async () => {
  jest.mocked(tripsApi.respondToInvitation).mockRejectedValue(new Error('Invitation not found'));
  await mount();
  const accept = await screen.findByRole('button', { name: 'Accept' });
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await userEvent.setup().press(accept);
  expect(await screen.findByText(language.t('notifications.responseError'))).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeOnTheScreen();
});

test('expired cards do not expose response actions', async () => {
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [{ ...invitation, expiresAt: '2000-01-01T00:00:00Z' }] });
  await mount();
  expect(await screen.findByText(language.t('invitationReview.expired'))).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
});

test('offline loading shows connection feedback instead of an endless spinner', async () => {
  onlineManager.setOnline(false);
  await mount();
  expect(await screen.findByText(language.t('loadingUi.offline'))).toBeOnTheScreen();
  expect(screen.queryByLabelText(language.t('notifications.loading'))).not.toBeOnTheScreen();
  expect(notificationsApi.list).not.toHaveBeenCalled();
  await act(() => onlineManager.setOnline(true));
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
});

test('account switching and sign-out never expose another recipient’s cached notifications', async () => {
  await mount();
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
  mockViewer = 'outsider';
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await screen.rerender(tree());
  expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen();
  expect(await screen.findByText(language.t('notifications.emptyTitle'))).toBeOnTheScreen();
  expect(client.getQueryData(notificationQueryKey('outsider'))).toEqual({ data: [] });
  mockViewer = null;
  await screen.rerender(tree());
  expect(screen.getByText('Sign in then /notifications')).toBeOnTheScreen();
  expect(screen.queryByText(invitation.trip.name)).not.toBeOnTheScreen();
});

test('returning to the screen refetches new invitations', async () => {
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [] });
  await mount();
  expect(await screen.findByText(language.t('notifications.emptyTitle'))).toBeOnTheScreen();
  mockFocused = false;
  await screen.rerender(tree());
  jest.mocked(notificationsApi.list).mockResolvedValue({ data: [invitation] });
  mockFocused = true;
  await screen.rerender(tree());
  expect(await screen.findByText(invitation.trip.name)).toBeOnTheScreen();
});
