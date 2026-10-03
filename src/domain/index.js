export { normalizeConsumption } from './consumption.js';
export { parseDecimalNumber } from './numbers.js';
export { CALCULATOR_INPUT_LIMITS, getCalculatorInputNumber } from './calculator-inputs.js';
export {
  getConfirmedTariffRate,
  getFinancialTariffRateRange,
  getUsableTariffRate,
  selectEffectiveSurplusCompensation,
  suggestStandardTariff,
  tariffBracketIncludesMonthlyKwh,
  createAutomaticStandardResidentialTariff,
  createAutomaticStandardResidentialTariffProfile,
  createStandardResidentialTariffFromActualDayNight,
  estimateStandardResidentialConsumptionFromBill,
  createUserTariffSelection
} from './tariffs.js';
export { PriceBookRepository, buildCommercialEstimate } from './pricebook.js';
export {
  ANALYSIS_SCHEMA_VERSION,
  buildSolarAnalysis,
  calculateArmeniaNetMeteringSettlement,
  calculateRoofPlaneArea,
  calculateSolarScenario,
  normalizeRoof
} from './solar-analysis.js';
export {
  PRELIMINARY_ELEVATED_GROUND_COVERAGE_RATIO,
  PRELIMINARY_USABLE_ROOF_RATIO
} from './calculator-assumptions.js';
export { calculatePreliminaryRoofCapacity } from './roof-capacity.js';
export { buildRegionalQuickAnalysis } from './quick-analysis.js';

export { buildEquipmentRecommendation } from './equipment-recommendation.js';
export { CALCULATION_BASIS_SOURCE_TYPE } from './calculation-provenance.js';
export { buildEnvironmentalImpact } from './environment.js';
export { SolarPassportRepository, buildSolarPassport } from './solar-passport.js';
export { ARMENIA_TARIFF_DATASET } from '../data/tariffs/armenia.js';

export { ARMENIA_GRID_CO2_FACTOR } from '../data/environment/armenia-grid-co2.js';
export { EPA_URBAN_TREE_CO2_EQUIVALENCY } from '../data/environment/epa-tree-co2-equivalence.js';
export { YOURENERGY_OWNER_MANAGED_PRICEBOOK } from '../data/pricebooks/armenia.js';
export {
  ARMENIA_REGIONAL_BENCHMARKS,
  getArmeniaRegionalBenchmark
} from '../data/regions/armenia.js';
