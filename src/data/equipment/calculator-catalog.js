import sourceProducts from '../../../data/equipment/yourenergy-equipment-calculator.json';

// This module is deliberately separate from the showroom catalogue. The showroom
// retains its localized display content, while this file is the single boundary
// through which normalized, calculation-grade equipment values are read.
const CATEGORY = Object.freeze({
  SOLAR_PANELS: 'solar-panels',
  GRID_INVERTERS: 'grid-inverters',
  HYBRID_INVERTERS: 'inverters',
  MICROINVERTERS: 'microinverters',
  BATTERIES: 'batteries',
  RESIDENTIAL_ESS: 'home-ess',
  COMMERCIAL_ESS: 'commercial-ess',
  MOUNTING: 'mounting',
  EV_CHARGERS: 'ev-chargers'
});
const CALCULATION_CATEGORIES = new Set(Object.values(CATEGORY));

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;
const isNonNegativePercent = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const isEfficiencyPercent = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 100;
const isInclination = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 90;
const isPositiveArray = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isPositiveNumber);
const isInclinationArray = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isInclination);

const POSITIVE_NUMBER_FIELDS = new Set([
  'panelWatts',
  'panelAreaSqm',
  'ac_power_min_kw',
  'ac_power_max_kw',
  'selected_ac_power_kw',
  'battery_voltage_min_v',
  'battery_voltage_max_v',
  'capacity_min_kwh',
  'capacity_max_kwh',
  'selected_capacity_kwh',
  'nominal_capacity_kwh',
  'usable_capacity_kwh',
  'module_nominal_capacity_kwh',
  'system_nominal_capacity_max_kwh',
  'system_usable_capacity_max_kwh',
  'nominal_voltage_v',
  'operating_voltage_min_v',
  'operating_voltage_max_v',
  'cycle_life_min',
  'kit_length_mm',
  'rail_length_mm',
  'mppt_count_max',
  'apparent_power_min_va',
  'apparent_power_max_va',
  'selected_apparent_power_va',
  'mppt_count',
  'max_dc_input_current_a',
  'selected_max_power_kw',
  'max_charge_discharge_current_a',
  'inverter_power_min_kw',
  'inverter_power_max_kw',
  'battery_capacity_min_kwh',
  'battery_capacity_max_kwh',
  'selected_inverter_power_kw',
  'selected_battery_capacity_kwh'
]);

const POSITIVE_ARRAY_FIELDS = new Set(['available_ac_power_kw', 'available_max_power_kw']);
const EFFICIENCY_FIELDS = new Set([
  'series_max_efficiency_percent',
  'max_efficiency_percent',
  'bifaciality_percent_nominal'
]);
const NULLABLE_FIELDS = new Set([
  'selected_ac_power_kw',
  'selected_capacity_kwh',
  'selected_inclination_deg',
  'selected_apparent_power_va',
  'selected_max_power_kw',
  'selected_inverter_power_kw',
  'selected_battery_capacity_kwh'
]);

const addIssue = (issues, code, field = null) => issues.push(Object.freeze({ code, field }));

const sanitizeCalculation = (value, issues) => {
  if (!isRecord(value)) {
    addIssue(issues, 'MISSING_CALCULATION');
    return null;
  }

  const calculation = {};
  if (isNonEmptyString(value.source)) calculation.source = value.source;
  if (isNonEmptyString(value.protection_rating))
    calculation.protection_rating = value.protection_rating;

  for (const field of POSITIVE_NUMBER_FIELDS) {
    if (!(field in value)) continue;
    if (value[field] === null && NULLABLE_FIELDS.has(field)) {
      calculation[field] = null;
    } else if (isPositiveNumber(value[field])) {
      calculation[field] = value[field];
    } else {
      addIssue(issues, 'INVALID_CALCULATION_VALUE', field);
    }
  }

  for (const field of POSITIVE_ARRAY_FIELDS) {
    if (!(field in value)) continue;
    if (isPositiveArray(value[field])) calculation[field] = Object.freeze([...value[field]]);
    else addIssue(issues, 'INVALID_CALCULATION_VALUE', field);
  }

  for (const field of EFFICIENCY_FIELDS) {
    if (!(field in value)) continue;
    if (isEfficiencyPercent(value[field])) calculation[field] = value[field];
    else addIssue(issues, 'INVALID_CALCULATION_VALUE', field);
  }

  if ('annual_degradation_percent' in value) {
    if (isNonNegativePercent(value.annual_degradation_percent)) {
      calculation.annual_degradation_percent = value.annual_degradation_percent;
    } else {
      addIssue(issues, 'INVALID_CALCULATION_VALUE', 'annual_degradation_percent');
    }
  }

  if ('available_inclination_deg' in value) {
    if (isInclinationArray(value.available_inclination_deg)) {
      calculation.available_inclination_deg = Object.freeze([...value.available_inclination_deg]);
    } else {
      addIssue(issues, 'INVALID_CALCULATION_VALUE', 'available_inclination_deg');
    }
  }
  if ('selected_inclination_deg' in value) {
    if (value.selected_inclination_deg === null) calculation.selected_inclination_deg = null;
    else if (isInclination(value.selected_inclination_deg)) {
      calculation.selected_inclination_deg = value.selected_inclination_deg;
    } else {
      addIssue(issues, 'INVALID_CALCULATION_VALUE', 'selected_inclination_deg');
    }
  }
  if ('dimensions_mm' in value) {
    const dimensions = value.dimensions_mm;
    if (
      isRecord(dimensions) &&
      isPositiveNumber(dimensions.length_mm) &&
      isPositiveNumber(dimensions.width_mm) &&
      isPositiveNumber(dimensions.thickness_mm)
    ) {
      calculation.dimensions_mm = Object.freeze({ ...dimensions });
    } else {
      addIssue(issues, 'INVALID_CALCULATION_VALUE', 'dimensions_mm');
    }
  }

  return Object.freeze(calculation);
};

