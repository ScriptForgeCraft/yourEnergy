/**
 * Preliminary layout assumptions describe the estimating model, not a
 * product specification, so they deliberately live outside equipment data.
 */
export const PRELIMINARY_USABLE_ROOF_RATIO = 0.7;

// This conservative plan-area allowance covers preliminary row spacing,
// access, shading clearance and layout losses for elevated arrays. It is not
// a full engineering row-spacing or layout simulation.
export const PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO = 0.45;

// A map outline can be converted to a preliminary roof-plane area only below
// this roof tilt. At steeper tilts, a measured plane area is required.
export const PRELIMINARY_MAX_MAP_PROJECTED_ROOF_TILT_DEGREES = 75;
