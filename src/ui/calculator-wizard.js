import {
  ANALYSIS_SCHEMA_VERSION,
  calculatePreliminaryRoofCapacity,
  calculateRoofPlaneArea,
  getCalculatorInputNumber,
  PRELIMINARY_USABLE_ROOF_RATIO,
  SolarPassportRepository
} from '../domain/index.js';
import { number, format, text, element, localeCode } from './calculator/view-helpers.js';
import { createCalculatorResultsView } from './calculator/results-view.js';
import { openCalculatorPdfReport } from './calculator/pdf-report.js';
import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { createPropertyMap } from '../services/property-map.js';
import {
  applyPotentialOutcome,
  createCalculatorWizardState,
  deriveWizardStepStates,
  isWizardStepAccessible,
  WIZARD_STEP_KEYS,
  WIZARD_STEP_STATUSES
} from './calculator-wizard-state.js';
import { initConsumptionInput } from './consumption-input.js';
import { initFileUpload } from './file-upload.js';
import { createAsyncRequestLifecycle } from './async-request-lifecycle.js';
import { createCalculatorSession } from './calculator-session.js';
import {
  createProfessionalAnalysisIdentity,
  isRestorableProfessionalAnalysis
} from './professional-analysis-identity.js';
import { localitiesForRegion, localityCenter } from '../data/locations/armenia.js';
import { createEquipmentCatalog } from '../data/equipment/showroom/catalog.js';
import { getDefaultCalculatorSystem } from '../data/equipment/calculator/defaults.js';

