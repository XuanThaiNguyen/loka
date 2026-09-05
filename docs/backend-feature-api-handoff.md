# Loka UI, user flows, and backend API handoff

This document describes the UI and user flows currently implemented in the Loka
mobile app. It also proposes backend domains, API contracts, and an implementation
order so the frontend can replace local mock data feature by feature.

The original inventory reflects the source as of August 31, 2026. The proposed API
surface has since been implemented and connected to mobile; see
[`api-integration.md`](./api-integration.md) for the live route-to-screen mapping and
fallback policy.

## 1. Current application overview

The app opens into Google sign-in when no Better Auth session is available. A
restored session opens the protected main tab layout directly.

### Main tabs

| Tab | Route | Purpose |
| --- | --- | --- |
| Home | `/` | Personalized discovery feed, recent trip, cities, and destination collections |
| My Trips | `/trips` | Booked trips and AI-generated travel plans |
| AI Planner | `/explore` | Conversational trip-planning flow and generated itinerary |
| Favorites | `/favorites` | Search and filter saved destinations |
| Profile | `/profile` | User identity, preferences, bookings shortcut, and account options |

### Detail routes

| Route | Screen |
| --- | --- |
| `/city/:id` | City detail, featured place, gallery, and related trips |
| `/collection/:slug` | Full list of destinations in a curated collection |
| `/destination/:id` | Destination/package detail and checkout entry point |

### Current data state

- The catalog contains 12 hard-coded destinations, five cities, and four collections.
- Favorites are a fixed local list and favorite toggles only update component state.
- My Trips contains two hard-coded bookings and one in-memory demo travel plan.
- Newly generated travel plans remain available only until the app process restarts.
- Profile identity, contact details, booking counts, and payment labels are static.
- The shared API request helper attaches the Better Auth cookie on native and uses
  browser credentials on web, but feature data still comes from local mocks.
- AI Planner calls OpenRouter directly from the app when a public API key is present.
- Vietnamese and English UI dictionaries are bundled in the app.

## 2. UI and flow inventory

## 2.1 Home

### Visible UI

- User avatar, welcome text, and user name.
- Search icon and notification icon with unread badge.
- Large destination search pill.
- Expandable bottom sheet containing:
  - Most recent travel plan.
  - Explore City carousel.
  - Recommended collection.
  - Trending collection.
  - Seasonal collection.
  - Newly added collection.

### Working flows

1. Tap the recent trip or **See all** to open `/trips`.
2. Tap a city to open `/city/:id`.
3. Tap **View all** on a collection to open `/collection/:slug`.
4. Tap a destination card to open `/destination/:id`.
5. Tap the center AI Planner entry through the tab bar to open `/explore`.

### UI without behavior yet

- User/avatar press.
- Header search button.
- Notification button and badge.
- Large search pill.

### Backend data needed

- Current user summary.
- Unread notification count.
- Most recent booking or travel plan.
- Featured cities.
- Curated collections with ordered destination previews.
- Destination favorite state.

## 2.2 City detail

### Visible UI

- City title and back button.
- Featured/popular place card with image, price, location, rating, and favorite button.
- Image gallery with a total-count overlay.
- Related destination list.

### Working flows

1. Navigate back to the previous screen.
2. Toggle the featured place heart locally.
3. Open the recommended collection from **View all**.
4. Open a related destination at `/destination/:id`.

### UI without behavior yet

- Gallery **View all**.
- Gallery image preview.
- Header overflow menu.
- Favorite persistence.

### Backend data needed

- City identity and localized content.
- Featured places or packages.
- Complete gallery and media count.
- Related destinations.
- Favorite state for featured entities.

## 2.3 Collection listing

### Visible UI

- Collection title.
- Result count.
- Vertical destination list with image, location, rating, and starting price.

### Working flows

1. Navigate back.
2. Open a destination at `/destination/:id`.

### Current collection types

