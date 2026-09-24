# YOURENERGY

Static Armenian, Russian and English site built with Vite + Handlebars and Cloudflare Pages Functions.

```text
assets/
  images/{common,home,calculator,process,projects,equipment}/
  documents/equipment/{longi,solax,mounting,znshine}/
  icons/
  fonts/
src/
  config/       # routes, original-to-public asset mapping, responsive presets
  content/      # localized page copy, blog articles, project cases
  templates/    # Handlebars pages and shared partials
  domain/       # calculator formulas, tariffs, PriceBook, Solar Passport
  data/         # equipment/{calculator,showroom,provenance} and other datasets
  services/     # browser API client and property map
  ui/           # controllers; calculator/results-view.js renders results
  styles/       # page styles; calculator/ modules retain cascade order
functions/      # Cloudflare Pages API handlers and provider adapters
scripts/
  build/        # assets, page contexts, HTML, sitemap, output verification
  loaders/      # Node JSON import support
  dev/          # development and reproducibility tools
test/           # calculation, API, compatibility and architecture regressions
docs/           # current maintenance and deployment documentation
public/         # hand-maintained deployment text (robots.txt)
.generated/     # ignored intermediate output and image cache
dist/           # ignored deploy output
```

| Change                               | Edit here                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Homepage imagery                     | `assets/images/home/hero/`                                                      |
| Calculator imagery                   | `assets/images/calculator/`                                                     |
| Customer Journey photos/background   | `assets/images/process/`                                                        |
| Project imagery                      | `assets/images/projects/` (also reused by blog/about)                           |
| Equipment renders                    | `assets/images/equipment/{hero,products}/`                                      |
| Equipment PDFs                       | `assets/documents/equipment/<brand>/`                                           |
| Page copy                            | `src/content/`; equipment copy in `src/data/equipment/showroom/translations.js` |
| Add a project                        | `src/content/project-cases.js`; gallery copy in `src/content/projects.js`       |
| Add a blog article                   | `src/content/blog-articles.txt`; select its image in `src/content/blog.js`      |
| Public route registry                | `src/config/routes.js`                                                          |
| Asset sources and compatibility URLs | `src/config/static-assets.json` and `image-assets.js`                           |
| Calculator calculations              | `src/domain/`                                                                   |
| Server integrations                  | `functions/`                                                                    |

Edit source files above. Never edit `.generated/` or `dist/` manually: both can be deleted and rebuilt. Original assets are stored once; multiple public URLs are build outputs.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run check
```

Use Node compatible with the locked Vite version (Node 22.12+ or a current supported release). `npm test` generates its own HTML fixtures; it does not require committed HTML or a previous production build. `npm run verify:clean` rebuilds from an empty generated workspace, compares a second build and checks that source hashes and Git status stay unchanged.

See [architecture](docs/architecture.md), [assets](docs/assets.md), [equipment data](docs/equipment-data.md), [calculator behavior](docs/calculator.md), [deployment](docs/deployment.md) and [Functions configuration](docs/functions.md).
