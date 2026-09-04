import {
  calculateRoofPlaneArea,
  createUserTariffSelection,
  normalizeConsumption,
  SolarPassportRepository
} from './domain/index.js';
import { toFiniteNumberOrNull } from './domain/numbers.js';
import { trackProductEvent } from './services/analytics.js';
import { ProductApiClient, ProductApiError } from './services/api-client.js';
import { createPropertyMap } from './services/property-map.js';
import { renderAnalysisLedger } from './ui/analysis-ledger.js';
import { createAnalysisView } from './ui/analysis-view.js';
import { initGenerationChart } from './ui/chart.js';
import { initConsumptionInput } from './ui/consumption-input.js';
import { initPassportDialog } from './ui/dialogs.js';
import { initFileUpload } from './ui/file-upload.js';
import { initLeadForm } from './ui/lead-form.js';
import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';
import { initOfferCheckerWorkspace } from './tools.js';

const DEFAULT_PVGIS_REQUEST_KWP = 1;
const DEFAULT_PVGIS_LOSS_PERCENT = 14;
const POTENTIAL_COOLDOWN_MS = 10_000;
const ANALYSIS_COOLDOWN_MS = 15_000;

document.documentElement.classList.add('js');

const readConfig = () => {
  try {
    return JSON.parse(document.querySelector('#page-config')?.textContent ?? '{}');
  } catch {
    return {};
  }
};

const config = readConfig();
const locale = config.locale ?? 'ru-RU';
const status = config.status ?? {};
const product = config.product ?? {};
const mapConfig = config.map ?? {};
const apiClient = new ProductApiClient({ endpoints: config.endpoints ?? {} });
const passportRepository = new SolarPassportRepository();

const form = document.querySelector('[data-address-form]');
const addressInput = form?.querySelector('input[name="address"]');
const statusElement = document.querySelector('[data-analysis-status]');
const resultPanel = document.querySelector('[data-result-panel]');
const resultSummary = document.querySelector('[data-analysis-summary]');
const calculatorFlowSteps = [...document.querySelectorAll('[data-calculator-flow-step]')];
const calculatorMenuItems = [...document.querySelectorAll('[data-calculator-menu-item]')];
const locationStage = document.querySelector('[data-location-stage]');
const locationMessage = document.querySelector('[data-location-message]');
const locationAddress = document.querySelector('[data-location-address]');
const locationCoordinates = document.querySelector('[data-location-coordinates]');
const locationConfirm = document.querySelector('[data-location-confirm]');
const locationLatitude = document.querySelector('[data-location-latitude]');
const locationLongitude = document.querySelector('[data-location-longitude]');
const roofStage = document.querySelector('[data-roof-stage]');
const roofMessage = document.querySelector('[data-roof-message]');
const roofPoints = document.querySelector('[data-roof-points]');
const roofArea = document.querySelector('[data-roof-area]');
const roofOrientation = document.querySelector('[data-roof-orientation]');
const roofOrientationCustom = document.querySelector('[data-roof-orientation-custom]');
const roofOrientationCustomInput = document.querySelector('[data-roof-orientation-custom-input]');
const roofTilt = document.querySelector('[data-roof-tilt]');
const roofMountingMode = document.querySelector('[data-roof-mounting-mode]');
const roofAreaMethods = [...document.querySelectorAll('[data-roof-area-method]')];
const roofPlaneArea = document.querySelector('[data-roof-plane-area]');
const roofPlaneAreaWrap = document.querySelector('[data-roof-plane-area-wrap]');
const roofEffectiveArea = document.querySelector('[data-roof-effective-area]');
const roofPointSelect = document.querySelector('[data-roof-point-select]');
const roofNudgeControls = document.querySelector('[data-roof-nudge-controls]');
const roofFinish = document.querySelector('[data-roof-finish]');
const mapShell = document.querySelector('[data-map-shell]');
const propertyMapContainer = document.querySelector('[data-property-map]');
const propertyMapNote = document.querySelector('[data-property-map-note]');
const sitePotentialRoot = document.querySelector('[data-site-potential]');
const sitePotentialStatus = document.querySelector('[data-site-potential-status]');
const sitePotentialValues = document.querySelector('[data-site-potential-values]');
const sitePotentialYield = document.querySelector('[data-site-potential-yield]');
const sitePotentialOrientation = document.querySelector('[data-site-potential-orientation]');
const sitePotentialTilt = document.querySelector('[data-site-potential-tilt]');
const sitePotentialArrow = document.querySelector('[data-site-potential-arrow]');
const sitePotentialCache = document.querySelector('[data-site-potential-cache]');
const sitePotentialContact = document.querySelector('[data-site-potential-contact]');
const sitePotentialRetry = document.querySelector('[data-site-potential-retry]');
const sitePotentialContinue = document.querySelector('[data-site-potential-continue]');
const roofPreviewArrow = document.querySelector('[data-roof-preview-arrow]');
const roofPreviewOrientation = document.querySelector('[data-roof-preview-orientation]');
const roofPreviewTilt = document.querySelector('[data-roof-preview-tilt]');
const roofBenchmarkOrientation = document.querySelector('[data-roof-benchmark-orientation]');
const roofBenchmarkTilt = document.querySelector('[data-roof-benchmark-tilt]');
const optionalUpload = document.querySelector('[data-optional-upload]');
const ledgerRoot = document.querySelector('[data-analysis-ledger]');
const passportPersistence = document.querySelector('[data-passport-persistence]');
const leadSection = document.querySelector('[data-lead-section]');
const leadStatus = document.querySelector('[data-lead-status]');
const passportDialogEyebrow = document.querySelector('[data-passport-dialog-eyebrow]');

