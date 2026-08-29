import { ApiError, handlePost, readJsonBody } from '../_lib/http.js';
import { createPvgisAdapter, validateAnalysisInput } from '../_lib/pvgis.js';
import { buildP0SolarAnalysis, validateP0AnalysisWorkflow } from '../_lib/solar-analysis.js';

const P0_PVGIS_QUERY = Object.freeze({ capacityKwp: 1, lossPercent: 14 });

export const analyze = async ({ request, env, fetchImpl }) => {
  const body = await readJsonBody(request);
  const input = validateAnalysisInput(body);
  validateP0AnalysisWorkflow(body);
  if (
    input.system.capacityKwp !== P0_PVGIS_QUERY.capacityKwp ||
    input.system.lossPercent !== P0_PVGIS_QUERY.lossPercent
  ) {
    throw new ApiError('INVALID_INPUT');
  }
  const adapter = createPvgisAdapter(env, { fetchImpl });
  const providerAnalysis = await adapter.analyze(input, { signal: request.signal });
  return {
    analysis: buildP0SolarAnalysis({
      body,
      validatedInput: input,
      providerAnalysis
    })
  };
};

export const onRequest = (context) => handlePost(context, analyze);
