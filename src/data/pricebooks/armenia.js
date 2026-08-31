/**
 * Temporary residential price book used only until an approved YOURENERGY
 * catalogue is supplied. It is deliberately versioned, dated and finite so
 * the UI cannot silently keep showing an outdated provisional amount.
 */
export const TEMPORARY_YOURENERGY_PRICEBOOK = Object.freeze({
  id: 'yourenergy-am-residential-grid-v0-1',
  version: 'v0.1',
  status: 'temporary',
  countryCode: 'AM',
  region: 'all-armenia',
  systemType: 'residential-grid-tied',
  currency: 'AMD',
  checkedAt: '2026-08-29',
  validFrom: '2026-08-29',
  validUntil: '2026-09-28',
  ratesAmdPerWp: Object.freeze({ p25: 232, p50: 247, p75: 264 }),
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
    status: 'estimated',
    provider: 'YOURENERGY temporary price book',
    reference: 'P1-v0.1',
    verifiedAt: '2026-08-29'
  })
});

export const ARMENIA_PRICEBOOKS = Object.freeze([TEMPORARY_YOURENERGY_PRICEBOOK]);
