const cleanText = (value) => (typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '');

const finite = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const validLeadPhone = (value) => /^[+()\d\s-]{6,32}$/u.test(value) && /\d/u.test(value);
const validLeadEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);

const wholeProfile = (values) =>
  Array.isArray(values) && values.length === 12 && values.every((value) => finite(value) !== null)
    ? values.map(finite)
    : null;

const compactEquipment = (item, details = '') => {
  if (!item || typeof item !== 'object') return null;
  const name = [
    item.brand ?? item.panelBrand,
    item.productName ?? item.name,
    item.model ?? item.panelModel
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim();
  const suffix = cleanText(details);
  return [name, suffix].filter(Boolean).join(' · ') || null;
};

/**
 * Creates the explicit Professional Calculator handoff. It deliberately uses
 * only values already shown to the visitor and never includes file contents.
 * The API validates this shape again before it is delivered to an engineer.
 */
export const buildProfessionalLeadContext = ({ analysis, state } = {}) => {
  const scenario = analysis?.selectedScenario ?? {};
  const system = scenario.system ?? {};
  const generation = scenario.generation ?? {};
  const balance = scenario.energyBalance ?? {};
  const financial = scenario.financial ?? {};
  const roof = state?.roof ?? {};
  const normalizedRoof = analysis?.roof ?? {};
  const consumption = state?.consumption ?? {};
  const equipment = analysis?.equipment ?? system.equipment ?? {};
  const inverter = analysis?.inverterRecommendation;
  const storage = analysis?.storageRecommendation;
  const mounting = analysis?.mountingHardwareRecommendation;
  const billFile = state?.selectedBillFile;

  return {
    kind: 'professional',
    property: {
      address: cleanText(state?.addressNote) || null,
      latitude: finite(state?.confirmedProperty?.lat ?? analysis?.property?.coordinates?.lat),
      longitude: finite(state?.confirmedProperty?.lng ?? analysis?.property?.coordinates?.lng)
    },
    consumption: {
      mode: cleanText(consumption.mode) || null,
      averageMonthlyBillAmd: finite(consumption.averageMonthlyBillAmd),
      averageMonthlyKwh: finite(consumption.averageMonthlyKwh),
      monthlyKwh: wholeProfile(consumption.monthlyKwh),
      annualKwh: finite(analysis?.consumption?.annualKwh)
    },
    tariffAmdPerKwh: finite(state?.userTariff?.rateAmdPerKwh),
    roof: {
      areaMethod: cleanText(roof.areaMethod) || null,
      areaSqm: finite(normalizedRoof.areaSqm ?? roof.effectiveAreaSqm),
      projectedAreaSqm: finite(roof.areaSqm ?? roof.projectedAreaSqm),
      planeAreaSqm: finite(roof.planeAreaSqm),
      azimuthDegrees: finite(normalizedRoof.orientationDegrees ?? roof.orientationDegrees),
      tiltDegrees: finite(normalizedRoof.tiltDegrees ?? roof.tiltDegrees),
      mountingMode: cleanText(normalizedRoof.mountingMode ?? roof.mountingMode) || null,
      outlinePoints: Array.isArray(roof.points)
        ? roof.points.map((point) => ({ lat: finite(point?.lat), lng: finite(point?.lng) }))
        : null
    },
    storageRequested: state?.storageRequired === true,
    result: {
      solarYieldKwhPerKwp: finite(analysis?.production?.annualYieldKwhPerKwp),
      capacityKwp: finite(system.capacityKwp),
      panelCount: finite(system.panelCount),
      panelWatts: finite(system.panelWatts),
      annualGenerationKwh: finite(generation.annualKwh),
      monthlyGenerationKwh: wholeProfile(generation.monthlyKwh),
      annualConsumptionKwh: finite(
        balance.annualConsumptionKwh ?? analysis?.consumption?.annualKwh
      ),
      coveredConsumptionKwh: finite(balance.offsetEnergyKwh),
      surplusGenerationKwh: finite(balance.surplusEnergyKwh),
      coveragePercent: finite(scenario.coveragePercent),
      annualSavingsAmd: finite(financial.annualSavingsAmd),
      avoidedCo2Tons: finite(analysis?.environmental?.avoidedCo2Tons),
      source: cleanText(analysis?.production?.source?.provider) || null
    },
    equipment: {
      solarModule: compactEquipment(
        equipment,
        equipment.panelWatts ? `${equipment.panelWatts} W` : ''
      ),
      inverter: compactEquipment(
        inverter,
        inverter?.selectedAcPowerKw ? `${inverter.selectedAcPowerKw} kW AC` : ''
      ),
      storage:
        storage?.status === 'sized'
          ? compactEquipment(
              storage,
              storage.selectedUsableCapacityKwh ? `${storage.selectedUsableCapacityKwh} kWh` : ''
            )
          : null,
      mounting: compactEquipment(
        mounting,
        mounting?.practicalInclinationDeg !== null &&
          mounting?.practicalInclinationDeg !== undefined
          ? `${mounting.practicalInclinationDeg}°`
          : ''
      )
    },
    billFileName: cleanText(billFile?.name) || null
  };
};

export const validateProfessionalLeadForm = ({ name, phone, email, message } = {}) => {
  const values = {
    name: cleanText(name),
    phone: cleanText(phone),
    email: cleanText(email),
    message: cleanText(message)
  };
  if (values.name.length < 2 || values.name.length > 100) {
    return { valid: false, field: 'name', values };
  }
  if (!validLeadPhone(values.phone)) {
    return { valid: false, field: 'phone', values };
  }
  if (values.email && (values.email.length > 254 || !validLeadEmail(values.email))) {
    return { valid: false, field: 'email', values };
  }
  if (values.message.length > 2_000) {
    return { valid: false, field: 'message', values };
  }
  return { valid: true, field: null, values };
};
