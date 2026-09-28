# City & destination details

## Layout implemented on mobile

Keep the existing orange palette, screen header, destination cards and stack routes.

### City
1. City cover, name, country, catalog count and city description.
2. Open the city in Maps and create-trip entry point.
3. Optional editorial travel guide.
4. Explore by category, text search, listed-zero-price filter and rating ≥ 4 filter.
5. Results with counts, empty state and reset; links remain scoped to this city.
6. Gallery with actual image counts and full-screen viewing.

### Destination
1. Cover, name, location, aggregate rating/count and tags.
2. Favorite and external Maps actions.
3. Description and last-curated date (not a claim of verified accuracy).
4. Before-you-go cards: location, opening hours, editorial information and tips.
5. Local adult/child-senior prices and notes from existing pricingTiers.
6. Gallery containing only this destination's cover/gallery.
7. Other catalog destinations in the same city, not claimed to be nearby.
8. Persistent add-to-trip action; existing booking action for paid listings.

Adding to a trip uses existing APIs: fetch latest detail, reject duplicate or sixth
stop, then preserve all current stops and append the destination. Favorites and
trip stops remain separate concepts. Backend concurrency/version checks are a
future requirement; the existing replace-stops endpoint cannot prevent another
device changing a route between read and write.

## Content slots ready on mobile

DetailGuide is an optional local presentation model, not a new API contract.
City and Destination models can carry an editorial guide. Cards render only when
populated. No city-specific travel or safety facts have been fabricated.

- Detailed address.
- Typical visit duration, best time of day, best season.
- Transport, facilities, accessibility, booking advice, safety notes.
- Destination best-for labels.

The API mapper currently supplies only existing fields. A future adapter can map
approved backend content to these slots without redesigning the screens.

## Existing backend fields now connected

- City: description, isFeatured, country, cover and related destinations.
- City detail embeds only 20 destinations. An infinite query now uses the existing
  destinations endpoint filtered by cityId; results are deduplicated and users
  can load additional pages. Filters are explicitly scoped to loaded places.
- Destination: coordinates for Maps, aggregate rating/count, recorded visitorCount,
  catalog popularityRank, isFeatured, tags, hours, tips and lastCuratedAt.
- pricingTiers: local adult and child/senior prices, notes, approximate USD prices.
  Currency minor units are converted correctly, preserving zero prices.
- GET /api/destinations/:id/visit-profile: duration bounds, timezone, wheelchair
  access, weather exposure, schedule coverage, booking policy, advance booking
  minutes and travelAdvice. Null remains unknown; zero lead time is displayed.
- Evidence: source name and HTTP(S) link, observedAt, verifiedAt, validUntil,
  verification status and expired status. No live-weather claim is made.
- Profile null hides the optional section. Loading/errors stay within the section.
- Address, places/facilities, travel estimates and offering tables exist in the
  schema but are not returned by the inspected public catalog routes. They remain
  deferred; mobile must not call admin endpoints for this content.

## Next backend/data work (not implemented in this change)

Priority 1: sourced practical facts
- Exact entrance/address and coordinates; visit duration and seasonal advice.
- Accessibility, facilities, booking requirement and cancellation policy.
- Source, verified/updated timestamp and expiry for safety-sensitive facts.
- Distinguish unknown pricing from zero/free and separate entry from services.

Priority 2: discovery
- Server-side city search/filter/pagination as catalogs grow.
- Embedded map with pins and a synchronized list; existing action opens external
  Maps only. Do not represent a city search as an all-destination map.
- Optional location permission, routing provider and travel duration/cost;
  straight-line distance must not be presented as driving distance.
- Curated nearby places and mini-itineraries with travel feasibility.
- City daily budget ranges, airport/transit options, food themes and events.

Priority 3: live and community data
- Current weather/forecast and time-bounded alerts with provider timestamps.
- Real reviews and photos, rating breakdowns and star histogram from aggregates.
- Public planner/feed links filtered by city/place with privacy checks.
- Upcoming visitor counts from a defined, privacy-preserving aggregation.

Do not populate weather, crowds, review bars, emergency facilities, public trips
or popularity counts with placeholder facts. Existing numbered fake avatars,
static pagination dots, unrelated gallery fallback and “12+” overlay are removed.

## Verification

Static: TypeScript, Expo lint, iOS bundle export.
Device follow-up: small screens, large text, modal dismissal/zoom, Maps handoff,
filter reset, offline/retry, save failure, duplicate/full-trip feedback and booking.
Authenticated end-to-end writes require a running API and a test account.
