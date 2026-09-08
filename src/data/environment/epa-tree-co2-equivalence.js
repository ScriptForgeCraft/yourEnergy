/**
 * A communication equivalency, separate from Armenia's grid factor.
 *
 * EPA's Greenhouse Gas Equivalencies Calculator expresses the annual average
 * for an urban tree planted and grown for ten years as 0.060 metric tons CO₂.
 * It is an equivalency, not a tree-planting claim or a local forestry model.
 * Source: https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
 */
export const EPA_URBAN_TREE_CO2_EQUIVALENCY = Object.freeze({
  id: 'epa-urban-tree-co2-equivalency',
  version: 'v1.0',
  metricTonsCo2PerTreePerYear: 0.06,
  methodology: 'EPA urban tree planted and grown for ten years annual equivalency',
  sourceUrl:
    'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references',
  provider: 'United States Environmental Protection Agency',
  verifiedAt: '2026-09-08T00:00:00.000Z',
  status: 'verified'
});
