import { apiRequest } from '@/lib/api/client';
import { fetch } from 'expo/fetch';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/config/env', () => ({ env: { apiBaseURL: 'https://test.invalid' } }));
jest.mock('@/i18n', () => ({ i18n: { language: 'en' } }));
jest.mock('@/lib/auth/auth-client', () => ({ authClient: { getCookie: jest.fn().mockResolvedValue(null) } }));
const mockFetch = jest.mocked(fetch);
beforeEach(() => { jest.useFakeTimers(); mockFetch.mockReset(); });
afterEach(() => { jest.useRealTimers(); });

function stalledBody() {
  let signal: AbortSignal;
  const json = jest.fn(() => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })), { once: true });
  }));
  mockFetch.mockImplementation(async (_url, options) => {
    signal = options!.signal!;
    return { ok: true, status: 200, json } as unknown as Awaited<ReturnType<typeof fetch>>;
  });
  return json;
}

test('GET deadline includes a stalled body after successful headers', async () => {
  const json = stalledBody();
  const request = apiRequest('/slow-body');
  const rejected = expect(request).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
  await jest.advanceTimersByTimeAsync(1);
  expect(json).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(20_000);
  await rejected;
  expect(jest.getTimerCount()).toBe(0);
});

test('caller cancellation still aborts body consumption', async () => {
  const json = stalledBody();
  const caller = new AbortController();
  const remove = jest.spyOn(caller.signal, 'removeEventListener');
  const request = apiRequest('/cancel-body', { signal: caller.signal });
  const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
  await jest.advanceTimersByTimeAsync(1);
  expect(json).toHaveBeenCalledTimes(1);
  caller.abort();
  await rejected;
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(jest.getTimerCount()).toBe(0);
});

test('a successful response clears the deadline and keeps the payload', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: ['city'] }) } as Awaited<ReturnType<typeof fetch>>);
  await expect(apiRequest('/cities')).resolves.toEqual({ data: ['city'] });
  expect(jest.getTimerCount()).toBe(0);
});

test('body network errors are not silently converted into successful null data', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new TypeError('Connection lost'); } } as unknown as Awaited<ReturnType<typeof fetch>>);
  await expect(apiRequest('/cities')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
});

test('server error codes survive body consumption', async () => {
  mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND', message: 'Missing city' } }) } as Awaited<ReturnType<typeof fetch>>);
  await expect(apiRequest('/cities/missing')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
});