| Slug | Current ranking meaning |
| --- | --- |
| `recommended` | Personalized ranking |
| `trending` | Recent growth |
| `seasonal` | Seasonal relevance |
| `new` | Recently added |

### Backend data needed

- Collection metadata and ordered destination results.
- Pagination when destination volume grows.
- Optional personalization context for signed-in users.

## 2.4 Destination detail and checkout entry

### Visible UI

- Hero image and pagination indicators.
- Name, location, rating, visitor count, and favorite button.
- Description.
- Gallery.
- Starting price per person.
- Persistent checkout button.

### Working flows

1. Navigate back.
2. Toggle favorite locally.

### UI without behavior yet

- Gallery **View all** and media viewer.
- Header overflow menu.
- Checkout button.

### Backend data needed

- Destination/package details and media.
- Aggregate rating and review count.
- Real visitor or booking count if this metric is retained.
- Favorite state.
- Pricing currency and pricing unit.
- Availability, travel date, traveler count, and booking quote.

### Product gap before checkout can be completed

The current UI does not collect travel date, package option, or traveler count on
the destination detail screen. Backend booking creation should not infer these
values. Frontend needs either a checkout form/sheet or a separate checkout route.

## 2.5 Favorites

### Visible UI

- Search input.
- Category chips: all, adventure, beach, and culture.
- Recently added destinations.
- Favorite destination list.
- Empty search/filter state.

### Working flows

1. Filter the local list by title and category.
2. Open the `new` collection.
3. Open destination detail.
4. Toggle hearts locally on horizontal cards.

### Missing behavior

- Favorites are not tied to a user and do not persist.
- The filter/options icon is visual only.
- Search only evaluates the currently hard-coded list.

### Backend data needed

- Paginated user favorites.
- Search by localized destination title.
- Category filtering.
- Favorite creation and deletion.
- Favorite creation timestamp for recently added sorting.

## 2.6 My Trips: bookings

### Visible UI

- Segmented control with **Booked** and **Planning**.
- Booking cards containing:
  - Date.
  - Reminder switch.
  - Status.
  - Destination image, location, and rating.
  - Schedule and countdown.
  - Total price and traveler count.
  - Detail button.

### Working flows

1. Switch between booked and planning lists.
2. Toggle reminder locally.
3. Open the associated destination detail.

### Missing behavior

- Booking list and booking detail are not loaded from backend.
- Reminder state is not persisted and no notification is scheduled.
- Booking cards do not have a dedicated booking-detail route.
- Price and traveler count are currently calculated/hard-coded by the UI.

### Backend data needed

- Upcoming, active, completed, and cancelled bookings.
- Booking itinerary/schedule.
- Server-calculated totals and currency.
- Traveler count.
- Reminder preference and notification schedule.
- Booking status history.

## 2.7 My Trips: AI travel plans

### Visible UI

- List of generated or saved plans.
- Each card shows status, date, name, destination, rating, people count, and
  estimated cost.
- Empty state when no plan exists.

### Current limitation

Cards rendered inside the Planning tab do not currently navigate to plan detail.
The generated plan detail can only be opened immediately after generation in the
AI Planner flow.

### Backend data needed

- Paginated saved travel plans.
- Travel-plan detail by ID.
- Plan status, dates, travelers, estimated cost, hotels, days, and activities.
- Update/archive/delete operations if product requirements include them.

## 2.8 AI Trip Planner

### Entry state

- AI Planner header with online indicator.
- Starter card and **Create New Trip** action.
- Restart action appears once the conversation has started.

### Conversation sequence

The app currently enforces these steps in order:

1. `origin`: free text or Ho Chi Minh City, Hanoi, Da Nang suggestions.
2. `destination`: free text or Da Nang, Tokyo, Bali suggestions.
3. `groupSize`: solo, couple, family, or friends.
4. `budget`: cheap, balanced, or premium.
5. `tripDuration`: 1–14 days, with 3, 5, and 7-day presets.
6. `interests`: one or more of relaxing, road trip, historical, food tourism,
   and backpacking.
