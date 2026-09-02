/**
 * Shared P0 domain model vocabulary.
 *
 * These types intentionally describe values after user confirmation or a
 * provider response. They do not imply that a location, roof, tariff, or
 * financial estimate has been verified.
 */

/** @typedef {'manual'|'provider'|'registry'|'unavailable'} SourceKind */
/** @typedef {'confirmed'|'provided'|'estimated'|'unavailable'} SourceStatus */
/** @typedef {'preliminary'|'incomplete'|'unavailable'} DataCompletenessLevel */
/** @typedef {'unavailable'|'technical-ready'|'financial-ready'} AnalysisStatus */

/**
 * @typedef {Object} GeoPoint
 * @property {number} lat
 * @property {number} lng
 */

/**
 * @typedef {Object} SourceReference
 * @property {SourceKind} kind
 * @property {SourceStatus} status
 * @property {string|null} provider
 * @property {string|null} reference
 * @property {string|null} verifiedAt
 */

/**
 * @typedef {Object} Property
 * @property {string|null} address
 * @property {GeoPoint|null} coordinates
 * @property {boolean} confirmed
 * @property {SourceReference} source
 */

/**
 * @typedef {Object} Consumption
 * @property {'monthly-profile'|'annual-kwh'|'monthly-average-kwh'|'monthly-bill'|'unavailable'} kind
 * @property {boolean} available
 * @property {number|null} annualKwh
 * @property {number[]|null} monthlyKwh
 * @property {number|null} averageMonthlyKwh
 * @property {number|null} averageMonthlyBillAmd
 * @property {string[]} issues
 * @property {SourceReference} source
 */

/**
 * @typedef {Object} Roof
 * @property {number|null} areaSqm
 * @property {'map-projected'|'measured-plane'|null} areaMethod
 * @property {number|null} projectedAreaSqm
 * @property {number|null} planeAreaSqm
 * @property {'roof-parallel'|'elevated'|null} mountingMode
 * @property {number|null} orientationDegrees
 * @property {number|null} tiltDegrees
 * @property {number|null} usableAreaRatio
 * @property {boolean} polygonComplete
 * @property {SourceReference} source
 */

/**
 * @typedef {Object} Tariff
 * @property {string} id
 * @property {string} effectiveFrom
 * @property {string|null} effectiveTo
 * @property {'confirmed'|'provided'|'unavailable'} status
 * @property {number|null} rateAmdPerKwh
 * @property {string} currency
 * @property {SourceReference} source
 */

/**
 * @typedef {Object} SolarAnalysis
 * @property {string} schemaVersion
 * @property {AnalysisStatus} status
 * @property {Property} property
 * @property {Consumption} consumption
 * @property {Roof} roof
 * @property {Object} tariff
 * @property {Object} financial
 * @property {Object|null} priceBook
 * @property {Object|null} commercialEstimate
 * @property {Object[]} scenarios
 * @property {Object|null} selectedScenario
 * @property {'manual-roof-plane'|string} scope
 * @property {Object} dataCompleteness
 * @property {Object|null} cache
 * @property {string|null} providerRetrievedAt
 * @property {Object|null} mountingRecommendation
 * @property {string[]} limitations
 * @property {Object[]} sourceLedger
 * @property {string[]} assumptions
 */

/**
 * @typedef {Object} SitePotential
 * @property {'site-potential'} mode
 * @property {'provider'} source
 * @property {{coordinates: GeoPoint, confirmed: true}} property
 * @property {{capacityKwp: 1, lossPercent: 14}} system
 * @property {number} annualYieldKwhPerKwp
 * @property {number[]} monthlyYieldKwhPerKwp
 * @property {{azimuthDegrees: number, tiltDegrees: number, basis: string}} orientation
 * @property {Object[]} sourceLedger
 * @property {string[]} limitations
 */

/**
 * @typedef {Object} SolarPassport
 * @property {string} id
 * @property {string} schemaVersion
 * @property {string} createdAt
 * @property {'memory'} persistence
 * @property {boolean} permanentUrlAvailable
 * @property {SolarAnalysis|Object} analysis
 * @property {Object[]} sourceLedger
 * @property {string[]} assumptions
 */

export const DATA_COMPLETENESS_LEVEL = Object.freeze({
  PRELIMINARY: 'preliminary',
  INCOMPLETE: 'incomplete',
  UNAVAILABLE: 'unavailable'
});

export const ANALYSIS_STATUS = Object.freeze({
  UNAVAILABLE: 'unavailable',
  TECHNICAL_READY: 'technical-ready',
  FINANCIAL_READY: 'financial-ready'
});

export const SOURCE_KIND = Object.freeze({
  MANUAL: 'manual',
  PROVIDER: 'provider',
  REGISTRY: 'registry',
  UNAVAILABLE: 'unavailable'
});

export const SOURCE_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PROVIDED: 'provided',
  ESTIMATED: 'estimated',
  UNAVAILABLE: 'unavailable'
});
