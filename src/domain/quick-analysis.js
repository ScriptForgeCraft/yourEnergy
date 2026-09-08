import { buildSolarAnalysis } from './solar-analysis.js';

/**
 * Creates an intentionally regional, not property-specific, early estimate.
 * The calculation itself is delegated to the same engine used by the
 * refinement and professional flows; this module only supplies the truthful
 * scope and non-property evidence model.
 */
export const buildRegionalQuickAnalysis = ({
  region,
  consumption,
  tariffSelection,
  production,
  priceBook,
  gridEmissionFactor,
  treeEquivalency,
  effectiveDate = new Date()
} = {}) => {
  const analysis = buildSolarAnalysis({
    property: {
      address: `Regional benchmark: ${region?.id ?? 'unknown'}`,
      coordinates: region
        ? { lat: region.coordinates.latitude, lng: region.coordinates.longitude }
        : null,
      confirmed: false,
      source: region?.source
    },
    consumption,
    roof: {
      // An early regional result has no roof measurement and therefore does
      // not impose a made-up capacity constraint.
      mountingMode: null,
      areaMethod: null,
      polygonComplete: false
    },
    production,
    tariffSelection,
    system: { panelWatts: 580, panelAreaSqm: 2 },
    investment: {},
    priceBook,
    gridEmissionFactor,
    treeEquivalency,
    effectiveDate,
    scope: 'regional-preliminary',
    limitations: [
      'REGIONAL_REFERENCE_POINT_NOT_PROPERTY_LOCATION',
      'ROOF_AREA_ORIENTATION_TILT_AND_SHADING_NOT_INCLUDED',
      'FINAL_SYSTEM_REQUIRES_PROPERTY_REFINEMENT'
    ],
    assumptions: ['REGIONAL_PVGIS_BENCHMARK']
  });

  return {
    ...analysis,
    mode: 'regional-quick-analysis',
    regionalBenchmark: {
      id: region?.id ?? null,
      coordinates: region?.coordinates ?? null,
      rationale: region?.rationale ?? null
    },
    dataCompleteness: {
      ...analysis.dataCompleteness,
      // The result has enough evidence for an early regional estimate, but it
      // intentionally cannot be promoted to a roof or property survey.
      level:
        analysis.consumption.available && analysis.production.available
          ? 'preliminary'
          : 'incomplete'
    }
  };
};