7. `requirements`: free text or no requirements, traveling with children, or
   wheelchair accessibility.
8. `final`: summary and generate action.

### Conversation behavior

- Each answer becomes a user chat bubble.
- Backend/AI response is expected to contain one message and the next UI control.
- A thinking state is shown between turns.
- A progress bar shows completion of the seven required answers.
- Restart clears the current local session.
- AI failures currently fall back silently to local questions and a generated
  fallback itinerary.

### Generation result UI

- Trip name, hero image, origin-to-destination route, and summary.
- Duration, traveler count, and estimated cost.
- Suggested hotel carousel with name, address, nightly price, image, and rating.
- Day-by-day itinerary.
- Each activity includes name, description, image, address, best time, ticket
  pricing, and travel time.
- Back to summary and plan-another-trip actions.

### Current planner data contract

```ts
type PlannerAnswers = {
  origin: string;
  destination: string;
  travellerId: "solo" | "couple" | "family" | "friends";
  budgetId: "cheap" | "balanced" | "premium";
  durationDays: number;
  interestIds: string[];
  specialRequirements: string;
};
```

### Important backend and security requirement

The OpenRouter credential is currently read from an `EXPO_PUBLIC_*` environment
variable and the request is made from the client. Any `EXPO_PUBLIC_*` value is part
of the shipped application bundle and cannot be treated as a secret. AI provider
credentials and prompts must move to the backend before production.

### Missing product data

The planner does not ask for travel dates. Current generated start/end dates are
placeholder translations. Backend should return `null` dates until the UI adds a
date-selection step, rather than inventing fixed dates.

## 2.9 Profile and account settings

### Visible UI

- Avatar and verification badge.
- Name, email, and phone.
- Edit profile action.
- My Bookings shortcut.
- Payment methods row.
- Language selector for Vietnamese and English.
- Help Center, Terms, Privacy Policy, Rate Us, and Delete Account rows.

### Working flows

1. My Bookings opens `/trips`.
2. Language selector changes the in-memory app language.

### UI without behavior yet

- Edit profile.
- Payment methods.
- Help Center.
- Terms and Privacy links.
- Rate Us.
- Delete Account.
- Header overflow menu.

### Backend data needed

- User profile and verification status.
- Profile update.
- Avatar upload workflow.
- Persisted locale preference.
- Payment methods, depending on payment provider integration.
- Account deletion request and status.
- Configured URLs or CMS content for help/legal pages.

## 2.10 Authentication and session

Google authentication, session restoration, protected navigation, and sign-out are
integrated with the backend's Better Auth routes. Personalized feature data still
needs to replace the local mocks incrementally.

Minimum expected flows:

- Sign up.
- Sign in.
- Refresh or restore session.
- Sign out.
- Forgot/reset password if password authentication is used.
- Optional email/phone verification.
- Re-authentication for destructive account deletion.

## 3. Proposed API surface

Use `/v1` as an example version prefix. Resource names and authentication mechanics
can be changed during backend design review.

## 3.1 Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/v1/auth/sign-up` | Create account |
| `POST` | `/v1/auth/sign-in` | Create session |
| `POST` | `/v1/auth/refresh` | Rotate/refresh access token |
| `POST` | `/v1/auth/sign-out` | Revoke session |
| `POST` | `/v1/auth/password/forgot` | Start password reset |
| `POST` | `/v1/auth/password/reset` | Complete password reset |