const PVGIS_KWP = 1;
const PVGIS_LOSS = 14;
const POTENTIAL_COOLDOWN_MS = 10_000;
const ANALYSIS_COOLDOWN_MS = 15_000;

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
    PVGIS_CACHE_NOT_CONFIGURED: product.status?.cacheNotConfigured,
    PVGIS_CACHE_UNAVAILABLE: product.status?.cacheUnavailable,
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
  if (
    roof.areaMethod === 'map-projected' &&
    (!roof.polygonComplete || roof.effectiveAreaSqm === null)
  )
    return 'outline';
  if (roof.areaMethod === 'measured-plane' && roof.effectiveAreaSqm === null) return 'area';
  if (roof.azimuthDegrees === null) return 'orientation';
  if (roof.tiltDegrees === null) return 'tilt';
  return null;
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
  const displayProductsById = new Map(
    createEquipmentCatalog(localeCode(locale))
      .products.filter((displayProduct) => displayProduct?.id)
      .map((displayProduct) => [displayProduct.id, displayProduct])
  );
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
  const pointConfirmation = root.querySelector('[data-point-confirmation]');
  const pendingCoordinates = root.querySelector('[data-pending-coordinates]');
  const potentialLoading = root.querySelector('[data-potential-loading]');
  const potentialStatus = root.querySelector('[data-potential-status]');
  const potentialResult = root.querySelector('[data-potential-result]');
  const potentialRetry = root.querySelector('[data-potential-retry]');
  const potentialSkip = root.querySelector('[data-potential-skip]');
  const potentialChart = root.querySelector('[data-potential-chart]');
  const potentialTable = root.querySelector('[data-potential-table]');
  const roofArea = root.querySelector('[data-roof-area]');
  const roofAreaLabel = root.querySelector('[data-roof-area-label]');
  const roofMapArea = root.querySelector('[data-roof-map-area]');
  const roofMapOrientation = root.querySelector('[data-roof-map-orientation]');
  const roofMapTilt = root.querySelector('[data-roof-map-tilt]');
  const roofPoints = root.querySelector('[data-roof-points]');
  const roofPlaneWrap = root.querySelector('[data-roof-plane-area-wrap]');
  const roofPlaneArea = root.querySelector('[data-roof-plane-area]');
  const roofOrientation = root.querySelector('[data-roof-orientation]');
  const roofOrientationCustom = root.querySelector('[data-roof-orientation-custom]');
  const roofOrientationCustomInput = root.querySelector('[data-roof-orientation-custom-input]');
  const roofTilt = root.querySelector('[data-roof-tilt]');
  const storageRequired = root.querySelector('[data-storage-required]');
  const roofNotice = root.querySelector('.professional-roof-notice');
  const roofNoticeCopy = roofNotice?.querySelector('p');
  const roofNoticeDefault = roofNoticeCopy?.innerHTML ?? '';
  const roofCapacityPreview = root.querySelector('[data-roof-capacity-preview]');
  const roofCapacityArea = root.querySelector('[data-roof-capacity-area]');
  const roofCapacityUsable = root.querySelector('[data-roof-capacity-usable]');
  const roofCapacityPanels = root.querySelector('[data-roof-capacity-panels]');
  const roofCapacityPanel = root.querySelector('[data-roof-capacity-panel]');
  const roofCapacitySystem = root.querySelector('[data-roof-capacity-system]');
  const roofCapacityAssumption = root.querySelector('[data-roof-capacity-assumption]');
  const resultDashboard = root.querySelector('[data-result-dashboard]');
  const resultSummary = root.querySelector('[data-result-summary]');
  const financeEmpty = root.querySelector('[data-finance-empty]');
  const financeResult = root.querySelector('[data-finance-result]');
  const financeValues = root.querySelector('[data-finance-values]');
  const downloadPdfButton = root.querySelector('[data-download-pdf]');
  const passportDialog = document.querySelector('[data-passport-dialog]');
  const passportContent = document.querySelector('[data-passport-dialog-content]');
  const heroTitle = root.querySelector('#calculator-title');
  const heroIntro = root.querySelector('.professional-hero__copy > p');
  const heroBreadcrumbCurrent = root.querySelector('.calculator-breadcrumb > span');
  const heroControls = root.querySelector('.professional-hero__controls');
  const restartButton = root.querySelector('[data-wizard-restart]');
  const defaultHeroTitle = heroTitle?.textContent ?? '';
  const defaultHeroIntro = heroIntro?.textContent ?? '';
  const defaultHeroBreadcrumb = heroBreadcrumbCurrent?.textContent ?? '';

  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  if (heroControls && restartButton) heroControls.append(restartButton);

  const session = createCalculatorSession();
  const savedSession = session.read();
  // Professional sizing always starts with the calculator-selected catalog
  // module. A legacy session's former customer choice is deliberately ignored.
  const recommendedPanelSystem = getDefaultCalculatorSystem();
  const recommendedPanelId = recommendedPanelSystem?.equipment?.panelId ?? null;
  const savedStorageRequired = savedSession.storageRequired === true;
  const savedProfessionalIdentity = createProfessionalAnalysisIdentity({
    property: savedSession.property?.coordinates,
    consumption: savedSession.consumption,
    tariff: savedSession.userTariff,
    roof: savedSession.roof,
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
    userTariff: savedSession.userTariff ?? null,
    storageRequired: savedStorageRequired,
    analysis: restoredAnalysis,
    solarPassport: restoredAnalysis ? (savedSession.professionalSolarPassport ?? null) : null,
    analysisStatus: restoredAnalysis ? WIZARD_STEP_STATUSES.COMPLETE : WIZARD_STEP_STATUSES.LOCKED
  });
  let mapController = null;
  let mapControllerPromise = null;
  let potentialRequest = null;
  let geocodeRequest = null;
  let analysisRequest = null;
  let lastPotential = null;
  let lastAnalysis = null;
  let passportOpener = null;
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
      userTariff: state.userTariff,
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
      option.textContent = locality;
      return option;
    });
    localitySelect.replaceChildren(placeholder, ...options);
    localitySelect.disabled = localities.length === 0;
  };

  const stopAddressSearch = () => {
    geocodeRequest?.abort();
    lifecycle.release(geocodeRequest);
    geocodeRequest = null;
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
    if (financeEmpty) financeEmpty.hidden = true;
    if (financeResult) financeResult.hidden = true;
  };
  const clearPotentialAndBelow = () => {
    stopPotential();
    setPotentialOutcome({ status: WIZARD_STEP_STATUSES.LOCKED });
    if (potentialResult) potentialResult.hidden = true;
    if (potentialRetry) potentialRetry.hidden = true;
    if (potentialSkip) potentialSkip.hidden = true;
    if (potentialLoading) potentialLoading.textContent = '';
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
    state.confirmedProperty = null;
    clearPotentialAndBelow();
    if (pendingCoordinates)
      pendingCoordinates.textContent = `${format(lat, locale, { maximumFractionDigits: 5 })}, ${format(lng, locale, { maximumFractionDigits: 5 })}`;
    if (pointConfirmation) pointConfirmation.hidden = false;
    updateProgress();
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

  const focusLocality = async (coordinates) => {
    if (!lifecycle.isActive()) return false;
    const lat = number(coordinates?.lat ?? coordinates?.latitude, -90, 90);
    const lng = number(coordinates?.lng ?? coordinates?.longitude, -180, 180);
    if (lat === null || lng === null) return false;
    state.pendingLocation = null;
    state.confirmedProperty = null;
    if (pointConfirmation) pointConfirmation.hidden = true;
    clearPotentialAndBelow();
    syncLocationCoordinates({ lat, lng });
    updateProgress();
    const map = await mountMap('location');
    if (!lifecycle.isActive()) return false;
    map?.clearLocation();
    map?.focusLocation({ lat, lng }, { zoom: 14 });
    return true;
  };

  const locateSelectedLocality = async () => {
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
    state.roof = roof;
    if (roofPoints)
      roofPoints.textContent = text(product.roof?.pointsLabel, { count: roof.points.length });
    updateRoofAreaSummary();
    clearAnalysis();
    updateProgress();
  };

  const updateRoofCapacityPreview = (roof) => {
    if (!roofCapacityPreview) return;
    const system = recommendedPanelSystem;
    const capacity = calculatePreliminaryRoofCapacity({
      roofAreaSqm: roof.effectiveAreaSqm,
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
      roofCapacityUsable.textContent = `${format(capacity.usableRoofAreaSqm, locale, {
        maximumFractionDigits: 1
      })} m²`;
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
        ratio: format(PRELIMINARY_USABLE_ROOF_RATIO * 100, locale, {
          maximumFractionDigits: 0
        })
      });
  };

  const updateRoofAreaSummary = () => {
    const roof = roofGeometry();
    if (roofAreaLabel) {
      roofAreaLabel.textContent =
        roof.areaMethod === 'measured-plane'
          ? (product.roof?.measuredAreaLabel ?? product.roof?.planeAreaLabel ?? '')
          : (product.roof?.areaLabel ?? '');
    }
    if (roofArea) {
      roofArea.textContent =
        roof.effectiveAreaSqm === null
          ? '—'
          : `${format(roof.effectiveAreaSqm, locale, { maximumFractionDigits: 1 })} m²`;
    }
    if (roofMapArea)
      roofMapArea.textContent =
        roof.effectiveAreaSqm === null
          ? '—'
          : `${format(roof.effectiveAreaSqm, locale, { maximumFractionDigits: 1 })} m²`;
    if (roofMapOrientation && roof.azimuthDegrees !== null) {
      const selectedOrientation = roofOrientation?.selectedOptions?.[0]?.textContent?.trim();
      roofMapOrientation.textContent =
        selectedOrientation && roof.azimuthDegrees !== null
          ? `${selectedOrientation} (${format(roof.azimuthDegrees, locale)}°)`
          : `${format(roof.azimuthDegrees, locale)}°`;
    }
    if (roofMapTilt && roof.tiltDegrees !== null)
      roofMapTilt.textContent = `${format(roof.tiltDegrees, locale)}°`;
    updateRoofCapacityPreview(roof);
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
      mapController?.mount(host);
      mapController?.setMode(mode);
      if (mode === 'roof') {
        root
          .querySelectorAll('.professional-roof-map__layers button')
          .forEach((button, index) => button.classList.toggle('is-active', index === 1));
      }
      if (state.confirmedProperty)
        mapController?.setLocation(state.confirmedProperty, { notify: false });
      if (state.confirmedProperty) syncLocationCoordinates(state.confirmedProperty);
      if (mode === 'roof' && state.roof?.points?.length) {
        mapController?.setRoofPoints(state.roof.points, { complete: state.roof.complete });
      }
      mapController?.resize();
      return mapController;
    } catch {
      mapControllerPromise = null;
      if (!lifecycle.isActive()) return null;
      writeStatus(product.roof?.fallback ?? product.location?.manualUnavailable, true);
      return null;
    }
  };

  const renderBars = (container, values, months, unit) => {
    if (!container) return;
    container.replaceChildren();
    const maximum = Math.max(...values.map(Number).filter(Number.isFinite), 1);
    values.forEach((value, index) => {
      const numeric = Number(value);
      const button = element('button', 'chart-bar');
      button.type = 'button';
      button.style.setProperty('--bar-height', `${Math.max(3, (numeric / maximum) * 100)}%`);
      const month = months[index] ?? {};
      const display = `${format(numeric, locale, { maximumFractionDigits: 0 })} ${unit}`;
      button.setAttribute('aria-label', `${month.name ?? month.short ?? index + 1}: ${display}`);
      button.title = button.getAttribute('aria-label');
      button.append(
        element('span', 'chart-bar__value', display),
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
    financeEmpty,
    financeResult,
    financeValues,
    passportContent,
    renderBars,
    state
  });

  const renderPotential = (potential) => {
    const months = product.passport?.months ?? [];
    root.querySelector('[data-potential-yield]').textContent =
      `${format(potential.annualYieldKwhPerKwp, locale, { maximumFractionDigits: 0 })} kWh/kWp`;
    root.querySelector('[data-potential-azimuth]').textContent = compass(
      potential.orientation?.azimuthDegrees,
      product.potential?.directions
    );
    root.querySelector('[data-potential-tilt]').textContent =
      `${format(potential.orientation?.tiltDegrees, locale, { maximumFractionDigits: 0 })}°`;
    renderBars(potentialChart, potential.monthlyYieldKwhPerKwp ?? [], months, 'kWh/kWp');
    potentialTable?.replaceChildren();
    (potential.monthlyYieldKwhPerKwp ?? []).forEach((value, index) => {
      const row = document.createElement('tr');
      row.append(
        element('td', '', months[index]?.name ?? String(index + 1)),
        element('td', '', format(value, locale, { maximumFractionDigits: 0 }))
      );
      potentialTable?.append(row);
    });
    const cache =
      potential.cache?.state === 'hit'
        ? text(product.potential?.cacheHit, {
            date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              new Date(potential.cache.providerRetrievedAt)
            )
          })
        : product.potential?.cacheMiss;
    root.querySelector('[data-potential-source]').textContent = [product.potential?.source, cache]
      .filter(Boolean)
      .join(' ');
    if (potentialResult) potentialResult.hidden = false;
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
    setPotentialOutcome({ status: WIZARD_STEP_STATUSES.AVAILABLE });
    pointConfirmation.hidden = true;
    await mountMap('location');
    if (!lifecycle.isActive()) return;
    mapController?.setLocation(state.confirmedProperty, { notify: false });
    setStep(1);
    void requestPotential();
  };

  const roofAzimuth = () =>
    roofOrientation?.value === 'custom'
      ? number(roofOrientationCustomInput?.value, 0, 359)
      : number(roofOrientation?.value, 0, 359);
  const roofGeometry = () => {
    const areaMethod = activeAreaMethod(root);
    const tiltDegrees = number(roofTilt?.value, 0, 90);
    const azimuthDegrees = roofAzimuth();
    const projectedAreaSqm = getCalculatorInputNumber(state.roof?.areaSqm, 'roofAreaSqm');
    const planeAreaSqm = getCalculatorInputNumber(roofPlaneArea?.value, 'roofAreaSqm');
    const effective = calculateRoofPlaneArea({
      areaMethod,
      projectedAreaSqm,
      planeAreaSqm,
      tiltDegrees
    });
    return {
      areaMethod,
      mountingMode: activeMountingMode(root),
      tiltDegrees,
      azimuthDegrees,
      projectedAreaSqm,
      planeAreaSqm,
      effectiveAreaSqm: effective,
      polygonComplete: Boolean(state.roof?.complete)
    };
  };
  const clearRoofValidation = () => {
    roofNotice?.classList.remove('is-error');
    roofNotice?.removeAttribute('role');
    if (roofNoticeCopy && roofNoticeCopy.innerHTML !== roofNoticeDefault)
      roofNoticeCopy.innerHTML = roofNoticeDefault;
    [roofPlaneArea, roofOrientation, roofOrientationCustomInput, roofTilt].forEach((field) =>
      field?.removeAttribute('aria-invalid')
    );
  };

  const showRoofValidation = (issue) => {
    const messages = {
      outline: wizard.ui?.roof?.outlineRequired ?? product.roof?.parametersRequired,
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
    if (roofOrientationCustom) roofOrientationCustom.hidden = roofOrientation?.value !== 'custom';
    const roof = roofGeometry();
    state.roof = {
      ...(state.roof ?? {}),
      areaMethod: roof.areaMethod,
      mountingMode: roof.mountingMode,
      projectedAreaSqm: roof.projectedAreaSqm,
      planeAreaSqm: roof.planeAreaSqm,
      tiltDegrees: roof.tiltDegrees,
      orientationDegrees: roof.azimuthDegrees
    };
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
      tariff: state.userTariff,
      roof: {
        areaMethod: roof.areaMethod,
        mountingMode: roof.mountingMode,
        projectedAreaSqm: roof.projectedAreaSqm,
        planeAreaSqm: roof.planeAreaSqm,
        polygonComplete: roof.polygonComplete,
        tiltDegrees: roof.tiltDegrees,
        azimuthDegrees: roof.azimuthDegrees
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
      if (!mapController?.finishRoof()) onRoofChange({ ...state.roof, complete: true });
    }
    if (!validateRoof()) return;
    state.consumption = consumption.value;
    state.userTariff = consumption.tariff;
    const payload = buildPayload();
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
    state.analysisStatus = WIZARD_STEP_STATUSES.LOADING;
    lastAnalysis = { fingerprint, startedAt: Date.now() };
    const button = root.querySelector('[data-run-analysis]');
    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('disabled', '');
    writeStatus(product.result?.preparing ?? '');
    updateProgress();
    try {
      // selectedBillFile is deliberately not part of this payload.
      const response = await api.analyze(payload, { signal: controller.signal });
      if (!lifecycle.canCommit(controller, analysisRequest)) return;
      state.analysis = response?.analysis ?? null;
      if (!state.analysis) throw new ProductApiError('MALFORMED_RESPONSE');
      state.analysisStatus = WIZARD_STEP_STATUSES.COMPLETE;
      state.solarPassport = passportRepository.create(state.analysis, { locale });
      professionalAnalysisIdentity = createProfessionalAnalysisIdentity({
        property: payload.property,
        consumption: payload.consumption,
        tariff: payload.tariff,
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
  }
  const savedTariff = root.querySelector('[data-consumption-tariff]');
  if (savedTariff && state.userTariff?.rateAmdPerKwh) {
    savedTariff.value = state.userTariff.rateAmdPerKwh;
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
    strings: product.consumption ?? {},
    onChange: () => {
      const draft = consumptionInput?.inspect();
      state.consumption = draft?.valid ? draft.value : null;
      state.userTariff = draft?.valid ? draft.tariff : null;
      clearAnalysis();
      updateProgress();
    }
  });
  const fileUpload = initFileUpload({
    root,
    status: config.status ?? {},
    onChange: (file) => {
      state.selectedBillFile = file;
    }
  });

  root
    .querySelector('[data-open-location-map]')
    ?.addEventListener('click', () => void searchAddress());
  address?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void searchAddress();
  });
  root.querySelector('[data-clear-address]')?.addEventListener('click', () => {
    stopAddressSearch();
    clearLocationSearchResults();
    if (address) address.value = '';
    writeStatus('');
    address?.focus();
  });
  root
    .querySelector('[data-confirm-location]')
    ?.addEventListener('click', () => void confirmLocation());
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
  root
    .querySelector('[data-location-coordinates-submit]')
    ?.addEventListener('click', selectCoordinates);
  root.querySelector('[data-use-map-coordinates]')?.addEventListener('click', selectCoordinates);
  root.querySelector('[data-map-focus-location]')?.addEventListener('click', selectCoordinates);
  root.querySelector('[data-use-current-location]')?.addEventListener('click', useCurrentLocation);
  regionSelect?.addEventListener('change', () => {
    const center = ARMENIA_REGION_CENTERS[regionSelect.value];
    if (!center) return;
    populateLocalityOptions();
    stopAddressSearch();
    clearLocationSearchResults();
    if (address) address.value = '';
    state.pendingLocation = null;
    state.confirmedProperty = null;
    pointConfirmation.hidden = true;
    clearPotentialAndBelow();
    syncLocationCoordinates(center);
    updateProgress();
    void mountMap('location').then((map) => {
      if (!lifecycle.isActive()) return;
      map?.clearLocation();
      map?.focusLocation(center);
    });
  });
  localitySelect?.addEventListener('change', () => void locateSelectedLocality());
  root.querySelector('[data-location-continue]')?.addEventListener('click', () => {
    const lat = number(latitudeInput?.value, -90, 90);
    const lng = number(longitudeInput?.value, -180, 180);
    if (lat === null || lng === null) {
      writeStatus(product.location?.invalidCoordinates, true);
      return;
    }
    setPendingLocation({ lat, lng });
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
  potentialSkip?.addEventListener('click', () => setStep(1));
  potentialRetry?.addEventListener('click', () => void requestPotential({ force: true }));
  root.querySelector('[data-consumption-continue]')?.addEventListener('click', () => {
    const consumption = consumptionInput?.read();
    if (!consumption?.valid) {
      writeStatus(consumption?.message ?? product.consumption?.noConsumption, true);
      return;
    }
    state.consumption = consumption.value;
    state.userTariff = consumption.tariff;
    setStep(2);
  });
  const useRoofMap = (action) => {
    void mountMap('roof').then((controller) => {
      if (lifecycle.isActive() && controller) action(controller);
    });
  };
  root
    .querySelector('[data-roof-add-center]')
    ?.addEventListener('click', () => useRoofMap((map) => map.addPointAtCenter()));
  root
    .querySelector('[data-roof-undo]')
    ?.addEventListener('click', () => useRoofMap((map) => map.undo()));
  root
    .querySelectorAll('[data-roof-reset]')
    .forEach((button) =>
      button.addEventListener('click', () => useRoofMap((map) => map.resetRoof()))
    );
  root.querySelector('[data-roof-finish]')?.addEventListener('click', () =>
    useRoofMap((map) => {
      if (!map.finishRoof()) {
        writeStatus(product.roof?.minimumPoints, true);
        return;
      }
      writeStatus(product.roof?.finishHelp);
    })
  );
  root
    .querySelectorAll(
      '[data-roof-area-method], [data-roof-mounting-mode], [data-roof-tilt], [data-roof-plane-area], [data-roof-orientation], [data-roof-orientation-custom-input]'
    )
    .forEach((input) => input.addEventListener('input', syncRoofControls));
  root
    .querySelectorAll('[data-roof-area-method], [data-roof-mounting-mode], [data-roof-orientation]')
    .forEach((input) => input.addEventListener('change', syncRoofControls));

  storageRequired?.addEventListener('change', () => {
    const nextStorageRequired = storageRequired.checked;
    if (nextStorageRequired === state.storageRequired) return;
    state.storageRequired = nextStorageRequired;
    clearAnalysis();
    lastAnalysis = null;
    updateProgress();
  });

  root.querySelector('[data-run-analysis]')?.addEventListener('click', () => void runAnalysis());
  root.querySelector('[data-add-tariff]')?.addEventListener('click', () => {
    setStep(1);
    requestAnimationFrame(() => {
      if (lifecycle.isActive()) root.querySelector('[data-consumption-tariff]')?.focus();
    });
  });
  root.querySelector('[data-wizard-restart]')?.addEventListener('click', () => {
    session.clear();
    window.location.reload();
  });
  downloadPdfButton?.addEventListener('click', () => {
    const opened = openCalculatorPdfReport({
      analysis: state.analysis,
      passport: state.solarPassport,
      state,
      wizard,
      product,
      locale
    });
    if (!opened) writeStatus(wizard.pdfReport?.popupBlocked ?? product.result?.unavailable, true);
  });
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
  if (state.analysis) renderResult(state.analysis);
  const restoredStep = Number.isInteger(savedSession.currentStep) ? savedSession.currentStep : 0;
  setStep(restoredStep, { focus: false });
  if (state.currentStep === 0)
    void mountMap('location').then((map) => {
      if (!lifecycle.isActive() || !map || state.confirmedProperty || state.pendingLocation) return;
      const lat = number(latitudeInput?.value, -90, 90);
      const lng = number(longitudeInput?.value, -180, 180);
      if (lat !== null && lng !== null) {
        map.setLocation({ lat, lng }, { notify: false });
        syncLocationCoordinates({ lat, lng });
      }
    });
  const destroy = () => {
    if (!lifecycle.destroy()) return;
    stopAddressSearch();
    stopPotential();
    stopAnalysis();
    mapController?.destroy();
    mapController = null;
    if (passportDialog?.open) passportDialog.close();
  };
  return { state, getSelectedBillFile: () => fileUpload.getFile(), destroy };
};
