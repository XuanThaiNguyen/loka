import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { catalogApi, useHomeCatalog, type CityDTO, type DestinationDTO } from '@/features/travel/services/travel-api-service';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
jest.mock('@/lib/api/client', () => ({ apiPath: (path: string) => path, apiRequest: jest.fn() }));

// Endpoint fixtures only; no test data is imported by application code.
const city: CityDTO = { id: 'city-1', name: 'Da Nang', slug: 'da-nang', country: 'Vietnam', description: null, coverImageUrl: '', isFeatured: true, createdAt: '', updatedAt: '', hasPublishedContent: true };
const destination: DestinationDTO = { id: 'place-1', cityId: city.id, slug: 'marble-mountains', title: 'Marble Mountains', location: { city: city.name, country: city.country, label: city.name, latitude: null, longitude: null }, description: null, category: 'culture', tags: [], openingHours: null, tips: null, coverImageUrl: '', gallery: [], rating: { average: 0, count: 0 }, visitorCount: 0, popularityRank: null, lastCuratedAt: null, isFeatured: true, isFavorite: false, createdAt: '', updatedAt: '' };
afterEach(() => jest.restoreAllMocks());

test('real Home hooks resolve independently, recover empty collections, and reuse cached data on revisit', async () => {
  let rejectCollections!: (reason: Error) => void;
  const collections = jest.spyOn(catalogApi, 'listCollections')
    .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectCollections = reject; }))
    .mockResolvedValue({ data: [] });
  const cities = jest.spyOn(catalogApi, 'listCities').mockResolvedValue({ data: [city, { ...city, id: 'legacy-city', hasPublishedContent: false, contentUpdatedAt: '2026-10-19' }] });
  const places = jest.spyOn(catalogApi, 'listDestinations').mockResolvedValue({ data: [destination], meta: { nextCursor: null, hasMore: false } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 300_000, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const first = await renderHook(() => useHomeCatalog(), { wrapper });
  await waitFor(() => expect(first.result.current.recommendedQuery.data?.[0]?.id).toBe(destination.id));
  expect(first.result.current.citiesQuery.data?.map(item => item.id)).toEqual([city.id]);
  expect(first.result.current.collectionsQuery.isPending).toBe(true);
  expect(places).toHaveBeenCalledWith({ sort: 'recommended', limit: 12 }, expect.anything());

  await act(() => rejectCollections(new Error('Collections temporarily unavailable')));
  await waitFor(() => expect(first.result.current.collectionsQuery.isError).toBe(true));
  expect(first.result.current.recommendedQuery.data?.[0]?.title).toBe(destination.title);
  expect(first.result.current.citiesQuery.data?.[0]?.name).toBe(city.name);
  await act(() => first.result.current.collectionsQuery.refetch());
  await waitFor(() => expect(first.result.current.collectionsQuery.data).toEqual([]));
  expect(first.result.current.collectionsQuery.isError).toBe(false);
  await first.unmount();

  const revisit = await renderHook(() => useHomeCatalog(), { wrapper });
  expect(revisit.result.current.recommendedQuery.isPending).toBe(false);
  expect(revisit.result.current.recommendedQuery.data?.[0]?.id).toBe(destination.id);
  expect(revisit.result.current.collectionsQuery.data).toEqual([]);
  expect(cities).toHaveBeenCalledTimes(1);
  expect(places).toHaveBeenCalledTimes(1);
  expect(collections).toHaveBeenCalledTimes(2);
  await revisit.unmount();
  client.clear();
});
