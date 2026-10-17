# Loka content contract inventory — 17 October 2026

Read-only repository findings for the coordinating BA/content researcher. Scope: mobile, backend, and existing city/destination management. No admin redesign, code change, database mutation, or publishing is authorized in this BA task.

Latest Phase 1 requirement: [no traveler-facing pricing](ba-phase1-no-pricing-20261017.md). Monetary fields listed below document existing storage/contracts, not fields to show or require from travelers. Preserve them internally; add compatible no-price traveler projections and a qualitative Low / Medium / Luxury preference while keeping Create New Trip.

## Confirmed content scope

Da Nang, Ho Chi Minh City, Ha Noi, Nha Trang, Ninh Binh. Use stable record IDs after live reconciliation; slugs below are proposed content identifiers, not verified database keys. Preserve existing Hoi An, Da Lat, Kyoto and other records/references; exclude them from the initial discovery rollout rather than deleting them.

## Actual city and guide fields

Source: `pland/src/schema/trips/catalog.contracts.ts`, `city-guides.ts`, `city-guides.contracts.ts`.

- City: `id`, `name` (255), `slug`, `country` (100), nullable `description` (5000), required `coverImageUrl`, `isFeatured`, timestamps.
- City detail adds `destinations` and nullable `guide`. Embedded destinations are limited to 20; the dedicated destination list endpoint supports pagination.
- Guide: `cityId`, nullable `hook` (500), timestamps.
- Section: `id`, `cityId`, nonnegative `position`, `layout`, nullable `eyebrow` (80), required `title` (255), nullable `navLabel` (40), `tags[]`, `snippets[]` (maximum 20), nullable `actionLabel` (80), timestamps.
- Item: `id`, `sectionId`, nonnegative `position`, required `title` (255), nullable `description`, `imageUrl`, `emoji` (16), `accent`, `tag` (60), `highlight` (255), `ratio`, `stat` (60), `points[]` (maximum 20), `note`, `navLabel` (40), timestamps.
- Layouts: `snippets`, `highlights`, `masonry`, `checklist`, `badges`, `rail`, `info`, `cta`.
- Accents: `coral`, `sunset`, `gold`, `mint`, `sky`, `lilac`, `rose`. Ratios: `tall`, `portrait`, `square`, `landscape`.
- Sections/items sort by position, then creation time and ID. Guide deletion cascades sections/items. Do not use deletion to reset content.
- Existing default editorial headings documented in `pland/docs/city-guides.md`: Start here; Top attractions; Coastal delights; Why you'll love it; Save these; Where to stay; Pick your vibe; Eat like a local; Drink like a local; Good to know; Final Call. These are editable content conventions, not mandatory city categories. Replace coastal-specific headings for inland cities.
- Schema currently has no destination/action target, locale, publication revision/status, or guide source evidence fields. Store research citations/verification in the content deliverable pending additive contract support; do not silently put unsupported properties into import payloads.
- Mobile CTA currently routes to `/trip/new`; guide cards do not yet navigate to an associated destination. Developer must connect targets.

## Actual destination fields

Source: `pland/src/schema/trips/catalog.contracts.ts`; database definitions in `pland/src/schema/trips/index.ts`.

`id`, optional nullable `cityId`, `slug`, `title` (255), `location` (`city`, `country`, optional latitude/longitude), nullable `description` (10000), `category`, `tags[]` (20 maximum; each 50), nullable `openingHours` (255), nullable `tips` (5000), required `coverImageUrl`, `gallery[]` (50 maximum), `ratingAverage` (0–5), `ratingCount`, `visitorCount`, nullable `popularityRank`, required `fromPriceMinor`, `currency`, nullable `pricingTiers`, nullable `lastCuratedAt`, `isFeatured`, timestamps. Public DTO groups rating and fromPrice and includes `isFavorite` and location label. Do not fabricate ratings, visitors, prices, coordinates, or image URLs to satisfy the current contract. Unknown price needs contract treatment; zero must not mean unknown.

Category values are `adventure`, `beach`, `culture`, `city`, `food`. Collection types are `recommended`, `trending`, `seasonal`, `new`; these labels do not establish measured popularity.

`pricingTiers`: local currency/adultMinor/optional childSeniorMinor/notes, optional approximate USD adultMinor/childSeniorMinor. Current source currency and date must be verified before using travel prices.