## 3.2 User and preferences

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/me` | Current user profile |
| `PATCH` | `/v1/me` | Update name, phone, and profile fields |
| `POST` | `/v1/me/avatar-upload` | Create an upload URL or media upload session |
| `GET` | `/v1/me/preferences` | Load locale and notification preferences |
| `PATCH` | `/v1/me/preferences` | Persist locale and preferences |
| `POST` | `/v1/me/deletion-requests` | Request account deletion |
| `GET` | `/v1/me/deletion-requests/latest` | Read deletion request status |

Suggested profile response:

```json
{
  "data": {
    "id": "usr_123",
    "displayName": "Loka User",
    "email": "loka.user@example.com",
    "phone": "+84987654321",
    "avatarUrl": "https://cdn.example.com/users/usr_123/avatar.jpg",
    "isVerified": true,
    "locale": "vi"
  }
}
```

## 3.3 Home, cities, collections, and destinations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/home` | Optional aggregate response optimized for the Home screen |
| `GET` | `/v1/cities` | List featured/searchable cities |
| `GET` | `/v1/cities/:cityId` | City, featured places, gallery, and related destinations |
| `GET` | `/v1/collections` | Collection metadata |
| `GET` | `/v1/collections/:slug/destinations` | Ordered, paginated collection content |
| `GET` | `/v1/destinations` | Search/filter destinations |
| `GET` | `/v1/destinations/:destinationId` | Destination detail |

Recommended query parameters for `/v1/destinations`:

```text
q=
category=adventure|beach|culture|city
cityId=
sort=recommended|rating|price_asc|price_desc|newest
cursor=
limit=20
```

Suggested destination shape:

```json
{
  "id": "dst_123",
  "slug": "ha-long-bay",
  "title": "Ha Long Bay",
  "location": {
    "label": "Quang Ninh, Vietnam",
    "latitude": 20.9101,
    "longitude": 107.1839
  },
  "description": "...",
  "category": "adventure",
  "coverImageUrl": "https://cdn.example.com/destinations/dst_123/cover.jpg",
  "gallery": [
    {
      "id": "media_1",
      "type": "image",
      "url": "https://cdn.example.com/media/media_1.jpg"
    }
  ],
  "rating": {
    "average": 4.8,
    "count": 1240
  },
  "visitorCount": 15000,
  "fromPrice": {
    "amountMinor": 6450,
    "currency": "USD",
    "unit": "person"
  },
  "isFavorite": true
}
```

The backend should return raw numeric values. The frontend should format `15000` as
`15K`, money according to currency, and dates according to locale.

## 3.4 Favorites

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/me/favorites` | Search, filter, sort, and paginate favorites |
| `PUT` | `/v1/me/favorites/:destinationId` | Idempotently save a destination |
| `DELETE` | `/v1/me/favorites/:destinationId` | Remove a saved destination |

Recommended list query:

```text
q=
category=
sort=recent|title|rating
cursor=
limit=20
```

The favorite list item should include `favoritedAt` so the UI can render recently
added items without a separate endpoint.

## 3.5 Booking, checkout, and reminders

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/v1/booking-quotes` | Validate package, availability, travelers, and final price |
| `POST` | `/v1/bookings` | Create a booking from a valid quote |
| `GET` | `/v1/me/bookings` | List bookings by status |
| `GET` | `/v1/me/bookings/:bookingId` | Booking detail and itinerary |
| `PATCH` | `/v1/me/bookings/:bookingId/reminder` | Enable/disable reminder |
| `POST` | `/v1/me/bookings/:bookingId/cancel` | Request cancellation when allowed |

Suggested quote request:

```json
{
  "destinationId": "dst_123",
  "packageOptionId": "pkg_standard",
  "startDate": "2026-12-20",
  "travelerCount": 4,
  "currency": "USD"
}
```

Suggested booking summary:

```json
{
  "id": "bkg_123",
  "status": "upcoming",
  "destination": {},
  "startAt": "2026-12-20T09:00:00+07:00",
  "endAt": "2026-12-23T18:00:00+07:00",
  "travelerCount": 4,
  "total": {
    "amountMinor": 25800,
    "currency": "USD"
  },
  "reminderEnabled": true,
  "scheduleSummary": "..."
}
```

Booking creation should support an `Idempotency-Key` header to avoid duplicate
bookings after retries.

## 3.6 Payment methods

