# Mobile implementation checkpoint — 17 October 2026

This is an implementation/verification checkpoint, not a full mobile release signoff. Import validation (84 EN/VI versions, 268 assertions) remains a separate earlier result.

## Implemented in this checkpoint

- Home: semantic pale header #EAF4F7, dark foreground #18232D / #566573 at both animation endpoints, dark status bar, featured trip #183D56 and planning banner #EDF2FF. RecentTripCard no longer renders estimated monetary cost (both variants). Positive status text #217A42. Social Demo remains, after travel content. Header height follows text layout.
- Create Trip: optional independent low/medium/luxury preference, localized EN/VI labels, no numeric budget/currency/presets/scope in this form or its create payload. No default monetary budget or conversion from old money. City CTA passes its canonical cityId and prefills city/name without an effect/state cascade. Dates use selected app locale. Back/Continue retains the selection; Cancel creates nothing.
- Backend: nullable trips.budget_preference, request validation, repository and DTO. Additive migration applied to the configured DB; all 4 existing trip records' previous fields hashed identically before/after. Existing money remains stored. No production deployment, trip creation or deletion.
- City/destination: compact 16:9 hero, 80-point fallback for absent/failed images; neutral knowledge surfaces. Destination identity/actions and overview precede operational information; raw untranslated tags and unverified visitor/rank statistics removed from hero. Missing visit-profile has an explicit unknown state. Source link failures now give feedback; content revision distinct from source checkedOn.
- Admin/API/content path: existing catalog-content section JSON accepts stable IDs, supported layouts/items/images and typed city/destination/trip targets. Destination now projects and renders editorialSections and contentUpdatedAt. City guide renders items in all layouts, retains visited panels/expansion, only uses a real typed target or current city for CTA. Existing legacy sections remain backward compatible; explicit IDs should be added during editorial enrichment. No admin redesign and no bulk content enrichment published in this checkpoint.
- Favorites: View all stays in Saved scope; all five categories, loading/error/empty states, refresh. Save/Unsave accessibility label follows current state. Profile VI labels translated. Removed nonfunctional ellipsis from shared travel header.

## Actual verification

Device: existing iPhone 17 Pro simulator, iOS 26.5, UDID 797FA883-E262-49BD-BB0A-C0AB10738837, installed Expo Go, existing Metro localhost:8081. Used cached agent-device 0.21.18, named session loka-checkpoint. No app reinstall/reset, no account sign-out, no trip/favorite/booking mutation during UI QA. Only temporary locale and Dynamic Type changes, both restored.

| Check | Evidence / outcome |
| --- | --- |
| Home VI before/after | home-before.png / home-after.png, visually inspected: new surfaces, dark readable header/status bar, no US$235 on recent trip. |
| Create Trip VI | Traversed all 3 steps, chose Trung bình; create-trip-vi.png. No VND amount/preset/currency/scope controls. |
| Back / Continue | create-trip-back-retained.png visually confirms Trung bình retained. Exited via header, no submit. |
| Favorites View all | Actual tap stayed on favorites list; no collection/new navigation. Opened saved My Khe using correct destination. |
| Destination VI | destination-vi.png, screenshot + AX inspection. Overview/practical content earlier; scroll revealed explicit missing knowledge, no Retry. No save toggle. |
| City VI → Create Trip | city-vi.png; 12 destinations reported for Da Nang; CTA opened form with selected Da Nang and generated name. Cancel returned to city. |
| Profile VI / EN | AX confirms localized stats/tabs in VI and correct English on switch. No own-profile back button. |
| EN Create Trip | Runtime traversed steps and AX confirmed Low / Medium / Luxury. Did not submit. |
| Large text | Temporarily set iOS category extra-extra-extra-large. Found clipped Home text, fixed header measurement and section wrapping. home-en-large.png is after the fix. This is a limited Home/form check, not a full large-text signoff. Exact RN multiplier was not measured. |
| User correction / restore | Before test, settings text-size returned large. Restored exactly large, reloaded Metro, read it again: large. Restored app VI. home-restored.png visually inspected at original size. |
| Backend tests | 38 passed / 0 failed / 753 assertions across trip-budget-preference, app, catalog-localization, catalog-search, city-guides, admin-data, destination-knowledge-api. Includes preference persistence + legacy monetary preservation + invalid rejection + migration idempotency; admin sections/edit → localized API target/revision validation. |
| Type/lint | Mobile tsc passed; ESLint 0 errors, 2 pre-existing unused profile photo-handler warnings. Admin/web tsc -b passed. Backend typecheck only the two pre-existing OpenRouter configuration errors in test/agent.test.ts:126–127. Both repos diff --check passed. |

## Typography baseline and restoration

No global font-family, font-size, line-height or scaling token was increased. The QA setting change from iOS large to extra-extra-extra-large caused the visible enlargement. The one new source font-size increase (HomeSectionHeader actionLabel 12 → 14) was reverted to 12 following the user's correction. Font scaling stays enabled. Header measurement and wrapping remain to avoid clipping; they do not enlarge fonts. Final visible app is VI at original iOS large. Screenshot home-restored.png matches the baseline text size while retaining the new colors/data/no-price changes.

## Skills actually used

- Read react-native-best-practices; kept changes in JS/TS, no dependency/native upgrade or speculative performance claims.
- Read react-navigation; retained native router, safe areas, back flow and existing bottom sheet; city context passes through route params.
- Read agent-device plus bootstrap/exploration; used its open-first pinned simulator session, fresh AX refs, screenshots, reload and reversible settings verification.
- Read dogfood earlier; this pass used acceptance-driven checks and evidence, not a comprehensive exploratory dogfood audit.
- No React component tests were written; react-native-testing was not needed. Backend tests use Bun/PGlite.

## Remaining work / limits

- Full no-price still OPEN: Planner, Trip detail/edit/booking history, saved/generated plan prose and a complete traveler-only backend projection. This checkpoint covers catalog changes already present plus Home cards and Create Trip; it does not certify every route.
- Deeper editorial population for all 42 places, five legacy Da Nang EN/VI versions, richer city items and explicit stable IDs in existing editorial data remain. API/render path is ready; no claim that empty sections now contain researched content.
- Discovery inclusion/order for only the selected five cities remains open; Hoi An is still preserved and may be offered. Existing unrelated sample travel-plan fallback also remains to reconcile.
- Approved replacement assets remain unavailable; failed/empty photos use fallback. No new image rights or venue operating details asserted.
- Android not exercised in this developer pass. No full software-keyboard, VoiceOver/TalkBack, performance, all-route EN/large-font or every-city/place runtime certification. Demo social retained by explicit user preference.
- iOS snapshot does not expose Home bottom-sheet descendants reliably; visual screenshot inspection was used for those claims. Agent-device automatic back failed on some localized controls; tapping the visible Back/Quay lại worked. This is not evidence of an app navigation failure.
