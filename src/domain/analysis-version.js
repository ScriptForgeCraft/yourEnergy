// Keep the cache contract independent of calculation/catalog modules. Session
// readers on the home page need the version, not the entire sizing engine.
// Roof and PV-array geometry plus elevated row-density provenance became
// explicit in 1.7.0; earlier cached Passports must not be reused as though
// their single tilt field had the new meaning.
export const ANALYSIS_SCHEMA_VERSION = '1.7.0';
