# YOURENERGY — consumer-first refactor engineering report

Date of verification: 7 September 2026

## 1. Structure and routes

The site remains a Vite MPA. Handlebars generates static semantic HTML before
the browser starts. Published, indexable routes are Home, Calculator and Offer
Checker in Armenian (`/`), Russian (`/ru/`) and English (`/en/`). Privacy and
Terms are available in all three languages and remain `noindex` legal drafts.

The generated production build contains 15 routes. `/soon/` and its locale
variants are no longer generated, linked, included in the sitemap or retained
as redirects. Common header and footer partials are used by marketing, tool and
legal pages; `ENERGY` keeps the required `#F5BD18` wordmark colour.

## 2. Homepage

The homepage is now consumer-first: hero, what the calculation provides,
example Solar Passport/result, typical configurations, process, company and
engineer trust, equipment documentation, FAQ, final CTA and footer.

The hero has one primary calculation CTA. PVGIS is explained as methodology,
not a marketing promise. Static figures are explicitly marked as example data
or an example result; none is presented as a visitor's personalised output.
The former static finance panel was removed because it implied a calculation
before the visitor supplied inputs.

## 3. Calculator wizard

There is one `CalculatorWizardController`-style controller and one browser
session state source. Its visible consumer path is:

1. Property — choose and confirm a point; address is only an optional note.
2. Consumption — average bill with an explicit tariff, average kWh, or the
   twelve-month engineering input.
3. Roof — outline the available roof or enter a measured roof-plane area.
4. Result — available only after a successful same-origin `/api/analysis`.

Coordinates, PVGIS diagnostics and retry, monthly profile, bill upload,
orientation, tilt, mounting mode and other detailed inputs are retained inside
native `details` disclosures labelled “Engineering parameters”. Opening or
closing them does not reset the shared state.

## 4. PVGIS, roof and map behaviour

PVGIS stays server-side: browser → same-origin Cloudflare Pages Function →
PVGIS. A confirmed point starts `/api/potential` in the background. Its status
is independent (`locked`, `available`, `loading`, `complete`, `unavailable`)
from Object, Consumption, Roof and Result.

Therefore a PVGIS failure exposes an honest retry/continue state but does not
clear the point, roof, consumption, tariff or in-memory bill file, and does not
block Roof or Consumption. It never yields demo PVGIS values. A later retry
updates only potential state.

The lazy Leaflet map uses OSM with attribution and zoom 19. It has no satellite
or auto-roof-detection claim. The same in-flow map supports point selection,
add vertex, click a vertex to delete it, drag a vertex, undo, reset and finish.
The map outline is labelled “Preliminary area from outline”; it is not called a
survey. Measured roof-plane area remains an alternative. Keyboard centre-point
controls now avoid reusing a deleted starter vertex, so they cannot create a
zero-area duplicate after an edit.

## 5. Financial semantics and calculation parity

No calculation formula, unit, rounding rule, PVGIS normalisation, roof-area
conversion, PriceBook rule, finance calculation or Offer Checker rule was
changed by this refactor.

- Average bill in AMD requires an explicit user tariff before consumption can be
  derived. Its label, help text, `required` and `aria-required` switch together.
- Average kWh and a twelve-month profile work without a tariff.
- Without an explicit usable tariff, savings, payback and the finance timeline
  remain absent. There is no registry, demo, hidden or fallback tariff.
- PriceBook P25/P50/P75 remains available while valid; it is a preliminary
  budget, not an offer.

`test/calculation-parity.test.js` fixes a deterministic pre-refactor domain
fixture and asserts identical results: 1,500 kWh/kWp, a normalised monthly
profile, 7.54 kWp, 13 panels, 100 m² roof area, 1.75m / 1.86m / 1.99m AMD
P25/P50/P75, 11,310 kWh annual generation, 588,120 AMD annual savings,
3.162619873495205-year payback, 12.843m AMD timeline endpoint, Passport
values and a 247 AMD/Wp Offer Checker verdict. No engine exception was needed.

## 6. Result and Solar Passport

The result begins with capacity, panel count, annual generation, coverage and
P25/P50/P75 preliminary budget. Savings and payback appear only if their tariff
precondition is met. Monthly chart, assumptions, sources, limitations and the
Passport follow rather than competing with core homeowner outcomes.

Solar Passport opens only from a successful result in a native dialog. It is a
snapshot of current browser-session analysis and clearly does not promise PDF,
a permanent URL, a cloud history or an account history.

