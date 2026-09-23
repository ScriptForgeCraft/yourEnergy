import { getSolarPanelById } from './calculator-catalog.js';

// The default is deliberately an identifier only. Watts, physical area, brand
// and model are resolved from the validated calculation catalogue below.
export const DEFAULT_CALCULATOR_PANEL_ID = 'longi-hi-mo-x10-guardian-lr7-72hvdf';

/**
 * Normalized calculation data for a real catalogue panel. Optional technical
 * fields are intentionally omitted when the catalogue does not provide them;
 * they are comparison metadata, not PVGIS adjustment factors.
 */
export const getSolarPanelCalculationProfile = (panelId = DEFAULT_CALCULATOR_PANEL_ID) => {
  const panel = getSolarPanelById(panelId);
  const calculation = panel?.calculation;
  if (!calculation) return null;

  return Object.freeze({
    id: panel.id,
    brand: panel.brand,
    productName: panel.product_name,
    model: panel.model,
    watts: calculation.panelWatts,
    areaSqm: calculation.panelAreaSqm,
    ...(calculation.dimensions_mm
      ? {
          dimensionsMm: Object.freeze({
            length: calculation.dimensions_mm.length_mm,
            width: calculation.dimensions_mm.width_mm,
            thickness: calculation.dimensions_mm.thickness_mm
          })
        }
      : {}),
    ...(calculation.series_max_efficiency_percent
      ? { efficiencyPercent: calculation.series_max_efficiency_percent }
      : {}),
    ...(calculation.bifaciality_percent_nominal
      ? { bifacialityPercent: calculation.bifaciality_percent_nominal }
      : {}),
    ...(calculation.annual_degradation_percent !== undefined
      ? { annualDegradationPercent: calculation.annual_degradation_percent }
      : {})
  });
};

export const getCalculatorSystemForPanel = (panelId = DEFAULT_CALCULATOR_PANEL_ID) => {
  const panel = getSolarPanelCalculationProfile(panelId);
  if (!panel) return null;

  return Object.freeze({
    panelWatts: panel.watts,
    panelAreaSqm: panel.areaSqm,
    equipment: Object.freeze({
      panelId: panel.id,
      panelBrand: panel.brand,
      panelModel: panel.model,
      panelWatts: panel.watts,
      panelAreaSqm: panel.areaSqm,
      source: 'equipment-catalog'
    })
  });
};

export const getDefaultCalculatorSystem = () => getCalculatorSystemForPanel();
