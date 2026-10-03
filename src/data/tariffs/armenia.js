/**
 * Residential 0.38 kV electricity tariffs for Armenia.
 *
 * The Public Services Regulatory Commission reported that consumer rates remain
 * unchanged in 2026. The homeowner calculator uses only the standard
 * residential category. Day/night rates remain authoritative source data even
 * though the product does not ask a homeowner to choose a period.
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
  minMonthlyKwhInclusive = true,
  maxMonthlyKwh = null,
  dayRate,
  nightRate
}) =>
  Object.freeze({
    id,
    customerType,
    minMonthlyKwh,
    minMonthlyKwhInclusive,
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
  schemaVersion: '3.0.0',
  revision: '2026-psrc-standard-residential-v2',
  countryCode: 'AM',
  currency: 'AMD',
  reviewedAt: '2026-09-08',
  source: TARIFF_SOURCE,
  records: Object.freeze([
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
      minMonthlyKwh: 200,
      minMonthlyKwhInclusive: false,
      maxMonthlyKwh: 400,
      dayRate: 48.48,
      nightRate: 38.48
    }),
    record({
      id: 'standard-over-400',
      customerType: 'standard',
      minMonthlyKwh: 400,
      minMonthlyKwhInclusive: false,
      dayRate: 53.48,
      nightRate: 43.48
    })
  ])
});
