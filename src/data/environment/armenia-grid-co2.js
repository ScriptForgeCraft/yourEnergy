/**
 * The latest connected, verified historical Armenian grid factor. It is the
 * 2022 value from Armenia's National Inventory Document, not a 2026 forecast
 * or a claim about a current household's electricity mix.
 *
 * Source: https://unfccc.int/sites/default/files/resource/1_Armenia%2520NID_2022.pdf
 */
export const ARMENIA_GRID_CO2_FACTOR = Object.freeze({
  id: 'armenia-grid-co2',
  version: 'v1.0',
  dataYear: 2022,
  valueKgCo2PerKwh: 0.183,
  effectiveFrom: '2022-01-01T00:00:00.000Z',
  effectiveTo: '2022-12-31T23:59:59.999Z',
  sourceUrl: 'https://unfccc.int/sites/default/files/resource/1_Armenia%2520NID_2022.pdf',
  provider: 'Armenia National Inventory Document / UNFCCC',
  methodology: 'Historical grid emission factor for 2022',
  verifiedAt: '2026-09-08T00:00:00.000Z',
  status: 'verified-historical'
});
