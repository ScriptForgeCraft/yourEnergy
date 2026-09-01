import { createPvgisAdapter, validatePotentialInput } from '../_lib/pvgis.js';
import { handlePost, readJsonBody } from '../_lib/http.js';

const P0_PVGIS_QUERY = Object.freeze({ capacityKwp: 1, lossPercent: 14 });

/**
 * A quick location-level result. It intentionally does not include roof area,
 * system size, price, savings or ownership claims; those require the detailed
 * roof and consumption flow in /api/analysis.
 */
export const potential = async ({ request, env, fetchImpl }) => {
  const input = validatePotentialInput(await readJsonBody(request));
  const adapter = createPvgisAdapter(env, { fetchImpl });
  const providerPotential = await adapter.potential(input, { signal: request.signal });
  const retrievedAt = providerPotential.sourceLedger?.[0]?.retrievedAt ?? new Date().toISOString();

  return {
    potential: {
      mode: 'site-potential',
      source: 'provider',
      property: {
        coordinates: {
          lat: input.property.latitude,
          lng: input.property.longitude
        },
        confirmed: true
      },
      system: P0_PVGIS_QUERY,
      annualYieldKwhPerKwp: providerPotential.optimum.generation.annualKwh,
      monthlyYieldKwhPerKwp: providerPotential.optimum.generation.monthlyKwh,
      orientation: {
        azimuthDegrees: providerPotential.optimum.azimuthDegrees,
        tiltDegrees: providerPotential.optimum.tiltDegrees,
        basis: 'pvgis-fixed-free-standing-optimum'
      },
      sourceLedger: [
        {
          key: 'solar-potential-optimum',
          source: {
            kind: 'provider',
            status: 'confirmed',
            provider: 'PVGIS',
            reference: null,
            verifiedAt: retrievedAt
          }
        }
      ],
      limitations: [
        'PVGIS_FREE_STANDING_OPTIMUM_NOT_ROOF_SURVEY',
        'ROOF_GEOMETRY_SHADING_AND_STRUCTURAL_CHECK_REQUIRED'
      ]
    }
  };
};

export const onRequest = (context) => handlePost(context, potential);
