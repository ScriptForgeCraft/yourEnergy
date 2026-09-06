/**
 * Product-configured representative points for an early regional estimate.
 *
 * They are deliberately not geocoding results and must never be presented as
 * a visitor's house coordinates.  A property-level analysis always requires
 * a point confirmed by the visitor in the refinement or professional flow.
 */
export const ARMENIA_REGIONAL_BENCHMARKS_VERSION = 'v1.0.0';

export const ARMENIA_REGIONAL_BENCHMARKS = Object.freeze(
  [
    ['yerevan', 40.1792, 44.4991],
    ['aragatsotn', 40.5899, 44.3529],
    ['ararat', 39.8317, 44.7045],
    ['armavir', 40.1545, 44.0382],
    ['gegharkunik', 40.3542, 45.1265],
    ['kotayk', 40.2737, 44.6338],
    ['lori', 40.8079, 44.4939],
    ['shirak', 40.7894, 43.8475],
    ['syunik', 39.5135, 46.3392],
    ['tavush', 40.8747, 45.1485],
    ['vayots-dzor', 39.6959, 45.4653]
  ].map(([id, latitude, longitude]) =>
    Object.freeze({
      id,
      coordinates: Object.freeze({ latitude, longitude }),
      source: Object.freeze({
        kind: 'provider',
        status: 'provided',
        provider: 'YOURENERGY regional benchmark configuration',
        reference: ARMENIA_REGIONAL_BENCHMARKS_VERSION
      }),
      rationale:
        'Representative regional point for an early estimate only; not a property location.'
    })
  )
);

export const getArmeniaRegionalBenchmark = (regionId) =>
  ARMENIA_REGIONAL_BENCHMARKS.find((region) => region.id === regionId) ?? null;
