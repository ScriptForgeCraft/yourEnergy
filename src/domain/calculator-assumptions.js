/**
 * Preliminary layout assumptions describe the estimating model, not a
 * product specification, so they deliberately live outside equipment data.
 */
export const PRELIMINARY_USABLE_ROOF_RATIO = 0.7;

// Preliminary row-spacing criterion for a conventional, single-direction,
// fixed-tilt elevated array. PVsyst describes a practical preliminary limit
// angle range of roughly 18–22°; 20° is deliberately a transparent midpoint,
// not an optimum or a final shading/layout design.
export const PRELIMINARY_ELEVATED_LIMIT_PROFILE_ANGLE_DEGREES = 20;

// A map outline can be converted to a preliminary roof-plane area only below
// this roof tilt. At steeper tilts, a measured plane area is required.
export const PRELIMINARY_MAX_MAP_PROJECTED_ROOF_TILT_DEGREES = 75;
