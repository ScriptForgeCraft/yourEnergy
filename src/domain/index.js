export { ANALYSIS_STATUS, DATA_COMPLETENESS_LEVEL, SOURCE_KIND, SOURCE_STATUS } from './models.js';
export { normalizeConsumption, isNormalizedConsumption } from './consumption.js';
export { parseDecimalNumber, toFiniteNumberOrNull } from './numbers.js';
export {
  CALCULATOR_INPUT_LIMITS,
  getCalculatorInputNumber,
  isCalculatorInputInRange
} from './calculator-inputs.js';
export {
  getConfirmedTariffRate,
  getUsableSurplusCompensationRate,
  getUsableTariffRate,
  isConfirmedTariff,
  listRegistryTariffOptions,
  selectEffectiveTariff,
  selectEffectiveSurplusCompensation,
  suggestStandardTariff,
  tariffBracketIncludesMonthlyKwh,
  toIsoDate,
  createRegistryTariffSelection,
  createUserTariffSelection,
  TARIFF_PERIOD
} from './tariffs.js';
export {
  PRICEBOOK_STATUS,
  PRICEBOOK_SYSTEM_TYPE,
  PriceBookRepository,
  buildCommercialEstimate,
  isPriceBookActive,
  normalizePriceBook
} from './pricebook.js';
export {
  ANALYSIS_ASSUMPTIONS,
  ANALYSIS_SCHEMA_VERSION,
  DEFAULT_SCENARIO_TARGETS,
  buildSolarAnalysis,
  calculateDataCompleteness,
  calculateRoofPlaneArea,
  calculateSolarScenario,
  normalizeInvestment,
  normalizeProduction,
  normalizeProperty,
  normalizeRoof,
  normalizeSystem,
  roundAnalysisValue
} from './solar-analysis.js';
export { buildRegionalQuickAnalysis } from './quick-analysis.js';
export {
  INVERTER_COMPATIBILITY_LIMITATIONS,
  INVERTER_TECHNOLOGY,
  recommendInverter
} from './inverter-recommendation.js';
export {
  STORAGE_COMPATIBILITY_LIMITATIONS,
  STORAGE_RECOMMENDATION_STATUS,
  STORAGE_TECHNOLOGY,
  recommendStorage
} from './storage-recommendation.js';
export {
  MOUNTING_HARDWARE_COMPATIBILITY_LIMITATIONS,
  MOUNTING_HARDWARE_RECOMMENDATION_STATUS,
  recommendMountingHardware,
  selectPracticalMountingOption
} from './mounting-recommendation.js';
export {
  EQUIPMENT_RECOMMENDATION_COMPATIBILITY_LIMITATIONS,
  buildEquipmentRecommendation
} from './equipment-recommendation.js';
export { CALCULATION_BASIS_SOURCE_TYPE, buildCalculationBasis } from './calculation-provenance.js';
export {
  buildEnvironmentalImpact,
  buildTreeEquivalence,
  normalizeGridEmissionFactor,
  normalizeTreeEquivalency
} from './environment.js';
export {
  SOLAR_PASSPORT_SCHEMA_VERSION,
  SolarPassportRepository,
  buildSolarPassport,
  createSolarPassportId
} from './solar-passport.js';
export { ARMENIA_TARIFF_DATASET } from '../data/tariffs/armenia.js';
export { ARMENIA_SURPLUS_COMPENSATION_DATASET } from '../data/regulatory/armenia-surplus-compensation.js';
export { ARMENIA_GRID_CO2_FACTOR } from '../data/environment/armenia-grid-co2.js';
export { EPA_URBAN_TREE_CO2_EQUIVALENCY } from '../data/environment/epa-tree-co2-equivalence.js';
export { ARMENIA_PRICEBOOKS, TEMPORARY_YOURENERGY_PRICEBOOK } from '../data/pricebooks/armenia.js';
export {
  ARMENIA_REGIONAL_BENCHMARKS,
  ARMENIA_REGIONAL_BENCHMARKS_VERSION,
  getArmeniaRegionalBenchmark
} from '../data/regions/armenia.js';