const hasRange = (calculation, minimum, maximum) =>
  isPositiveNumber(calculation?.[minimum]) &&
  isPositiveNumber(calculation?.[maximum]) &&
  calculation[minimum] <= calculation[maximum];

const requiredCalculationFields = (category, calculation) => {
  switch (category) {
    case CATEGORY.SOLAR_PANELS:
      return isPositiveNumber(calculation?.panelWatts) &&
        isPositiveNumber(calculation?.panelAreaSqm)
        ? []
        : ['panelWatts', 'panelAreaSqm'];
    case CATEGORY.GRID_INVERTERS:
    case CATEGORY.HYBRID_INVERTERS:
      return hasRange(calculation, 'ac_power_min_kw', 'ac_power_max_kw')
        ? []
        : ['ac_power_min_kw', 'ac_power_max_kw'];
    case CATEGORY.MICROINVERTERS:
      return hasRange(calculation, 'apparent_power_min_va', 'apparent_power_max_va')
        ? []
        : ['apparent_power_min_va', 'apparent_power_max_va'];
    case CATEGORY.BATTERIES:
      return hasRange(calculation, 'capacity_min_kwh', 'capacity_max_kwh')
        ? []
        : ['capacity_min_kwh', 'capacity_max_kwh'];
    case CATEGORY.RESIDENTIAL_ESS:
    case CATEGORY.COMMERCIAL_ESS:
      return hasRange(calculation, 'inverter_power_min_kw', 'inverter_power_max_kw') &&
        hasRange(calculation, 'battery_capacity_min_kwh', 'battery_capacity_max_kwh')
        ? []
        : [
            'inverter_power_min_kw',
            'inverter_power_max_kw',
            'battery_capacity_min_kwh',
            'battery_capacity_max_kwh'
          ];
    case CATEGORY.MOUNTING:
      return isInclinationArray(calculation?.available_inclination_deg)
        ? []
        : ['available_inclination_deg'];
    case CATEGORY.EV_CHARGERS:
      return isPositiveArray(calculation?.available_max_power_kw) ? [] : ['available_max_power_kw'];
    default:
      return [];
  }
};

const isStableId = (value) => isNonEmptyString(value);

const makeReadonlyRecord = (record, calculation) => {
  const displayRecord = { ...record };
  delete displayRecord.calculation;
  return Object.freeze({
    ...displayRecord,
    ...(calculation ? { calculation } : {})
  });
};

/**
 * Builds a safe view of a raw calculation catalogue. It is exported so tests
 * and future import pipelines can validate a candidate data set before it is
 * made available to a calculator.
 */
