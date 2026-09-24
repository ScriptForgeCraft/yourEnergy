# Equipment content and sources

The showroom reads `src/data/equipment/showroom/equipment-data.json` and `solax-products.json` through `showroom/catalog.js`. Text, documents, highlights and A–E hotspots are data-driven; no product-specific HTML is required.

## Source provenance

| Source supplied in Desktop/files                                             | Use on the site                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1_ZXNR-BD132 182.2×210_2382×1134(30×32NH)_620-650W_350mm_20250723_E(6).pdf` | New ZNShine ZXNR-BD132 card; specifications from pp. 1–2, revision 2507.E.                                                                                                                                         |
| `Energy Stock LLC, Price list for Aluminium.pdf`                             | New GCK Triangle 2200 mounting-system card; 20°/30° variants and AL6005-T5 from p. 1. Related rails and clamps from pp. 1–3. This is a supplier price list, not a manufacturer datasheet.                          |
| `Longi 650 w.pdf`                                                            | Exact duplicate of the existing Scientist LR8-66HVD datasheet (SHA-256 `9bfbf08cd392abfcdd63ce76773bf01bd5c1fe264f0a5ffac8fac50670afc41c`). No duplicate product created.                                          |
| `Снимок экрана 2025—12—09 в 11.26.23.pdf`                                    | 68-page SolaX product catalog, attached to both existing SolaX cards. It contains X1-Lite-LV on pp. 27–28 and D53 on pp. 31–32, plus other product families. The catalog is not a statement of local availability. |

Existing model specifications remain authoritative from their separate datasheets. The catalog contains older/preliminary revisions, so its figures must not silently replace the current card's specification.

The mounting supplier's price list gives neither an explicit validity date nor warranty period. The page does not present its prices/stock counts as live values or invent warranty terms. System layout, loads, compatibility and final bill of materials require project-specific selection. The GCK visualization depicts a system, not a guaranteed single-kit bill of materials.

The 12 SolaX ecosystem references that appear only in system diagrams are retained in `solax-source.json` as provenance. They have no separate datasheet or unambiguous product visual, so they are deliberately excluded from the browser bundle rather than presented as product cards.

Three extracted catalog documents (microinverter accessories, TB-HR140 and X3-TRENE-100KI) and the latter two renders support provenance records rather than active showroom cards. They retain their already published URLs through the asset manifest. `source_pack_file` and `source_pack_image` describe the supplied package; `canonical_catalog`, `image` and `document` point to actual repository originals. A source-pack illustration that was never supplied locally is not represented as a live asset path.

## Assets and downloads

- Originals: `assets/images/equipment/` and `assets/documents/equipment/<brand>/`.
- Public URLs and compatibility aliases: `src/config/static-assets.json`.
- Product display data and translations: `src/data/equipment/showroom/`.
- Calculation-grade records: `src/data/equipment/calculator/products.json`, read only through `calculator/catalog.js`; model selection defaults live in `calculator/defaults.js`.
- Documentary source records and image prompts: `src/data/equipment/provenance/`. These are intentionally outside the browser catalog.
- Public document filenames retain their published spelling/case; canonical filenames are lowercase.

The SolaX catalog was optimized from 53,842,700 to 20,519,107 bytes (144 dpi image target, JPEG quality 82). All 68 pages and extracted page text were verified unchanged; technical tables remain vector text. Representative rendered pages were visually inspected. Other PDFs are byte-for-byte copies of their originals.

## Adding a product

1. Put its verified PDF and render in the canonical folders above and register their public URLs in the asset manifest.
2. Add a unique `id`, existing `category`, brand/model, description, image, `datasheetPdf`, highlights, five hotspots, specs and documents to `showroom/equipment-data.json` or `showroom/solax-products.json`.
3. Each document provides `label`, `url`, `type`, `language`, `pages` and `sizeLabel`. Use descriptive ASCII PDF filenames. Add `downloadLabel` for a price list and `documentsNote` where context is needed.
4. Enable the category only when a real product is present. Missing warranty terms must use `warrantyNote`, not an invented guarantee.
5. Add `imageNote` for illustrative renders; optional hotspot `position: {x, y}` uses percentages of the hotspot layer for a different product silhouette.
6. Run `npm test`, `npm run lint`, `npm run build`, and `npm run verify:build`. Check card switching, all hotspots, fullscreen, documents and narrow-screen layout in the browser.
