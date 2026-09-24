# Assets

## Source assets

`assets/images/` and `assets/documents/` contain manually maintained originals.
Icons and fonts live in `assets/icons/` and `assets/fonts/`. A PDF or image has one physical source.
Directories are organized by the page/domain that owns the image; shared blog/about imagery can reuse project originals.

| Image owner                | Canonical source                          |
| -------------------------- | ----------------------------------------- |
| Home time-of-day hero      | `assets/images/home/hero/hero-time-*.png` |
| Calculator                 | `assets/images/calculator/`               |
| Process / Customer Journey | `assets/images/process/`                  |
| Projects                   | `assets/images/projects/`                 |
| Equipment                  | `assets/images/equipment/`                |
| Shared social preview      | `assets/images/common/og.png`             |

## Generated assets

`.generated/public/` holds copied originals, document aliases, responsive images and sitemap.
`.generated/site/` holds Handlebars HTML, `.generated/image-cache/` holds content-addressed image encodings, and `.generated/asset-urls.json` inventories published binary URLs.
`dist/` is the complete static deploy output. Never edit these directories/files manually.
They are ignored by Git and can be deleted; a full build creates everything again.

## Replacing an image

Replace, for example, `assets/images/home/hero/hero-time-8.png`, then run:

```sh
npm run build
npm run verify:build
```

Do not edit generated AVIF/WebP/JPEG files. `src/config/image-assets.js` defines responsive sources and widths; process presets are shared with template contexts through `src/config/process-images.js`.
An undersized/missing original fails with its path and requested width. The pipeline never enlarges an original or silently labels a smaller file with a larger width.
Analysis uses 640/1024/1536 px; other process steps use 640/1024/1600 px.

Every asset build clears the published intermediate directory, removing stale outputs even when an entire preset was deleted. The encoding cache key includes original bytes, presets, encoder policy and Sharp/library versions. Only currently used cache entries survive.

## Static resources and compatibility

Register each static original and its public URLs in `src/config/static-assets.json`. The first URL is the preferred one; remaining URLs are compatibility copies created only during build. Equipment JSON stores public URLs, never filesystem source paths.

PDFs live in `assets/documents/equipment/{longi,solax,mounting,znshine}/`. The four historical `/documents/*.pdf` URLs and published `/assets/equipment/docs/*.pdf` filenames remain available from single originals. Numbered product images have descriptive source/current URL names; `/assets/equipment/products/1.png` through `4.png` remain aliases.

`process-background.png` is the shared blurred decorative layer behind all six Customer Journey states. The independent responsive process photos are retained. Historical `process-step-*-bg.png` URLs are compatibility copies, not six editable files.

To add a resource, add its canonical original, register its public URL, update the owning content/template and run `npm run check`. Architecture tests reject duplicate binary sources, IDs, URLs and unregistered originals.

## Image provenance and company records

Photographs are illustrative, not evidence of completed customer installations. Six hero frames were supplied by the owner; other illustrative assets were generated for the prototype. Equipment prompts remain in `src/data/equipment/provenance/image-prompts.json`.
The hero chooses supplied frames using Asia/Yerevan time; before 08:00 and from 22:00 it uses a neutral 08:00 fallback without a sun-position claim.

Manufacturer PDFs support product specifications, not installer authorization, stock or project suitability. Company-registration originals with personal identifiers are intentionally absent; the site publishes the official verification URL/control code. If approved public company documents are added, their source location is `assets/documents/company/` (create only when needed).
