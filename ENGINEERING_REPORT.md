# YOURENERGY — Quick / Refine / Pro calculator engineering report

Verification date: 7 September 2026

## 1. Scope

This iteration restructures calculator entry and progression only. It does not
change domain formulas, PVGIS normalisation, tariff rules, roof geometry,
PriceBook maths, Offer Checker maths or homepage calculation claims.

## 2. Public calculator routes

- `/calculator/`, `/ru/calculator/`, `/en/calculator/` — indexable Quick Calculator.
- `/calculator/refine/`, `/ru/calculator/refine/`, `/en/calculator/refine/` — consumer roof refinement, `noindex,follow`.
- `/calculator/pro/`, `/ru/calculator/pro/`, `/en/calculator/pro/` — detailed professional calculator, `noindex,follow`.
- `/offer-checker/` and its locale variants remain separate, indexable tools.

Only Quick Calculator and Offer Checker are sitemap entries. Refinement and Pro
have self-canonical URLs and reciprocal hreflang but are intentionally not in
the sitemap.

## 3. Quick Calculator UX

The first screen contains only a region, a consumption mode and one value. Bill
mode opens an explicit tariff field because bill-to-kWh conversion cannot be
honest without it. kWh mode leaves tariff optional and shows it only as an
economics input. There is no map, coordinate, roof polygon, azimuth, tilt,
PVGIS diagnostic panel or Leaflet request in initial Quick HTML.

## 4. Regional PVGIS model

`src/data/regions/armenia.js` defines 11 versioned regional benchmark points:
Yerevan, Aragatsotn, Ararat, Armavir, Gegharkunik, Kotayk, Lori, Shirak, Syunik,
Tavush and Vayots Dzor. Every point is marked as a configured regional reference,
never a geocoded property location. HY/RU/EN labels live in
`src/content/calculator-modes.js`.

## 5. Quick server endpoint

`functions/api/quick-analysis.js` adds `POST /api/quick-analysis`. It validates
region and consumption, calls the same server-side PVGIS adapter with 1 kWp and
14% system loss, selects the same server-owned PriceBook, then delegates sizing
to `buildRegionalQuickAnalysis` → existing `buildSolarAnalysis`. Provider/cache
failure has the existing JSON error envelope; it never returns demo values.

## 6. Regional-result honesty

Quick results use `scope: regional-preliminary`, state that PVGIS represents a
regional reference point rather than the visitor's property, and do not apply a
roof-area constraint. Capacity, panels, annual generation and P25/P50/P75
budget appear when source data is available; savings/payback appear only with an
explicit usable tariff.

## 7. Roof refinement UX

Refinement receives the same temporary browser session and asks for a manual
point plus one of two truthful roof inputs: a completed OSM outline labelled
“Preliminary area from outline”, or user-entered measured roof-plane area. Tilt
and azimuth stay inside a native Engineering parameters disclosure and the page
sends the same `/api/analysis` request as professional mode.

## 8. Map behaviour

Leaflet remains lazy. It loads only after a visitor opens a point map or reaches
a roof editing surface. OSM is still the sole base map. Current zoom,
click-to-add, marker click-to-delete, marker drag, undo, reset, finish and
keyboard centre-point controls are preserved. Refinement now scrolls the moved
Leaflet container into view after switching from point selection to roof editing,
so the sticky header does not hide the editing surface.

## 9. Professional Calculator

The existing independent-status wizard is retained at `/calculator/pro/`:
Object, Consumption, Roof and Result; PVGIS potential remains independent of
roof/consumption completion. It retains coordinates, map selection, polygon,
PVGIS retry/diagnostics, roof direction, tilt, mounting type, monthly profile,
tariff and in-memory bill upload. Public Quick routes no longer embed those
controls.

## 10. Shared temporary state

`src/ui/calculator-session.js` is the single `sessionStorage` handoff model for
Quick, refinement and Pro. It persists region, consumption, tariff, point, roof,
potential, analysis and Passport snapshots for the current browser tab. Files are
excluded: the electricity bill remains an in-memory `File` and is never sent or
serialised.

Changing consumption in the same regional context preserves an existing
refinement. Changing the Quick region clears old point/roof/potential data so a
roof from another regional starting context cannot be carried forward.

