# Mobile alignment with PlanD 0010c4a

Compared source changes from e7eab64 through 0010c4a, ignoring formatter-only churn.

## Integrated

- `GET /api/cities/:id` now supplies `guide`. Mobile maps it to `contentGuide`, distinct from the existing practical `DetailGuide` model.
- All eight section layouts are supported: snippets, highlights, masonry, checklist, badges, rail, info and CTA. Server ordering is preserved; unknown layouts are skipped.
- Native section selection replaces web sticky anchors. Rails scroll horizontally, cards reflow for larger fonts, long paragraphs and practical details expand on demand. CTA opens the existing full-screen trip flow.
- Guide palette mirrors web GuideLayout. City imagery and destination board remain native. Destination details use pastel surfaces and HeroUI Native action buttons; booking is also available for free destinations, as on web.
- No city-name fallback: a missing/null guide does not silently restore Da Nang sample content. The old sample files remain as unused layout references.
- Removed obsolete generation API methods and `generationId` from the travel-plan DTO. No AI provenance is inferred from the new response.
- Trip deletion copy matches the new cascade: account-level travel plans and gallery photos are retained.
- Planner introduction uses the new pastel treatment while retaining the native multi-step/date-modal flow.

## Intentionally not copied

- Web assistant currently uses `stubChatModel`, canned replies and in-memory threads; it has no public backend assistant route. Mobile keeps the working session/context persistence flow and does not pretend to generate a real itinerary.
- Browser-only Poppins font injection, CSS sticky anchors, desktop tables and admin catalog deletion were not ported into the traveler app.
- Base HeroUI brand tokens are unchanged by these commits, so the existing synced blue palette remains.
- Booking, trips, favorites, auth and Instagram HTTP contracts inspected in this range have no relevant public shape changes beyond formatting. Existing integrations are retained.

No backend files, database migrations, seeds or remote data were changed. Verify the city-guide migration/data are deployed if a city returns `guide: null`.