export const createCalculatorEquipmentCatalog = (rawProducts) => {
  const records = Array.isArray(rawProducts) ? rawProducts : [];
  const idCounts = new Map();
  for (const record of records) {
    if (!isRecord(record) || !isStableId(record.id)) continue;
    idCounts.set(record.id, (idCounts.get(record.id) ?? 0) + 1);
  }

  const entries = [];
  const rejectedRecords = [];
  records.forEach((record, index) => {
    if (!isRecord(record)) {
      rejectedRecords.push(
        Object.freeze({ index, issues: Object.freeze([{ code: 'INVALID_RECORD' }]) })
      );
      return;
    }

    const issues = [];
    if (!isStableId(record.id)) addIssue(issues, 'MISSING_STABLE_ID', 'id');
    if (!isNonEmptyString(record.category)) addIssue(issues, 'MISSING_CATEGORY', 'category');
    if (isStableId(record.id) && idCounts.get(record.id) > 1) {
      addIssue(issues, 'DUPLICATE_ID', 'id');
    }

    const calculation = sanitizeCalculation(record.calculation, issues);
    const missingFields = requiredCalculationFields(record.category, calculation);
    for (const field of missingFields)
      addIssue(issues, 'MISSING_REQUIRED_CALCULATION_FIELD', field);
    if (isNonEmptyString(record.category) && !CALCULATION_CATEGORIES.has(record.category)) {
      addIssue(issues, 'UNSUPPORTED_CALCULATION_CATEGORY', 'category');
    }

    const displayValid = isStableId(record.id) && isNonEmptyString(record.category);
    const calculationReady =
      displayValid &&
      idCounts.get(record.id) === 1 &&
      CALCULATION_CATEGORIES.has(record.category) &&
      missingFields.length === 0;
    if (displayValid) {
      entries.push(
        Object.freeze({
          product: makeReadonlyRecord(record, calculation),
          calculationReady,
          issues: Object.freeze(issues)
        })
      );
    } else {
      rejectedRecords.push(Object.freeze({ index, issues: Object.freeze(issues) }));
    }
  });

  const products = Object.freeze(entries.map(({ product }) => product));
  const byId = new Map(
    entries
      .filter(({ product }) => idCounts.get(product.id) === 1)
      .map(({ product }) => [product.id, product])
  );
  const calculationReadyById = new Map(
    entries
      .filter(({ calculationReady }) => calculationReady)
      .map(({ product }) => [product.id, product])
  );
  const categories = Object.freeze([...new Set(products.map(({ category }) => category))]);
  const validationRecords = Object.freeze([
    ...entries
      .filter(({ issues }) => issues.length)
      .map(({ product, issues }) => Object.freeze({ id: product.id, issues })),
    ...rejectedRecords
  ]);
  const duplicateIds = Object.freeze(
    [...idCounts].filter(([, count]) => count > 1).map(([id]) => id)
  );
  const validation = Object.freeze({
    totalRecords: records.length,
    acceptedRecords: products.length,
    calculationReadyRecords: entries.filter(({ calculationReady }) => calculationReady).length,
    duplicateIds,
    records: validationRecords
  });

  const getEquipmentByCategory = (category) =>
    products.filter((product) => product.category === category);
  const getCalculationReadyByCategory = (category) =>
    entries
      .filter(({ product, calculationReady }) => product.category === category && calculationReady)
      .map(({ product }) => product);

  return Object.freeze({
    getEquipment: () => products,
    getEquipmentById: (id) => (isStableId(id) ? (byId.get(id) ?? null) : null),
    getSolarPanelById: (id) => {
      const product = isStableId(id) ? calculationReadyById.get(id) : null;
      return product?.category === CATEGORY.SOLAR_PANELS ? product : null;
    },
    getCategories: () => categories,
    getEquipmentByCategory,
    getCalculationReadyByCategory,
    getSolarPanels: () => getCalculationReadyByCategory(CATEGORY.SOLAR_PANELS),
    getGridInverters: () => getCalculationReadyByCategory(CATEGORY.GRID_INVERTERS),
    getHybridInverters: () => getCalculationReadyByCategory(CATEGORY.HYBRID_INVERTERS),
    getMicroinverters: () => getCalculationReadyByCategory(CATEGORY.MICROINVERTERS),
    getBatteries: () => getCalculationReadyByCategory(CATEGORY.BATTERIES),
    getResidentialEss: () => getCalculationReadyByCategory(CATEGORY.RESIDENTIAL_ESS),
    getCommercialEss: () => getCalculationReadyByCategory(CATEGORY.COMMERCIAL_ESS),
    getMountingSystems: () => getCalculationReadyByCategory(CATEGORY.MOUNTING),
    getEvChargers: () => getCalculationReadyByCategory(CATEGORY.EV_CHARGERS),
    getValidation: () => validation
  });
};

export const calculatorEquipmentCatalog = createCalculatorEquipmentCatalog(sourceProducts);

export const getEquipment = () => calculatorEquipmentCatalog.getEquipment();
export const getEquipmentById = (id) => calculatorEquipmentCatalog.getEquipmentById(id);
export const getSolarPanelById = (id) => calculatorEquipmentCatalog.getSolarPanelById(id);
export const getEquipmentCategories = () => calculatorEquipmentCatalog.getCategories();
export const getEquipmentByCategory = (category) =>
  calculatorEquipmentCatalog.getEquipmentByCategory(category);
export const getCalculationReadyEquipmentByCategory = (category) =>
  calculatorEquipmentCatalog.getCalculationReadyByCategory(category);
export const getSolarPanels = () => calculatorEquipmentCatalog.getSolarPanels();
export const getGridInverters = () => calculatorEquipmentCatalog.getGridInverters();
export const getHybridInverters = () => calculatorEquipmentCatalog.getHybridInverters();
export const getMicroinverters = () => calculatorEquipmentCatalog.getMicroinverters();
export const getBatteries = () => calculatorEquipmentCatalog.getBatteries();
export const getResidentialEss = () => calculatorEquipmentCatalog.getResidentialEss();
export const getCommercialEss = () => calculatorEquipmentCatalog.getCommercialEss();
export const getMountingSystems = () => calculatorEquipmentCatalog.getMountingSystems();
export const getEvChargers = () => calculatorEquipmentCatalog.getEvChargers();
export const getEquipmentCatalogValidation = () => calculatorEquipmentCatalog.getValidation();
