import { ApiError, handlePost, readJsonBody } from '../_lib/http.js';
import { createPvgisAdapter, validateAnalysisInput } from '../_lib/pvgis.js';
import { buildP0SolarAnalysis, validateP0AnalysisWorkflow } from '../_lib/solar-analysis.js';
import { assertArmeniaServiceArea } from '../_lib/service-area.js';

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
  const [providerAnalysis, providerPotential] = await Promise.all([
    // Both mounting approaches calculate the visitor's entered plane. Only
    // `mountingplace` changes: building-mounted or free-standing.
    adapter.analyze(input, { signal: request.signal }),
    elevatedMount
      ? adapter.potential(benchmarkInputFor(input), { signal: request.signal })
      : Promise.resolve(null)
  ]);
  const normalizedProviderAnalysis = {
    ...providerAnalysis,
    recommendedMounting: elevatedMount
      ? {
          mountingMode: 'elevated',
          tiltDegrees: providerPotential.optimum.tiltDegrees,
          azimuthDegrees: providerPotential.optimum.azimuthDegrees,
          pvgisMountingPlace: input.roof.pvgisMountingPlace,
          basis: 'pvgis-fixed-free-standing-optimum'
        }
      : {
          mountingMode: 'roof-parallel',
          tiltDegrees: input.roof.tiltDegrees,
          azimuthDegrees: input.roof.azimuthDegrees,
          pvgisMountingPlace: input.roof.pvgisMountingPlace,
          basis: 'user-entered-roof-plane'
        }
  };
  return {
    analysis: buildP0SolarAnalysis({
      body,
      validatedInput: input,
      providerAnalysis: normalizedProviderAnalysis,
      tariffSelection: workflow.tariffSelection,
      roofArea: workflow.roofArea
    })
  };
};

export const onRequest = (context) => handlePost(context, analyze);
