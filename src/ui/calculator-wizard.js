import {
  ANALYSIS_SCHEMA_VERSION,
  calculatePreliminaryRoofCapacity,
  calculateRoofPlaneArea,
  getCalculatorInputNumber,
  PRELIMINARY_USABLE_ROOF_RATIO,
  SolarPassportRepository,
  createStandardFinancialRate,
  toFinancialRateRequest
} from '../domain/index.js';
import { number, format, text, element, localeCode } from './calculator/view-helpers.js';
import { createCalculatorResultsView } from './calculator/results-view.js';
import { openCalculatorPdfReport } from './calculator/pdf-report.js';
import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { createPropertyMap, isSimplePolygon } from '../services/property-map.js';
import {
  applyPotentialOutcome,
  createCalculatorWizardState,
  deriveWizardStepStates,
  isWizardStepAccessible,
  WIZARD_STEP_KEYS,
  WIZARD_STEP_STATUSES
} from './calculator-wizard-state.js';
import { initConsumptionInput } from './consumption-input.js';
import { createAsyncRequestLifecycle } from './async-request-lifecycle.js';
import { createCalculatorSession } from './calculator-session.js';
import { buildProfessionalLeadContext, validateProfessionalLeadForm } from './professional-lead.js';
import {
  completeProfessionalRoofInput,
  createProfessionalAnalysisIdentity,
  isRestorableProfessionalAnalysis,
  mergeProfessionalRoofInput
} from './professional-analysis-identity.js';
import { localitiesForRegion, localityCenter } from '../data/locations/armenia.js';
import { localityLabel } from '../data/locations/locality-labels.js';
import { getDefaultCalculatorSystem } from '../data/equipment/calculator/defaults.js';
import { recommendMountingHardware } from '../domain/mounting-recommendation.js';

const PVGIS_KWP = 1;
const PVGIS_LOSS = 14;
const ADDRESS_SEARCH_DEBOUNCE_MS = 1_000;
const POTENTIAL_COOLDOWN_MS = 10_000;
const ANALYSIS_COOLDOWN_MS = 15_000;
// A property point can be imprecise (for example, an entrance rather than
// the roof centre), but an outline kilometres away is plainly a different
// building. This guard applies only to map-drawn roofs.
const MAX_ROOF_DISTANCE_FROM_PROPERTY_METERS = 500;

// Step four is not part of the initial Professional flow. Keeping its visual
// layer in a separate CSS chunk avoids downloading dashboard-only rules until
// an analysis is ready. Callers wait for the stylesheet before exposing the
// result, preventing a flash of unstyled dashboard content.
let resultStylesRequest = null;
const ensureResultStyles = () =>
  (resultStylesRequest ??= import('../styles/calculator/pro-result.css'));

export const getViewportPopoverPosition = ({
  triggerRect,
  popoverRect,
  viewportWidth,
  viewportHeight,
  gutter = 12
}) => {
  const safeGutter = Math.max(0, gutter);
  const maximumWidth = Math.max(1, viewportWidth - safeGutter * 2);
  const width = Math.min(Math.max(1, popoverRect.width), maximumWidth);
  const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - safeGutter);
  const spaceAbove = Math.max(0, triggerRect.top - safeGutter);
  const placement = spaceBelow >= spaceAbove ? 'below' : 'above';
  const maximumHeight = Math.max(1, placement === 'below' ? spaceBelow : spaceAbove);
  const height = Math.min(Math.max(1, popoverRect.height), maximumHeight);
  const maximumLeft = Math.max(safeGutter, viewportWidth - safeGutter - width);
  const left = Math.min(maximumLeft, Math.max(safeGutter, triggerRect.right - width));
  const top =
    placement === 'below' ? triggerRect.bottom : Math.max(safeGutter, triggerRect.top - height);

  return { left, top, width, maximumHeight, placement };
};

const analysisMatchesPanel = (analysis, system) => {
  const equipment = analysis?.equipment ?? analysis?.selectedScenario?.system?.equipment;
  const selected = system?.equipment;
  if (!equipment || !selected) return false;
  return (
    equipment?.panelId === selected?.panelId &&
    equipment?.panelWatts === selected?.panelWatts &&
    equipment?.panelAreaSqm === selected?.panelAreaSqm
  );
};

const analysisMatchesStorageRequest = (analysis, storageRequired) =>
  Boolean(analysis?.storageRecommendation) === storageRequired;

const compass = (degrees, directions) => {
  const value = Number(degrees);
  if (!Number.isFinite(value)) return '—';
  const names = [
    directions?.north,
    directions?.northEast,
    directions?.east,
    directions?.southEast,
    directions?.south,
    directions?.southWest,
    directions?.west,
    directions?.northWest
  ];
  return `${format(value, 'en', { maximumFractionDigits: 0 })}° · ${names[Math.round(value / 45) % 8] ?? ''}`;
};

const describeError = (error, product) => {
  if (!(error instanceof ProductApiError)) return product.result?.unavailable ?? '';
  const messages = {
    OUTSIDE_SERVICE_AREA: product.status?.outsideServiceArea,
    PVGIS_CACHE_NOT_CONFIGURED: product.potential?.unavailable,
    PVGIS_CACHE_UNAVAILABLE: product.potential?.unavailable,
    ROOF_AREA_REQUIRES_MEASURED_PLANE: product.status?.roofAreaRequiresMeasured,
    PVGIS_TIMEOUT: product.potential?.unavailable,
    PVGIS_UNAVAILABLE: product.potential?.unavailable
  };
  return (
    messages[error.code] ?? product.result?.unavailable ?? product.potential?.unavailable ?? ''
  );
};

const activeAreaMethod = (root) =>
  root.querySelector('[data-roof-area-method]:checked')?.value ?? 'map-projected';

const activeMountingMode = (root) =>
  root.querySelector('select[data-roof-mounting-mode]')?.value ??
  root.querySelector('[data-roof-mounting-mode]:checked')?.value ??
  'roof-parallel';

const ARMENIA_REGION_CENTERS = Object.freeze({
  yerevan: { lat: 40.1792, lng: 44.4991 },
  aragatsotn: { lat: 40.2992, lng: 44.3629 },
  ararat: { lat: 39.9539, lng: 44.5506 },
  armavir: { lat: 40.1545, lng: 44.0382 },
  gegharkunik: { lat: 40.3585, lng: 45.1262 },
  kotayk: { lat: 40.4972, lng: 44.7661 },
  lori: { lat: 40.8071, lng: 44.4939 },
  shirak: { lat: 40.7894, lng: 43.8475 },
  syunik: { lat: 39.2075, lng: 46.4058 },
  tavush: { lat: 40.8756, lng: 45.1486 },
  'vayots-dzor': { lat: 39.7639, lng: 45.3324 }
});

export const getRoofValidationIssue = (roof = {}) => {
  if (roof.areaMethod === 'map-projected' && roof.simplePolygon === false)
    return 'self-intersection';
  if (
    roof.areaMethod === 'map-projected' &&
    Number.isFinite(roof.distanceFromPropertyMeters) &&
    roof.distanceFromPropertyMeters > MAX_ROOF_DISTANCE_FROM_PROPERTY_METERS
  )
    return 'distance';
  if (roof.areaMethod === 'map-projected' && !roof.polygonComplete) return 'outline';
  if (roof.areaMethod === 'measured-plane' && roof.effectiveAreaSqm === null) return 'area';
  if (roof.azimuthDegrees === null) return 'orientation';
  if (roof.tiltDegrees === null) return 'tilt';
  // A valid outline can still have no derived plane area when the entered
  // tilt is too steep for a reliable plan-view conversion. That requires a
  // measured roof-face area, not another instruction to redraw the polygon.
  if (roof.areaMethod === 'map-projected' && roof.effectiveAreaSqm === null) return 'area';
  return null;
};

export const roofAreaForDisplay = (roof = {}) =>
  roof.areaMethod === 'map-projected' ? roof.projectedAreaSqm : roof.effectiveAreaSqm;

const roofOutlineDistanceFromProperty = (points, property) => {
  if (!Array.isArray(points) || points.length < 3 || !property) return null;
  const normalized = points.filter(
    (point) => Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
  );
  if (normalized.length !== points.length) return null;
  const center = normalized.reduce(
    (total, point) => ({ lat: total.lat + Number(point.lat), lng: total.lng + Number(point.lng) }),
    { lat: 0, lng: 0 }
  );
  const lat = center.lat / normalized.length;
  const lng = center.lng / normalized.length;
  const propertyLat = Number(property.lat);
  const propertyLng = Number(property.lng);
  if (!Number.isFinite(propertyLat) || !Number.isFinite(propertyLng)) return null;
  const radians = Math.PI / 180;
  const deltaLat = (propertyLat - lat) * radians;
  const deltaLng = (propertyLng - lng) * radians;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat * radians) * Math.cos(propertyLat * radians) * Math.sin(deltaLng / 2) ** 2;
  return 6_371_008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
};

/**
 * The calculator has one state source and explicitly serializes only the
 * inputs needed by the same-origin analysis endpoint. In particular, a bill
 * file remains a File object in this tab and is intentionally not serialized.
 */
