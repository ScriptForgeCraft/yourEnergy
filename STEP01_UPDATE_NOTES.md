# Process Step 01 — photographic update

This bundle changes only the first Customer Journey / Process step visual architecture.

- Uses `assets/source/process/process-step-analysis.png` as the real full-bleed scene.
- Keeps the existing Step 01 copy, form, metric cards, journey progress and scroll behaviour.
- Keeps only the `W / N / E` orientation overlay for now.
- Removes the old Step 01 CSS/SVG house, terrain, duplicate solar path and animated sun marker.
- Removes the now-unused sun-path JS animation code.
- Adds a dark vignette and edge-only blur so the centre/house stays visually sharp and the text remains readable.
- Adds responsive AVIF/WebP/JPEG outputs and registers the source in `scripts/build-images.mjs`.
- Steps 02–06 are untouched.

The provided reference screenshot is treated as the composition reference. It is not used directly as a background because it contains baked-in UI/text. The clean `process-step-analysis.png` source is used instead.
