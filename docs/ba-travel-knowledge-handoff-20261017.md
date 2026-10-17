- **Focus Loka on useful travel knowledge for five Vietnamese destinations:** Da Nang, Ho Chi Minh City, Ha Noi, Nha Trang and Ninh Binh. Phase 1 has no traveler-facing prices or monetary amounts; Create New Trip remains with Low / Medium / Luxury preference only. Booking, marketplace, AI and social expansion are outside this release.
- **Build on the existing product:** mobile routes, catalog APIs, structured city guides, destination knowledge storage, image uploads and admin editors already exist. Extend these contracts and connect content rather than replacing the application or redesigning admin.
- **Correct trust and navigation before adding volume:** production queries can substitute sample catalog/favorites, city “view all” opens the planner, and editorial cards lack destination targets. These undermine the knowledge product even when the screens look polished.
- **Review every mobile component using Home/Profile's visual language:** lighter typography, generous spacing, rounded image cards and restrained surfaces, including compact Home search and consistent VI/EN labels. Preserve approved behavior and existing trip/profile functionality; Tripzen is visual inspiration, not a new navigation specification.
- **Developer implementation is required:** this BA audit changes documentation only. Current API/database coverage and image failure causes remain unverified; preserve all in-progress work and existing records, reconcile live data, then implement/admin-publish the reviewed content.

# Loka developer handoff — travel knowledge release

Prepared 17 October 2026. Decision owner: product user. BA owns requirements, evidence, research and acceptance; developer owns implementation, migrations, testing and integration. Content review/publication ownership still needs assignment. Latest screenshot-driven requirements and annotated issue list: [mobile visual QA addendum](ba-mobile-visual-qa-20261017.md). This extends visual review to Home/Profile themselves and requires consistent selected-language UI throughout mobile. **Mandatory latest scope: [Phase 1 no-pricing amendment](ba-phase1-no-pricing-20261017.md)** supersedes any earlier monetary-display recommendation. Current-state price references below are findings to remove from traveler views, not requirements to retain them.

## Scope and success

The confirmed journey is: “I want to visit a famous destination → find its city → understand what is worth visiting and how to prepare → open a specific place → use useful tips, save it or open its location.” The initial discovery scope is the five cities above. Treat Ninh Binh as a traveler destination area without inventing a precise municipal boundary. Existing out-of-scope content and trip references must survive filtering/migration.

Included: mobile Home, search, city guides, destination details, collections and favorites; consistent styling/state behavior on existing secondary mobile screens; backend catalog/content contracts; editing city/destination content using the existing admin presentation; image validation/delivery/fallback; researched drafts and source tracking. “Dynamic” means traveler-facing city/destination copy, facts, images, ordering and discovery inclusion come from backend/admin. UI translations, security rules and design tokens need not become arbitrary remote configuration.

Excluded: traveler web redesign, admin UI redesign, unrelated admin features, new payments/marketplace/vendor integrations, AI itinerary generation, live social network, notification infrastructure, live weather/routing, purchased assets/accounts, deployment or data publication by this BA. Existing booking/trip functions are regression scope, not growth scope.

Task-based audience hypotheses: first-time visitors need orientation and practical tips; visitors already in a city need a quick place decision and map handoff; returning travelers need reliable saved content. Confidence: medium, derived from the user's stated job, not interviews. No market sizing, monetization, conversion forecast or numeric RICE score is justified by available evidence. Use Must/Should/Could priorities below. Suggested metrics, without invented targets: successful search-to-guide visits, useful section-to-detail taps, saves, repeat guide use, image failure rate, empty-search rate and content freshness coverage. Define analytics/privacy implementation separately if absent.

## Evidence and current implementation

Evidence labels: **V** repository/task API verified; **O** direct simulator observation; **H** historical task report, not rerun; **A** assumption; **R** recommendation. File paths below are relative to `/Users/xuanthainguyen/Desktop/loka-pland` and refer to the working tree inspected on this date, including uncommitted work.

### Stack and boundaries (V)

