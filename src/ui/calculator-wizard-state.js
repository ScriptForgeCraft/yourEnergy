export const WIZARD_STEP_KEYS = Object.freeze([
  'object',
  'potential',
  'roof',
  'consumption',
  'result'
]);

export const WIZARD_STEP_STATUSES = Object.freeze({
  LOCKED: 'locked',
  AVAILABLE: 'available',
  LOADING: 'loading',
  COMPLETE: 'complete',
  UNAVAILABLE: 'unavailable'
});

const potentialStatus = (value) =>
  [
    WIZARD_STEP_STATUSES.LOADING,
    WIZARD_STEP_STATUSES.COMPLETE,
    WIZARD_STEP_STATUSES.UNAVAILABLE
  ].includes(value)
    ? value
    : WIZARD_STEP_STATUSES.AVAILABLE;

/**
 * State contains only browser-session inputs. A potential request is an
 * independent enrichment of a confirmed point; it never owns roof or
 * consumption data.
 */
export const createCalculatorWizardState = (overrides = {}) => ({
  currentStep: 0,
  addressNote: '',
  pendingLocation: null,
  confirmedProperty: null,
  sitePotential: null,
  potentialStatus: WIZARD_STEP_STATUSES.LOCKED,
  roof: null,
  consumption: null,
  userTariff: null,
  selectedBillFile: null,
  analysis: null,
  analysisStatus: WIZARD_STEP_STATUSES.LOCKED,
  solarPassport: null,
  ...overrides
});

/**
 * This intentionally touches only potential fields. It is used by both the
 * controller and regression tests to prevent a retry from clearing inputs.
 */
export const applyPotentialOutcome = (state, { status, potential = null } = {}) => ({
  ...state,
  potentialStatus: potentialStatus(status),
  sitePotential: status === WIZARD_STEP_STATUSES.COMPLETE ? potential : null
});

/**
 * Availability is not a linear pipeline. Roof and consumption can be prepared
 * while PVGIS is retryable; the result remains closed until analysis succeeds.
 */
export const deriveWizardStepStates = ({
  confirmedProperty,
  potentialStatus: currentPotentialStatus,
  roofComplete,
  consumptionComplete,
  analysisStatus
} = {}) => {
  const status = WIZARD_STEP_STATUSES;
  const propertyConfirmed = Boolean(confirmedProperty);
  const roofReady = Boolean(roofComplete);
  const consumptionReady = Boolean(consumptionComplete);

  return Object.freeze({
    object: propertyConfirmed ? status.COMPLETE : status.AVAILABLE,
    potential: propertyConfirmed ? potentialStatus(currentPotentialStatus) : status.LOCKED,
    roof: propertyConfirmed ? (roofReady ? status.COMPLETE : status.AVAILABLE) : status.LOCKED,
    consumption:
      propertyConfirmed && roofReady
        ? consumptionReady
          ? status.COMPLETE
          : status.AVAILABLE
        : status.LOCKED,
    result:
      analysisStatus === status.COMPLETE
        ? status.COMPLETE
        : analysisStatus === status.LOADING
          ? status.LOADING
          : status.LOCKED
  });
};

/**
 * Loading data may be inspected for a previously opened enrichment step, but
 * the result view remains closed until an analysis object exists.
 */
export const isWizardStepAccessible = (stepStatus, { allowLoading = true } = {}) =>
  stepStatus !== WIZARD_STEP_STATUSES.LOCKED &&
  (allowLoading || stepStatus !== WIZARD_STEP_STATUSES.LOADING);
