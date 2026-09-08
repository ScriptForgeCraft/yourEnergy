/**
 * Residential 0.38 kV electricity tariffs for Armenia.
 *
 * The Public Services Regulatory Commission reported that consumer rates remain
 * unchanged in 2026. This registry deliberately carries only the standard
 * residential and socially-vulnerable household categories requested for the
 * public calculator. It is a data file: a future revision can replace these
 * records without changing calculator formulas or UI logic.
 *
 * Sources:
 * - https://www.ena.am/Info.aspx?id=11&lang=2
 * - https://www.psrc.am/contents/newsPress/electricity-tariff-2026
 */
const TARIFF_SOURCE = Object.freeze({
  kind: 'registry',
  status: 'confirmed',
  provider: 'Electric Networks of Armenia / Public Services Regulatory Commission of Armenia',
  reference: 'https://www.ena.am/Info.aspx?id=11&lang=2',
  verifiedAt: '2026-09-08'
});

const record = ({
  id,
  customerType,
  minMonthlyKwh = null,
  maxMonthlyKwh = null,
  dayRate,
  nightRate
}) =>
  Object.freeze({
    id,
    customerType,
    minMonthlyKwh,
    maxMonthlyKwh,
    dayRate,
    nightRate,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    status: 'confirmed',
    currency: 'AMD',
    source: TARIFF_SOURCE
  });

export const ARMENIA_TARIFF_DATASET = Object.freeze({
  id: 'am-residential-electricity',
  schemaVersion: '2.0.0',
  revision: '2026-psrc-residential-v1',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: '2026-09-08',
  source: TARIFF_SOURCE,
  records: Object.freeze([
    record({
      id: 'social-vulnerable',
      customerType: 'social-vulnerable',
      dayRate: 29.99,
      nightRate: 19.99
    }),
    record({
      id: 'standard-up-to-200',
      customerType: 'standard',
      minMonthlyKwh: 0,
      maxMonthlyKwh: 200,
      dayRate: 46.48,
      nightRate: 36.48
    }),
    record({
      id: 'standard-201-to-400',
      customerType: 'standard',
      minMonthlyKwh: 201,
      maxMonthlyKwh: 400,
      dayRate: 48.48,
      nightRate: 38.48
    }),
    record({
      id: 'standard-over-400',
      customerType: 'standard',
      minMonthlyKwh: 401,
      dayRate: 53.48,
      nightRate: 43.48
    })
  ])
});