export const initCalculatorWizard = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-calculator-wizard]');
  if (!root) return null;

  const product = config.product ?? {};
  const wizard = config.wizard ?? {};
  const locale = config.locale ?? 'en-US';
  const displayProductsById = new Map();
  let displayProductsRequest = null;
  const loadDisplayProducts = () => {
    if (displayProductsRequest) return displayProductsRequest;
    displayProductsRequest = import('../data/equipment/showroom/catalog.js').then(
      ({ createEquipmentCatalog }) => {
        for (const displayProduct of createEquipmentCatalog(localeCode(locale)).products) {
          if (displayProduct?.id) displayProductsById.set(displayProduct.id, displayProduct);
        }
      }
    );
    return displayProductsRequest;
  };
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const lifecycle = createAsyncRequestLifecycle();
  const passportRepository = new SolarPassportRepository();
  const steps = [...root.querySelectorAll('[data-wizard-step]')];
  const progress = [...root.querySelectorAll('[data-wizard-nav]')];
  const mobileProgress = root.querySelector('[data-wizard-mobile-progress]');
  const status = root.querySelector('[data-wizard-status]');
  const address = root.querySelector('[data-wizard-address]');
  const locationSearchResults = root.querySelector('[data-location-search-results]');
  const latitudeInput = root.querySelector('[data-location-latitude]');
  const longitudeInput = root.querySelector('[data-location-longitude]');
  const regionSelect = root.querySelector('[data-location-region]');
  const localitySelect = root.querySelector('[data-location-locality]');
  const mapLatitude = root.querySelector('[data-map-latitude]');
  const mapLongitude = root.querySelector('[data-map-longitude]');
  const mapElement = root.querySelector('[data-property-map]');
  const locationMapWrap = root.querySelector('[data-location-map-wrap]');
  const roofMapHost = root.querySelector('[data-roof-map-host]');
  const roofMapTools = root.querySelector('.professional-roof-map__tools');
  const roofMapAnalysis = root.querySelector('.professional-roof-map__analysis');
  const roofLineWidth = root.querySelector('[data-roof-line-width]');
  const roofLineWidthOutput = root.querySelector('[data-roof-line-width-output]');
  const roofPointRadius = root.querySelector('[data-roof-point-radius]');
  const roofPointRadiusOutput = root.querySelector('[data-roof-point-radius-output]');
  const roofPointNumbers = root.querySelector('[data-roof-point-numbers]');
  const potentialLoading = root.querySelector('[data-potential-loading]');
  const potentialStatus = root.querySelector('[data-potential-status]');
  const potentialResult = root.querySelector('[data-potential-result]');
  const potentialRetry = root.querySelector('[data-potential-retry]');
  const potentialSkip = root.querySelector('[data-potential-skip]');
  const potentialChart = root.querySelector('[data-potential-chart]');
  const potentialTable = root.querySelector('[data-potential-table]');
  const potentialSummary = root.querySelector('[data-potential-summary]');
  const consumptionContinue = root.querySelector('[data-consumption-continue]');
  const roofArea = root.querySelector('[data-roof-area]');
  const roofAreaLabel = root.querySelector('[data-roof-area-label]');
  const roofMapArea = root.querySelector('[data-roof-map-area]');
  const roofMapOrientation = root.querySelector('[data-roof-map-orientation]');
  const roofMapTilt = root.querySelector('[data-roof-map-tilt]');
  const roofPlaneWrap = root.querySelector('[data-roof-plane-area-wrap]');
  const roofPlaneArea = root.querySelector('[data-roof-plane-area]');
  const roofOrientation = root.querySelector('[data-roof-orientation]');
  const roofOrientationCustom = root.querySelector('[data-roof-orientation-custom]');
  const roofOrientationCustomInput = root.querySelector('[data-roof-orientation-custom-input]');
  const roofTilt = root.querySelector('[data-roof-tilt]');
  const roofMountingModeHelp = root.querySelector('[data-roof-mounting-mode-help]');
  const roofInfoButtons = [...root.querySelectorAll('[data-roof-info-toggle]')];
  const roofInfoPopovers = [...root.querySelectorAll('[data-roof-info-popover]')];
  const roofInfoPopoversById = new Map(roofInfoPopovers.map((popover) => [popover.id, popover]));
  const arrayGeometry = root.querySelector('[data-array-geometry]');
  const arrayTilt = root.querySelector('[data-array-tilt]');
  const arrayAzimuth = root.querySelector('[data-array-azimuth]');
  const storageRequired = root.querySelector('[data-storage-required]');
  const roofNotice = root.querySelector('.professional-roof-notice');
  const roofNoticeCopy = roofNotice?.querySelector('p');
  const roofNoticeDefault = roofNoticeCopy?.innerHTML ?? '';
  const roofCapacityPreview = root.querySelector('[data-roof-capacity-preview]');
  const roofCapacityArea = root.querySelector('[data-roof-capacity-area]');
  const roofCapacityUsableLabel = root.querySelector('[data-roof-capacity-usable-label]');
  const roofCapacityUsable = root.querySelector('[data-roof-capacity-usable]');
  const roofCapacityPanels = root.querySelector('[data-roof-capacity-panels]');
  const roofCapacityPanel = root.querySelector('[data-roof-capacity-panel]');
  const roofCapacitySystem = root.querySelector('[data-roof-capacity-system]');
  const roofCapacityAssumption = root.querySelector('[data-roof-capacity-assumption]');
  const roofReferenceComparison = root.querySelector('[data-roof-reference-comparison]');
  const roofReferenceActual = root.querySelector('[data-roof-reference-actual]');
  const roofReferencePvgis = root.querySelector('[data-roof-reference-pvgis]');
  const resultDashboard = root.querySelector('[data-result-dashboard]');
  const resultSummary = root.querySelector('[data-result-summary]');
  const resultHeroActions = root.querySelector('[data-result-hero-actions]');
  const downloadPdfButtons = root.querySelectorAll('[data-download-pdf]');
  const professionalLeadOpeners = root.querySelectorAll('[data-professional-lead-open]');
  const professionalLeadTriggerStatus = root.querySelector(
    '[data-professional-lead-trigger-status]'
  );
  const professionalLeadDialog = document.querySelector('[data-professional-lead-dialog]');
  const professionalLeadForm = professionalLeadDialog?.querySelector(
    '[data-professional-lead-form]'
  );
  const professionalLeadName = professionalLeadDialog?.querySelector(
    '[data-professional-lead-name]'
  );
  const professionalLeadPhone = professionalLeadDialog?.querySelector(
    '[data-professional-lead-phone]'
  );
  const professionalLeadEmail = professionalLeadDialog?.querySelector(
    '[data-professional-lead-email]'
  );
  const professionalLeadAttachCalculation = professionalLeadDialog?.querySelector(
    '[data-professional-lead-attach-calculation]'
  );
  const professionalLeadMessage = professionalLeadDialog?.querySelector(
    '[data-professional-lead-message]'
  );
  const professionalLeadSubmit = professionalLeadDialog?.querySelector(
    '[data-professional-lead-submit]'
  );
  const professionalLeadStatus = professionalLeadDialog?.querySelector(
    '[data-professional-lead-status]'
  );
  const professionalLeadContent = professionalLeadDialog?.querySelector(
    '[data-professional-lead-content]'
  );
  const professionalLeadSuccess = professionalLeadDialog?.querySelector(
    '[data-professional-lead-success]'
  );
  const professionalLeadDismiss = professionalLeadDialog?.querySelector(
    '[data-professional-lead-dismiss]'
  );
  const passportDialog = document.querySelector('[data-passport-dialog]');
  const passportContent = document.querySelector('[data-passport-dialog-content]');
  const heroTitle = root.querySelector('#calculator-title');
  const heroIntro = root.querySelector('.professional-hero__copy > p');
  const heroBreadcrumbCurrent = root.querySelector('.calculator-breadcrumb > span');
  const defaultHeroTitle = heroTitle?.textContent ?? '';
  const defaultHeroIntro = heroIntro?.textContent ?? '';
  const defaultHeroBreadcrumb = heroBreadcrumbCurrent?.textContent ?? '';

  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

  const session = createCalculatorSession();
  const savedSession = session.read();
  // Professional sizing always starts with the calculator-selected catalog
  // module. A legacy session's former customer choice is deliberately ignored.
  const recommendedPanelSystem = getDefaultCalculatorSystem();
  const recommendedPanelId = recommendedPanelSystem?.equipment?.panelId ?? null;
  const savedStorageRequired = savedSession.storageRequired === true;
  const savedRoofForIdentity = completeProfessionalRoofInput(savedSession.roof, {
    areaMethod: activeAreaMethod(root),
    mountingMode: activeMountingMode(root),
    projectedAreaSqm: savedSession.roof?.areaSqm ?? null,
    planeAreaSqm: number(roofPlaneArea?.value, 0),
    tiltDegrees: number(roofTilt?.value, 0, 90),
    arrayTiltDegrees: number(arrayTilt?.value, 0, 90),
    arrayAzimuthDegrees: number(arrayAzimuth?.value, 0, 359),
    azimuthDegrees:
      roofOrientation?.value === 'custom'
        ? number(roofOrientationCustomInput?.value, 0, 359)
        : number(roofOrientation?.value, 0, 359)
  });
  const savedProfessionalIdentity = createProfessionalAnalysisIdentity({
    property: savedSession.property?.coordinates,
    consumption: savedSession.consumption,
    financialRate: savedSession.financialRate,
    roof: savedRoofForIdentity,
    system: { capacityKwp: PVGIS_KWP, lossPercent: PVGIS_LOSS },
    panelId: recommendedPanelId,
    storageRequired: savedStorageRequired,
    calculationVersion: ANALYSIS_SCHEMA_VERSION
  });
  const restoredAnalysis =
    analysisMatchesPanel(savedSession.professionalAnalysis, recommendedPanelSystem) &&
    analysisMatchesStorageRequest(savedSession.professionalAnalysis, savedStorageRequired) &&
    isRestorableProfessionalAnalysis({
      analysis: savedSession.professionalAnalysis,
      status: savedSession.professionalAnalysisStatus,
      storedIdentity: savedSession.professionalAnalysisIdentity,
      currentIdentity: savedProfessionalIdentity,
      calculationVersion: ANALYSIS_SCHEMA_VERSION
    })
      ? savedSession.professionalAnalysis
      : null;
  const state = createCalculatorWizardState({
    addressNote: savedSession.addressNote ?? '',
    confirmedProperty: savedSession.property?.coordinates ?? null,
    sitePotential: savedSession.sitePotential ?? null,
    potentialStatus: savedSession.sitePotential
      ? WIZARD_STEP_STATUSES.COMPLETE
      : WIZARD_STEP_STATUSES.LOCKED,
    roof: savedSession.roof ?? null,
    consumption: savedSession.consumption ?? null,
    financialRate: savedSession.financialRate ?? createStandardFinancialRate(),
    storageRequired: savedStorageRequired,
    analysis: restoredAnalysis,
    solarPassport: restoredAnalysis ? (savedSession.professionalSolarPassport ?? null) : null,
    analysisStatus: restoredAnalysis ? WIZARD_STEP_STATUSES.COMPLETE : WIZARD_STEP_STATUSES.LOCKED
  });
  let mapController = null;
  let mapControllerPromise = null;
  let potentialRequest = null;
  let geocodeRequest = null;
  let addressSearchDebounce = null;
  let analysisRequest = null;
  let lastPotential = null;
  let lastAnalysis = null;
  let passportOpener = null;
  let professionalLeadRequest = null;
  let professionalLeadTrigger = null;
  let professionalLeadComplete = false;
  let professionalAnalysisIdentity = restoredAnalysis
    ? savedSession.professionalAnalysisIdentity
    : null;

  const persistSession = () => {
    if (!lifecycle.isActive()) return;
    session.write({
      currentStep: state.currentStep,
      addressNote: state.addressNote,
      property: state.confirmedProperty
        ? {
            coordinates: { ...state.confirmedProperty },
            confirmed: true,
            source: { kind: 'manual', status: 'confirmed' }
          }
        : null,
      sitePotential: state.sitePotential,
      roof: state.roof,
      consumption: state.consumption,
      financialRate: state.financialRate,
      storageRequired: state.storageRequired,
      professionalAnalysis: state.analysis,
      professionalAnalysisStatus: state.analysisStatus,
      professionalAnalysisIdentity,
      professionalSolarPassport: state.solarPassport
    });
  };

  const clearLocationSearchResults = () => {
    if (!locationSearchResults) return;
    locationSearchResults.replaceChildren();
    locationSearchResults.hidden = true;
  };

  const populateLocalityOptions = () => {
    if (!localitySelect) return;
    const localities = localitiesForRegion(regionSelect?.value);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = product.location?.localityPlaceholder ?? '';
    placeholder.disabled = true;
    placeholder.selected = true;
    const options = localities.map((locality) => {
      const option = document.createElement('option');
      option.value = locality;
      option.textContent = localityLabel(locality, locale);
      return option;
    });
    localitySelect.replaceChildren(placeholder, ...options);
    localitySelect.disabled = localities.length === 0;
  };

  const stopAddressSearch = () => {
    geocodeRequest?.abort();
    lifecycle.release(geocodeRequest);
    geocodeRequest = null;
    const button = root.querySelector('[data-open-location-map]');
    button?.removeAttribute('aria-busy');
    button?.removeAttribute('disabled');
  };

  const clearAddressSearchDebounce = () => {
    if (addressSearchDebounce === null) return;
    window.clearTimeout(addressSearchDebounce);
    addressSearchDebounce = null;
  };

  const writeStatus = (message, error = false) => {
    if (!lifecycle.isActive()) return;
    if (!status) return;
    status.textContent = message ?? '';
    status.classList.toggle('is-error', Boolean(error));
  };

  const syncLocationCoordinates = (coordinates) => {
    const lat = number(coordinates?.lat, -90, 90);
    const lng = number(coordinates?.lng, -180, 180);
    if (lat === null || lng === null) return;
    const latValue = String(lat.toFixed(5));
    const lngValue = String(lng.toFixed(5));
    if (latitudeInput) latitudeInput.value = latValue;
    if (longitudeInput) longitudeInput.value = lngValue;
    if (mapLatitude) mapLatitude.textContent = latValue;
    if (mapLongitude) mapLongitude.textContent = lngValue;
  };

  const clearLocationCoordinates = () => {
    if (latitudeInput) latitudeInput.value = '';
    if (longitudeInput) longitudeInput.value = '';
    if (mapLatitude) mapLatitude.textContent = '—';
    if (mapLongitude) mapLongitude.textContent = '—';
  };

  const stepStates = () =>
    deriveWizardStepStates({
      confirmedProperty: state.confirmedProperty,
      potentialStatus: state.potentialStatus,
      roofComplete: hasRoof(),
      consumptionComplete: Boolean(state.consumption),
      analysisStatus: state.analysisStatus
    });

  const setPotentialOutcome = (outcome) =>
    Object.assign(state, applyPotentialOutcome(state, outcome));

  const isStepAccessible = (index) => {
    const stepKey = WIZARD_STEP_KEYS[index];
    return isWizardStepAccessible(stepStates()[stepKey], {
      // Result has no meaningful UI before a successful analysis. It can be
      // loading for progress feedback, but cannot be opened until complete.
      allowLoading: stepKey !== 'result'
    });
  };

  const updateProgress = () => {
    if (!lifecycle.isActive()) return;
    persistSession();
    const allStepStates = stepStates();
    progress.forEach((button, index) => {
      const stepStatus = allStepStates[WIZARD_STEP_KEYS[index]];
      const current = index === state.currentStep;
      button.dataset.stepState = stepStatus;
      button.disabled = !isStepAccessible(index);
      if (current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (potentialStatus) potentialStatus.dataset.stepState = allStepStates.potential;
    if (mobileProgress) {
      mobileProgress.textContent = text(wizard.stepMobile, {
        step: state.currentStep + 1,
        title: wizard.steps?.[state.currentStep] ?? ''
      });
    }
  };

  const scrollToTop = () => {
    if (!lifecycle.isActive()) return;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  };

  const scheduleScrollToTop = () => {
    if (!lifecycle.isActive()) return;
    scrollToTop();
    requestAnimationFrame(() => {
      if (!lifecycle.isActive()) return;
      scrollToTop();
      requestAnimationFrame(() => {
        if (lifecycle.isActive()) scrollToTop();
      });
    });
  };

  const setStep = (nextStep, { focus = true, scroll = true } = {}) => {
    if (!lifecycle.isActive()) return false;
    const target = Math.max(0, Math.min(Number(nextStep), steps.length - 1));
    if (!isStepAccessible(target)) return false;
    state.currentStep = target;
    root.dataset.currentStep = String(target);
    const showingResults = target === 3;
    if (heroTitle) {
      heroTitle.classList.toggle('visually-hidden', showingResults);
      heroTitle.textContent = showingResults
        ? (wizard.results?.title ?? defaultHeroTitle)
        : defaultHeroTitle;
    }
    if (heroIntro) {
      heroIntro.textContent = showingResults
        ? (wizard.results?.intro ?? defaultHeroIntro)
        : defaultHeroIntro;
    }
    if (heroBreadcrumbCurrent) {
      heroBreadcrumbCurrent.textContent = showingResults
        ? (wizard.steps?.[3] ?? defaultHeroBreadcrumb)
        : defaultHeroBreadcrumb;
    }
    steps.forEach((step, index) => {
      step.hidden = index !== target;
    });
    updateProgress();
    if (target === 0) {
      // The Professional URL opens directly on the location step. Initialise
      // its visible map here, rather than waiting for a later address or
      // coordinate action. Otherwise Leaflet is only created after moving
      // through the wizard, leaving the first visit with an empty map panel.
      void mountMap('location').then((controller) => {
        if (!lifecycle.isActive() || !controller || state.currentStep !== 0) return;
        requestAnimationFrame(() => {
          if (lifecycle.isActive() && state.currentStep === 0) controller.resize();
        });
      });
    }
    if (target === 2) {
      void mountMap('roof').then((controller) => {
        if (!lifecycle.isActive() || !controller || state.currentStep !== 2) return;
        requestAnimationFrame(() => {
          if (lifecycle.isActive()) controller.resize();
        });
      });
    }
    if (focus) steps[target]?.focus({ preventScroll: true });
    if (scroll) scheduleScrollToTop();
    return true;
  };

  const stopPotential = () => {
    potentialRequest?.abort();
    lifecycle.release(potentialRequest);
    potentialRequest = null;
  };
  const stopAnalysis = () => {
    analysisRequest?.abort();
    lifecycle.release(analysisRequest);
    analysisRequest = null;
  };
  const clearAnalysis = () => {
    stopAnalysis();
    state.analysis = null;
    state.analysisStatus = WIZARD_STEP_STATUSES.LOCKED;
    state.solarPassport = null;
    professionalAnalysisIdentity = null;
    resultDashboard?.replaceChildren();
    if (resultSummary) resultSummary.textContent = wizard.results?.intro ?? '';
  };
  const clearPotentialAndBelow = () => {
    stopPotential();
    setPotentialOutcome({ status: WIZARD_STEP_STATUSES.LOCKED });
    if (potentialResult) potentialResult.hidden = true;
    if (potentialSummary) potentialSummary.hidden = true;
    if (potentialRetry) potentialRetry.hidden = true;
    if (potentialSkip) potentialSkip.hidden = true;
    if (potentialLoading) potentialLoading.textContent = '';
    if (roofReferenceComparison) roofReferenceComparison.hidden = true;
    state.roof = null;
    mapController?.resetRoof();
    clearAnalysis();
  };

  const setPendingLocation = (coordinates) => {
    if (!lifecycle.isActive()) return false;
    const lat = number(coordinates?.lat, -90, 90);
    const lng = number(coordinates?.lng, -180, 180);
    if (lat === null || lng === null) return false;
    state.pendingLocation = { lat, lng };
    syncLocationCoordinates({ lat, lng });
    clearPotentialAndBelow();
    // Selecting an exact point on the map (or a geocoded address) is enough
    // to identify its solar resource. Start that lookup now, while Location
    // is still visible, instead of making the visitor go forward and then
    // back merely to see the result.
    state.confirmedProperty = { lat, lng };
    state.mapFocus = { lat, lng };
    updateProgress();
    void requestPotential();
    return true;
  };

  const chooseAddressCandidate = async (candidate) => {
    if (!lifecycle.isActive()) return;
    const lat = number(candidate?.coordinates?.latitude, -90, 90);
    const lng = number(candidate?.coordinates?.longitude, -180, 180);
    if (lat === null || lng === null) return;
    if (address) address.value = candidate.label ?? '';
    clearLocationSearchResults();
    if (!setPendingLocation({ lat, lng })) return;
    const map = await mountMap('location');
    if (!lifecycle.isActive()) return;
    map?.setLocation({ lat, lng }, { notify: false });
  };

  const renderAddressCandidates = (candidates) => {
    if (!locationSearchResults) return;
    locationSearchResults.replaceChildren();
    const heading = element('p', 'location-search-results__title', wizard.addressResults ?? '');
    locationSearchResults.append(heading);
    candidates.forEach((candidate) => {
      const option = element('button', 'location-search-results__option', candidate.label);
      option.type = 'button';
      option.addEventListener('click', () => void chooseAddressCandidate(candidate));
      locationSearchResults.append(option);
    });
    locationSearchResults.hidden = false;
  };

  const searchAddress = async () => {
    clearAddressSearchDebounce();
    if (!lifecycle.isActive()) return;
    const query = address?.value.trim() ?? '';
    if (query.length < 3) {
      clearLocationSearchResults();
      writeStatus(wizard.addressSearchHint ?? '', true);
      address?.focus();
      return;
    }
    stopAddressSearch();
    const controller = lifecycle.createController();
    geocodeRequest = controller;
    const button = root.querySelector('[data-open-location-map]');
    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('disabled', '');
    clearLocationSearchResults();
    writeStatus(wizard.addressSearching ?? '');
    try {
      const response = await api.geocode({ query, locale }, { signal: controller.signal });
      if (!lifecycle.canCommit(controller, geocodeRequest)) return;
      const candidates = Array.isArray(response?.location?.candidates)
        ? response.location.candidates
        : [];
      if (!candidates.length) {
        writeStatus(wizard.addressNoResults ?? '', true);
        return;
      }
      writeStatus('');
      renderAddressCandidates(candidates);
    } catch (error) {
      if (!lifecycle.canCommit(controller, geocodeRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      writeStatus(wizard.addressSearchUnavailable ?? product.location?.unavailable ?? '', true);
    } finally {
      const ownsRequest = geocodeRequest === controller;
      if (ownsRequest) geocodeRequest = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest) {
        button?.removeAttribute('aria-busy');
        button?.removeAttribute('disabled');
      }
    }
  };

  const searchAddressImmediately = () => {
    clearAddressSearchDebounce();
    void searchAddress();
  };

  const scheduleAddressSearch = () => {
    clearAddressSearchDebounce();
    stopAddressSearch();
    clearLocationSearchResults();
    // An edited address no longer describes the selected point. Never retain
    // coordinates from a previous property under new address text.
    if (state.pendingLocation || state.confirmedProperty) {
      state.pendingLocation = null;
      state.confirmedProperty = null;
      clearPotentialAndBelow();
      clearLocationCoordinates();
      updateProgress();
    }
    writeStatus('');
    if ((address?.value.trim().length ?? 0) < 3) return;
    addressSearchDebounce = window.setTimeout(() => {
      addressSearchDebounce = null;
      void searchAddress();
    }, ADDRESS_SEARCH_DEBOUNCE_MS);
  };

  const focusLocality = async (coordinates) => {
    if (!lifecycle.isActive()) return false;
    const lat = number(coordinates?.lat ?? coordinates?.latitude, -90, 90);
    const lng = number(coordinates?.lng ?? coordinates?.longitude, -180, 180);
    if (lat === null || lng === null) return false;
    state.mapFocus = { lat, lng };
    state.pendingLocation = null;
    state.confirmedProperty = null;
    clearPotentialAndBelow();
    clearLocationCoordinates();
    updateProgress();
    const map = await mountMap('location');
    if (!lifecycle.isActive()) return false;
    map?.clearLocation();
    map?.focusLocation({ lat, lng }, { zoom: 14 });
    return true;
  };

  const locateSelectedLocality = async () => {
    clearAddressSearchDebounce();
    if (!lifecycle.isActive()) return;
    const locality = localitySelect?.value.trim() ?? '';
    if (!locality) return;
    const regionId = regionSelect?.value;
    const selectedCenter = localityCenter(regionId, locality);
    if (selectedCenter) {
      stopAddressSearch();
      clearLocationSearchResults();
      if (address) address.value = '';
      await focusLocality(selectedCenter);
      if (!lifecycle.isActive()) return;
      writeStatus('');
      return;
    }
    const regionName = regionSelect?.selectedOptions?.[0]?.textContent?.trim() ?? '';
    const query = [locality, regionName, 'Armenia'].filter(Boolean).join(', ');
    if (address) address.value = query;
    stopAddressSearch();
    const controller = lifecycle.createController();
    geocodeRequest = controller;
    localitySelect.disabled = true;
    clearLocationSearchResults();
    writeStatus(wizard.addressSearching ?? '');
    try {
      const response = await api.geocode({ query, locale }, { signal: controller.signal });
      if (!lifecycle.canCommit(controller, geocodeRequest)) return;
      const candidates = Array.isArray(response?.location?.candidates)
        ? response.location.candidates
        : [];
      if (!candidates.length || !(await focusLocality(candidates[0]?.coordinates))) {
        writeStatus(wizard.addressNoResults ?? '', true);
        return;
      }
      writeStatus('');
    } catch (error) {
      if (!lifecycle.canCommit(controller, geocodeRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      writeStatus(wizard.addressSearchUnavailable ?? product.location?.unavailable ?? '', true);
    } finally {
      const ownsRequest = geocodeRequest === controller;
      if (ownsRequest) geocodeRequest = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest && localitySelect)
        localitySelect.disabled = localitiesForRegion(regionSelect?.value).length === 0;
    }
  };

  const useCurrentLocation = () => {
    clearAddressSearchDebounce();
    if (!lifecycle.isActive()) return;
    if (!window.isSecureContext || !navigator.geolocation) {
      writeStatus(wizard.currentLocationUnavailable ?? '', true);
      return;
    }
    writeStatus(wizard.currentLocationLoading ?? '');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!lifecycle.isActive()) return;
        const lat = number(position.coords.latitude, -90, 90);
        const lng = number(position.coords.longitude, -180, 180);
        if (lat === null || lng === null || !setPendingLocation({ lat, lng })) {
          writeStatus(wizard.currentLocationUnavailable ?? '', true);
          return;
        }
        writeStatus('');
        void mountMap('location').then((map) => {
          if (lifecycle.isActive()) map?.setLocation({ lat, lng }, { notify: false });
        });
      },
      () => {
        if (lifecycle.isActive()) writeStatus(wizard.currentLocationUnavailable ?? '', true);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    );
  };

  const onRoofChange = (roof) => {
    if (!lifecycle.isActive()) return;
    // Map edits contain only geometry. Preserve engineering values already
    // entered for the same outline so an incomplete session never silently
    // falls back to form defaults after a refresh.
    state.roof = { ...state.roof, ...roof };
    updateRoofAreaSummary();
    clearAnalysis();
    updateProgress();
  };

  const updateRoofCapacityPreview = (roof) => {
    if (!roofCapacityPreview) return;
    const system = recommendedPanelSystem;
    const automaticArrayTilt =
      roof.mountingMode === 'elevated' && roof.arrayTiltDegrees === null
        ? recommendMountingHardware({
            mountingMode: 'elevated',
            pvgisOptimumTiltDegrees: state.sitePotential?.orientation?.tiltDegrees
          })?.practicalInclinationDeg
        : null;
    const capacity = calculatePreliminaryRoofCapacity({
      roofAreaSqm: roof.effectiveAreaSqm,
      projectedRoofAreaSqm: roof.projectedAreaSqm,
      areaMethod: roof.areaMethod,
      mountingMode: roof.mountingMode,
      roofTiltDegrees: roof.tiltDegrees,
      arrayTiltDegrees: roof.arrayTiltDegrees ?? automaticArrayTilt,
      usableAreaRatio: PRELIMINARY_USABLE_ROOF_RATIO,
      panelAreaSqm: system?.panelAreaSqm,
      panelWatts: system?.panelWatts
    });
    if (!capacity || !system) {
      roofCapacityPreview.hidden = true;
      return;
    }

    roofCapacityPreview.hidden = false;
    if (roofCapacityArea)
      roofCapacityArea.textContent = `${format(capacity.roofAreaSqm, locale, {
        maximumFractionDigits: 1
      })} m²`;
    if (roofCapacityUsable)
      roofCapacityUsable.textContent = `${format(
        capacity.preliminaryModuleAreaSqm ?? capacity.usableRoofAreaSqm,
        locale,
        {
          maximumFractionDigits: 1
        }
      )} m²`;
    if (roofCapacityUsableLabel)
      roofCapacityUsableLabel.textContent =
        roof.mountingMode === 'elevated'
          ? (wizard.preliminaryModuleArea ?? 'Preliminary module area')
          : (wizard.preliminaryUsableRoofArea ?? 'Usable module area');
    if (roofCapacityPanels)
      roofCapacityPanels.textContent = format(capacity.maximumPanelCount, locale);
    if (roofCapacityPanel)
      roofCapacityPanel.textContent =
        wizard.preliminarySizingBasisCopy ??
        'The preliminary roof fit uses a catalog module footprint and rating.';
    if (roofCapacitySystem)
      roofCapacitySystem.textContent = text(wizard.roofCapacityPreview, {
        capacity: format(capacity.maximumCapacityKwp, locale, { maximumFractionDigits: 2 }),
        count: format(capacity.maximumPanelCount, locale)
      });
    if (roofCapacityAssumption)
      roofCapacityAssumption.textContent = text(wizard.roofCapacityAssumption, {
        ratio: format((capacity.layoutGcr ?? capacity.usableAreaRatio) * 100, locale, {
          maximumFractionDigits: 0
        })
      });
  };

  const updateRoofReferenceComparison = (roof) => {
    const reference = state.sitePotential;
    if (!roofReferenceComparison) return;
    if (
      !reference ||
      roof.azimuthDegrees === null ||
      roof.tiltDegrees === null ||
      number(reference.orientation?.azimuthDegrees) === null ||
      number(reference.orientation?.tiltDegrees) === null
    ) {
      roofReferenceComparison.hidden = true;
      return;
    }
    roofReferenceComparison.hidden = false;
    if (roofReferenceActual)
      roofReferenceActual.textContent = `${format(roof.azimuthDegrees, locale, {
        maximumFractionDigits: 0
      })}° / ${format(roof.tiltDegrees, locale, { maximumFractionDigits: 0 })}°`;
    if (roofReferencePvgis)
      roofReferencePvgis.textContent = `${format(reference.orientation.azimuthDegrees, locale, {
        maximumFractionDigits: 0
      })}° / ${format(reference.orientation.tiltDegrees, locale, {
        maximumFractionDigits: 0
      })}°`;
  };

  const updateRoofAreaSummary = () => {
    const roof = roofGeometry();
    const displayAreaSqm = roofAreaForDisplay(roof);
    if (roofAreaLabel) {
      roofAreaLabel.textContent =
        roof.areaMethod === 'measured-plane'
          ? (product.roof?.measuredAreaLabel ?? product.roof?.planeAreaLabel ?? '')
          : (product.roof?.areaLabel ?? '');
    }
    if (roofArea) {
      roofArea.textContent =
        displayAreaSqm === null
          ? '—'
          : `${format(displayAreaSqm, locale, { maximumFractionDigits: 1 })} m²`;
    }
    if (roofMapArea)
      roofMapArea.textContent =
        displayAreaSqm === null
          ? '—'
          : `${format(displayAreaSqm, locale, { maximumFractionDigits: 1 })} m²`;
    if (roofMapOrientation && roof.azimuthDegrees !== null) {
      const selectedOrientation = roofOrientation?.selectedOptions?.[0]?.textContent?.trim();
      roofMapOrientation.textContent =
        selectedOrientation && roof.azimuthDegrees !== null
          ? `${selectedOrientation} (${format(roof.azimuthDegrees, locale)}°)`
          : `${format(roof.azimuthDegrees, locale)}°`;
    } else if (roofMapOrientation) roofMapOrientation.textContent = '—';
    if (roofMapTilt && roof.tiltDegrees !== null)
      roofMapTilt.textContent = `${format(roof.tiltDegrees, locale)}°`;
    else if (roofMapTilt) roofMapTilt.textContent = '—';
    updateRoofCapacityPreview(roof);
    updateRoofReferenceComparison(roof);
  };

  const applyRoofMapStyle = (map) => {
    if (!map) return;
    map.setRoofLineWeight(roofLineWidth?.value);
    map.setRoofPointRadius(roofPointRadius?.value);
    map.setRoofPointNumbers(roofPointNumbers?.checked ?? true);
  };

  const closeRoofMapPanels = () => {
    roofMapTools?.removeAttribute('open');
    roofMapAnalysis?.removeAttribute('open');
  };

  const mountMap = async (mode) => {
    if (!lifecycle.isActive()) return null;
    const host = mode === 'roof' ? roofMapHost : locationMapWrap;
    if (!mapElement || !host) return null;
    if (mode === 'location' && locationMapWrap) locationMapWrap.hidden = false;
    try {
      if (!mapController) {
        const pendingMap =
          mapControllerPromise ??
          createPropertyMap({
            container: mapElement,
            tileUrl: config.map?.tileUrl,
            tileAttribution: config.map?.tileAttribution,
            imageryTileUrl: config.map?.imageryTileUrl,
            imageryTileAttribution: config.map?.imageryTileAttribution,
            locationPointLabel: product.location?.resultLabel,
            roofPointLabel: (index) => text(product.roof?.pointSelectLabel, { index: index + 1 }),
            onLocationChange: setPendingLocation,
            onRoofChange
          });
        mapControllerPromise ??= pendingMap;
        const createdMap = await pendingMap;
        if (!lifecycle.isActive()) {
          if (mapControllerPromise === pendingMap) {
            mapControllerPromise = null;
            createdMap?.destroy();
          }
          return null;
        }
        mapController = createdMap;
      }
      if (!lifecycle.isActive()) return null;
      // Moving the shared Leaflet element between the location and roof steps
      // is the only time its property view should be restored. Style controls
      // call mountMap too; resetting the view there would discard a visitor's
      // deliberate zoom or pan while editing an outline.
      const mapMoved = mapController?.mount(host) ?? false;
      mapController?.setMode(mode);
      if (mode === 'roof') {
        applyRoofMapStyle(mapController);
        root
          .querySelectorAll('.professional-roof-map__layers button')
          .forEach((button, index) => button.classList.toggle('is-active', index === 1));
      }
      if (state.confirmedProperty)
        mapController?.setLocation(state.confirmedProperty, {
          fit: mapMoved,
          notify: false
        });
      if (state.confirmedProperty) syncLocationCoordinates(state.confirmedProperty);
      if (mode === 'location' && !state.confirmedProperty && state.mapFocus)
        mapController?.focusLocation(state.mapFocus);
      if (mode === 'roof' && state.roof?.points?.length) {
        // Restoring the unchanged outline is not an edit and must not clear
        // the existing analysis or the roof's persisted technical controls.
        mapController?.setRoofPoints(state.roof.points, {
          complete: state.roof.complete,
          notify: false
        });
      }
      mapController?.resize();
      if (mode === 'roof' && mapMoved && state.confirmedProperty)
        mapController?.centerAfterLayout(state.confirmedProperty);
      return mapController;
    } catch {
      mapControllerPromise = null;
      if (!lifecycle.isActive()) return null;
      writeStatus(product.roof?.fallback ?? product.location?.manualUnavailable, true);
      return null;
    }
  };

  const renderBars = (container, values, months, unit, { compactValues = false } = {}) => {
    if (!container) return;
    container.replaceChildren();
    const maximum = Math.max(...values.map(Number).filter(Number.isFinite), 1);
    values.forEach((value, index) => {
      const numeric = Number(value);
      const button = element('button', 'chart-bar');
      button.type = 'button';
      button.style.setProperty('--bar-height', `${Math.max(3, (numeric / maximum) * 100)}%`);
      const month = months[index] ?? {};
      const valueText = format(numeric, locale, { maximumFractionDigits: 0 });
      const valueLabel = element('span', 'chart-bar__value', valueText);
      if (!compactValues) valueLabel.append(' ', element('span', 'chart-bar__unit', unit));
      button.setAttribute(
        'aria-label',
        `${month.name ?? month.short ?? index + 1}: ${valueText} ${unit}`
      );
      button.title = button.getAttribute('aria-label');
      button.append(
        valueLabel,
        element('span', 'chart-bar__label', month.short ?? String(index + 1))
      );
      container.append(button);
    });
  };

  const { renderResult, renderPassport } = createCalculatorResultsView({
    wizard,
    product,
    locale,
    displayProductsById,
    resultDashboard,
    resultSummary,
    resultHeroActions,
    passportContent,
    renderBars,
    state
  });

  const renderPotential = (potential) => {
    const months = product.passport?.months ?? [];
    const annualYield = `${format(potential.annualYieldKwhPerKwp, locale, { maximumFractionDigits: 0 })} kWh/kWp`;
    const azimuth = compass(potential.orientation?.azimuthDegrees, product.potential?.directions);
    const tilt = `${format(potential.orientation?.tiltDegrees, locale, { maximumFractionDigits: 0 })}°`;
    root.querySelector('[data-potential-yield]').textContent = annualYield;
    root.querySelector('[data-potential-azimuth]').textContent = azimuth;
    root.querySelector('[data-potential-tilt]').textContent = tilt;
    renderBars(potentialChart, potential.monthlyYieldKwhPerKwp ?? [], months, 'kWh/kWp', {
      compactValues: true
    });
    potentialTable?.replaceChildren();
    (potential.monthlyYieldKwhPerKwp ?? []).forEach((value, index) => {
      const row = document.createElement('tr');
      row.append(
        element('td', '', months[index]?.name ?? String(index + 1)),
        element('td', '', format(value, locale, { maximumFractionDigits: 0 }))
      );
      potentialTable?.append(row);
    });
    // Cache state remains an implementation detail. The customer only needs
    // the PVGIS source and the stated preliminary loss assumption.
    const source = product.potential?.source ?? '';
    root.querySelector('[data-potential-source]').textContent = source;
    const potentialSummaryYield = root.querySelector('[data-potential-summary-yield]');
    const potentialSummarySource = root.querySelector('[data-potential-summary-source]');
    if (potentialSummaryYield) potentialSummaryYield.textContent = annualYield;
    if (potentialSummarySource) potentialSummarySource.textContent = source;
    if (potentialResult) potentialResult.hidden = false;
    if (potentialSummary) potentialSummary.hidden = false;
    updateRoofReferenceComparison(roofGeometry());
    if (potentialRetry) potentialRetry.hidden = true;
    if (potentialSkip) potentialSkip.hidden = true;
  };

  const requestPotential = async ({ force = false } = {}) => {
    if (!lifecycle.isActive() || !state.confirmedProperty || potentialRequest) return;
    const fingerprint = `${state.confirmedProperty.lat.toFixed(5)},${state.confirmedProperty.lng.toFixed(5)}`;
    const remaining =
      lastPotential?.fingerprint === fingerprint
        ? POTENTIAL_COOLDOWN_MS - (Date.now() - lastPotential.startedAt)
        : 0;
    if (!force && remaining > 0) {
      writeStatus(
        text(product.status?.potentialCooldown, { seconds: Math.ceil(remaining / 1000) }),
        false
      );
      if (potentialRetry) potentialRetry.hidden = false;
      return;
    }
    stopPotential();
    const controller = lifecycle.createController();
    potentialRequest = controller;
    lastPotential = { fingerprint, startedAt: Date.now() };
    setPotentialOutcome({ status: WIZARD_STEP_STATUSES.LOADING });
    if (potentialLoading) potentialLoading.textContent = product.potential?.loading ?? '';
    if (potentialResult) potentialResult.hidden = true;
    if (potentialSummary) potentialSummary.hidden = true;
    if (potentialRetry) potentialRetry.hidden = true;
    if (potentialSkip) potentialSkip.hidden = true;
    writeStatus('');
    updateProgress();
    try {
      const response = await api.potential(
        {
          property: {
            latitude: state.confirmedProperty.lat,
            longitude: state.confirmedProperty.lng,
            confirmed: true
          }
        },
        { signal: controller.signal }
      );
      if (!lifecycle.canCommit(controller, potentialRequest)) return;
      const potential = response?.potential;
      if (
        !Array.isArray(potential?.monthlyYieldKwhPerKwp) ||
        potential.monthlyYieldKwhPerKwp.length !== 12
      )
        throw new ProductApiError('MALFORMED_RESPONSE');
      setPotentialOutcome({ status: WIZARD_STEP_STATUSES.COMPLETE, potential });
      renderPotential(potential);
      if (potentialLoading) potentialLoading.textContent = '';
      updateProgress();
    } catch (error) {
      if (!lifecycle.canCommit(controller, potentialRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setPotentialOutcome({ status: WIZARD_STEP_STATUSES.UNAVAILABLE });
      if (potentialLoading) potentialLoading.textContent = describeError(error, product);
      if (potentialRetry) potentialRetry.hidden = false;
      if (potentialSkip) potentialSkip.hidden = false;
      updateProgress();
    } finally {
      if (potentialRequest === controller) potentialRequest = null;
      lifecycle.release(controller);
    }
  };

  const confirmLocation = async () => {
    if (!lifecycle.isActive() || !state.pendingLocation) return;
    state.addressNote = address?.value.trim() ?? '';
    state.confirmedProperty = { ...state.pendingLocation };
    state.mapFocus = { ...state.confirmedProperty };
    // A point may already have returned its solar-resource reference while
    // the visitor reviewed it on this step. Do not discard that result while
    // continuing to consumption.
    if (state.potentialStatus === WIZARD_STEP_STATUSES.LOCKED)
      setPotentialOutcome({ status: WIZARD_STEP_STATUSES.AVAILABLE });
    await mountMap('location');
    if (!lifecycle.isActive()) return;
    mapController?.setLocation(state.confirmedProperty, { notify: false });
    setStep(1);
    if (!state.sitePotential && !potentialRequest) void requestPotential();
  };

  const roofAzimuth = () =>
    roofOrientation?.value === 'custom'
      ? number(roofOrientationCustomInput?.value, 0, 359)
      : number(roofOrientation?.value, 0, 359);
  const roofGeometry = () => {
    const areaMethod = activeAreaMethod(root);
    const tiltDegrees = number(roofTilt?.value, 0, 90);
    const azimuthDegrees = roofAzimuth();
    const arrayTiltDegrees = number(arrayTilt?.value, 0, 90);
    const arrayAzimuthDegrees = number(arrayAzimuth?.value, 0, 359);
    const projectedAreaSqm = getCalculatorInputNumber(state.roof?.areaSqm, 'roofAreaSqm');
    const planeAreaSqm = getCalculatorInputNumber(roofPlaneArea?.value, 'roofAreaSqm');
    const effective = calculateRoofPlaneArea({
      areaMethod,
      projectedAreaSqm,
      planeAreaSqm,
      tiltDegrees
    });
    const points = Array.isArray(state.roof?.points) ? state.roof.points : [];
    const hasOutline = points.length >= 3;
    const simplePolygon = hasOutline ? isSimplePolygon(points) : true;
    return {
      areaMethod,
      mountingMode: activeMountingMode(root),
      tiltDegrees,
      azimuthDegrees,
      roofTiltDegrees: tiltDegrees,
      roofAzimuthDegrees: azimuthDegrees,
      arrayTiltDegrees,
      arrayAzimuthDegrees,
      projectedAreaSqm,
      planeAreaSqm,
      effectiveAreaSqm: effective,
      // Geometry is authoritative. A valid Leaflet polygon is already closed
      // visually, so a stale interaction flag must not reject 3+ real corners.
      polygonComplete: hasOutline && simplePolygon,
      simplePolygon,
      distanceFromPropertyMeters: hasOutline
        ? roofOutlineDistanceFromProperty(points, state.confirmedProperty)
        : null
    };
  };
  const clearRoofValidation = () => {
    roofNotice?.classList.remove('is-error');
    roofNotice?.removeAttribute('role');
    if (roofNoticeCopy && roofNoticeCopy.innerHTML !== roofNoticeDefault)
      roofNoticeCopy.innerHTML = roofNoticeDefault;
    [
      roofPlaneArea,
      roofOrientation,
      roofOrientationCustomInput,
      roofTilt,
      arrayTilt,
      arrayAzimuth
    ].forEach((field) => field?.removeAttribute('aria-invalid'));
  };

  const showRoofValidation = (issue) => {
    const messages = {
      outline: wizard.ui?.roof?.outlineRequired ?? product.roof?.parametersRequired,
      'self-intersection': wizard.ui?.roof?.invalidOutline ?? product.roof?.parametersRequired,
      distance: wizard.ui?.roof?.outlineTooFar ?? product.roof?.parametersRequired,
      area: wizard.ui?.roof?.areaRequired ?? product.roof?.parametersRequired,
      orientation: wizard.ui?.roof?.orientationRequired ?? product.roof?.parametersRequired,
      tilt: wizard.ui?.roof?.tiltRequired ?? product.roof?.parametersRequired
    };
    let field = null;
    if (issue === 'area') {
      const manualMethod = root.querySelector('[data-roof-area-method][value="measured-plane"]');
      if (manualMethod) manualMethod.checked = true;
      syncRoofControls({ preserveValidation: true });
      field = roofPlaneArea;
    } else if (issue === 'orientation') {
      field = roofOrientation?.value === 'custom' ? roofOrientationCustomInput : roofOrientation;
    } else if (issue === 'tilt') {
      field = roofTilt;
    }
    clearRoofValidation();
    roofNotice?.classList.add('is-error');
    roofNotice?.setAttribute('role', 'alert');
    if (roofNoticeCopy) roofNoticeCopy.textContent = messages[issue] ?? '';
    field?.setAttribute('aria-invalid', 'true');
    requestAnimationFrame(() => {
      if (!lifecycle.isActive()) return;
      roofNotice?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      field?.focus({ preventScroll: true });
    });
  };

  const showRoofActionError = (message) => {
    clearRoofValidation();
    roofNotice?.classList.add('is-error');
    roofNotice?.setAttribute('role', 'alert');
    if (roofNoticeCopy) roofNoticeCopy.textContent = message ?? '';
    requestAnimationFrame(() => {
      if (lifecycle.isActive()) roofNotice?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const hasRoof = () => getRoofValidationIssue(roofGeometry()) === null;

  const validateRoof = () => {
    const issue = getRoofValidationIssue(roofGeometry());
    if (!issue) {
      clearRoofValidation();
      return true;
    }
    showRoofValidation(issue);
    return false;
  };

  const syncRoofControls = ({ preserveValidation = false, preserveAnalysis = false } = {}) => {
    const measured = activeAreaMethod(root) === 'measured-plane';
    if (roofPlaneWrap) roofPlaneWrap.hidden = !measured;
    if (roofPlaneArea) roofPlaneArea.disabled = !measured;
    const mountingMode = activeMountingMode(root);
    const elevated = mountingMode === 'elevated';
    if (roofMountingModeHelp)
      roofMountingModeHelp.textContent =
        product.roof?.mountingModes?.[elevated ? 'elevatedHelp' : 'roofParallelHelp'] ?? '';
    if (!elevated) closeRoofInfoPopovers({ restoreFocus: false });
    if (arrayGeometry) arrayGeometry.hidden = !elevated;
    if (arrayTilt) arrayTilt.disabled = !elevated;
    if (arrayAzimuth) arrayAzimuth.disabled = !elevated;
    if (roofOrientationCustom) roofOrientationCustom.hidden = roofOrientation?.value !== 'custom';
    const roof = roofGeometry();
    state.roof = mergeProfessionalRoofInput(state.roof, roof);
    updateRoofAreaSummary();
    if (!preserveValidation) clearRoofValidation();
    if (!preserveAnalysis) clearAnalysis();
    updateProgress();
  };

  const buildPayload = () => {
    const roof = roofGeometry();
    return {
      property: {
        address: state.addressNote || null,
        latitude: state.confirmedProperty.lat,
        longitude: state.confirmedProperty.lng,
        confirmed: true,
        source: 'manual'
      },
      consumption: state.consumption,
      financialRate: toFinancialRateRequest(state.financialRate, state.consumption),
      roof: {
        areaMethod: roof.areaMethod,
        mountingMode: roof.mountingMode,
        projectedAreaSqm: roof.projectedAreaSqm,
        planeAreaSqm: roof.planeAreaSqm,
        polygonComplete: roof.polygonComplete,
        tiltDegrees: roof.tiltDegrees,
        azimuthDegrees: roof.azimuthDegrees,
        arrayTiltDegrees: roof.arrayTiltDegrees,
        arrayAzimuthDegrees: roof.arrayAzimuthDegrees
      },
      // PVGIS remains a normalized 1 kWp yield query. The calculator-selected
      // catalog module is sent independently and resolved server-side.
      system: { capacityKwp: PVGIS_KWP, lossPercent: PVGIS_LOSS },
      equipment: { panelId: recommendedPanelId },
      storageRequired: state.storageRequired
    };
  };

  const runAnalysis = async () => {
    if (!lifecycle.isActive()) return;
    const consumption = consumptionInput?.read();
    if (!consumption?.valid) {
      writeStatus(consumption?.message ?? product.consumption?.noConsumption, true);
      return;
    }
    // Three vertices form a closed area. Requesting a calculation is an
    // explicit finish action, so the visitor never has to retype map data.
    if (
      activeAreaMethod(root) === 'map-projected' &&
      !state.roof?.complete &&
      state.roof?.points?.length >= 3
    ) {
      if (!mapController?.finishRoof()) {
        const simplePolygon = isSimplePolygon(state.roof.points);
        onRoofChange({ ...state.roof, simplePolygon, complete: simplePolygon });
      }
    }
    if (!validateRoof()) return;
    state.consumption = consumption.value;
    state.financialRate = consumption.financialRate;
    const payload = buildPayload();
    // Persist every roof value used in this exact request. Without this,
    // untouched default controls are absent from a freshly drawn map outline,
    // so the cached result cannot pass the refresh-time identity check.
    state.roof = mergeProfessionalRoofInput(state.roof, payload.roof);
    const fingerprint = JSON.stringify(payload);
    const remaining =
      lastAnalysis?.fingerprint === fingerprint
        ? ANALYSIS_COOLDOWN_MS - (Date.now() - lastAnalysis.startedAt)
        : 0;
    if (remaining > 0) {
      writeStatus(text(product.status?.analysisCooldown, { seconds: Math.ceil(remaining / 1000) }));
      return;
    }
    stopAnalysis();
    const controller = lifecycle.createController();
    analysisRequest = controller;
    // Product imagery and detail links are required only for the completed
    // result. Start their catalogue load beside the provider request so it
    // cannot delay the result transition, while keeping it out of first load.
    const displayProducts = loadDisplayProducts().catch(() => null);
    state.analysisStatus = WIZARD_STEP_STATUSES.LOADING;
    const button = root.querySelector('[data-run-analysis]');
    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('disabled', '');
    writeStatus(product.result?.preparing ?? '');
    updateProgress();
    try {
      const response = await api.analyze(payload, { signal: controller.signal });
      if (!lifecycle.canCommit(controller, analysisRequest)) return;
      await displayProducts;
      if (!lifecycle.canCommit(controller, analysisRequest)) return;
      state.analysis = response?.analysis ?? null;
      if (!state.analysis) throw new ProductApiError('MALFORMED_RESPONSE');
      // Keep the completed state hidden until its visual layer is available.
      // A stylesheet request failure must not discard an otherwise valid
      // analysis: the semantic result markup remains a useful fallback.
      await ensureResultStyles().catch(() => null);
      if (!lifecycle.canCommit(controller, analysisRequest)) return;
      state.analysisStatus = WIZARD_STEP_STATUSES.COMPLETE;
      // Cool down completed calculations only. A provider failure must leave
      // Retry immediately available for the same inputs.
      lastAnalysis = { fingerprint, startedAt: Date.now() };
      state.solarPassport = passportRepository.create(state.analysis, { locale });
      professionalAnalysisIdentity = createProfessionalAnalysisIdentity({
        property: payload.property,
        consumption: payload.consumption,
        financialRate: state.financialRate,
        roof: payload.roof,
        system: payload.system,
        panelId: payload.equipment?.panelId,
        storageRequired: payload.storageRequired,
        calculationVersion: ANALYSIS_SCHEMA_VERSION
      });
      renderResult(state.analysis);
      writeStatus('');
      setStep(3);
    } catch (error) {
      if (!lifecycle.canCommit(controller, analysisRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      state.analysisStatus = WIZARD_STEP_STATUSES.UNAVAILABLE;
      const described = describeError(error, product);
      const message =
        described === product.result?.unavailable
          ? (wizard.ui?.roof?.analysisFailed ?? described)
          : described;
      writeStatus(message, true);
      showRoofActionError(message);
      updateProgress();
    } finally {
      const ownsRequest = analysisRequest === controller;
      if (ownsRequest) analysisRequest = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest) {
        button?.removeAttribute('aria-busy');
        button?.removeAttribute('disabled');
      }
    }
  };

  // The professional route is a view over the same temporary session used by
  // Quick and roof refinement. Populate fields before attaching the input
  // controller so no navigation silently discards an explicit tariff or kWh.
  const savedMode = state.consumption?.mode;
  if (savedMode === 'usage') {
    const radio = root.querySelector('input[name="consumption-mode"][value="usage"]');
    if (radio) radio.checked = true;
    const input = root.querySelector('[data-consumption-usage]');
    if (input) input.value = state.consumption.averageMonthlyKwh ?? '';
  } else if (savedMode === 'monthly') {
    const radio = root.querySelector('input[name="consumption-mode"][value="monthly"]');
    if (radio) radio.checked = true;
    root.querySelectorAll('[data-consumption-month]').forEach((input, index) => {
      input.value = state.consumption.monthlyKwh?.[index] ?? '';
    });
  } else if (savedMode === 'bill') {
    const input = root.querySelector('[data-consumption-bill]');
    if (input) input.value = state.consumption.averageMonthlyBillAmd ?? '';
    const billedKwh = root.querySelector('[data-consumption-billed-kwh]');
    if (billedKwh) billedKwh.value = state.consumption.billedKwh ?? '';
  }
  if (state.addressNote && address) address.value = state.addressNote;
  if (storageRequired) storageRequired.checked = state.storageRequired;
  if (state.roof) {
    const areaMethod = root.querySelector(
      `[data-roof-area-method][value="${state.roof.areaMethod}"]`
    );
    if (areaMethod) areaMethod.checked = true;
    if (roofPlaneArea && state.roof.planeAreaSqm) roofPlaneArea.value = state.roof.planeAreaSqm;
    if (roofTilt && Number.isFinite(Number(state.roof.tiltDegrees))) {
      roofTilt.value = state.roof.tiltDegrees;
    }
    if (arrayTilt && Number.isFinite(Number(state.roof.arrayTiltDegrees))) {
      arrayTilt.value = state.roof.arrayTiltDegrees;
    }
    if (arrayAzimuth && Number.isFinite(Number(state.roof.arrayAzimuthDegrees))) {
      arrayAzimuth.value = state.roof.arrayAzimuthDegrees;
    }
    if (roofOrientation && Number.isFinite(Number(state.roof.orientationDegrees))) {
      const known = [...roofOrientation.options].some(
        (option) => Number(option.value) === Number(state.roof.orientationDegrees)
      );
      roofOrientation.value = known ? String(state.roof.orientationDegrees) : 'custom';
      if (roofOrientationCustomInput && !known)
        roofOrientationCustomInput.value = state.roof.orientationDegrees;
    }
    const mountingMode = root.querySelector('select[data-roof-mounting-mode]');
    if (mountingMode && state.roof.mountingMode) mountingMode.value = state.roof.mountingMode;
  }

  const consumptionInput = initConsumptionInput({
    root: root.querySelector('[data-consumption-inputs]'),
    strings: { ...(product.consumption ?? {}), ...(wizard.ui?.consumption ?? {}) },
    locale,
    initialFinancialRate: state.financialRate,
    onChange: () => {
      const validation = consumptionInput?.inspect();
      const draft = consumptionInput?.draft();
      state.consumption = draft?.consumption ?? null;
      state.financialRate = draft?.financialRate ?? createStandardFinancialRate();
      if (consumptionContinue) consumptionContinue.disabled = validation?.valid !== true;
      // Consumption and its optional effective rate are shared with Quick. A Professional edit
      // cannot leave an earlier regional result visible for different inputs.
      session.clearQuickAnalysis();
      clearAnalysis();
      updateProgress();
    }
  });
  if (consumptionContinue) {
    consumptionContinue.disabled = consumptionInput?.inspect().valid !== true;
  }
  root
    .querySelector('[data-open-location-map]')
    ?.addEventListener('click', searchAddressImmediately);
  address?.addEventListener('input', scheduleAddressSearch);
  address?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    searchAddressImmediately();
  });
  root.querySelector('[data-clear-address]')?.addEventListener('click', () => {
    clearAddressSearchDebounce();
    stopAddressSearch();
    clearLocationSearchResults();
    if (address) address.value = '';
    state.addressNote = '';
    state.pendingLocation = null;
    state.confirmedProperty = null;
    clearPotentialAndBelow();
    clearLocationCoordinates();
    updateProgress();
    writeStatus('');
    address?.focus();
  });
  const selectCoordinates = () => {
    const lat = number(latitudeInput?.value, -90, 90);
    const lng = number(longitudeInput?.value, -180, 180);
    if (lat === null || lng === null) {
      writeStatus(product.location?.invalidCoordinates, true);
      return;
    }
    setPendingLocation({ lat, lng });
    void mountMap('location').then((map) => {
      if (lifecycle.isActive()) map?.setLocation({ lat, lng }, { notify: false });
    });
  };
  root.querySelector('[data-use-map-coordinates]')?.addEventListener('click', selectCoordinates);
  [latitudeInput, longitudeInput].forEach((input) =>
    input?.addEventListener('input', () => {
      // Typing is not selection. Keep the manual value visible, but invalidate
      // any old property and require the explicit “show on map” action before
      // it can become pending/confirmed.
      if (!state.pendingLocation && !state.confirmedProperty) return;
      state.pendingLocation = null;
      state.confirmedProperty = null;
      clearPotentialAndBelow();
      updateProgress();
    })
  );
  root.querySelector('[data-use-current-location]')?.addEventListener('click', useCurrentLocation);
  regionSelect?.addEventListener('change', () => {
    const center = ARMENIA_REGION_CENTERS[regionSelect.value];
    if (!center) return;
    populateLocalityOptions();
    stopAddressSearch();
    clearLocationSearchResults();
    if (address) address.value = '';
    state.addressNote = '';
    state.mapFocus = { ...center };
    state.pendingLocation = null;
    state.confirmedProperty = null;
    clearPotentialAndBelow();
    clearLocationCoordinates();
    updateProgress();
    void mountMap('location').then((map) => {
      if (!lifecycle.isActive()) return;
      map?.clearLocation();
      map?.focusLocation(center);
    });
  });
  localitySelect?.addEventListener('change', () => void locateSelectedLocality());
  root.querySelector('[data-location-continue]')?.addEventListener('click', () => {
    if (!state.pendingLocation) {
      writeStatus(wizard.selectExactProperty ?? product.location?.invalidCoordinates, true);
      return;
    }
    void confirmLocation();
  });
  root.querySelectorAll('[data-map-layer]').forEach((button) =>
    button.addEventListener('click', () => {
      const layer = button.dataset.mapLayer;
      if (!layer) return;
      void mountMap('location').then((map) => {
        if (!lifecycle.isActive()) return;
        if (!map?.setLayer(layer)) return;
        root.querySelectorAll('[data-map-layer]').forEach((item) => {
          item.classList.toggle('is-active', item.dataset.mapLayer === layer);
        });
      });
    })
  );
  root.querySelectorAll('.professional-roof-map__layers button').forEach((button, index) =>
    button.addEventListener('click', () => {
      const layer = index === 0 ? 'map' : 'satellite';
      void mountMap('roof').then((map) => {
        if (!lifecycle.isActive()) return;
        if (!map?.setLayer(layer)) return;
        root
          .querySelectorAll('.professional-roof-map__layers button')
          .forEach((item) => item.classList.toggle('is-active', item === button));
      });
    })
  );
  roofMapHost?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    // Only a click on the interactive map closes the two overlay panels.
    // The controls themselves and the rest of the page retain their own state.
    if (!target?.closest('.leaflet-container') || target.closest('.leaflet-control')) return;
    closeRoofMapPanels();
  });
  potentialSkip?.addEventListener('click', () => setStep(1));
  potentialRetry?.addEventListener('click', () => void requestPotential({ force: true }));
  consumptionContinue?.addEventListener('click', () => {
    const consumption = consumptionInput?.read();
    if (!consumption?.valid) {
      writeStatus(consumption?.message ?? product.consumption?.noConsumption, true);
      return;
    }
    state.consumption = consumption.value;
    state.financialRate = consumption.financialRate;
    setStep(2);
  });
  const useRoofMap = (action) => {
    void mountMap('roof').then((controller) => {
      if (lifecycle.isActive() && controller) action(controller);
    });
  };
  root
    .querySelector('[data-roof-undo]')
    ?.addEventListener('click', () => useRoofMap((map) => map.undo()));
  root
    .querySelectorAll('[data-roof-reset]')
    .forEach((button) =>
      button.addEventListener('click', () => useRoofMap((map) => map.resetRoof()))
    );
  const updateRoofLineWidth = () => {
    const value = Number(roofLineWidth?.value) || 3;
    if (roofLineWidthOutput) roofLineWidthOutput.textContent = `${value} px`;
    useRoofMap((map) => map.setRoofLineWeight(value));
  };
  const updateRoofPointRadius = () => {
    const value = Number(roofPointRadius?.value) || 10;
    if (roofPointRadiusOutput) roofPointRadiusOutput.textContent = `${value} px`;
    useRoofMap((map) => map.setRoofPointRadius(value));
  };
  roofLineWidth?.addEventListener('input', updateRoofLineWidth);
  roofPointRadius?.addEventListener('input', updateRoofPointRadius);
  roofPointNumbers?.addEventListener('change', () =>
    useRoofMap((map) => map.setRoofPointNumbers(roofPointNumbers.checked))
  );
  root
    .querySelectorAll(
      '[data-roof-area-method], [data-roof-mounting-mode], [data-roof-tilt], [data-array-tilt], [data-array-azimuth], [data-roof-plane-area], [data-roof-orientation], [data-roof-orientation-custom-input]'
    )
    .forEach((input) => input.addEventListener('input', syncRoofControls));
  root
    .querySelectorAll('[data-roof-area-method], [data-roof-mounting-mode], [data-roof-orientation]')
    .forEach((input) => input.addEventListener('change', syncRoofControls));

  const roofInfoPopoverFor = (button) =>
    roofInfoPopoversById.get(button.getAttribute('aria-controls')) ?? null;
  const positionRoofInfoPopover = (button) => {
    const popover = roofInfoPopoverFor(button);
    if (!popover || popover.hidden) return;
    popover.style.width = '';
    popover.style.maxWidth = '';
    popover.style.maxHeight = '';
    const position = getViewportPopoverPosition({
      triggerRect: button.getBoundingClientRect(),
      popoverRect: popover.getBoundingClientRect(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
    popover.style.width = `${position.width}px`;
    popover.style.maxHeight = `${position.maximumHeight}px`;
    popover.style.left = `${position.left}px`;
    popover.style.right = 'auto';
    popover.style.top = `${position.top}px`;
  };
  const positionOpenRoofInfoPopovers = () =>
    roofInfoButtons.forEach((button) => positionRoofInfoPopover(button));
  const closeRoofInfoPopover = (button, { restoreFocus = true } = {}) => {
    const popover = roofInfoPopoverFor(button);
    if (!popover || popover.hidden) return;
    popover.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (restoreFocus) button.focus();
  };
  const closeRoofInfoPopovers = ({ except = null, restoreFocus = true } = {}) => {
    roofInfoButtons.forEach((button) => {
      if (button === except) return;
      closeRoofInfoPopover(button, { restoreFocus: false });
    });
    if (restoreFocus && except) except.focus();
  };
  roofInfoButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const popover = roofInfoPopoverFor(button);
      if (!popover) return;
      const opening = popover.hidden;
      closeRoofInfoPopovers({ except: button, restoreFocus: false });
      popover.hidden = !opening;
      button.setAttribute('aria-expanded', String(opening));
      if (opening) {
        positionRoofInfoPopover(button);
        popover.focus();
        requestAnimationFrame(() => positionRoofInfoPopover(button));
      }
    })
  );
  const handleRoofInfoPopoverKeydown = (event) => {
    if (event.key !== 'Escape') return;
    const button = roofInfoButtons.find((item) => roofInfoPopoverFor(item)?.hidden === false);
    if (!button) return;
    event.preventDefault();
    closeRoofInfoPopover(button);
  };
  const handleRoofInfoPopoverOutsideClick = (event) => {
    if (
      roofInfoButtons.some(
        (button) =>
          button.contains(event.target) || roofInfoPopoverFor(button)?.contains(event.target)
      )
    )
      return;
    closeRoofInfoPopovers({ restoreFocus: false });
  };
  document.addEventListener('keydown', handleRoofInfoPopoverKeydown);
  document.addEventListener('click', handleRoofInfoPopoverOutsideClick);
  window.addEventListener('resize', positionOpenRoofInfoPopovers);
  window.addEventListener('scroll', positionOpenRoofInfoPopovers, true);

  storageRequired?.addEventListener('change', () => {
    const nextStorageRequired = storageRequired.checked;
    if (nextStorageRequired === state.storageRequired) return;
    state.storageRequired = nextStorageRequired;
    clearAnalysis();
    lastAnalysis = null;
    updateProgress();
  });

  root.querySelector('[data-run-analysis]')?.addEventListener('click', () => void runAnalysis());
  const setProfessionalLeadStatus = (message, invalid = false) => {
    if (!professionalLeadStatus) return;
    professionalLeadStatus.textContent = message ?? '';
    professionalLeadStatus.classList.toggle('is-error', invalid);
  };
  const setProfessionalLeadTriggerStatus = (message, invalid = false) => {
    if (!professionalLeadTriggerStatus) return;
    professionalLeadTriggerStatus.textContent = message ?? '';
    professionalLeadTriggerStatus.classList.toggle('is-error', invalid);
  };
  const resetProfessionalLeadDialog = () => {
    if (!lifecycle.isActive()) return;
    professionalLeadRequest?.abort();
    professionalLeadRequest = null;
    professionalLeadComplete = false;
    professionalLeadForm?.reset();
    professionalLeadForm?.removeAttribute('aria-busy');
    if (professionalLeadSubmit) professionalLeadSubmit.disabled = false;
    if (professionalLeadSuccess) professionalLeadSuccess.hidden = true;
    if (professionalLeadDismiss) professionalLeadDismiss.hidden = false;
    if (professionalLeadContent) professionalLeadContent.hidden = false;
    if (professionalLeadForm) professionalLeadForm.hidden = false;
    professionalLeadDialog?.setAttribute('aria-labelledby', 'professional-lead-title');
    professionalLeadDialog?.setAttribute('aria-describedby', 'professional-lead-copy');
    setProfessionalLeadStatus('');
    [
      professionalLeadName,
      professionalLeadPhone,
      professionalLeadEmail,
      professionalLeadMessage
    ].forEach((field) => field?.removeAttribute('aria-invalid'));
  };
  const closeProfessionalLeadDialog = () => {
    if (!professionalLeadDialog?.open) return;
    if (typeof professionalLeadDialog.close === 'function') professionalLeadDialog.close();
    else professionalLeadDialog.removeAttribute('open');
  };
  professionalLeadOpeners.forEach((professionalLeadOpen) =>
    professionalLeadOpen.addEventListener('click', () => {
      if (!lifecycle.isActive()) return;
      if (!state.analysis) {
        setProfessionalLeadTriggerStatus(wizard.lead?.resultUnavailable, true);
        return;
      }
      if (!professionalLeadDialog) {
        setProfessionalLeadTriggerStatus(wizard.lead?.formUnavailable, true);
        return;
      }
      professionalLeadTrigger = professionalLeadOpen;
      resetProfessionalLeadDialog();
      setProfessionalLeadTriggerStatus('');
      try {
        if (
          !professionalLeadDialog.open &&
          typeof professionalLeadDialog.showModal === 'function'
        ) {
          professionalLeadDialog.showModal();
        } else if (!professionalLeadDialog.open) {
          // Older browsers without the dialog API still receive a visible form
          // instead of an unresponsive button.
          professionalLeadDialog.setAttribute('open', '');
        }
      } catch {
        professionalLeadDialog.setAttribute('open', '');
      }
      if (!professionalLeadDialog.open) {
        setProfessionalLeadTriggerStatus(wizard.lead?.formUnavailable, true);
        return;
      }
      professionalLeadName?.focus();
    })
  );
  professionalLeadDialog
    ?.querySelectorAll('[data-professional-lead-close]')
    .forEach((control) => control.addEventListener('click', closeProfessionalLeadDialog));
  professionalLeadDialog?.addEventListener('close', () => {
    const trigger = professionalLeadTrigger;
    if (!lifecycle.isActive()) {
      professionalLeadTrigger = null;
      return;
    }
    resetProfessionalLeadDialog();
    professionalLeadTrigger = null;
    trigger?.focus?.();
  });
  professionalLeadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!lifecycle.isActive() || professionalLeadRequest || professionalLeadComplete) return;
    const validated = validateProfessionalLeadForm({
      name: professionalLeadName?.value,
      phone: professionalLeadPhone?.value,
      email: professionalLeadEmail?.value,
      message: professionalLeadMessage?.value
    });
    if (!validated.valid) {
      const field = {
        name: professionalLeadName,
        phone: professionalLeadPhone,
        email: professionalLeadEmail,
        message: professionalLeadMessage
      }[validated.field];
      field?.setAttribute('aria-invalid', 'true');
      field?.focus();
      setProfessionalLeadStatus(wizard.lead?.invalid, true);
      return;
    }
    if (!state.analysis) {
      setProfessionalLeadStatus(wizard.lead?.unavailable, true);
      return;
    }
    const controller = lifecycle.createController();
    professionalLeadRequest = controller;
    if (professionalLeadSubmit) professionalLeadSubmit.disabled = true;
    professionalLeadForm.setAttribute('aria-busy', 'true');
    setProfessionalLeadStatus(wizard.lead?.loading);
    try {
      await api.submitLead(
        {
          ...validated.values,
          locale,
          attachCalculation: Boolean(professionalLeadAttachCalculation?.checked),
          ...(professionalLeadAttachCalculation?.checked
            ? {
                calculatorContext: buildProfessionalLeadContext({ analysis: state.analysis, state })
              }
            : {})
        },
        { signal: controller.signal }
      );
      if (!lifecycle.canCommit(controller, professionalLeadRequest)) return;
      professionalLeadComplete = true;
      professionalLeadForm.hidden = true;
      if (professionalLeadContent) professionalLeadContent.hidden = true;
      if (professionalLeadDismiss) professionalLeadDismiss.hidden = true;
      if (professionalLeadSuccess) {
        professionalLeadSuccess.hidden = false;
        professionalLeadSuccess.focus();
      }
      professionalLeadDialog?.setAttribute('aria-labelledby', 'professional-lead-success-title');
      professionalLeadDialog?.removeAttribute('aria-describedby');
      setProfessionalLeadStatus('');
    } catch (error) {
      if (!lifecycle.canCommit(controller, professionalLeadRequest)) return;
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setProfessionalLeadStatus(wizard.lead?.unavailable, true);
    } finally {
      const ownsRequest = professionalLeadRequest === controller;
      if (ownsRequest) professionalLeadRequest = null;
      lifecycle.release(controller);
      if (lifecycle.isActive() && ownsRequest) {
        if (!professionalLeadComplete && professionalLeadSubmit)
          professionalLeadSubmit.disabled = false;
        professionalLeadForm.removeAttribute('aria-busy');
      }
    }
  });
  downloadPdfButtons.forEach((downloadPdfButton) =>
    downloadPdfButton.addEventListener('click', () => {
      const opened = openCalculatorPdfReport({
        analysis: state.analysis,
        passport: state.solarPassport,
        state,
        wizard,
        product,
        locale
      });
      if (!opened) writeStatus(wizard.pdfReport?.popupBlocked ?? product.result?.unavailable, true);
    })
  );
  root.querySelector('[data-open-passport]')?.addEventListener('click', (event) => {
    if (!passportDialog || typeof passportDialog.showModal !== 'function') return;
    passportOpener = event.currentTarget;
    renderPassport();
    passportDialog.showModal();
  });
  passportDialog?.addEventListener('close', () => passportOpener?.focus());
  root
    .querySelectorAll('[data-wizard-back]')
    .forEach((button) =>
      button.addEventListener('click', () => setStep(Number(button.dataset.wizardBack)))
    );
  progress.forEach((button) =>
    button.addEventListener('click', () => setStep(Number(button.dataset.wizardNav)))
  );

  populateLocalityOptions();
  syncRoofControls({ preserveAnalysis: true });
  if (state.sitePotential) renderPotential(state.sitePotential);
  const restoredStep = Number.isInteger(savedSession.currentStep) ? savedSession.currentStep : 0;
  if (state.analysis) {
    void ensureResultStyles()
      .catch(() => null)
      .then(() => {
        if (!lifecycle.isActive() || !state.analysis) return;
        renderResult(state.analysis);
        setStep(restoredStep, { focus: false });
        void loadDisplayProducts()
          .then(() => {
            if (lifecycle.isActive() && state.analysis) renderResult(state.analysis);
          })
          .catch(() => {});
      });
  } else {
    setStep(restoredStep, { focus: false });
  }
  const destroy = () => {
    if (!lifecycle.destroy()) return;
    clearAddressSearchDebounce();
    stopAddressSearch();
    stopPotential();
    stopAnalysis();
    professionalLeadRequest?.abort();
    professionalLeadRequest = null;
    professionalLeadTrigger = null;
    document.removeEventListener('keydown', handleRoofInfoPopoverKeydown);
    document.removeEventListener('click', handleRoofInfoPopoverOutsideClick);
    window.removeEventListener('resize', positionOpenRoofInfoPopovers);
    window.removeEventListener('scroll', positionOpenRoofInfoPopovers, true);
    mapController?.destroy();
    mapController = null;
    if (passportDialog?.open) passportDialog.close();
    if (professionalLeadDialog?.open) professionalLeadDialog.close();
  };
  return { state, destroy };
};
