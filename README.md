# YOURENERGY P1

Static, multilingual Vite site for `yourenergy.am` with an honest P1
real-analysis flow. Homepages are Armenian (`/`), Russian (`/ru/`) and English
(`/en/`); each locale also has `/calculator/` and `/offer-checker/` routes. It
is not a SPA and does not deploy anything itself.

## 1. Structure

- `src/content/` — localized, crawlable page dictionaries.
- `src/templates/` and `scripts/generate-pages.mjs` — Handlebars build-time HTML.
- `src/domain/` — pure consumption, tariff, scenario, confidence and Passport models.
- `src/data/tariffs/` — dated tariff registry; no rate is invented when it is unavailable.
- `src/data/pricebooks/` — versioned, temporary commercial budget inputs, isolated from UI templates.
- `src/services/` and `src/ui/` — small browser enhancements only.
- `functions/` — Cloudflare Pages Functions for providers and lead delivery.
- `test/` — Node unit and API-boundary tests.

## 2. Dependencies

`leaflet` is the only runtime dependency and is dynamically imported only after
the visitor begins the map workflow. Vite, Handlebars, Sharp, ESLint and
Prettier are development dependencies. There are no browser API keys.

## 3. Real-analysis flow

1. A visitor provides an address and kWh consumption (average or monthly).
2. `/api/geocode` returns provider candidates. The visitor selects and confirms
   one, or deliberately places a manual point.
3. The visitor outlines the roof on a geographic Leaflet map, chooses an
   orientation and tilt, then finishes the polygon.
4. `/api/analysis` asks the server-side PVGIS adapter for a **1 kWp** yield.
   It uses the public PVGIS endpoint by default or an approved server-side
   override. The pure domain layer scales that provider yield transparently
   from the entered consumption; the 14% PVGIS system-loss assumption appears
   in the ledger. A PVGIS failure shows retry/manual-contact, never demo data.
5. A memory-only Solar Passport snapshots the result, its sources and its
   assumptions. A permanent link/PDF is intentionally unavailable in P1.

The dashboard, map, Passport, chart, ledger and all three system scenarios use
the same returned `SolarAnalysis`. A tariff entered from the visitor's bill is
explicitly identified as user-provided. The server selects any temporary
commercial price book; the client cannot submit a capex value to obtain a quote.

No address is treated as geocoded until the person confirms it. An unavailable
geocoder, map, PVGIS adapter or CRM never falls back to a fabricated real result
or delivery success.

## 4. Demo versus real content

The existing projects, reviews, photos, fixed example system options and static
aerial roof image are labelled illustrative/demo. The old `DemoHomeAnalysisService`
remains only for explicitly labelled static examples and is not imported by the
homepage. The real flow is `ProductApiClient` + `src/domain/`.

## 5. Consumption and tariffs

Visitors can provide an average bill, average kWh, or twelve monthly kWh values,
plus an optional AMD/kWh tariff copied from their bill. A bill is never converted
to kWh until that user tariff or a dated, verified registry tariff exists.
Savings and payback remain hidden when no usable tariff is available.

`yourenergy-am-residential-grid-v0-1` is a temporary Armenia residential
price-book input checked on 2026-08-29 and valid for 30 days through 2026-09-28.
It calculates a rounded preliminary range from 232 / 247 / 264 AMD/Wp and is
clearly not an offer. It includes panels, inverter, mounting, standard
installation and basic grid connection; battery, roof repair, non-standard
electrical work and financing are excluded. VAT and permits require
confirmation. Once expired, price output is suppressed and the flow requests an
engineering survey.

To publish financial values, add an approved record in
`src/data/tariffs/armenia.js` with its effective dates, source reference and
verification date; add matching tests before release.

## 6. Cloudflare Functions

All endpoints are same-origin POST JSON and use the envelope
`{ ok: true, data }` or `{ ok: false, error }`.

- `/api/geocode` — normalized provider candidates; never a confirmation.
- `/api/analysis` — PVGIS yield plus server-selected temporary price-book data;
  no fabricated provider result, client capex or contractual quote.
- `/api/lead` — submits only after a configured CRM accepts it.

Read [functions/README.md](functions/README.md) for adapter shapes and all
server-side bindings. Copy `functions/.dev.vars.example` to the ignored
`functions/.dev.vars` only for local Functions testing. Do not place any of
those values in `VITE_*` variables.

## 7. Map and roof editor

The page begins with a fast static fallback visual. After a real/manual location
action, Leaflet is lazy-loaded using geographic coordinates; `CRS.Simple` is
not part of the production analysis flow. The polygon supports click-to-add,
marker drag, point selection, keyboard-accessible nudge, undo, reset and finish.
Area is explicitly preliminary, not a survey.

The manual map starts with the public OpenStreetMap tile fallback
`https://tile.openstreetmap.org/{z}/{x}/{y}.png` and visible attribution after
the visitor starts the workflow. Set `VITE_MAP_TILE_URL` and
`VITE_MAP_ATTRIBUTION` only to replace it with an approved HTTPS provider; the
build adds exactly that public origin to `img-src` in `dist/_headers`.

## 8. Passport and lead handling

`SolarPassportRepository` is a process/page-memory P1 repository. It provides
no URL and no PDF. The lead form sends no PII to analytics; it requires a name,
phone and consent, then shows an error until CRM configuration is present.
Turnstile verification is prepared server-side and is not represented as active
until both its widget/site key and secret have been configured.

## 9. Security and privacy

`public/_headers` supplies CSP, no-sniff, frame, referrer and permissions
headers. The Vite build regenerates `dist/_headers` with the explicit public
OpenStreetMap (or approved replacement) tile origin. Provider endpoints,
credentials, CRM credentials and Turnstile secrets are server-side only.
Functions do not log address,
coordinates or lead payloads.

## 10. SEO and accessibility

Primary HTML exists before JavaScript, including canonical URLs, reciprocal
HY/RU/EN hreflang, localized metadata and FAQ JSON-LD where applicable.
Support pages are `noindex`; sitemap includes the localized home, calculator
and Offer Checker routes only. The page has landmarks, a skip link, one H1,
keyboard controls, `aria-live` status messages, native `details`/`dialog`, chart
tables and reduced-motion styles.

## 11. Local commands

```sh
npm run dev
npm test
npm run lint
npm run format:check
npm run build
npm run verify:build
npm run check
```

`npm run dev` serves static Vite pages only. Pages Functions need a Cloudflare
Pages-compatible local environment such as `wrangler pages dev` with ignored
local bindings.

## 12. Before launch

1. Obtain and configure a geocoder, dated tariff source/revision, CRM and
   Turnstile credentials. Optionally replace the public PVGIS/OSM fallbacks
   with approved server-side PVGIS and public tile providers.
2. Have Armenian copy, legal pages, tariff records, actual project evidence and
   all public claims reviewed by their owners.
3. Run `npm run check`, browser keyboard/mobile smoke tests and production
   Lighthouse against the deployed preview; record actual results rather than
   treating local lab values as production CWV guarantees.