| Layer | Actual stack and role |
|---|---|
| Mobile `loka` | Expo ~57.0.18, React Native 0.86.3, React 19.2.3, Expo Router, TypeScript, HeroUI Native/Uniwind/Tailwind, TanStack Query, Reanimated/Gorhom bottom sheet, i18next, Better Auth/Expo SecureStore, expo-image |
| Backend `pland/src` | Bun/Hono, TypeScript, Drizzle/Neon PostgreSQL; Better Auth; Redis/BullMQ; Cloudflare R2; installed Strands/OpenRouter infrastructure does not prove a working AI feature |
| Existing admin `pland/ui_admin` | React editors within the Vite web application/router, role-guarded generic record management plus city guide editor and photo input; reuse its presentation |
| Traveler web `pland/ui` | Vite/React/React Router/HeroUI; inspected only as integration context; excluded from this design release |

Architecture sources: both `README.md`/`AGENTS.md`, package manifests, `loka/docs/architecture.md`, `pland/src/app.ts`, `pland/ui_admin/README.md`. Mobile route files are thin feature entry points. Public catalog APIs allow optional sessions, but mobile currently guards catalog routes behind authentication. Guest browsing is a product decision, not an implied requirement.

### Routes and completion assessment (V unless marked)

“Implemented” here means substantial source flow exists, not production acceptance or verified backend availability.

| Screen/route | Existing behavior | Gap or qualification |
|---|---|---|
| Home `/` | Modern header/hero/sheet, city and collection rails, trip cards, planner shortcut, demo traveler rail | Catalog fallback; city view-all opens `/explore` (planner); recent plan opens trips; header avatar/notification actions incomplete; unconditional notification dot |
| Search `/search` | All/Places/Cities/People, debounce, per-section errors/retry, place pagination | City list capped, no city pagination; global demo suggestions; people are labeled Demo, not real nearby people |
| City `/city/[id]` | Hero, dynamic guide with eight layouts, jump chips, destinations, filters, map/create trip | Guide cards not connected to destinations; CTA always creates trip; embedded detail list limited to 20, full destination query separate |
| Destination `/destination/[id]` | Hero/gallery, tags, prices, map, favorite, add-to-trip, same-city suggestions, visit-profile loading/error/expiry | Practical knowledge can be overshadowed by checkout; unknown/value semantics need review; same-city is not proximity |
| Collection `/collection/[slug]` | Destination listing/navigation | Missing collection can become broad destination list; ignores loading/error in screen; sample fallback on empty |
| Favorites `/favorites` | Categories, recent row/list, favorite controls | Empty/error can show five sample saved places; “recent view all” opens `/collection/new`; missing food/city categories; options icon has no action |
| Profile `/profile` | Modern cover, overlapping avatar, API identity, own trips, private-default photo upload, swipe Trips/Photos/Saved | Cover is sample Swiss Alps image; follower/following values shown unavailable; Saved uses real empty state, unlike Favorites |
| Traveler `/traveler/[id]` | Fictional traveler profiles, explicitly Demo | No real following/nearby service; do not build social for this scope |
| Trips `/trips` | Server trips, invites, bookings, plans, refresh/retry/empty states | Dense older styling; invitation failure not surfaced; upcoming filtering may include cancelled; implementation language visible (O) |
| Trip create/detail `/trip/new`, `/trip/[id]` | Trip CRUD, ownership/roles, stops, companions/invites, bookings/cancel | Preserve access controls; replace-stops concurrency is a backend review risk; no new planning features required |
| Planner `/explore` | Multistep context and server session CRUD | Name differs from route; explicitly AI coming soon, not itinerary generation |
| Plan `/plan/[id]` | Read/edit/archive/delete saved plans | Archived maps to completed; missing cost/rating become zero; Home can mix a demo plan with saved plans; some failures lack visible retry |
| Booking `/booking/new` | Owner trip/package/date creation and server calculation | Does not establish live inventory/payment/vendor confirmation; bookings navigate to destination rather than booking details; preserve, do not expand |
| Settings `/settings` | Name/avatar, language, signout | Language selection not persisted; many disabled account/help/legal rows still look actionable; verified badge lacks established evidence |
| Sign-in `/sign-in` | Google auth/secure session and guarded routes | Visual alignment/regression only unless guest access is separately decided |

Route sources: `loka/src/app/_layout.tsx`, `loka/src/app/(tabs)/_layout.tsx`, corresponding `src/features/*/screens/*`. Full field/path inventory is in [ba-content-contract-inventory-20261017.md](ba-content-contract-inventory-20261017.md).

### Baseline visual system and observed differences

