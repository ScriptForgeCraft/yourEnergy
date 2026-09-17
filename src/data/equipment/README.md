# Equipment content and sources

The showroom reads `equipment-data.json`. Text, documents, highlights and A–E hotspots are data-driven; no product-specific HTML is required.

## September 2026 additions

| Source supplied in Desktop/files                                             | Use on the site                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1_ZXNR-BD132 182.2×210_2382×1134(30×32NH)_620-650W_350mm_20250723_E(6).pdf` | New ZNShine ZXNR-BD132 card; specifications from pp. 1–2, revision 2507.E.                                                                                                                                         |
| `Energy Stock LLC, Price list for Aluminium.pdf`                             | New GCK Triangle 2200 mounting-system card; 20°/30° variants and AL6005-T5 from p. 1. Related rails and clamps from pp. 1–3. This is a supplier price list, not a manufacturer datasheet.                          |
| `Longi 650 w.pdf`                                                            | Exact duplicate of the existing Scientist LR8-66HVD datasheet (SHA-256 `9bfbf08cd392abfcdd63ce76773bf01bd5c1fe264f0a5ffac8fac50670afc41c`). No duplicate product created.                                          |
| `Снимок экрана 2025—12—09 в 11.26.23.pdf`                                    | 68-page SolaX product catalog, attached to both existing SolaX cards. It contains X1-Lite-LV on pp. 27–28 and D53 on pp. 31–32, plus other product families. The catalog is not a statement of local availability. |

Existing model specifications remain authoritative from their separate datasheets. The catalog contains older/preliminary revisions, so its figures must not silently replace the current card's specification.

The mounting supplier's price list gives neither an explicit validity date nor warranty period. The page does not present its prices/stock counts as live values or invent warranty terms. System layout, loads, compatibility and final bill of materials require project-specific selection. The GCK visualization depicts a system, not a guaranteed single-kit bill of materials.

## Assets and downloads

All runtime paths are local to this project:

- PDFs: `public/assets/equipment/docs/`.
- Existing user-provided renders: `public/assets/equipment/products/1.png` through `4.png`, unchanged.
- New illustrative renders: `public/assets/equipment/products/znshine-zxnr-bd132.png` and `gck-triangle-2200.png`.
- Full generation and refinement prompts: `image-prompts.json`; generated with the built-in image generation tool, not the API/CLI fallback.

Customer-facing PDF names contain brand, model and document type. Main and document-list download links specify the same filename. Legacy PDFs are retained for existing external links; source PDFs on Desktop were not modified.

The SolaX catalog was optimized from 53,842,700 to 20,519,107 bytes (144 dpi image target, JPEG quality 82). All 68 pages and extracted page text were verified unchanged; technical tables remain vector text. Representative rendered pages were visually inspected. Other PDFs are byte-for-byte copies of their originals.

## Adding a product

1. Put its verified PDF and render in the folders above.
2. Add a unique `id`, existing `category`, brand/model, description, image, `datasheetPdf`, highlights, five hotspots, specs and documents to `equipment-data.json`.
3. Each document provides `label`, `url`, `type`, `language`, `pages` and `sizeLabel`. Use descriptive ASCII PDF filenames. Add `downloadLabel` for a price list and `documentsNote` where context is needed.
4. Enable the category only when a real product is present. Missing warranty terms must use `warrantyNote`, not an invented guarantee.
5. Add `imageNote` for illustrative renders; optional hotspot `position: {x, y}` uses percentages of the hotspot layer for a different product silhouette.
6. Run `npm test`, `npm run lint`, `npm run build`, and `npm run verify:build`. Check card switching, all hotspots, fullscreen, documents and narrow-screen layout in the browser.