Exact endpoints depend on the selected payment provider. The app will minimally
need:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/me/payment-methods` | List masked, provider-safe payment methods |
| `POST` | `/v1/me/payment-method-sessions` | Start provider-specific setup flow |
| `DELETE` | `/v1/me/payment-methods/:paymentMethodId` | Detach a payment method |
| `POST` | `/v1/bookings/:bookingId/payment-session` | Start payment for a booking |

Never send raw card numbers through the Loka backend unless the selected provider
and compliance scope explicitly require it. Prefer provider tokens and hosted/native
payment elements.

## 3.7 Travel Planner sessions and generation

The following session-based design preserves the current conversational UI and
makes the backend the source of truth.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/v1/travel-planner/sessions` | Start a planner session and return the origin question |
| `GET` | `/v1/travel-planner/sessions/:sessionId` | Restore conversation and collected answers |
| `POST` | `/v1/travel-planner/sessions/:sessionId/answers` | Submit one answer and receive the next turn |
| `POST` | `/v1/travel-planner/sessions/:sessionId/generations` | Start itinerary generation |
| `GET` | `/v1/travel-plan-generations/:generationId` | Poll generation state/result |
| `GET` | `/v1/me/travel-plans` | List saved plans |
| `GET` | `/v1/me/travel-plans/:travelPlanId` | Load full plan detail |
| `PATCH` | `/v1/me/travel-plans/:travelPlanId` | Rename or update supported plan metadata |
| `DELETE` | `/v1/me/travel-plans/:travelPlanId` | Delete/archive a plan |

Start-session response:

```json
{
  "data": {
    "sessionId": "planner_session_123",
    "status": "collecting",
    "progress": {
      "completed": 0,
      "total": 7
    },
    "turn": {
      "messageId": "msg_1",
      "message": "Where will you be travelling from?",
      "ui": "origin"
    }
  }
}
```

Answer request:

```json
{
  "step": "groupSize",
  "value": "family",
  "locale": "vi"
}
```

Answer response:

```json
{
  "data": {
    "acceptedAnswer": {
      "step": "groupSize",
      "value": "family"
    },
    "progress": {
      "completed": 3,
      "total": 7
    },
    "turn": {
      "messageId": "msg_4",
      "message": "What spending level feels right for this trip?",
      "ui": "budget"
    }
  }
}
```

Generation should be asynchronous because the current AI timeout is up to three
minutes. A generation request should return HTTP `202`:

```json
{
  "data": {
    "generationId": "gen_123",
    "status": "queued"
  }
}
```

Generation status values:

```text
queued | generating | completed | failed
```

On completion, return the saved `travelPlanId` and the full plan or a link to fetch
it. The travel-plan response should include:

- Stable plan ID.
- Origin and destination.
- Nullable start/end dates.
- Traveler group and count.
- Budget tier and estimated money value.
- Interest IDs and special requirements.
- Summary and cover image.
- Hotel options.
- Day-by-day itinerary.
- Activities with coordinates, addresses, pricing, and timing.
- Generation metadata such as provider/model for internal observability; this does
  not need to be shown to users.

## 3.8 Notifications

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/v1/me/notifications` | Paginated notification inbox |
| `GET` | `/v1/me/notifications/unread-count` | Home badge count |
| `PATCH` | `/v1/me/notifications/:notificationId/read` | Mark one notification read |
| `POST` | `/v1/me/notifications/read-all` | Mark all notifications read |
| `POST` | `/v1/me/devices` | Register push token/device |
| `DELETE` | `/v1/me/devices/:deviceId` | Remove push token/device |

## 3.9 Help and legal content

Static web URLs can be delivered through remote config instead of a full CMS:

```http
GET /v1/app-config
```

Suggested fields:

```json
{
  "data": {
    "helpCenterUrl": "https://loka.example/help",
    "termsUrl": "https://loka.example/terms",
    "privacyUrl": "https://loka.example/privacy",
    "supportEmail": "support@loka.example",
    "minimumSupportedAppVersion": "1.0.0"
  }
}
```

The **Rate Us** action is normally a client-side App Store/Play Store deep link and
does not require an API.

## 4. API conventions required by the frontend

### Localization

- Frontend sends `Accept-Language: vi` or `Accept-Language: en`.
- Backend returns localized catalog/CMS content when available.
- Stable IDs and enum values must not be localized.
- Frontend remains responsible for formatting dates, counts, and money.

### Pagination

Prefer cursor pagination for destinations, favorites, bookings, notifications, and
travel plans:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "opaque_cursor_or_null",
    "hasMore": false
  }
}
```