## 11. PVGIS retry and stale-data safety

Refinement starts a background `/api/potential` request after point confirmation.
A failure is silent at that consumer layer and cannot erase point, roof,
consumption, tariff or file state. Pro exposes diagnostics/retry. Both detailed
flows require successful `/api/analysis` before a property-level result; neither
creates a demo substitute.

## 12. Tariff and finance invariants

- Average AMD bill requires an explicit user tariff.
- Average kWh and monthly profile work without tariff.
- No tariff produces no savings, payback or timeline.
- There is no hidden registry, demo or default tariff in P0 public flow.
- Temporary PriceBook P25/P50/P75 remains server-selected and is not an offer.

## 13. Calculation parity

No calculation-engine code was changed. `test/calculation-parity.test.js` still
asserts PVGIS yield/profile, 7.54 kWp, 13 panels, roof area/constraints,
P25/P50/P75, annual generation, annual savings, payback, timeline, Passport
values and Offer Checker output. New Quick coverage compares its selected
scenario directly to `buildSolarAnalysis` with identical inputs, proving it is a
scope/presentation wrapper rather than duplicate formula code.

## 14. Solar Passport

Solar Passport remains a result-only current-session snapshot. Refinement creates
it after successful `/api/analysis`; Pro displays it through its native dialog.
No PDF, permanent URL, account history or cloud storage is claimed.

## 15. Offer Checker

Offer Checker remains standalone and retains its safety rules: AMD/Wp comparison
only for complete standard grid-tied scope; battery, incomplete scope, another
system type or expired PriceBook return “not comparable”. Its calculation code
was not changed.

## 16. Homepage, demo content and shared chrome

The existing consumer-first homepage was left intact: all calculation CTAs still
point to same-locale Quick Calculator routes, and the homepage has no calculator
runtime/map state. It continues to label static examples as examples instead of
visitor-specific results. Shared Handlebars header/footer partials serve home,
Quick, refinement, Pro, Offer Checker, Privacy and Terms.

## 17. Removed/dead functionality

No removed feature was restored. Existing removal guarantees remain:
testimonials, MyEnergy, `/soon/`, old calculator workspace selectors and their
dead data/styles/routes are absent. The public old wizard template at
`/calculator/` was replaced by `calculator-quick.hbs`; full controls exist only
in the separately generated professional template. No hidden old calculator is
emitted on Quick routes.

## 18. Files changed and added

Added: regional data, Quick domain wrapper, Quick Function, shared session
module, Quick/refinement controllers, localized mode content, Quick/refinement
templates and Quick tests.

Updated: page generator, Vite MPA inputs, API client, professional wizard
hydration, property-map restoration API, tools CSS, build validator, README and
Functions README. Generated `calculator/`, `ru/calculator/` and
`en/calculator/` HTML now represents Quick mode; generated Pro/refinement HTML
is new.

## 19. Automated verification

Completed locally after implementation:

- `npm test` — 55 tests passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run build` — passed; 21 generated HTML routes.
- `npm run verify:build` — passed for all 21 routes.

Leaflet remains a separate lazy 43.38 kB gzip chunk; Quick Calculator has no map
selector and does not request it until a visitor enters a map workflow.

## 20. Browser smoke and remaining blockers

Local production-preview checks covered Quick, refinement and Pro at 375 px.
Quick had no Leaflet/map DOM, switched tariff `required` and `aria-required`
correctly between bill/kWh modes, rendered honest PVGIS unavailable state without
fallback numbers, and had no horizontal overflow or console error. Refinement
opened Leaflet only after explicit map action, confirmed a point, finished a
three-vertex outline with finite 18 m² preliminary area, and had no overflow.
Same-tab Quick → refinement → Pro preserved consumption; Pro rendered the
professional workspace without initially loading Leaflet. The mobile hero
overflow found in QA was corrected.

Local Vite preview does not execute Pages Functions/KV, so successful live PVGIS
browser response is not claimed. Controlled Function tests cover success,
failure, tariff conditions and cache setup. Before release configure
`PVGIS_CACHE` plus `PVGIS_CACHE_SALT` in Cloudflare Pages and run a live Quick
and refinement flow on Pages. Native Armenian copy and legal content still need
owner approval. No commit, push, deployment or migration was performed.
