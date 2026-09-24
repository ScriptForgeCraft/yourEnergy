# Architecture

The project remains a static multilingual Vite + Handlebars site.

| Boundary          | Responsibility                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/content`     | Page copy, locale schema, project cases and blog source; keep translations with their content responsibility |
| `src/templates`   | Page markup and shared header/footer/journey partials                                                        |
| `src/config`      | Canonical page registry, source-to-public asset manifest and responsive presets                              |
| `src/domain`      | Pure calculation contracts and formulas; no DOM or provider access                                           |
| `src/data`        | Versioned tariffs, PriceBooks, locations and equipment records; calculator/showroom/provenance are separate  |
| `src/services`    | Same-origin browser API client and map integration                                                           |
| `src/ui`          | Browser lifecycle, session and controllers; result rendering reads the controller's single state             |
| `src/styles`      | Explicit page entries; calculator modules are imported in original cascade order                             |
| `assets`          | Editable binary originals, icons and fonts                                                                   |
| `functions`       | Cloudflare convention-based handlers under `api/`; provider/cache/validation adapters under `_lib/`          |
| `scripts/build`   | Asset publication, page context construction, Handlebars emission, sitemap and deploy checks                 |
| `scripts/loaders` | Node JSON import registration, also used by tests                                                            |
| `scripts/dev`     | Reproducibility check and Lighthouse screenshot extraction                                                   |
| `test`            | Domain parity, API, session migrations, removed-feature guards and architecture invariants                   |
| `.generated`      | Disposable intermediate HTML, public resources and image cache                                               |
| `dist`            | Disposable production output; deploy this directory with root `functions/`                                   |

## Build

`npm run build` first publishes originals/derivatives into `.generated/public`, then renders pages into `.generated/site`. Vite uses `.generated/site` as its documented `root`, an explicit `/src` alias for application imports, the repository as `envDir`, `.generated/public` as `publicDir`, and absolute `dist` as `outDir`. No symlinks or post-build route moves are needed.

`src/config/routes.js` derives articles from parsed blog content and cases from `project-cases.js`. Page generation, Vite inputs, sitemap and verification consume that registry. Add content in its owner file; page kinds are added in the route registry with a context/template implementation. Private calculator shells/migration pages and legal/about/contacts pages retain their current indexing policy.

Page context construction lives in `scripts/build/page-contexts.mjs`; the generator only compiles templates and writes output. Project page copy belongs in `src/content/projects.js`. Equipment translation dictionaries are separate from localization functions.

`public/robots.txt` is manually maintained. Sitemap is generated from the registry; `_headers` is generated from the Vite CSP policy and configured map origins. Source paths and customer-facing URLs are separate contracts.

## Compatibility

Historic calculator routes, legacy session versions, asynchronous request ownership and restored analysis identity remain intentional guards. `/soon/`, MyEnergy and testimonials negative assertions prevent removed features from returning. Provenance JSON and translation audit helpers are used by tests/documentation and must not be classified as dead browser code.

The domain index exposes only consumed exports. Functions used internally remain internal; Cloudflare `onRequest` entries and tested adapter APIs remain exported. `knip.json` explicitly includes Handlebars browser entries, Node loaders, tests and Cloudflare handlers.

## Verification

`npm run check` runs tests, ESLint, formatting, production build and output checks. `npm run verify:clean` deletes only `.generated` and `dist`, performs two builds, compares output hashes and verifies unchanged source hashes and Git status. It records evidence under ignored `reports/architecture/`.