### Error shape

All APIs should use a consistent error contract:

```json
{
  "error": {
    "code": "DESTINATION_NOT_FOUND",
    "message": "Destination was not found",
    "details": {},
    "requestId": "req_123"
  }
}
```

Recommended frontend-relevant status codes:

- `400`: invalid request.
- `401`: session missing or expired.
- `403`: authenticated but not authorized.
- `404`: resource not found.
- `409`: state conflict or duplicate action.
- `422`: field validation failure.
- `429`: rate limit, especially AI generation.
- `500/502/503`: backend or provider failure.

### Dates, money, and numbers

- Use ISO 8601 dates/timestamps.
- Return timezone or offset for scheduled events.
- Return money as integer minor units plus ISO currency.
- Return ratings and counts as numbers, not formatted strings.
- Return coordinates as numeric latitude/longitude.

### Idempotency and concurrency

- Booking, payment, account deletion, and AI-generation creation should accept an
  idempotency key.
- Mutable resources should return `updatedAt`; ETags or version fields are useful
  if concurrent edits will be supported.

## 5. Suggested backend implementation order

### Phase 0: shared foundation

1. Authentication/session strategy.
2. Standard response, error, pagination, localization, and money contracts.
3. User profile and preferences.
4. Catalog database schema for cities, destinations, media, and collections.

### Phase 1: replace read-only mock data

1. Destination, city, and collection APIs.
2. Home aggregate API.
3. Profile API.
4. Booking and travel-plan list/detail reads.

This phase allows frontend integration without changing transactional behavior.

### Phase 2: persist user actions

1. Favorites create/delete/list.
2. Locale and profile updates.
3. Notification device registration and unread count.
4. Booking reminder preference.

### Phase 3: AI planner

1. Move AI provider credentials and prompts to backend.
2. Planner session and answer APIs.
3. Asynchronous generation jobs.
4. Persisted travel-plan list/detail.
5. Rate limits, retries, provider observability, and explicit failed state.

### Phase 4: checkout and account operations

1. Availability and booking quote.
2. Payment-provider integration.
3. Booking creation and cancellation.
4. Account deletion and legal/support configuration.

## 6. Decisions needed before backend contracts are finalized

1. Which authentication methods will be supported: email/password, phone OTP,
   social sign-in, or a combination?
2. Are destinations editorial content, bookable packages, or both?
3. Is checkout performed by Loka or redirected to a partner?
4. Which currencies and markets are supported?
5. Should destination content be stored per locale or translated externally?
6. Is a favorite always a destination, or can users also favorite cities, hotels,
   and activities?
7. Does a travel plan require dates before generation?
8. Are AI-generated hotels and activities informational only, or must they map to
   bookable inventory?
9. Should planner conversations be restorable across devices?
10. What is the account-deletion grace period and audit requirement?

## 7. Frontend integration notes

- The shared `apiRequest` helper can be used once `EXPO_PUBLIC_API_URL` points to
  the backend; it forwards the persisted Better Auth session cookie.
- TanStack Query is already configured and should own server state, caching, retry,
  and invalidation.
- Local component state should remain only for transient presentation state such as
  active tab, expanded language selector, input draft, and selected filters.
- Favorites, bookings, user profile, reminders, notifications, and travel plans must
  become backend-owned state.
- Every list/detail screen needs loading, empty, retry, offline, and pagination states
  when API integration begins.