**V:** `loka/src/theme/theme.ts` uses light background `#f8f7f5`, foreground `#161b20`, surface white, secondary `#f4f2ef`, muted `#636a71`, accent `#2045e8`, border `#e1dfdb`. Spacing is 4/8/12/16/20/24/32/40/48; radii include 8/12/16/24/28/full. System typography, not confirmed Inter Tight. `global.css` duplicates tokens; check consistency when extracting components. `theme-provider.tsx` forces light; dark token existence is not dark-mode support.

**V:** Home section gutter 20/gap 28, headings approximately 19/26 weight 600, 15–16 radius image cards, dark trip card radius 24. Profile: cover with rounded white body radius 28, overlapping 104 avatar, name 23/30 weight 600, bio 15/23 and compact portrait grid. Sources: `home-sheet-content.tsx`, `home-section-header.tsx`, `profile-screen.tsx`. These are the implementation baseline. No exact pixel specification is inferred from the external kit.

**O:** I inspected the running iPhone 17 Pro/iOS 26.5 simulator on the user's machine, using read-only tab navigation. Home and Profile appeared lighter and more image-led than Favorites/Trips, which had heavier headings, denser borders and tighter card radii. Several destination images were blank/grey, including My Khe in Favorites; visible Da Nang/Hoi An city covers rendered. No screenshots were saved as durable artifacts. Interaction stopped when the tool reported that the user changed the simulator. This was not a full test run and was not browser activity on the user's machine.

