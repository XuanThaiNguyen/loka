# Five-city editorial content staging

## Current Phase 1 package — use this for traveler content

[phase1-five-city-content.md](phase1-five-city-content.md) is the revised combined pack (document Version 2, Library version 1), retrieved from `libfile_a3af8b8998908191bffefa16eb91ef2d`. It retains all five guides and 37 destination cards while removing monetary amounts, pricing sections, fares/cost comparisons and free-entry claims. The coordinating parent's ZIP is `libfile_68bad7961bb88191a253ea3216ff9fc8`; it excludes the original research. Source references, nonfinancial operational information, review/translation needs and image holds remain. **Use this revised package, not the original raw files below, as the input for traveler-content mapping.** It still requires schema mapping and editorial validation before import/publication. Its statement that the researcher had not inspected the schema is resolved by the separate BA contract inventory; the content pack itself is not an executable import.

## Original research — internal provenance only

Status: **research drafts, not imported or published**. Content supplied by the coordinating research task, dated 17 October 2026. Local copies were retrieved through the authorized Library text-read tool after signed-download DNS resolution failed; source text is preserved with terminal-newline normalization. This is documentation/content staging only, not a seed or executable import.

**Phase 1 publication rule:** these originals retain pricing research only for internal provenance. The revised derivative linked above is now available. Do not import the originals directly into public guide text. Preserve source notes; do not delete stored data or modify admin presentation. See [the mandatory no-pricing amendment](../ba-phase1-no-pricing-20261017.md).

| Draft | Coverage | Library source |
|---|---|---|
| [coastal-city-guides.md](coastal-city-guides.md) | Da Nang: 7 destinations; Nha Trang: 6 | `libfile_5df122ae5bac8191ad655b4aadd9e8d4` |
| [northern_destination_knowledge.json](northern_destination_knowledge.json) | Ha Noi: 8 attractions, 10 city modules; Ninh Binh: 8 attractions, 11 city modules | `libfile_3732f782afd081919fdedb38f9028563` |
| [ho-chi-minh-city.md](ho-chi-minh-city.md) | Ho Chi Minh City: 8 destinations | `libfile_a2e974286f0881918562a86a80e7ba48` |

Total: five city guides and **37 destination drafts**. The Library contents and declared structure were retrieved/read; this audit does not independently reverify every external source or operational claim. The source registers, check dates, refresh guidance, editorial estimates and unknowns must travel with the content.

## Mapping to the real model

Use [the actual contract inventory](../ba-content-contract-inventory-20261017.md). Research IDs such as `DN01` or `ha-noi` are editorial references, not database UUIDs. Maintain an explicit editorial-ID→existing/new database-ID map after live inventory. Never send an editorial city slug to `/api/cities/:id`.

| Research content | Current storage/rendering target | Mapping rule |
|---|---|---|
| City name, overview, aliases, geographical scope | `cities.name/description/slug/country`, `city_guides.hook` | Use concise overview as description; derive a short reviewed hook. Alias/scope need explicit metadata or reviewed copy; city JSON outer `destinations[]` actually contains cities, not destination table rows. |
| Orientation, movement, seasons, food, etiquette, mistakes | Ordered `city_guide_sections` | Map module title/body to title and snippets or info items. Use `snippets` for short overview, `info`/`checklist` for preparation, `rail`/`masonry` for attraction cards. Preserve paragraph breaks and meaningful headings, respect field limits; don't truncate source qualifications. |
| Attraction name/description/why visit | `destinations.title/description`, category/tags | Northern `attractions[]` are destination records. Combine short/long description without duplication; category must map to adventure/beach/culture/city/food. Museum/temple/heritage → culture; urban market → city or food according to actual focus; choose consistently. |
| Tips and location/access | `destinations.tips`, `location`, linked cityId; visit-profile travelAdvice as appropriate | Retain actionable tips. Location prose is not a verified coordinate; do not infer lat/lon or current administrative boundaries. |
| Hours and other nonfinancial operational facts; internal pricing research | Destination fields plus existing evidence-bearing knowledge records and Phase 1 projection | Publish only reviewed nonfinancial facts. Retain ticket product/currency/unit/source/check date internally, but omit all monetary content from traveler payloads and prose. Do not import zero to satisfy required legacy `fromPriceMinor`; developer must handle compatible contracts while preserving data. |
| Suggested visit lengths/day routes | Guide snippets and qualified notes | These are editorial estimates. Do not mark them as operator-verified visit-profile durations; introduce an evidence basis if structured estimates are required. Routes are editorial reading content, not generated/saved trip entities. |
| source_ids, checked_on, volatility, refresh flags, source register | Existing knowledge evidence where applicable; proposed guide evidence metadata | Resolve source IDs to URLs/names. Page-review date is observedAt only when its semantics fit; it is not automatic verifiedAt. Keep per-fact status and expiry policy rather than a blanket city “verified” stamp. |
| Image candidates/briefs | Review queue → managed `coverImageUrl`/gallery/item imageUrl | A source-page image is not permission to copy. Hold rights/subject/technical checks; no invented URLs and no reused unrelated place images. |
| Attraction card references | Proposed typed guide action/entity target | Resolve to published UUID destination after import; existing schema lacks targets. Do not put arbitrary route strings in copy or make every CTA create a trip. |
| Language/version/publication_status | Proposed locale/publication/revision metadata | All three packs are English drafts. App defaults to Vietnamese; translate/review or make fallback explicit. Do not label these as completed Vietnamese content. |

## Mandatory editorial holds

- Da Nang: official season guidance conflicts. Do not promise dry September–October. Preserve the conflict note and recommend current forecasts for dated plans.
- Ninh Binh: communicate a dispersed travel region. UNESCO designation applies to Trang An Landscape Complex, not every attraction or the whole region.
- Independence Palace: official language pages describe conflicting ticket products/prices. Keep structured price on hold until current product/checkout reconciliation; no purchasing is requested.
- Notre-Dame Cathedral: sightseeing/interior access remains unverified. Worship information is not an opening-hours guarantee.
- Current prices, hours, closures, accessibility, vehicle restrictions and beach conditions need fact-specific rechecks before publication. “Checked” in the draft means the researcher reviewed a page, not that venue operations were independently confirmed.
- Imagery licensing and current physical-device URL behavior remain unverified. Museum imagery may require specific permission; the coastal draft flags Cham museum restrictions.

## Population checklist for the developer/content owner

Reconcile IDs and avoid duplicates; preserve existing out-of-scope records; prepare a dry-run diff; map the actual contracts and hold unsupported facts; translate/review; choose approved images; connect each promoted card to useful content; publish through existing city/destination management; verify all five city guides and 37 draft destinations individually. Existing Da Nang records should be reviewed and enriched rather than replaced wholesale. The 37 drafts are a coverage starting point, not permission to publish every record or a maximum catalog size.

## Implemented bilingual derivatives (17 October 2026)

Following the user's explicit approval to import and publish, concise EN/VI adaptations now live in BE `catalog_content`: five cities and 37 destinations, 84 published language versions. The three original research files remain internal provenance and were not imported verbatim. See `pland/content/five-city-bilingual.ts` and `pland/docs/bilingual-catalog.md` in the sibling backend repository for the exact derivative, API/admin contract, import report and operational limits. No new external images or uncertain operating-hour claims were published. This does not mark the wider no-pricing amendment or image-rights audit complete.
