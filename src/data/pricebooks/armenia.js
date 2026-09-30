/**
 * Owner-managed residential price book. It stays active until YOURENERGY
 * replaces its version and rates; it remains a preliminary budget guide, not
 * an offer, invoice or automatically refreshed supplier feed.
 */
export const YOURENERGY_OWNER_MANAGED_PRICEBOOK = Object.freeze({
  id: 'yourenergy-am-residential-grid-v1-0',
  version: 'v1.0',
  status: 'owner-managed',
  countryCode: 'AM',
  region: 'all-armenia',
  systemType: 'residential-grid-tied',
  currency: 'AMD',
  checkedAt: '2026-08-29',
  validFrom: '2026-08-29',
  validUntil: null,
  // The client-confirmed ceiling for the 10.4 kWp preliminary example is
  // 2,150,000 AMD. 206.7 AMD/Wp is 2,149,680 AMD at 10.4 kWp, which is
  // displayed as 2,150,000 AMD after the consumer-facing 10,000 AMD rounding.
  ratesAmdPerWp: Object.freeze({ p25: 182, p50: 194, p75: 206.7 }),
  scope: Object.freeze([
    'panels',
    'inverter',
    'mounting',
    'standard-installation',
    'basic-grid-connection'
  ]),
  exclusions: Object.freeze([
    'battery',
    'roof-repair',
    'non-standard-electrical-work',
    'financing'
  ]),
  confirmationRequired: Object.freeze(['vat', 'permits']),
  source: Object.freeze({
    kind: 'registry',
    status: 'owner-managed',
    provider: 'YOURENERGY owner-managed price book',
    reference: 'P1-v1.0',
    verifiedAt: '2026-08-29'
  })
});

export const ARMENIA_PRICEBOOKS = Object.freeze([YOURENERGY_OWNER_MANAGED_PRICEBOOK]);
