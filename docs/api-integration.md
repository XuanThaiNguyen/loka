# Mobile API integration

The mobile app consumes the existing `pland` API through `expo/fetch`. Native
requests attach the Better Auth cookie explicitly; web requests use credentialed
cookies. React Query owns request cancellation, caching, retry, and invalidation.

## Connected route groups

| Backend routes | Mobile service | Current UI consumer |
| --- | --- | --- |
| `GET /api/cities`, `GET /api/cities/:id` | `travel-api-service.ts` | Home and City detail |
| `GET /api/destinations`, `GET /api/destinations/:id` | `travel-api-service.ts` | Home fallback collections and Destination detail |
| `GET /api/collections`, `GET /api/collections/:slug/destinations` | `travel-api-service.ts` | Home and Collection detail |
| `GET/PUT/DELETE /api/me/favorites` | `travel-api-service.ts` | Favorites and heart actions |
| All `/api/trips` collaboration routes | `trips-api-service.ts` | API-ready; list data supports booking/planner flows |
| All `/api/me/bookings` routes | `trips-api-service.ts` | My Trips and reminder action |
| All `/api/me/travel-plans` routes | `travel-plan-api-service.ts` | Home, My Trips, and planner result persistence |
| All `/api/travel-planner` routes | `planner-api-service.ts` | API-ready; generation remains on the existing mobile fallback while the backend returns `AI_PLANNER_COMING_SOON` |
| `GET/PATCH /api/me` | `profile-api-service.ts` | Profile identity |

## UI-safe data policy

- A successful non-empty API response replaces the equivalent mock collection.
- Loading, network failure, or an empty development dataset keeps the current mock
  cards so existing screens and layouts remain usable.
- The current backend database has cities and destinations but no collection rows.
  Until collections are seeded, the four existing collection sections are filled
  from `/api/destinations` with the matching sort and keep their current slugs.
- UUID-backed favorite and reminder actions persist to the backend. Mock identifiers
  remain local and never send invalid requests.
- Generated itineraries are posted to `/api/me/travel-plans`; if persistence fails,
  the generated plan remains available in the existing in-memory store.

## Runtime configuration

`EXPO_PUBLIC_API_URL` must point to the backend origin, without `/api` at the end.
The iOS Simulator can use `http://localhost:3000`; Android Emulator should use
`http://10.0.2.2:3000`; a physical device needs the development machine's LAN URL.