Existing destination visit profile: `destinationId`, `timezone`, `scheduleCoverage` (unknown/partial/complete), nullable paired `minimumVisitMinutes`/`maximumVisitMinutes`, `wheelchairAccess` (unknown/accessible/partial/inaccessible), `weatherExposure` (unknown/indoor/outdoor/mixed), `bookingPolicy` (unknown/not_required/recommended/required), nullable `advanceBookingMinutes`, `travelAdvice`; evidence includes verificationStatus (unverified/verified), sourceName, sourceUrl, observedAt, verifiedAt, validUntil. Source: `pland/src/schema/trips/destination-knowledge.ts`. Verified records require evidence and consistent dates.

Other knowledge tables exist: `places`, `destination_places`, `place_offerings`, `catalog_prices`, `catalog_hours_exceptions`, `destination_travel_estimates`, `planner_feasibility_assessments`. Their presence does not establish a mobile read flow; currently only visit-profile public reads were verified. Reuse these where appropriate instead of creating a duplicate knowledge system.

## Paths and APIs

| Purpose | Verified path |
|---|---|
| Public catalog routes | `pland/src/http/catalog.ts` |
| Catalog repository | `pland/src/repositories/catalog.ts` |
| Initial seed | `pland/src/seed/catalog.ts` |
| Existing Da Nang guide fixture | `pland/test/fixtures/da-nang-guide.json` |
| Guide lifecycle/migration documentation | `pland/docs/city-guides.md` |
| Knowledge schema documentation | `pland/docs/destination-knowledge.md` |
| Existing admin guide editor | `pland/ui_admin/CityGuideEditor.tsx` |
| Existing generic admin record editor | `pland/ui_admin/RecordEditor.tsx`, `AdminPage.tsx`, `form.ts` |
| Existing image input | `pland/ui_admin/PhotoInput.tsx` |
| Catalog admin routes | `pland/src/http/admin-catalog.ts`; inspect app registration for generic data routes |
| Image delivery/upload | `pland/src/http/city-photos.ts` |
| Mobile catalog mapper/query hooks | `loka/src/features/travel/services/travel-api-service.ts` |
| Mobile guide renderer | `loka/src/features/travel/components/city-guide-sections.tsx` |
| Mobile demo data | `loka/src/features/travel/city.data.ts`, `travel.data.ts` |

Public routes: `GET /api/cities` (q, featured, limit); `GET /api/cities/:id`; `GET /api/destinations` (q, category, cityId, tag, sort, pagination); `GET /api/destinations/:id`; `GET /api/destinations/:id/visit-profile`; `GET /api/collections`; `GET /api/collections/:slug/destinations`; `GET /api/city-photos/:key`. City/destination route identifiers are UUIDs, not slugs. Public catalog supports an optional session; mobile currently gates catalog behind sign-in.

Mobile tabs: `/` Home; `/trips`; `/explore` actually the planner; `/favorites`; `/profile`. Stacks: `/search`, `/traveler/[id]`, `/city/[id]`, `/destination/[id]`, `/collection/[slug]`, `/trip/new`, `/trip/[id]`, `/plan/[id]`, `/booking/new`, `/settings`, `/sign-in`. No standalone all-cities route or booking-detail route was found. Prefer the Cities search scope for Home's city “view all”; do not route that action to the planner.

## Inventory limitations

Repository seed contains Da Lat, Hoi An, Kyoto, Da Nang, with two destinations each. Only Da Nang overlaps the confirmed rollout; the four other requested cities may still exist in the live database, which could not be reached from this audit environment. Guide documentation describes an earlier Da Nang migration with 11 sections/33 cards, not a verified current live count. Seed conflict handling does not update existing rows. Current migration-journal reconciliation must precede any developer migration run.

## Research payload recommendation

For each city, prepare: proposed slug/name/aliases; description/hook; ordered sections with current layout-compatible text; destination references by proposed slug; source URLs and per-claim verification status; imagery subject/rights brief; explicit unknowns. For each destination: identity, parent city, category, description, tips, sourced operational facts or null, visit-profile draft, source log, image brief. Keep `proposedActionTarget`, `sourceEvidence`, `locale`, `publicationStatus` in a clearly separate BA requirements envelope until contracts support them. No import or publication is implied by this document.
