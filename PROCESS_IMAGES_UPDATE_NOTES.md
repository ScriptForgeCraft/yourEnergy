# Process Steps 01–06 — photographic update

This bundle extends the existing Step 01 photographic implementation to every
Customer Journey / Process step.

## What changed

- Step 01 keeps `process-step-analysis.png` and the separate `W / N / E` overlay.
- Step 02 uses `process-step-inspection.png`.
- Step 03 uses `process-step-design.png`.
- Step 04 uses `process-step-proposal.png`.
- Step 05 uses `process-step-installation.png`.
- Step 06 uses `process-step-support.png`.
- All six images are rendered as full-bleed scene backgrounds.
- The shared left/edge vignette and edge-only blur keep the centre image sharp
  while preserving readable copy.
- Existing process copy, progress navigation, dynamic metric cards, form,
  transitions and Step 05 installation timeline stay as real HTML/UI.
- Removed the old CSS/SVG/HTML artwork for roof measurement, panel/inverter
  design, proposal sheet, installation panel model and Solar Passport mockup.
- The asset pipeline now generates AVIF/WebP/JPEG variants for all six process
  images at 640, 1024 and 1600 output names.
- Source files use semantic names instead of `step2.png` … `step6.png`.

## Source rename map

- `step2.png` → `process-step-inspection.png`
- `step3.png` → `process-step-design.png`
- `step4.png` → `process-step-proposal.png`
- `step5.png` → `process-step-installation.png`
- `step6.png` → `process-step-support.png`

The image files in this bundle were matched byte-for-byte (CRC) to the five
files supplied in `yourEnergy(3).rar`, so no generated variant was substituted
for a different selection.
