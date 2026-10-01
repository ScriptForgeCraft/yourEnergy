/**
 * Preliminary layout assumptions describe the estimating model, not a
 * product specification, so they deliberately live outside equipment data.
 */
export const PRELIMINARY_USABLE_ROOF_RATIO = 0.7;

// Elevated rows need service access and inter-row spacing to avoid one row
// shading the next. This conservative plan-area ratio is intentionally lower
// than the roof-parallel usable-area assumption.
export const PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO = 0.45;
