import { render, screen, userEvent } from '@testing-library/react-native';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { router } from 'expo-router';
import { HomeSheetContent } from '@/features/home/components/home-sheet-content';
import { resources } from '@/i18n/resources';

function successful(data: unknown[] = []) {
  return { data, isPending: false, isFetching: false, isError: false, fetchStatus: 'idle', error: undefined as unknown, refetch: jest.fn() };
}
let mockCatalog = { citiesQuery: successful(), recommendedQuery: successful(), collectionsQuery: successful() };
let mockCollection = { ...successful(), items: [] as { id: string; title: string }[] };
let mockTrips = successful();
let mockPlans = successful();
let mockPlanner = successful();
const mockInvalidate = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));
jest.mock('@gorhom/bottom-sheet', () => ({ BottomSheetScrollView: jest.requireActual('react-native').ScrollView }));
jest.mock('@/features/travel/services/travel-api-service', () => ({ useHomeCatalog: () => mockCatalog, useCollection: () => mockCollection }));
jest.mock('@/features/trips/services/trips-api-service', () => ({ useTrips: () => mockTrips }));
jest.mock('@/features/travel-plan/services/travel-plan-api-service', () => ({ useSavedTravelPlans: () => mockPlans }));
jest.mock('@/features/travel-plan/services/planner-api-service', () => ({ usePlannerSessions: () => mockPlanner }));
jest.mock('@/features/discovery/services/discovery-api-service', () => ({ useRecentTravelers: () => ({ data: [], cards: [], refetch: jest.fn() }) }));
jest.mock('@/features/travel-plan/components/recent-trip-card', () => ({ RecentTripCard: () => null }));
jest.mock('@/features/travel/components/destination-card', () => ({ DestinationCard: ({ destination }: { destination: { title: string } }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text>{destination.title}</Text>;
} }));

beforeEach(() => {
  mockCatalog = { citiesQuery: successful(), recommendedQuery: successful(), collectionsQuery: successful() };
  mockCollection = { ...successful(), items: [] };
  mockTrips = successful(); mockPlans = successful(); mockPlanner = successful();
  jest.clearAllMocks();
});
async function mount(language: 'en' | 'vi') {
  const i18n = createInstance();
  await i18n.init({ resources, lng: language, interpolation: { escapeValue: false } });
  await render(<I18nextProvider i18n={i18n}><HomeSheetContent bottomPadding={0} /></I18nextProvider>);
  return i18n;
}

test.each(['en', 'vi'] as const)('%s hides successful empty admin sections and translates recent travelers', async (language) => {
  const i18n = await mount(language);
  for (const key of ['homeSections.collections', 'homeSections.noCollections', 'home.exploreCity', 'travel.collections.recommended']) {
    expect(screen.queryByText(i18n.t(key))).not.toBeOnTheScreen();
  }
  expect(screen.getByText(language === 'vi' ? 'Ai vừa khám phá?' : 'Who’s around')).toBeOnTheScreen();
});

test.each(['en', 'vi'] as const)('%s keeps loading and retry, without timeout banners, and recovers to empty', async (language) => {
  mockCatalog.collectionsQuery = { ...successful(), isPending: true, isFetching: true, fetchStatus: 'fetching' };
  const i18n = await mount(language);
  expect(screen.getByText(i18n.t('homeSections.collections'))).toBeOnTheScreen();
  expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  expect(screen.queryByText(i18n.t('homeSections.noCollections'))).not.toBeOnTheScreen();
  mockCatalog.collectionsQuery = { ...successful(), isError: true, error: { code: 'REQUEST_TIMEOUT' } };
  await screen.rerender(<I18nextProvider i18n={i18n}><HomeSheetContent bottomPadding={0} /></I18nextProvider>);
  expect(screen.queryByText(i18n.t('loadingUi.timeout'))).not.toBeOnTheScreen();
  await userEvent.setup().press(screen.getByRole('button', { name: i18n.t('common.retry') }));
  expect(mockCatalog.collectionsQuery.refetch).toHaveBeenCalledTimes(1);
  mockCatalog.collectionsQuery = successful();
  await screen.rerender(<I18nextProvider i18n={i18n}><HomeSheetContent bottomPadding={0} /></I18nextProvider>);
  expect(screen.queryByText(i18n.t('homeSections.collections'))).not.toBeOnTheScreen();
});

test('hides an empty named collection, then shows its real cards and navigation after data arrives', async () => {
  mockCatalog.collectionsQuery = successful([{ id: 'collection-1', slug: 'featured', title: 'Weekend picks', type: 'featured' }]);
  const i18n = await mount('en');
  expect(screen.queryByText('Weekend picks')).not.toBeOnTheScreen();
  mockCollection = { ...successful([{}]), items: [{ id: 'destination-1', title: 'Marble Mountains' }] };
  await screen.rerender(<I18nextProvider i18n={i18n}><HomeSheetContent bottomPadding={0} /></I18nextProvider>);
  expect(screen.getByText('Marble Mountains')).toBeOnTheScreen();
  await userEvent.setup().press(screen.getAllByRole('button', { name: i18n.t('common.viewAll') }).at(-1)!);
  expect(router.push).toHaveBeenCalledWith({ pathname: '/collection/[slug]', params: { slug: 'featured' } });
});
