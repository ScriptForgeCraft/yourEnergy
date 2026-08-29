/**
 * P0 tariff registry for the Armenia deployment.
 *
 * No electricity rate is stored here yet because the project owner has not
 * supplied a dated tariff resolution and verification record. Keeping the
 * registry intentionally empty is safer than turning an old or guessed rate
 * into a current financial promise. A future approved revision belongs in
 * `records` with its source URL, effective dates, and `verifiedAt` date.
 */
export const ARMENIA_TARIFF_DATASET = Object.freeze({
  id: 'am-retail-electricity',
  schemaVersion: '1.0.0',
  revision: 'p0-unconfigured',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: '2026-08-28',
  source: {
    kind: 'registry',
    status: 'unavailable',
    provider: 'Tariff source not configured',
    reference: null,
    verifiedAt: null
  },
  records: Object.freeze([])
});