let activeRequest = null;
let activePotentialRequest = null;
let mapController = null;
let pendingLocation = null;
let confirmedProperty = null;
let currentRoof = null;
let currentPassport = null;
let currentSitePotential = null;
let lastPotentialRequest = null;
let lastAnalysisRequest = null;

initNavigation();
initPassportDialog();
initFileUpload({ status });
initScrollers();
initOfferCheckerWorkspace(config.offerChecker);

const analysisView = createAnalysisView({
  locale,
  strings: product.result ?? {},
  solutionStrings: product.solutions ?? {}
});
const chart = initGenerationChart({ locale, status });
const consumptionControl = initConsumptionInput({
  root: document.querySelector('[data-consumption-inputs]'),
  strings: product.consumption ?? {},
  onChange: () => invalidateDetailedAnalysis({ notify: true })
});

const tariffSelectionFor = (consumptionInput) =>
  consumptionInput?.tariff ? createUserTariffSelection(consumptionInput.tariff) : null;

const normalizedConsumptionFor = (consumptionInput) =>
  normalizeConsumption(consumptionInput?.value, {
    tariff: tariffSelectionFor(consumptionInput)
  });

const writeStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message ?? '';
  statusElement.classList.toggle('is-error', Boolean(isError));
};

const formatCoordinate = (value) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 5 }).format(Number(value));

const formatProviderDate = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : '—';
};