**External reference (parent-provided observation):** [Tripzen](https://ui8.net/vektora-studio/products/tripzen---ai-travel-mobile-app-ui-kit) previews show pale blue/green/yellow panels, charcoal primary controls, rounded imagery/pill filters, blue active navigation, stacked settings and Inter Tight. Use visual rhythm and information hierarchy, not its route structure or commercial/AI flows. Static mocks have inconsistent durations and confirmation wording and do not prove behavior/accessibility. Parent inspected public mock images through cloud browsing; no purchase/account access.

## Priority backlog and acceptance

P0/Must is release-blocking for trustworthy discovery. P1/Should completes consistency and usability. P2/Could is deferred until the knowledge journey is accepted. Dependencies identify sequencing, not parallel implementation instructions.

### K01 — Backend/admin content ownership and five-city rollout (P0/Must)

Problem/outcome: travelers need current, consistent content; editors need to change it without shipping an app. Story: As a content editor, I can maintain city guides and destination facts in existing management so published edits reach mobile reliably.

Reuse cities/destinations/guides/sections/items, existing knowledge evidence tables and existing admin editors. Add only necessary fields/contracts: rollout inclusion/order, aliases, content locale policy, publication/revision metadata, linked entity/action targets and guide source evidence. Existing `isFeatured` is not a complete publication workflow. Preserve admin layout/navigation; any additional input needed to manage these records must fit existing editor patterns. No unrelated admin feature changes.

Acceptance:

- Given existing data and saved references, when reconciling the five-city scope, then reuse stable IDs, report duplicates/aliases, and retain every out-of-scope record and historical reference; default discovery returns only eligible published rollout content.
- Given a draft guide, when an editor saves through existing management, then it remains unavailable publicly until its publish condition is met; publication validates required identity, meaningful content, links and image readiness. This workflow is a recommendation to implement, not a claim it exists.
- Given a published record, when approved copy/order/image changes are published, then mobile reads the new revision after explicit refresh/cache invalidation without app rebuild. Developer must document and test the agreed propagation policy.
- Given an unauthorized session, when attempting catalog writes, then existing admin authorization rejects them; traveler clients never call admin write endpoints.
- Given concurrent edits or import retries, when changes are applied, then conflicting revisions are reported and retries do not duplicate records or overwrite unrelated editorial edits.

Dependencies: live read-only inventory; migration-journal reconciliation; field mapping from contract inventory; content review owner. QA: permission/validation tests, compatibility of public DTOs, update-to-mobile test, import dry-run/diff and rollback plan. Do not replay migrations blindly: `pland/docs/city-guides.md` flags journal reconciliation work.

### K02 — Truthful data states and knowledge contract (P0/Must)

Problem/outcome: a polished screen displaying fabricated saves, popularity or prices breaks trust. Story: As a traveler, I can distinguish actual content, missing facts and temporary failure.

Sources: `travel-api-service.ts` (`useHomeCatalog`, `useCollection`, `useFavorites`), `travel-plan-api-service.ts`, `city.data.ts`. Production queries currently replace empty/failed responses with demos; `useFavorites` is especially misleading. Destination detail does guard mismatched fallback IDs; do not remove its existing protection while correcting the broader policy.

Acceptance:

- Given zero saved places, when Favorites or Profile Saved opens, then both show the same truthful empty state with a discovery action and zero count.
- Given catalog/collection failure or 404, when loading finishes, then show retry or not-found as appropriate, never an unrelated broad list or demo city. Cached real data may remain clearly stale if that policy is chosen.
- Given unknown rating/hours/visit duration, when rendering, then show an explicit unavailable state or omit it; do not imply zero rating or a confirmed schedule. Phase 1 omits all pricing, including free/unavailable-price labels, regardless of whether a value is known. Preserve stored fields and use the no-pricing contract amendment.
- Given a verified or expired knowledge fact, when displaying practical information, then its source/check date or needs-verification status is available; do not equate an edited timestamp with independent verification.
- Given demo fixtures retained for development, when production discovery runs, then they cannot appear as real results/saves/plans. User-approved Demo people remain clearly labeled if retained and are not presented as live nearby activity.

Dependencies: K01 status/rollout semantics. QA: empty/404/401/500/offline/stale fixtures; ID validation; favorite failure rollback; no unearned rating/visitor statistics. Existing fallback policy in `loka/docs/api-integration.md` must be superseded explicitly.

### K03 — Images that load and depict the correct place (P0/Must)

Problem/outcome: blank or unrelated photography makes destinations hard to judge. Story: As a traveler, I see relevant imagery or an honest fallback on every card and detail.

Evidence: blank destination images observed (O); some city covers loaded (O). Seed reuses photo `1559592413-7cec4d0cae2b` for Hoi An city, Da Nang city, Hoi An ancient town and Ba Na; photo `1528127269322-539801943592` spans Da Lat/flower park/Marble Mountains (V). Subject suitability needs review. Direct Unsplash request failed DNS in the audit environment; this does not prove a bad URL. Local API was unreachable, so no live URL failure inventory exists.

`pland/src/http/city-photos.ts` constructs an absolute upload URL from request origin. A localhost/private-origin URL saved by admin is a plausible physical-device failure cause (A, medium), not an established diagnosis. Public delivery reads R2 objects, supports JPEG/PNG/WebP and immutable caching; `PhotoInput.tsx` uploads immediately and removing a reference does not remove the object.

Acceptance:

- Given every rollout city/destination and guide image, when auditing from the deployment environment, then produce a manifest with entity ID/field, URL, redirect/status, MIME, decode/dimensions, subject match, rights/source, result and checked date.
- Given a valid managed image, when opening it in existing admin preview and mobile on simulator and physical device, then it loads over the supported public origin; no localhost, expired signed link or missing object is persisted as a permanent public asset.
- Given missing/invalid/slow imagery, when rendering any card/hero/gallery, then preserve dimensions, show a neutral relevant fallback with accessible labeling and allow content use. Do not substitute a different city's photograph.
- Given image replacement, when published, then a new version/key or valid cache strategy displays the replacement; no old immutable URL is silently reused for changed bytes.

Dependencies: live catalog export, public asset base policy, licensed assets. QA: malformed URL/404/403/redirect/non-image/oversized/slow response, crop/focal point, Vietnamese titles, all five city covers. Do not solve an image issue by disabling authorization on admin uploads.

### K04 — Useful Home sections and search (P0/Must)

Story/outcome: As a visitor deciding where to go, every discovery tile and “see all” action takes me to the content its label promises.

| Home element | Required destination/content |
|---|---|
| Search | Search screen with actual published city/destination results and VN aliases |
| Explore cities card | That city's dynamic guide |
| Explore cities see all | Cities search scope or a dedicated city list if agreed; never planner |
| Curated collection heading | Matching collection by slug, backend title/description/order and real membership |
| Destination card | The matching destination detail |
| Recent plan/trip | Correct `/plan/[id]` or `/trip/[id]` based on entity type; see all can open Trips |
| Next trip | Relevant non-cancelled upcoming trip; no invented trip if absent |
| Planner shortcut | Existing planner, accurately labeled; secondary to knowledge |
| Avatar / bell / overflow | Real supported action, or remove unsupported affordance; no notification badge without data |
| Demo traveler rail | If retained, clearly Demo and lower priority; no suggestion of actual proximity |

Acceptance:

- Given the rollout is published, when searching `Da Nang`/`Đà Nẵng`, `Ha Noi`/`Hanoi`, `Ho Chi Minh`/`HCMC`/`Saigon`, Nha Trang or Ninh Binh, then aliases resolve to the intended canonical city and relevant destinations without duplicates.
- Given Home section labels and selected filters, when opening a card/see-all and returning, then destination, title, city/filter context and scroll behavior remain consistent.
- Given search failure, no results or additional pages, when interacting, then distinct retry/empty/load-more states work; suggestions come from curated eligible content, not global demos or unsupported “popular” claims.
- Given a nonempty collection with missing/unpublished members, when opened, then only eligible members appear with accurate counts; an entirely empty collection is hidden on discovery or explicitly empty, never substituted.

Dependencies: K01–K03, existing uncommitted search changes. QA: route assertions for every Home action, city alias/pagination tests, slow-query cancellation and query preservation; screen reader names for icon controls. Preserve Home header, hero, tab bar and bottom-sheet behavior approved in existing task context.

### K05 — City guide as the knowledge hub (P0/Must)

Story/outcome: As a first-time visitor, I can quickly understand the city, find useful places and prepare for a comfortable visit.

Required content: orientation/why visit, distinct attractions, suitable trip styles, local food/drink context, neighborhood/stay-area orientation without booking promises, arrival/getting around, seasonal preparation, etiquette/accessibility notes and source freshness. Reuse eight layouts; do not force a beach section into Ha Noi/Ninh Binh. Section density is editorial, not a requirement to pad every city to 11 headings.

Acceptance:

- Given any of the five published cities, when opening its guide, then its own backend text and image appear; no hardcoded Da Nang copy leaks into another city.
- Given an attraction/food/place card, when its action is offered, then it opens a linked destination, a relevant filtered list, map or useful expanded information as declared by a typed target. Invalid/unpublished targets cannot publish as active links.
- Given a city has more than the embedded 20 destinations, when viewing all/filtering, then pagination reaches the complete eligible dataset and does not treat the first page as the whole city.
- Given no guide or no destinations, when opening, then show available real city information with a clear partial state and usable back/search action; never another city's guide.
- Given mixed text lengths, when scrolling chips/sections, then headings land below safe-area controls, text remains readable and navigation does not trap the user.

Dependencies: guide target contract and city research pack. QA: all eight layouts, long Vietnamese text, empty arrays, large lists, section reordering and broken target handling. Files: `city-detail-screen.tsx`, `city-guide-sections.tsx`, `city-destination-board.tsx`.

### K06 — Practical destination detail (P0/Must)

Story/outcome: As a visitor evaluating a place, I can decide why to go, how to prepare and what remains uncertain.

Recommended hierarchy: subject-accurate hero/name/city → why visit/what to expect → practical visit facts → useful tips/accessibility/weather exposure → map/save → relevant places. Reuse source-aware visit profile. Keep add-to-trip available as secondary utility; remove pricing sections and do not introduce checkout/payment work. Gate commercial creation that would otherwise submit a hidden priced commitment; retain existing records. Create New Trip remains available.

Acceptance:

- Given a destination from any entry point, when opened, then identity, parent city, guide link, images and source facts agree with the published backend record.
- Given verified practical facts, when shown, then duration, schedule, access and preparation are understandable; time-sensitive values have a source/check date and expired facts are qualified. Ticket prices/currency and other monetary facts are omitted in Phase 1 even if verified.
- Given unknown coordinates or opening times, when using the screen, then there is no invented map pin or precise opening claim; available actions explain their limitations. No price/free badge appears in any case.
- Given favorite/map/add-to-trip interaction, when it succeeds or fails, then state and feedback are accurate across list/detail/Profile; existing permissions persist.
- Given recommendations from the same city, when labeled, then they are called same-city/related rather than nearby unless distance evidence exists.

Dependencies: K01–K03, research evidence. QA: missing knowledge, expired profile, invalid ID, offline content, permissions, large font, no source-free safety/accessibility claims. Files: `destination-detail-screen.tsx`, `visit-profile-card.tsx`, `detail-guide.ts`, `pland/docs/destination-knowledge.md`.

### K07 — Favorites and visual consistency (P1/Should, truthful empty state is P0)

Story/outcome: As a returning traveler, I recognize the same card language and can return to saved knowledge confidently.

Acceptance:

- Given saved destinations across adventure/beach/culture/city/food, when filtering, then all supported categories are accessible, results/counts agree and clearing filters restores the list.
- Given Favorites “see all,” when tapped, then it reveals the relevant saved set, not `/collection/new`; “recent” requires an actual saved timestamp or neutral wording.
- Given card/list/detail variants, when comparing them with Home/Profile, then type hierarchy, spacing, corner treatment, imagery, pressed/disabled/loading states and icon sizes are coherent. Avoid blindly replacing every radius with one number.
- Given any unsupported overflow action, when reviewing controls, then it is removed or disabled with understandable treatment rather than a silent tap.

Dependencies: K02–K03 and shared design decisions. QA: empty/populated/error/filtered screenshots and save/unsave synchronization. Scope shared primitives carefully because Home components are being edited concurrently.

### K08 — Secondary mobile screens and preserved flows (P1/Should)

Story/outcome: As an existing user, my trips, photos and settings remain usable and look consistent while the app emphasizes knowledge.

| Screen group | Acceptance and regression expectation |
|---|---|
| Profile/traveler | Given own profile, when displayed, then preserve no Follow/no root back, swipe tabs, aligned content starts and adaptive panel height. Preserve private-default photo upload, owned-trip selection and pagination/error states. Do not reintroduce removed photo filters. Sample cover and Demo people remain honest; no real follower claims. |
| Trips/create/detail | Given role/ownership, when editing or viewing, then existing permissions, invite handling, stop limits and cancellation continue to hold. Given failure, then show actionable feedback. Remove database implementation copy from traveler UI. Match Home/Profile spacing/type/cards. |
| Planner/plan | Given existing session/plan, when reopened or archived, then IDs/statuses and saved values are accurate; archived is not automatically completed, unknown is not zero. Given no AI generation, then no success promise implies one. Do not add generation. |
| Booking | Given existing records, when viewed, then IDs/access and noncommercial record actions are preserved without displaying totals. Gate new commercial creation rather than submit hidden priced commitments. No payment/vendor confirmation claim is added. Missing booking-detail flow is a known deferred gap. |
| Settings/sign-in | Given supported actions, when tapped, then edit/signout/auth work. Given chosen language, then persist it if included in release acceptance. Unavailable help/legal/account actions must not look active. Verify badge meaning or remove unsupported verification claim. |

Dependencies: core journey acceptance first, explicit decision on commercial visibility. QA: regression smoke tests for role permissions, photos, signout/cache clearing, Vietnamese/English, keyboard/safe areas and long text. Do not rebuild admin or traveler web to match mobile.

## Content research and population plan

**Latest package supersedes raw research for traveler publication:** [Phase 1 combined content](content-staging-20261017/phase1-five-city-content.md) contains all 37 cards with no monetary amounts, pricing sections, fares/cost comparisons or free-entry claims. Library source: `libfile_a3af8b8998908191bffefa16eb91ef2d`; revised ZIP: `libfile_68bad7961bb88191a253ea3216ff9fc8`. The original staged packs remain internal provenance only. Use the revised pack for schema mapping, reviewed translation and image clearance; nothing is imported or published.

The completed research drafts are staged in [content-staging-20261017/README.md](content-staging-20261017/README.md): five city guides and 37 destination drafts (Da Nang 7, Nha Trang 6, Ha Noi 8, Ninh Binh 8, Ho Chi Minh City 8). The staging index maps research fields to actual contracts and preserves source, date, refresh, language and image-rights holds. They are English editorial drafts, not database imports or published/independently reverified operational facts. Developer imports reviewed content through existing management/backend workflows. The compact table below is orientation only; use the staged packs for full content. Do not present seed copy as researched evidence.

| City | Source-backed orientation and initial destination candidates | Preparation topics to research before publishing |
|---|---|---|
| Da Nang | Coastal base with beach, mountain and food experiences; start with My Khe, Marble Mountains and Son Tra. [Vietnam Tourism](https://vietnam.travel/places-to-go/south-central-coast-central-highlands/da-nang) | Beach conditions, exposed outdoor visits, stairs/access at Marble Mountains, current access rules, airport transfer options, regional food guidance |
| Ho Chi Minh City | Urban history, markets and food; start with Central Post Office, Independence Palace and Ben Thanh Market. [Vietnam Tourism city guide](https://vietnam.travel/places-to-go/southeastern-vietnam/ho-chi-minh-city), [attraction guide](https://vietnam.travel/things-to-do/7-must-see-attractions-hcmc) | Heat/rain preparation, travel between districts, market etiquette, museum content suitability, operator-verified hours/tickets |
| Ha Noi | Old-quarter streets, lake life and heritage; start with Hoan Kiem Lake, Old Quarter and Temple of Literature. [Vietnam Tourism city guide](https://vietnam.travel/places-to-go/red-river-delta/ha-noi), [attraction guide](https://vietnam.travel/things-to-do/11-must-see-attractions-ha-noi) | Walking conditions, cultural etiquette, seasonal preparation, airport arrival, current monument access and food context |
| Nha Trang | Seaside visits with cultural stops; start with city beach, Po Nagar Cham Towers and Long Son Pagoda. [Vietnam Tourism city guide](https://vietnam.travel/places-to-go/south-central-coast-central-highlands/nha-trang), [weekend guide](https://vietnam.travel/things-to-do/perfect-weekend-nha-trang) | Cam Ranh gateway/transfer options, marine conditions, sun/rain preparation, respectful temple visits and confirmed accessibility |
| Ninh Binh | Karst scenery, waterways and historical sites; start with Trang An, Hang Mua and Hoa Lu. [Vietnam Tourism](https://vietnam.travel/places-to-go/red-river-delta/ninh-binh), [UNESCO Trang An](https://whc.unesco.org/en/list/1438/) | Distinguish town/region/sites, boat routes and operator rules, climb effort, weather exposure, distances/transfer options; do not label all Ninh Binh UNESCO |

Coverage gate (R): each city needs an accurate orientation, useful preparation section and linked destination set sufficient to support every promoted Home section. The table's three candidates per city are a research starting set, not an agreed maximum or proof of completeness. Maintain a matrix for every promised section/destination: draft copy, source, operational facts checked/unknown, image/rights, link target, locale, reviewer and publish readiness. Expand quantity only where editorial usefulness is clear.

Research rules: retain source URL/title and claim-level check dates; prefer official tourism for general context and venue/operator sources for current hours/tickets/access. Do not copy stale tourism-page prices or infer safety from promotional language. Do not claim therapeutic mud-bath benefits, universally safe swimming or guaranteed travel times. Use null/unknown until verified. Source access date alone is not verification of every statement on a page. AI-written drafts require editorial review and must not invent ratings or visitor counts.

Existing repository seed has four cities (Da Lat, Hoi An, Kyoto, Da Nang), eight destinations total, and only Da Nang overlaps this rollout. This does not prove the other four requested cities are absent live. The seed uses `onConflictDoNothing`, so rerunning it is not an update strategy. Da Nang guide migration/fixture content must be audited before reuse, not overwritten. Historical documentation reports 11 sections/33 cards; current live size is unknown.

## Delivery sequence and verification gate

1. Developer reads the working tree and this handoff, preserves ongoing Home/Profile/Search edits, reconciles live catalog IDs/aliases/images and migration journal. Produce dry-run inventory/diff.
2. Agree minimum additive content contracts, unknown-value behavior, publication policy and target actions. Keep existing admin presentation and permissions.
3. Prepare/review five-city and destination content with source/rights log; map records and links without destructive replacement. Resolve image delivery/subject failures.
4. Implement truthful data states and Home→Search/Collection→City→Destination→Save/Map journey. Validate edited admin content appears dynamically.
5. Apply shared mobile visual rules to remaining screens and run focused regression tests. Compare Home/Profile before/after so approved layout is preserved.
6. Content owner reviews the actual draft dataset and mobile previews; developer follows existing release process. This document does not claim deployment, import or publication.

Release QA must cover all five cities from Home and search; alias matching; correct parent-child relationships; every promoted card/action; source/expiry/unknown handling; zero/one/many records; missing/404/failed/slow images; failed API and recovery; save persistence; unauthorized admin writes; draft visibility; and revision propagation. Use narrow and wide supported phones, iOS/Android, dynamic text, screen readers, keyboard/safe areas and slow network. Contrast/tap-target checks require measurement, not assumptions from mockups. Verify data and navigation with automated tests where suitable; use screenshots/manual review for hierarchy/crops. Add no test suite solely mirroring style constants.

No tests/builds were run by this BA. Historical developer reports mention mobile typecheck/lint/web bundle and search tests passing, alongside pre-existing backend/web typing failures. These are **H**, not current acceptance evidence. Developer should rerun relevant checks against the eventual combined changes and report pre-existing failures separately.

## Assumptions, sources and risk log

| ID | Type/confidence | Evidence or limitation | Consequence |
|---|---|---|---|
| S1 | V/high | User explicitly selected five cities and knowledge-first/admin-managed scope, mobile/backend only, no admin redesign | Governs this handoff over older planner-oriented documents |
| S2 | V/high | Repository manifests, route/source files and schemas listed above; inspected uncommitted working tree | Source-level feature assessment, not production guarantee |
| S3 | O/high for visible state | Read-only simulator observation on user's machine; no durable captures | Visual mismatch/blank image observations are credible but not root-cause proof |
| S4 | V/high limitation | localhost:3000 API connection failed; Unsplash DNS failed in audit environment | Live record counts and URL reachability cannot be certified |
| S5 | A/medium | Request-origin absolute upload URLs may encode an inaccessible origin | Investigate persisted URLs before choosing a fix |
| S6 | R | Draft/review/publish/revision/locale/targets for guide records | Proposed additive requirements; current schema does not provide all of them |
| S7 | A/medium | Vietnamese-first content is likely appropriate; app supports VI/EN | Confirm content language depth; do not duplicate translated facts without review |
| S8 | External/source-qualified | Official Vietnam Tourism and UNESCO links above | General starter facts only; current operating details need venue verification |
| S9 | Parent observation | Tripzen public previews and visual findings | Inspiration only; no purchased design file or measured accessibility |
| S10 | H | Existing developer task completion reports | Not a replacement for current testing |

Additional risks: data-cascade deletion could remove guides/items; stale docs propose obsolete mock/API arrangements; some schema knowledge has no mobile read contract; fallback samples have cross-city inconsistencies; profile cover is not user-owned dynamic content; dormant OpenRouter service/config exists but no live import use was found, so do not assert a current key leak. Avoid expanding security/AI work absent a concrete issue. Existing migration-journal warning and in-progress changes make wholesale reset especially inappropriate.

Working-tree baseline: `loka` HEAD `8ed2e85`; `pland` HEAD `3ccfdca`. Pre-existing mobile modifications: root layout; Home header/hero/section-header/sheet; Profile screen; recent-trip/destination cards; VI/EN locale files. Pre-existing untracked: search route/feature, traveler route/profile, demo travelers, Profile tabs, who's-around. Backend pre-existing modifications: `src/repositories/catalog.ts`, `src/schema/trips/catalog.contracts.ts`; untracked `test/catalog-search.test.ts`. BA additions are documentation only. No commit, stash, revert or migration was performed.

Task context verified through supported task APIs, not session files: intended developer task **“Thiết kế lại trang cá nhân”**, exact ID `01a14871-5dcd-7161-9d2a-82f5238d31e3`, host local, project directory above. Related tasks: **“Implement mobile Home design”** `01a0e841-7655-7963-a2d7-ff1e968ea5d6`; **“Kết nối app mobile với backend”** `01a06f68-5386-79e1-b302-a1c26aeb7a81`. Parent has coordinated local delivery of the bounded implementation handoff; confirmed delivery status is reported separately.

## Key insights, decisions needed and next steps

The main release risk is content credibility and connected navigation, not lack of screens. Existing guide and knowledge infrastructure can support the direction with focused contract changes. The visual mismatch is strongest in older list/management-style mobile screens; Home/Profile already establish the desired baseline. Image availability, image subject correctness and asset origin are three separate checks.

Decisions needed: content reviewer/publisher; Vietnamese-only first pass versus complete VI/EN; minimum reviewed destination breadth per city; published historical deep-link behavior for out-of-rollout records; whether to demote/hide existing commercial and demo-social surfaces in knowledge discovery; guest browsing; and content propagation/freshness policy. Recommendations: preserve historical references, prioritize Vietnamese content with explicit fallback, keep bookings out of promoted discovery, and use manual editorial publication initially.

Next steps: deliver the concise developer brief and staged research to the verified developer task through supported local task messaging, as requested by the coordinating parent based on the user's explicit developer-handoff instruction. Developer performs the live inventory/image audit, resolves contract decisions, then implements and validates the core journey before broad visual cleanup. BA reviews the resulting content coverage, acceptance evidence and mobile screens against K01–K08. No app/backend change or content publication is represented as complete by this audit.