## 7. Demo content and removed legacy code

Typical project cards remain because they explain system configurations, but no
longer claim client names, actual addresses, installation dates, savings or
completed installations. Each has a compact example marker.

The following obsolete functionality was deleted rather than hidden:

- testimonials markup, data, scroller branch, styling and related content;
- MyEnergy teaser/content/references;
- `/soon/` templates and generated Armenian/Russian/English routes;
- old homepage finance/dashboard markup and its unused dialog/ledger modules;
- unused `src/home.js`, `src/ui/dialogs.js`, `src/ui/analysis-ledger.js` and
  the unused browser analytics event module;
- old calculator workspace/offer UI, selectors and media-query leftovers;
- stale tool CSS for removed card/layout variants.

`test/removed-features.test.js` and post-build validation reject the removed
route, old selectors and future/navigation labels. Repository searches were
also run for testimonials, MyEnergy, `/soon/`, legacy calculator selectors and
the removed CSS classes.

## 8. SEO, content and accessibility

Canonical URLs, reciprocal HY/RU/EN hreflang, one H1 per page, semantic
landmarks, static content, FAQ JSON-LD and the sitemap remain intact. The
sitemap contains Home, Calculator and standalone Offer Checker only. There is
no Product/Offer structured data for the temporary PriceBook.

The tools retain skip links, visible focus, labels, live status/error regions,
keyboard-accessible native details/dialog controls, 44 px map/action controls,
text alternatives for charts and no-JS semantic content. The calculator uses
one `aria-current` marker for the opened step while status is stored separately
for each step and PVGIS enrichment.

## 9. Dependencies and performance

Leaflet is the only runtime dependency and stays in a lazy chunk. The final
production build reports 14.38 kB gzip for initial main JavaScript, 10.26 kB
gzip for main CSS and 43.38 kB gzip for the separately loaded Leaflet chunk.
All other dependencies are build/development tooling.

Knip was used for an unused-code audit. It found and led to removal of the
unused analytics module and two unnecessary public exports in `src/tools.js`.
Remaining reported exports belong to Cloudflare file-based entrypoints or the
deliberately public domain barrel; their consumers are dynamic/runtime paths
that Knip cannot infer. There are no remaining unused source files reported.

## 10. Automated verification

The final local commands all pass:

- `npm test` — 50/50 tests passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run build` — passed.
- `npm run verify:build` — passed for 15 generated routes.

Regression coverage includes consumption/tariff modes, no finance without a
tariff, PriceBook expiry/ranges, PVGIS failure without fallback, server input
validation, Armenia guard, salted seven-day cache privacy/TTL, roof conversion,
manual measured area, independent wizard states, retry preservation, Passport,
Offer Checker safety, calculation parity and deleted-feature assertions.

## 11. Browser and responsive smoke

A local production preview was checked in the browser. The map opened lazily
with a non-zero 1046×500 desktop container and no console error. A local
unavailable-PVGIS flow confirmed that Consumption and Roof remained available;
the roof outline was finished with three points and produced 20.7 m². Clicking
a roof marker removed its vertex as designed. The standalone Offer Checker
returned “within range” for a complete 6 kWp / 1,482,000 AMD example (247
AMD/Wp) and returned “not comparable” when a battery was included.

105 production-route viewport checks covered Home, Calculator, Offer Checker,
Privacy and Terms in HY/RU/EN at 360, 375, 390, 430, 768, 1024 and 1440 px.
They found one H1, no horizontal overflow and no captured console errors. The
support-page and company-card mobile overflow found during the audit were
fixed.

The local Vite preview does not mount Cloudflare Pages Functions or the
required KV binding, so a real successful `/api/potential` → `/api/analysis`
browser transaction cannot be claimed from this machine. Controlled Function
tests cover success, failure, retry and cache paths; the live successful smoke
remains an explicit launch check after Cloudflare configuration.

## 12. Remaining launch blockers and next steps

1. Configure Cloudflare `PVGIS_CACHE` binding and non-public
   `PVGIS_CACHE_SALT`; without them live Functions intentionally return a
   clear unavailable state. Run a live Pages smoke after configuration to
   verify successful potential and analysis responses.
2. Obtain a confirmed tariff source/revision, CRM and Turnstile credentials
   only when those integrations are approved. Do not add secrets to browser
   configuration.
3. Complete Armenian native proofreading and legal review of Privacy/Terms;
   replace example projects with verified evidence only when available.

No commit, push, deployment or production migration was performed as part of
this refactor.