const formatArea = (value) => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} m²`;
};

const formatNumber = (value, options = {}) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat(locale, options).format(Number(value))
    : '—';

const formatDegrees = (value) =>
  Number.isFinite(Number(value)) ? `${formatNumber(value, { maximumFractionDigits: 0 })}°` : '—';

const directionForAzimuth = (value) => {
  if (!Number.isFinite(Number(value))) return null;
  const keys = [
    'north',
    'northEast',
    'east',
    'southEast',
    'south',
    'southWest',
    'west',
    'northWest'
  ];
  const index = Math.round((((Number(value) % 360) + 360) % 360) / 45) % keys.length;
  return product.potential?.directions?.[keys[index]] ?? null;
};

const formatCompassDirection = (value) => {
  const degrees = formatDegrees(value);
  const direction = directionForAzimuth(value);
  return direction ? `${degrees} · ${direction}` : degrees;
};

const flowIndex = Object.freeze({ location: 0, potential: 1, roof: 2, result: 3 });
const workspaceStageForFlow = Object.freeze({
  location: 'potential',
  potential: 'potential',
  roof: 'roof',
  result: 'result'
});
const workspaceStageOrder = Object.freeze(['start', 'potential', 'roof', 'result']);

const updateCalculatorMenu = (stage, state = 'active') => {
  const activeStage = workspaceStageForFlow[stage] ?? stage ?? 'start';
  const activeIndex = workspaceStageOrder.indexOf(activeStage);
  calculatorMenuItems.forEach((item) => {
    const itemStage = item.dataset.calculatorMenuItem;
    if (itemStage === 'offer') {
      item.dataset.state = activeStage === 'offer' ? state : 'optional';
      if (activeStage === 'offer') item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      return;
    }
    const itemIndex = workspaceStageOrder.indexOf(itemStage);
    item.dataset.state =
      itemIndex < activeIndex ? 'complete' : itemIndex === activeIndex ? state : 'pending';
    if (itemIndex === activeIndex) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
};

const updateCalculatorFlow = (stage, state = 'active') => {
  const activeIndex = flowIndex[stage] ?? 0;
  calculatorFlowSteps.forEach((step, index) => {
    step.dataset.state =
      index < activeIndex ? 'complete' : index === activeIndex ? state : 'pending';
  });
  updateCalculatorMenu(stage, state);
};

const updateCalculatorMenuFromHash = () => {
  const stage =
    {
      '#calculator': 'start',
      '#calculator-start': 'start',
      '#site-potential': 'potential',
      '#roof-analysis': 'roof',
      '#passport': 'result',
      '#offer-checker': 'offer'
    }[window.location.hash] ?? null;
  if (stage) updateCalculatorMenu(stage);
};

document.querySelector('[data-calculator-menu]')?.addEventListener('click', (event) => {
  const link = event.target.closest('[data-calculator-menu-item]');
  if (!link) return;
  updateCalculatorMenu(link.dataset.calculatorMenuItem);
  window.setTimeout(() => {
    const target = document.getElementById(link.hash.slice(1));
    if (target && !target.hidden) target.focus({ preventScroll: true });
  });
});
window.addEventListener('hashchange', updateCalculatorMenuFromHash);
updateCalculatorMenuFromHash();

const replaceToken = (value, token, replacement) =>
  String(value ?? '').replace(`{${token}}`, String(replacement));

const requestFingerprint = (value) => JSON.stringify(value);

const cooldownRemainingSeconds = (lastRequest, fingerprint, durationMs) => {
  if (!lastRequest || lastRequest.fingerprint !== fingerprint) return 0;
  return Math.max(0, Math.ceil((durationMs - (Date.now() - lastRequest.startedAt)) / 1000));
};

const hasRenderedAnalysis = () => Boolean(currentPassport || (resultPanel && !resultPanel.hidden));

const locationSource = (kind, details = {}) => ({
  kind,
  status: 'provided',
  provider: details.provider ?? null,
  reference: details.reference ?? null,
  verifiedAt: details.verifiedAt ?? null
});

const resetSitePotential = ({ abort = true } = {}) => {
  if (abort) stopPotentialRequest();
  currentSitePotential = null;
  if (sitePotentialRoot) sitePotentialRoot.hidden = true;
  if (sitePotentialStatus) sitePotentialStatus.textContent = '';
  if (sitePotentialValues) sitePotentialValues.hidden = true;
  if (sitePotentialYield) sitePotentialYield.textContent = '—';
  if (sitePotentialOrientation) sitePotentialOrientation.textContent = '—';
  if (sitePotentialTilt) sitePotentialTilt.textContent = '—';
  if (sitePotentialArrow) sitePotentialArrow.setAttribute('transform', 'rotate(0 100 100)');
  if (sitePotentialCache) sitePotentialCache.textContent = '';
  if (sitePotentialContact) sitePotentialContact.hidden = true;
  if (roofBenchmarkOrientation) roofBenchmarkOrientation.textContent = '—';
  if (roofBenchmarkTilt) roofBenchmarkTilt.textContent = '—';
  if (sitePotentialRetry) sitePotentialRetry.hidden = true;
  if (sitePotentialContinue) sitePotentialContinue.disabled = true;
};

const clearAnalysisResult = () => {
  currentPassport = null;
  analysisView.reset();
  chart.update({ monthlyGeneration: [] });
  const chartDescription = document.querySelector('#generation-chart-description');
  if (chartDescription) {
    chartDescription.textContent = product.passport?.pendingChartDescription ?? '';
  }
  if (resultPanel) resultPanel.hidden = true;
  if (ledgerRoot) ledgerRoot.hidden = true;
  if (passportPersistence) passportPersistence.hidden = true;
  if (leadSection) leadSection.hidden = true;
  if (leadStatus) leadStatus.textContent = '';
};

const clearCalculatedState = () => {
  stopActiveRequest();
  clearAnalysisResult();
  currentSitePotential = null;
  resetSitePotential();
};

function invalidateDetailedAnalysis({ notify = false } = {}) {
  const hadResult = hasRenderedAnalysis();
  stopActiveRequest();
  clearAnalysisResult();
  if (hadResult && notify) {
    writeStatus(product.status?.inputsChanged ?? 'Inputs changed. Calculate again.');
  }
}

const setRequestBusy = (button, busy) => {
  if (!button) return;
  if (busy) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }
};

const stopActiveRequest = () => {
  activeRequest?.abort();
  activeRequest = null;
};

const stopPotentialRequest = () => {
  activePotentialRequest?.abort();
  activePotentialRequest = null;
};

const errorCopy = (error, fallback) => {
  if (error instanceof ProductApiError && error.code === 'ABORTED') {
    return product.status?.canceled ?? fallback;
  }
  if (error instanceof ProductApiError) {
    const messages = {
      OUTSIDE_SERVICE_AREA: product.status?.outsideServiceArea,
      PVGIS_CACHE_NOT_CONFIGURED: product.status?.cacheNotConfigured,
      PVGIS_CACHE_UNAVAILABLE: product.status?.cacheUnavailable,
      ROOF_AREA_REQUIRES_MEASURED_PLANE: product.status?.roofAreaRequiresMeasured
    };
    if (messages[error.code]) return messages[error.code];
  }
  return fallback;
};

const updateLocationStage = ({ message, focus = false } = {}) => {
  if (!locationStage) return;
  locationStage.hidden = false;
  if (locationMessage) locationMessage.textContent = message ?? product.location?.copy ?? '';
  const candidate = pendingLocation;
  if (locationAddress) locationAddress.textContent = candidate?.address ?? '';
  if (locationCoordinates) {
    locationCoordinates.textContent = candidate?.coordinates
      ? `${formatCoordinate(candidate.coordinates.lat)}, ${formatCoordinate(candidate.coordinates.lng)}`
      : '';
  }
  if (locationConfirm) locationConfirm.disabled = !candidate;
  if (focus) {
    requestAnimationFrame(() => {
      locationStage.scrollIntoView({ block: 'nearest' });
      locationStage.focus({ preventScroll: true });
    });
  }
};

const resetDetailedFlow = () => {
  confirmedProperty = null;
  currentRoof = null;
  if (roofStage) roofStage.hidden = true;
  if (optionalUpload) optionalUpload.hidden = true;
  mapController?.resetRoof();
  updateCalculatorFlow('location');
};

const onMapLocationChange = (coordinates) => {
  resetDetailedFlow();
  pendingLocation = {
    address: addressInput?.value.trim() || null,
    coordinates,
    source: locationSource('manual')
  };
  clearCalculatedState();
  updateLocationStage({ message: product.location?.pointSelected ?? product.location?.manualCopy });
  trackProductEvent('property_point_selected', { source: 'manual' });
};

const selectedRoofAreaMethod = () =>
  roofAreaMethods.find((input) => input.checked)?.value ?? 'map-projected';

const selectedMountingMode = () =>
  roofMountingMode?.value === 'elevated' ? 'elevated' : 'roof-parallel';

const roofPlaneAreaValue = () =>
  numericRoofInput(roofPlaneArea, { minimum: 0.01, maximum: 100_000 });

const roofGeometry = (roof = currentRoof) => {
  const areaMethod = selectedRoofAreaMethod();
  const tiltDegrees = numericRoofInput(roofTilt, { minimum: 0, maximum: 90 });
  const projectedAreaSqm = Number.isFinite(Number(roof?.areaSqm)) ? Number(roof.areaSqm) : null;
  const planeAreaSqm = roofPlaneAreaValue();
  const effectiveAreaSqm = calculateRoofPlaneArea({
    areaMethod,
    projectedAreaSqm,
    planeAreaSqm,
    tiltDegrees
  });
  return {
    areaMethod,
    mountingMode: selectedMountingMode(),
    projectedAreaSqm,
    planeAreaSqm,
    effectiveAreaSqm,
    polygonComplete: Boolean(roof?.complete)
  };
};

const hasUsableRoofArea = (roof = currentRoof) => {
  const geometry = roofGeometry(roof);
  return geometry.areaMethod === 'measured-plane'
    ? geometry.planeAreaSqm !== null
    : geometry.polygonComplete && geometry.effectiveAreaSqm !== null;
};

const updateRoofAreaUi = (roof = currentRoof) => {
  const geometry = roofGeometry(roof);
  if (roofPlaneAreaWrap) roofPlaneAreaWrap.hidden = geometry.areaMethod !== 'measured-plane';
  if (roofPlaneArea) roofPlaneArea.disabled = geometry.areaMethod !== 'measured-plane';
  if (roofEffectiveArea) roofEffectiveArea.textContent = formatArea(geometry.effectiveAreaSqm);
  if (roofFinish) roofFinish.disabled = !hasUsableRoofArea(roof);
};

const updateRoofControls = (roof) => {
  currentRoof = roof;
  if (roofPoints) {
    roofPoints.textContent = replaceToken(product.roof?.pointsLabel, 'count', roof.points.length);
  }
  if (roofArea) roofArea.textContent = formatArea(roof.areaSqm);
  if (roofPointSelect) {
    roofPointSelect.replaceChildren();
    roof.points.forEach((_, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = replaceToken(product.roof?.pointSelectLabel, 'index', index + 1);
      option.selected = index === roof.selectedPointIndex;
      roofPointSelect.append(option);
    });
  }
  if (roofNudgeControls) roofNudgeControls.hidden = roof.points.length === 0;
  updateRoofAreaUi(roof);
};

const onRoofChange = (roof) => {
  const hadResult = hasRenderedAnalysis();
  updateRoofControls(roof);
  if (hadResult) invalidateDetailedAnalysis({ notify: true });
};

const ensurePropertyMap = async (mode = 'location') => {
  if (!propertyMapContainer) return null;
  propertyMapContainer.hidden = false;
  if (propertyMapNote) {
    propertyMapNote.hidden = false;
    propertyMapNote.textContent = mapConfig.tileUrl
      ? ((mode === 'roof' ? product.roof?.mapDisclosure : product.location?.manualCopy) ?? '')
      : (product.roof?.tilesUnavailable ?? '');
  }
  mapShell?.classList.add('has-property-map');

  if (!mapController) {
    try {
      mapController = await createPropertyMap({
        container: propertyMapContainer,
        tileUrl: mapConfig.tileUrl,
        tileAttribution: mapConfig.tileAttribution,
        locationPointLabel: product.location?.pointSelected,
        roofPointLabel: (index) => replaceToken(product.roof?.pointSelectLabel, 'index', index + 1),
        onLocationChange: onMapLocationChange,
        onRoofChange
      });
    } catch {
      propertyMapContainer.hidden = true;
      mapShell?.classList.remove('has-property-map');
      if (propertyMapNote) {
        propertyMapNote.hidden = false;
        propertyMapNote.textContent =
          product.roof?.fallback ?? product.roof?.tilesUnavailable ?? '';
      }
      writeStatus(product.roof?.fallback ?? product.status?.analysisUnavailable, true);
      return null;
    }
  }

  mapController.setMode(mode);
  mapController.resize();
  return mapController;
};

const selectManualLocation = async () => {
  stopActiveRequest();
  resetDetailedFlow();
  pendingLocation = null;
  clearCalculatedState();
  updateLocationStage({ message: product.location?.manualCopy, focus: true });
  const propertyMap = await ensurePropertyMap('location');
  propertyMap?.setMode('location');
  writeStatus(product.location?.manualCopy);
};

const beginRoofFlow = async () => {
  if (!confirmedProperty?.coordinates) return;
  if (roofStage && !roofStage.hidden) return;
  if (roofStage) roofStage.hidden = false;
  if (optionalUpload) optionalUpload.hidden = false;
  if (sitePotentialContinue) sitePotentialContinue.disabled = true;
  if (roofMessage) roofMessage.textContent = product.roof?.copy ?? '';
  const propertyMap = await ensurePropertyMap('roof');
  propertyMap?.setLocation(confirmedProperty.coordinates, { notify: false });
  propertyMap?.setMode('roof');
  propertyMap?.resetRoof();
  updateRoofAnglePreview();
  updateCalculatorFlow('roof');
  writeStatus(product.roof?.copy);
};

const loadSitePotential = async () => {
  if (!confirmedProperty?.coordinates) return;

  const fingerprint = requestFingerprint({
    latitude: confirmedProperty.coordinates.lat.toFixed(5),
    longitude: confirmedProperty.coordinates.lng.toFixed(5)
  });
  const cooldownSeconds = cooldownRemainingSeconds(
    lastPotentialRequest,
    fingerprint,
    POTENTIAL_COOLDOWN_MS
  );
  if (cooldownSeconds > 0) {
    if (sitePotentialRoot) sitePotentialRoot.hidden = false;
    if (sitePotentialStatus) {
      sitePotentialStatus.textContent = replaceToken(
        product.status?.potentialCooldown,
        'seconds',
        cooldownSeconds
      );
    }
    if (sitePotentialRetry) sitePotentialRetry.hidden = false;
    updateCalculatorFlow('potential', 'attention');
    return;
  }

  stopPotentialRequest();
  resetSitePotential({ abort: false });
  if (sitePotentialRoot) sitePotentialRoot.hidden = false;
  if (sitePotentialStatus) sitePotentialStatus.textContent = product.potential?.loading ?? '';
  if (sitePotentialRetry) sitePotentialRetry.hidden = true;
  if (sitePotentialContinue) sitePotentialContinue.disabled = true;
  requestAnimationFrame(() => {
    sitePotentialRoot?.scrollIntoView({ block: 'start' });
    sitePotentialRoot?.focus({ preventScroll: true });
  });
  updateCalculatorFlow('potential');

  const controller = new AbortController();
  activePotentialRequest = controller;
  lastPotentialRequest = { fingerprint, startedAt: Date.now() };
  try {
    const response = await apiClient.potential(
      {
        property: {
          latitude: confirmedProperty.coordinates.lat,
          longitude: confirmedProperty.coordinates.lng,
          confirmed: true
        }
      },
      { signal: controller.signal }
    );
    if (controller.signal.aborted || activePotentialRequest !== controller) return;

    const potential = response?.potential;
    const annualYield = Number(potential?.annualYieldKwhPerKwp);
    const tilt = Number(potential?.orientation?.tiltDegrees);
    const azimuth = Number(potential?.orientation?.azimuthDegrees);
    const monthly = potential?.monthlyYieldKwhPerKwp;
    if (
      potential?.mode !== 'site-potential' ||
      potential?.scope !== 'site-benchmark' ||
      !Number.isFinite(annualYield) ||
      !Number.isFinite(tilt) ||
      !Number.isFinite(azimuth) ||
      !Array.isArray(monthly) ||
      monthly.length !== 12 ||
      monthly.some((value) => !Number.isFinite(Number(value)))
    ) {
      throw new ProductApiError('MALFORMED_RESPONSE', { retryable: true });
    }

    if (sitePotentialYield) {
      sitePotentialYield.textContent = `${formatNumber(annualYield, {
        maximumFractionDigits: 0
      })} kWh`;
    }
    if (sitePotentialOrientation)
      sitePotentialOrientation.textContent = formatCompassDirection(azimuth);
    if (sitePotentialTilt) sitePotentialTilt.textContent = formatDegrees(tilt);
    if (sitePotentialArrow) {
      sitePotentialArrow.setAttribute('transform', `rotate(${azimuth.toFixed(2)} 100 100)`);
    }
    currentSitePotential = potential;
    if (sitePotentialCache) {
      const cache = potential.cache ?? {};
      sitePotentialCache.textContent =
        cache.state === 'hit'
          ? replaceToken(
              product.potential?.cacheHit,
              'date',
              formatProviderDate(cache.providerRetrievedAt)
            )
          : (product.potential?.cacheMiss ?? '');
    }
    updateRoofAnglePreview();
    if (sitePotentialStatus) sitePotentialStatus.textContent = '';
    if (sitePotentialValues) sitePotentialValues.hidden = false;
    if (sitePotentialContinue) sitePotentialContinue.disabled = false;
    updateCalculatorFlow('potential', 'complete');
    trackProductEvent('site_potential_ready', { source: 'provider' });
  } catch (error) {
    if (error instanceof ProductApiError && error.code === 'ABORTED') return;
    if (sitePotentialStatus) {
      sitePotentialStatus.textContent = errorCopy(error, product.potential?.unavailable ?? '');
    }
    if (sitePotentialValues) sitePotentialValues.hidden = true;
    if (sitePotentialRetry) sitePotentialRetry.hidden = false;
    if (sitePotentialContact) sitePotentialContact.hidden = false;
    if (sitePotentialContinue) sitePotentialContinue.disabled = true;
    updateCalculatorFlow('potential', 'attention');
    trackProductEvent('site_potential_unavailable', { code: error?.code ?? 'UNAVAILABLE' });
  } finally {
    if (activePotentialRequest === controller) activePotentialRequest = null;
  }
};

const confirmLocation = async () => {
  if (!pendingLocation?.coordinates) return;
  confirmedProperty = {
    ...pendingLocation,
    confirmed: true,
    source: { ...pendingLocation.source, status: 'confirmed' }
  };
  if (locationStage) locationStage.hidden = true;
  const propertyMap = await ensurePropertyMap('location');
  propertyMap?.setLocation(confirmedProperty.coordinates, { notify: false });
  propertyMap?.setMode('location');
  writeStatus(product.potential?.loading);
  trackProductEvent('property_confirmed', { source: confirmedProperty.source.kind });
  void loadSitePotential();
};

const selectCoordinateLocation = async () => {
  const latitude = numericRoofInput(locationLatitude, { minimum: -90, maximum: 90 });
  const longitude = numericRoofInput(locationLongitude, { minimum: -180, maximum: 180 });
  if (latitude === null || longitude === null) {
    if (latitude === null) locationLatitude?.setAttribute('aria-invalid', 'true');
    if (longitude === null) locationLongitude?.setAttribute('aria-invalid', 'true');
    writeStatus(product.location?.invalidCoordinates ?? status.minAddress, true);
    return;
  }

  locationLatitude?.removeAttribute('aria-invalid');
  locationLongitude?.removeAttribute('aria-invalid');
  stopActiveRequest();
  resetDetailedFlow();
  clearCalculatedState();
  pendingLocation = {
    address: addressInput?.value.trim() || null,
    coordinates: { lat: latitude, lng: longitude },
    source: locationSource('manual')
  };
  updateLocationStage({ message: product.location?.pointSelected, focus: true });
  mapController?.setLocation(pendingLocation.coordinates, { notify: false });
  trackProductEvent('property_point_selected', { source: 'manual-coordinates' });
};

const startManualLocation = async () => {
  addressInput?.removeAttribute('aria-invalid');
  await selectManualLocation();
};

const numericRoofInput = (input, { minimum, maximum }) => {
  const value = toFiniteNumberOrNull(input?.value);
  return value !== null && value >= minimum && value <= maximum ? value : null;
};

const updateCustomOrientationControl = ({ focus = false } = {}) => {
  const isCustom = roofOrientation?.value === 'custom';
  if (roofOrientationCustom) roofOrientationCustom.hidden = !isCustom;
  if (!isCustom) roofOrientationCustomInput?.removeAttribute('aria-invalid');
  if (isCustom && focus) roofOrientationCustomInput?.focus({ preventScroll: true });
  updateRoofAnglePreview();
};

const roofAzimuth = () =>
  numericRoofInput(
    roofOrientation?.value === 'custom' ? roofOrientationCustomInput : roofOrientation,
    {
      minimum: 0,
      maximum: 359.999
    }
  );

const updateRoofAnglePreview = () => {
  const azimuth = roofAzimuth();
  const tilt = numericRoofInput(roofTilt, { minimum: 0, maximum: 90 });
  const unknownValue = product.roof?.angleGuideUnknown ?? '—';
  if (roofPreviewArrow) {
    roofPreviewArrow.setAttribute(
      'transform',
      `rotate(${Number.isFinite(azimuth) ? azimuth.toFixed(2) : 0} 100 100)`
    );
  }
  if (roofPreviewOrientation) {
    roofPreviewOrientation.textContent = Number.isFinite(azimuth)
      ? formatCompassDirection(azimuth)
      : unknownValue;
  }
  if (roofPreviewTilt)
    roofPreviewTilt.textContent = Number.isFinite(tilt) ? formatDegrees(tilt) : unknownValue;
  const benchmarkAzimuth = Number(currentSitePotential?.orientation?.azimuthDegrees);
  const benchmarkTilt = Number(currentSitePotential?.orientation?.tiltDegrees);
  if (roofBenchmarkOrientation) {
    roofBenchmarkOrientation.textContent = Number.isFinite(benchmarkAzimuth)
      ? formatCompassDirection(benchmarkAzimuth)
      : unknownValue;
  }
  if (roofBenchmarkTilt) {
    roofBenchmarkTilt.textContent = Number.isFinite(benchmarkTilt)
      ? formatDegrees(benchmarkTilt)
      : unknownValue;
  }
  updateRoofAreaUi();
};

const publishAnalysis = (analysis, passport) => {
  currentPassport = passport;
  analysisView.update(analysis);
  const monthlyGeneration = analysis.selectedScenario?.generation?.monthlyKwh ?? [];
  chart.update({ monthlyGeneration });
  renderAnalysisLedger({
    root: ledgerRoot,
    analysis,
    strings: {
      sources: product.ledger?.sources ?? {},
      confidence: product.result?.confidence ?? {},
      assumptions: product.ledger?.assumptions ?? {}
    }
  });
  if (passportPersistence) passportPersistence.hidden = false;
  if (leadSection) leadSection.hidden = false;
  if (passportDialogEyebrow) passportDialogEyebrow.textContent = product.result?.title ?? '';
  document
    .querySelector('[data-passport-dialog-title]')
    ?.replaceChildren(document.createTextNode(product.passport?.realTitle ?? ''));
  document.querySelectorAll('[data-passport-badge]').forEach((element) => {
    element.textContent = product.passport?.sessionBadge ?? '';
  });
  document.querySelectorAll('[data-passport-source-label]').forEach((element) => {
    element.textContent = product.ledger?.sources?.solar ?? '';
  });
  const passportDate = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(passport.createdAt)
  );
  document.querySelectorAll('[data-passport-date]').forEach((element) => {
    element.textContent = passportDate;
  });
  const chartDescription = document.querySelector('#generation-chart-description');
  if (chartDescription) chartDescription.textContent = product.result?.chartDescription ?? '';
  if (resultSummary) resultSummary.textContent = product.result?.ready ?? '';
  if (resultPanel) resultPanel.hidden = false;
  resultPanel?.classList.remove('is-updated');
  requestAnimationFrame(() => {
    resultPanel?.classList.add('is-updated');
    resultPanel?.scrollIntoView({ block: 'start' });
    resultPanel?.focus({ preventScroll: true });
  });
  updateCalculatorFlow('result', 'complete');
  window.dispatchEvent(
    new CustomEvent('solar:analysis-updated', {
      detail: {
        analysis,
        passport,
        source: 'provider',
        commercialEstimate: analysis.commercialEstimate ?? null,
        priceBook: analysis.priceBook ?? null,
        tariffSource: analysis.financial?.tariff ?? null,
        dataCompleteness: analysis.dataCompleteness ?? null,
        scope: analysis.scope ?? null,
        exclusions: analysis.commercialEstimate?.exclusions ?? [],
        validUntil: analysis.commercialEstimate?.validUntil ?? null,
        limitations: analysis.limitations ?? [],
        cache: analysis.cache ?? null,
        providerRetrievedAt: analysis.providerRetrievedAt ?? null
      }
    })
  );
};

const analyzeRoof = async () => {
  const roof = mapController?.getRoof() ?? currentRoof;
  if (!confirmedProperty?.coordinates) {
    writeStatus(product.roof?.locationRequired ?? product.roof?.unavailable, true);
    return;
  }
  const geometry = roofGeometry(roof);
  if (!hasUsableRoofArea(roof)) {
    const invalidInput =
      geometry.areaMethod === 'measured-plane'
        ? roofPlaneArea
        : document.querySelector('[data-roof-start]');
    if (geometry.areaMethod === 'measured-plane')
      roofPlaneArea?.setAttribute('aria-invalid', 'true');
    writeStatus(product.roof?.minimumPoints ?? product.roof?.unavailable, true);
    invalidInput?.focus({ preventScroll: true });
    return;
  }
  const tiltDegrees = numericRoofInput(roofTilt, { minimum: 0, maximum: 90 });
  const azimuthDegrees = roofAzimuth();
  if (tiltDegrees === null || azimuthDegrees === null) {
    const orientationInput =
      roofOrientation?.value === 'custom' ? roofOrientationCustomInput : roofOrientation;
    roofOrientation?.removeAttribute('aria-invalid');
    roofOrientationCustomInput?.removeAttribute('aria-invalid');
    if (azimuthDegrees === null) orientationInput?.setAttribute('aria-invalid', 'true');
    if (tiltDegrees === null) roofTilt?.setAttribute('aria-invalid', 'true');
    else roofTilt?.removeAttribute('aria-invalid');
    writeStatus(
      product.roof?.parametersRequired ??
        `${product.roof?.orientationLabel}: ${product.common?.required}`,
      true
    );
    (azimuthDegrees === null ? orientationInput : roofTilt)?.focus({ preventScroll: true });
    return;
  }
  roofOrientationCustomInput?.removeAttribute('aria-invalid');
  roofOrientation?.removeAttribute('aria-invalid');
  roofTilt?.removeAttribute('aria-invalid');
  roofPlaneArea?.removeAttribute('aria-invalid');

  const consumptionInput = consumptionControl?.read();
  if (!consumptionInput?.valid) {
    writeStatus(consumptionInput?.message ?? product.consumption?.noConsumption, true);
    return;
  }
  const consumption = normalizedConsumptionFor(consumptionInput);
  if (!consumption.available) {
    writeStatus(product.consumption?.noConsumption ?? product.result?.noSavings, true);
    trackProductEvent('analysis_blocked_invalid_consumption', {
      inputMode: consumptionInput.value.mode
    });
    return;
  }

  const requestBody = {
    property: {
      address: confirmedProperty.address,
      latitude: confirmedProperty.coordinates.lat,
      longitude: confirmedProperty.coordinates.lng,
      confirmed: true,
      source: confirmedProperty.source.kind,
      provider: confirmedProperty.source.provider,
      verifiedAt: confirmedProperty.source.verifiedAt
    },
    consumption: consumptionInput.value,
    ...(consumptionInput.tariff ? { tariff: consumptionInput.tariff } : {}),
    roof: {
      areaMethod: geometry.areaMethod,
      mountingMode: geometry.mountingMode,
      ...(geometry.areaMethod === 'map-projected'
        ? { projectedAreaSqm: geometry.projectedAreaSqm }
        : { planeAreaSqm: geometry.planeAreaSqm }),
      polygonComplete: geometry.polygonComplete,
      tiltDegrees,
      azimuthDegrees
    },
    system: {
      capacityKwp: DEFAULT_PVGIS_REQUEST_KWP,
      lossPercent: DEFAULT_PVGIS_LOSS_PERCENT
    }
  };
  const fingerprint = requestFingerprint(requestBody);
  const cooldownSeconds = cooldownRemainingSeconds(
    lastAnalysisRequest,
    fingerprint,
    ANALYSIS_COOLDOWN_MS
  );
  if (cooldownSeconds > 0) {
    writeStatus(replaceToken(product.status?.analysisCooldown, 'seconds', cooldownSeconds), true);
    return;
  }

  stopActiveRequest();
  const controller = new AbortController();
  activeRequest = controller;
  lastAnalysisRequest = { fingerprint, startedAt: Date.now() };
  setRequestBusy(roofFinish, true);
  updateCalculatorFlow('result');
  writeStatus(product.result?.preparing ?? status.analyzing);

  try {
    const response = await apiClient.analyze(requestBody, { signal: controller.signal });
    if (controller.signal.aborted || activeRequest !== controller) return;
    const analysis = response.analysis;
    const monthlyGeneration = analysis?.selectedScenario?.generation?.monthlyKwh;
    if (
      analysis?.mode !== 'real-analysis' ||
      analysis?.scope !== 'manual-roof-plane' ||
      analysis?.dataCompleteness?.level !== 'preliminary' ||
      !Array.isArray(monthlyGeneration) ||
      monthlyGeneration.length !== 12 ||
      monthlyGeneration.some((value) => !Number.isFinite(Number(value)))
    ) {
      throw new ProductApiError('MALFORMED_RESPONSE', { retryable: true });
    }
    const passport = passportRepository.create(analysis, { locale });
    publishAnalysis(analysis, passport);
    const financialUnavailable = analysis.selectedScenario?.financial?.annualSavingsAmd === null;
    const priceUnavailable = ['PRICEBOOK_UNAVAILABLE', 'PRICEBOOK_EXPIRED'].includes(
      analysis.commercialEstimate?.reason
    );
    writeStatus(
      priceUnavailable
        ? `${product.result?.ready ?? ''} ${product.result?.priceUnavailable ?? ''}`.trim()
        : financialUnavailable
          ? `${product.result?.ready ?? ''} ${product.result?.noTariff ?? ''}`.trim()
          : (product.result?.ready ?? '')
    );
    trackProductEvent('analysis_ready', { status: analysis.status, source: 'provider' });
  } catch (error) {
    if (error instanceof ProductApiError && error.code === 'ABORTED') return;
    updateCalculatorFlow('roof', 'attention');
    writeStatus(
      errorCopy(error, product.status?.analysisUnavailable ?? product.result?.unavailable),
      true
    );
    trackProductEvent('analysis_unavailable', { code: error?.code ?? 'UNAVAILABLE' });
  } finally {
    if (activeRequest === controller) {
      activeRequest = null;
      setRequestBusy(roofFinish, false);
    }
  }
};

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  void startManualLocation();
});
document.querySelector('[data-location-manual]')?.addEventListener('click', () => {
  void selectManualLocation();
});
document.querySelector('[data-location-manual-start]')?.addEventListener('click', () => {
  void selectManualLocation();
});
document.querySelector('[data-location-coordinates-submit]')?.addEventListener('click', () => {
  void selectCoordinateLocation();
});
document.querySelector('[data-location-center]')?.addEventListener('click', () => {
  if (!mapController?.setLocationAtCenter()) {
    writeStatus(product.location?.manualUnavailable ?? product.roof?.fallback, true);
    return;
  }
  requestAnimationFrame(() => locationConfirm?.focus({ preventScroll: true }));
});
document.querySelector('[data-location-confirm]')?.addEventListener('click', () => {
  void confirmLocation();
});
document.querySelector('[data-roof-start]')?.addEventListener('click', () => {
  mapController?.setMode('roof');
  writeStatus(product.roof?.addPoint);
});
document.querySelector('[data-roof-add-center]')?.addEventListener('click', () => {
  mapController?.setMode('roof');
  if (!mapController?.addPointAtCenter()) {
    writeStatus(product.roof?.fallback ?? product.roof?.unavailable, true);
    return;
  }
  writeStatus(product.roof?.addPoint);
});
document.querySelector('[data-roof-undo]')?.addEventListener('click', () => mapController?.undo());
document
  .querySelector('[data-roof-reset]')
  ?.addEventListener('click', () => mapController?.resetRoof());
roofFinish?.addEventListener('click', () => void analyzeRoof());
roofPointSelect?.addEventListener('change', () =>
  mapController?.selectPoint(Number(roofPointSelect.value))
);
document.querySelectorAll('[data-roof-nudge]').forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.roofNudge;
    const delta = 0.5;
    mapController?.nudgeSelected({
      north: direction === 'north' ? delta : direction === 'south' ? -delta : 0,
      east: direction === 'east' ? delta : direction === 'west' ? -delta : 0
    });
  });
});
document
  .querySelector('[data-roof-remove]')
  ?.addEventListener('click', () => mapController?.removeSelected());
const invalidateForRoofInput = () => {
  const hadResult = hasRenderedAnalysis();
  updateRoofAnglePreview();
  if (hadResult) invalidateDetailedAnalysis({ notify: true });
};

roofOrientation?.addEventListener('change', () => {
  updateCustomOrientationControl({ focus: true });
  invalidateForRoofInput();
});
roofOrientationCustomInput?.addEventListener('input', () => {
  roofOrientationCustomInput.removeAttribute('aria-invalid');
  invalidateForRoofInput();
});
roofTilt?.addEventListener('input', () => {
  roofTilt.removeAttribute('aria-invalid');
  invalidateForRoofInput();
});
roofMountingMode?.addEventListener('change', invalidateForRoofInput);
roofAreaMethods.forEach((input) => input.addEventListener('change', invalidateForRoofInput));
roofPlaneArea?.addEventListener('input', () => {
  roofPlaneArea.removeAttribute('aria-invalid');
  invalidateForRoofInput();
});
sitePotentialRetry?.addEventListener('click', () => void loadSitePotential());
document.querySelector('[data-site-potential-continue]')?.addEventListener('click', () => {
  void beginRoofFlow().then(() => {
    roofStage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelector('[data-roof-start]')?.focus({ preventScroll: true });
  });
});
updateCustomOrientationControl();
updateCalculatorFlow('location');

initLeadForm({
  form: document.querySelector('[data-lead-form]'),
  apiClient,
  strings: product.lead ?? {},
  getPassport: () => currentPassport,
  writeStatus: (message, isError) => {
    if (!leadStatus) return;
    leadStatus.textContent = message ?? '';
    leadStatus.classList.toggle('is-error', Boolean(isError));
  }
});
