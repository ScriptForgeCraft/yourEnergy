import { ApiError, handlePost, readJsonBody } from '../_lib/http.js';
import {
  createPvgisAdapter,
  validateAnalysisInput,
  withElevatedArrayGeometry
} from '../_lib/pvgis.js';
import { buildP0SolarAnalysis, validateP0AnalysisWorkflow } from '../_lib/solar-analysis.js';
import { assertArmeniaServiceArea } from '../_lib/service-area.js';
import { recommendMountingHardware } from '../../src/domain/mounting-recommendation.js';

const P0_PVGIS_QUERY = Object.freeze({ capacityKwp: 1, lossPercent: 14 });

const usesElevatedMount = (body) => body?.roof?.mountingMode === 'elevated';

const benchmarkInputFor = (input) => ({
  property: { ...input.property, confirmed: true },
  system: input.system,
  roof: { pvgisMountingPlace: 'free' }
});

export const analyze = async ({ request, env, fetchImpl }) => {
  const body = await readJsonBody(request);
  const input = validateAnalysisInput(body);
  assertArmeniaServiceArea({
    latitude: input.property.latitude,
    longitude: input.property.longitude
  });
  const workflow = validateP0AnalysisWorkflow(body, input);
  if (
    input.system.capacityKwp !== P0_PVGIS_QUERY.capacityKwp ||
    input.system.lossPercent !== P0_PVGIS_QUERY.lossPercent
  ) {
    throw new ApiError('INVALID_INPUT');
  }
  const adapter = createPvgisAdapter(env, { fetchImpl });
  const elevatedMount = usesElevatedMount(body);
  let providerAnalysis;
  let providerPotential = null;
  let arrayGeometry = null;
  let mountingHardware = null;
  if (elevatedMount) {
    // First obtain the free-standing reference. The catalog's practical angle
    // becomes the actual preliminary array tilt; PVGIS is then queried again
    // using that same array geometry, never the roof-face tilt.
    providerPotential = await adapter.potential(benchmarkInputFor(input), {
      signal: request.signal
    });
    const explicitArrayTilt = input.array.tiltDegrees !== null;
    mountingHardware = recommendMountingHardware({
      mountingMode: 'elevated',
      pvgisOptimumTiltDegrees: providerPotential.optimum.tiltDegrees,
      arrayTiltDegrees: explicitArrayTilt ? input.array.tiltDegrees : null,
      explicitArrayTilt
    });
    arrayGeometry = {
      tiltDegrees:
        input.array.tiltDegrees ??
        mountingHardware?.practicalInclinationDeg ??
        providerPotential.optimum.tiltDegrees,
      azimuthDegrees: input.array.azimuthDegrees ?? providerPotential.optimum.azimuthDegrees
    };
    providerAnalysis = await adapter.analyze(
      withElevatedArrayGeometry(input, {
        arrayTiltDegrees: arrayGeometry.tiltDegrees,
        arrayAzimuthDegrees: arrayGeometry.azimuthDegrees
      }),
      { signal: request.signal }
    );
  } else {
    providerAnalysis = await adapter.analyze(input, { signal: request.signal });
  }
  const normalizedProviderAnalysis = {
    ...providerAnalysis,
    recommendedMounting: elevatedMount
      ? {
          mountingMode: 'elevated',
          // Legacy aliases are the actual selected array values. Explicit
          // names make the two geometries unambiguous in new records.
          tiltDegrees: arrayGeometry.tiltDegrees,
          azimuthDegrees: arrayGeometry.azimuthDegrees,
          arrayTiltDegrees: arrayGeometry.tiltDegrees,
          arrayAzimuthDegrees: arrayGeometry.azimuthDegrees,
          pvgisOptimumTiltDegrees: providerPotential.optimum.tiltDegrees,
          pvgisOptimumAzimuthDegrees: providerPotential.optimum.azimuthDegrees,
          practicalInclinationDeg: mountingHardware?.practicalInclinationDeg ?? null,
          pvgisMountingPlace: 'free',
          basis: input.roof.explicitArrayGeometry
            ? 'user-entered-array-geometry'
            : 'catalog-practical-inclination-from-pvgis-optimum'
        }
      : {
          mountingMode: 'roof-parallel',
          tiltDegrees: input.roof.tiltDegrees,
          azimuthDegrees: input.roof.azimuthDegrees,
          arrayTiltDegrees: input.roof.tiltDegrees,
          arrayAzimuthDegrees: input.roof.azimuthDegrees,
          pvgisMountingPlace: input.roof.pvgisMountingPlace,
          basis: 'user-entered-roof-plane'
        }
  };
  return {
    analysis: buildP0SolarAnalysis({
      body,
      validatedInput: input,
      providerAnalysis: normalizedProviderAnalysis,
      consumption: workflow.consumption,
      tariffSelection: workflow.tariffSelection,
      roofArea: workflow.roofArea,
      calculatorSystem: workflow.calculatorSystem,
      calculationConfig: {
        systemLossPercent: input.system.lossPercent,
        mountingPlace: normalizedProviderAnalysis.inputs.roof.pvgisMountingPlace,
        arrayTiltDegrees: normalizedProviderAnalysis.inputs.roof.tiltDegrees,
        arrayAzimuthDegrees: normalizedProviderAnalysis.inputs.roof.azimuthDegrees
      }
    })
  };
};

export const onRequest = (context) => handlePost(context, analyze);
