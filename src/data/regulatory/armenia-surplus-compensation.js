/**
 * Registry slot for the monetary treatment of annual solar-generation surplus
 * in Armenia. It intentionally contains no rate until a dated, verified
 * regulatory record is available. Consumer retail tariffs are not a proxy for
 * this value.
 */
const UNAVAILABLE_REGULATORY_SOURCE = Object.freeze({
  kind: 'registry',
  status: 'unavailable',
  provider: null,
  reference: null,
  verifiedAt: null
});

export const ARMENIA_SURPLUS_COMPENSATION_DATASET = Object.freeze({
  id: 'am-autonomous-generation-surplus-compensation',
  schemaVersion: '1.0.0',
  revision: 'unconfigured-v1',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: null,
  source: UNAVAILABLE_REGULATORY_SOURCE,
  records: Object.freeze([])
});
