# Mobile component QA addendum

Latest user screenshots extend this review to **all mobile components, including Home/Profile refinements**. Their established visual language remains the baseline, but it is not exempt from control-sizing, typography or localization fixes. Preserve approved navigation, Home sheet behavior and Profile interactions. Admin UI remains excluded.

Latest Phase 1 addition: [remove all traveler-facing pricing](ba-phase1-no-pricing-20261017.md), including Create New Trip amount fields. Keep creation and qualitative Low / Medium / Luxury. Review spacing after monetary blocks are removed; no orphan headings, currency labels or numeric price ranges in either locale or accessibility text. Existing checklist references to currency formatting apply only to historical findings/internal storage, not permission to show money in Phase 1.

Evidence: screenshot A, Library `libfile_c6b61f6ebf4081918921bfb5eb449f0b` (896×572), and screenshot B, `libfile_0af6c08fe098819189dd978c09187ca9` (882×544). The coordinating parent visually inspected the images; local Library reads confirmed names, dimensions and OCR/descriptions, but did not return directly renderable pixels to this audit. The annotations below identify regions in prose, not measured screenshot coordinates. Pixel dimensions must not be treated as logical mobile units.

## Annotated issues and developer acceptance

| ID / screenshot region | Finding and user impact | Requirement / Given–When–Then acceptance |
|---|---|---|
| V01 — A, central hero search | Search field appears oversized with generous vertical padding, consuming useful discovery space | Given default text size, when Home renders, then use a compact single-line field; approximately 48–52 logical units is a proposed starting target to verify in the actual component/device. Retain at least a 44-point iOS interactive target; use the supported Android target convention. Given large accessibility text, then allow growth without clipping or a tiny fixed text size. |
| V02 — A, top-right search icon and hero field | Two search entry points duplicate visual emphasis | Given Home has a clear hero search entry, when refining the header, then remove/reduce the duplicate icon or document a distinct useful behavior. Both retained entry points must open the same expected search context; no dead controls. Preserve notification/avatar functionality requirements separately. |
| V03 — B, title/countries/badge/button | English “Who’s around,” English countries and Demo label mix with Vietnamese “Xem hồ sơ” | Given Vietnamese is selected, when the section renders, then headings, country display names, badge, CTA, accessibility labels and states use Vietnamese. Given English, then the same UI uses English. Proper personal names remain unchanged. Do not concatenate both languages into each label. |
| V04 — B, small card CTA and country text | Compact labels need review for readability and long-language support; screenshot alone does not establish point sizes | Given either locale and supported text scaling, when rendering cards/buttons, then labels remain readable, centered/aligned and unclipped; use shared text roles rather than arbitrary local shrinking. Body roughly 16 and button 14–16 logical units are proposed design starting points, not measured facts or mandatory universal sizes. Secondary text must remain legible and pass contrast checks. |
| V05 — B, entire traveler rail | Demo social content contributes little to the travel-knowledge goal and may suggest real proximity | Recommend hiding this demo-only rail in production discovery or replacing it with real, admin-curated destination content after product decision. Given demo cards remain in a preview, then clearly localize the demo disclosure and never imply live nearby users. Do not invent social data or implement a new social backend. |
| V06 — A, hero description | Current description mentions lodging/experiences and should match the revised knowledge scope | Given knowledge-first copy is approved, when either locale renders, then the supporting text promises useful destination information and tips, not booking inventory or AI capability the app does not provide. |

## Component-wide review checklist

Audit Home, Search, city, destination, collections, Favorites, Profile, demo traveler profile if retained, Trips, create/detail forms, planner/plan, booking preservation screens, Settings and Sign-in. Inspect shared headers, cards, pills, tabs, inputs, textareas, selection rows, buttons, sheets, dialogs, toasts and state messages. Do not infer that HeroUI defaults make every use accessible.

- Typography: consistent title/body/secondary/button roles; realistic Vietnamese diacritics and long labels; supported text scaling; avoid weight 800/900 everywhere and unexplained tiny text. Inputs must not clip baseline/placeholder text.
- Controls: measured logical dimensions and hit areas, keyboard focus/return action, icon alignment, visible pressed/disabled/focused/loading states; no spinner that changes button width unexpectedly. Visual compactness must not shrink touch targets.
- Layout: consistent section rhythm, gutters and hierarchy; safe areas/keyboard insets; no clipped rail cards, conflicting nested scroll or hidden action behind a sheet/tab bar.
- Images: stable aspect ratios/focal crops, contrasting overlaid text and useful loading/error fallback; no unrelated location photo as fallback.
- States: loading, empty, failed, stale, not found, permission denied and success messages must be helpful and localized. Avoid backend/database implementation language in traveler copy.
- Locale: selected language applies to headings, country/category names, badges, CTA, placeholders, validation, errors, dates, numbers, currency formatting and accessibility labels. Separate content-language availability from UI translation. All staged research is English: obtain reviewed Vietnamese copy or a deliberately disclosed content fallback; never silently present an English guide as translated Vietnamese. Country display names should be localized, not hardcoded.

## Locale and visual acceptance matrix

Given VI or EN is selected, when navigating every route and reopening the app, then the selected UI locale persists and all supported strings remain consistent. Given a missing translation, then an agreed fallback is applied without raw keys, mixed duplicated labels or silently disappearing text. Content unavailable in the selected language has an explicit product-approved fallback; no machine-generated factual translation is published without review.

Given default and enlarged text on narrow and wide supported iOS/Android devices, when reviewing the main journeys, then content does not overlap/truncate essential actions and tap targets remain usable. Measure contrast for normal/secondary text and controls against actual backgrounds, including pastel cards, charcoal buttons, disabled states and photos. Confirm screen-reader names/order and that icon-only actions are discoverable.

Provide before/after screenshots for Home hero, traveler rail or its replacement, Profile, Search results, city guide, destination details and Favorites, with locale/device/text-scale recorded. Include one long Vietnamese case and empty/error/image-failure state per shared component family. Screenshots must show actual runtime behavior, not just a mock. No app-wide dark-mode promise: current provider forces light.

This addendum refines K04/K07/K08 in [the full handoff](ba-travel-knowledge-handoff-20261017.md). It does not authorize admin UI work, new marketplace/social features or deployment.
