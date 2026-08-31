import {
  createUserTariffSelection,
  normalizeConsumption,
  SolarPassportRepository
} from './domain/index.js';
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

const DEFAULT_PVGIS_REQUEST_KWP = 1;
const DEFAULT_PVGIS_LOSS_PERCENT = 14;
const CALCULATOR_DRAFT_KEY = 'yourenergy-calculator-draft';

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
const apiClient = new ProductApiClient();
const passportRepository = new SolarPassportRepository();

const form = document.querySelector('[data-address-form]');
const addressInput = form?.querySelector('input[name="address"]');
const statusElement = document.querySelector('[data-analysis-status]');
const resultPanel = document.querySelector('[data-result-panel]');
const resultSummary = document.querySelector('[data-analysis-summary]');
const locationStage = document.querySelector('[data-location-stage]');
const locationMessage = document.querySelector('[data-location-message]');
const locationAddress = document.querySelector('[data-location-address]');
const locationCoordinates = document.querySelector('[data-location-coordinates]');
const locationCandidates = document.querySelector('[data-location-candidates]');
const locationConfirm = document.querySelector('[data-location-confirm]');
const roofStage = document.querySelector('[data-roof-stage]');
const roofMessage = document.querySelector('[data-roof-message]');
const roofPoints = document.querySelector('[data-roof-points]');
const roofArea = document.querySelector('[data-roof-area]');
const roofOrientation = document.querySelector('[data-roof-orientation]');
const roofTilt = document.querySelector('[data-roof-tilt]');
const roofPointSelect = document.querySelector('[data-roof-point-select]');
const roofNudgeControls = document.querySelector('[data-roof-nudge-controls]');
const roofFinish = document.querySelector('[data-roof-finish]');
const mapShell = document.querySelector('[data-map-shell]');
const propertyMapContainer = document.querySelector('[data-property-map]');
const propertyMapNote = document.querySelector('[data-property-map-note]');
const ledgerRoot = document.querySelector('[data-analysis-ledger]');
const passportPersistence = document.querySelector('[data-passport-persistence]');
const leadSection = document.querySelector('[data-lead-section]');
const leadStatus = document.querySelector('[data-lead-status]');
const passportDialogEyebrow = document.querySelector('[data-passport-dialog-eyebrow]');

let activeRequest = null;
let mapController = null;
let pendingLocation = null;
let confirmedProperty = null;
let currentRoof = null;
let currentPassport = null;

initNavigation();
initPassportDialog();
initFileUpload({ status });
initScrollers();

const analysisView = createAnalysisView({
  locale,
  strings: product.result ?? {},
  solutionStrings: product.solutions ?? {}
});
const chart = initGenerationChart({ locale, status });
const consumptionControl = initConsumptionInput({
  root: form?.querySelector('[data-consumption-inputs]'),
  strings: product.consumption ?? {}
});

const tariffSelectionFor = (consumptionInput) =>
  consumptionInput?.tariff ? createUserTariffSelection(consumptionInput.tariff) : null;

const normalizedConsumptionFor = (consumptionInput) =>
  normalizeConsumption(consumptionInput?.value, {
    tariff: tariffSelectionFor(consumptionInput)
  });

/**
 * A calculator route can hand a locally-entered draft to the full property
 * workflow. The draft stays in this browser session and is deleted as soon as
 * the homepage consumes it; it is never sent until the visitor submits the
 * analysis request themselves.
 */
const applyCalculatorDraft = () => {
  if (!form || !consumptionControl) return;
  let draft;
  try {
    draft = JSON.parse(window.sessionStorage.getItem(CALCULATOR_DRAFT_KEY) ?? 'null');
    window.sessionStorage.removeItem(CALCULATOR_DRAFT_KEY);
  } catch {
    return;
  }
  if (!draft || typeof draft !== 'object') return;

  if (typeof draft.address === 'string' && addressInput)
    addressInput.value = draft.address.slice(0, 220);
  const consumption = draft.consumption ?? {};
  const tariffInput = form.querySelector('[data-consumption-tariff]');
  if (
    Number.isFinite(Number(draft.tariff?.rateAmdPerKwh)) &&
    Number(draft.tariff.rateAmdPerKwh) > 0
  ) {
    if (tariffInput) tariffInput.value = String(draft.tariff.rateAmdPerKwh);
  }
  const activate = (mode) => {
    const radio = form.querySelector(`input[name="consumption-mode"][value="${mode}"]`);
    if (!radio) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  };
  let draftedInput = null;
  if (
    Number.isFinite(Number(consumption.averageMonthlyKwh)) &&
    Number(consumption.averageMonthlyKwh) > 0
  ) {
    activate('usage');
    draftedInput = form.querySelector('[data-consumption-usage]');
    if (draftedInput) draftedInput.value = String(consumption.averageMonthlyKwh);
  } else if (
    Number.isFinite(Number(consumption.averageMonthlyBillAmd)) &&
    Number(consumption.averageMonthlyBillAmd) > 0
  ) {
    activate('bill');
    draftedInput = form.querySelector('[data-consumption-bill]');
    if (draftedInput) draftedInput.value = String(consumption.averageMonthlyBillAmd);
  }
  tariffInput?.dispatchEvent(new Event('input', { bubbles: true }));
  draftedInput?.dispatchEvent(new Event('input', { bubbles: true }));
};

applyCalculatorDraft();

const writeStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message ?? '';
  statusElement.classList.toggle('is-error', Boolean(isError));
};

const formatCoordinate = (value) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 5 }).format(Number(value));

const formatArea = (value) => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} m²`;
};

const replaceToken = (value, token, replacement) =>
  String(value ?? '').replace(`{${token}}`, String(replacement));

const locationSource = (kind, details = {}) => ({
  kind,
  status: 'provided',
  provider: details.provider ?? null,
  reference: details.reference ?? null,
  verifiedAt: details.verifiedAt ?? null
});

const clearCalculatedState = () => {
  currentPassport = null;
  analysisView.reset();
  if (ledgerRoot) ledgerRoot.hidden = true;
  if (passportPersistence) passportPersistence.hidden = true;
  if (leadSection) leadSection.hidden = true;
  if (leadStatus) leadStatus.textContent = '';
};

const hidePropertyMap = () => {
  mapShell?.classList.remove('has-property-map');
  if (propertyMapContainer) propertyMapContainer.hidden = true;
  if (propertyMapNote) propertyMapNote.hidden = true;
};

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

const errorCopy = (error, fallback) => {
  if (error instanceof ProductApiError && error.code === 'ABORTED') {
    return product.status?.canceled ?? fallback;
  }
  return fallback;
};

const updateLocationStage = ({ message } = {}) => {
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
};

const onMapLocationChange = (coordinates) => {
  pendingLocation = {
    address: addressInput?.value.trim() || null,
    coordinates,
    source: locationSource('manual')
  };
  clearCalculatedState();
  updateLocationStage({ message: product.location?.pointSelected ?? product.location?.manualCopy });
  trackProductEvent('property_point_selected', { source: 'manual' });
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
  if (roofFinish) roofFinish.disabled = !roof.complete;
};

const ensurePropertyMap = async (mode = 'location') => {
  if (!propertyMapContainer) return null;
  propertyMapContainer.hidden = false;
  if (propertyMapNote) {
    propertyMapNote.hidden = false;
    propertyMapNote.textContent = mapConfig.tileUrl
      ? (product.location?.manualCopy ?? '')
      : (product.roof?.tilesUnavailable ?? '');
  }
  mapShell?.classList.add('has-property-map');

  if (!mapController) {
    try {
      mapController = await createPropertyMap({
        container: propertyMapContainer,
        tileUrl: mapConfig.tileUrl,
        tileAttribution: mapConfig.tileAttribution,
        roofPointLabel: (index) => replaceToken(product.roof?.pointSelectLabel, 'index', index + 1),
        onLocationChange: onMapLocationChange,
        onRoofChange: updateRoofControls
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
  requestAnimationFrame(() => mapController?.resize());
  return mapController;
};

const renderCandidates = (candidates, source) => {
  if (!locationCandidates) return;
  locationCandidates.replaceChildren();
  candidates.forEach((candidate) => {
    const button = document.createElement('button');
    button.className = 'location-candidate';
    button.type = 'button';
    button.textContent = candidate.label;
    button.addEventListener('click', async () => {
      pendingLocation = {
        address: candidate.label,
        coordinates: {
          lat: candidate.coordinates.latitude,
          lng: candidate.coordinates.longitude
        },
        source: locationSource('provider', {
          provider: source?.provider,
          verifiedAt: source?.fetchedAt
        })
      };
      clearCalculatedState();
      updateLocationStage();
      const propertyMap = await ensurePropertyMap('location');
      propertyMap?.setLocation(pendingLocation.coordinates, { notify: false });
    });
    locationCandidates.append(button);
  });
  locationCandidates.hidden = candidates.length === 0;
};

const selectManualLocation = async () => {
  stopActiveRequest();
  pendingLocation = null;
  clearCalculatedState();
  renderCandidates([], null);
  updateLocationStage({ message: product.location?.manualCopy });
  const propertyMap = await ensurePropertyMap('location');
  propertyMap?.setMode('location');
  writeStatus(product.location?.manualCopy);
};

const confirmLocation = async () => {
  if (!pendingLocation?.coordinates) return;
  confirmedProperty = {
    ...pendingLocation,
    confirmed: true,
    source: { ...pendingLocation.source, status: 'confirmed' }
  };
  if (locationStage) locationStage.hidden = true;
  if (roofStage) roofStage.hidden = false;
  if (roofMessage) roofMessage.textContent = product.roof?.copy ?? '';
  const propertyMap = await ensurePropertyMap('roof');
  propertyMap?.setLocation(confirmedProperty.coordinates, { notify: false });
  propertyMap?.setMode('roof');
  propertyMap?.resetRoof();
  writeStatus(product.roof?.copy);
  trackProductEvent('property_confirmed', { source: confirmedProperty.source.kind });
};

const validateAddress = (value) => typeof value === 'string' && value.trim().length >= 5;

const startGeocoding = async () => {
  const address = addressInput?.value.trim() ?? '';
  const consumption = consumptionControl?.read();
  if (!validateAddress(address)) {
    addressInput?.setAttribute('aria-invalid', 'true');
    addressInput?.focus();
    writeStatus(status.minAddress ?? product.consumption?.noConsumption, true);
    return;
  }
  if (!consumption?.valid) {
    writeStatus(consumption?.message ?? product.consumption?.noConsumption, true);
    return;
  }
  if (!normalizedConsumptionFor(consumption).available) {
    writeStatus(product.consumption?.noConsumption ?? product.result?.noSavings, true);
    return;
  }

  addressInput?.removeAttribute('aria-invalid');
  stopActiveRequest();
  clearCalculatedState();
  hidePropertyMap();
  pendingLocation = null;
  confirmedProperty = null;
  currentRoof = null;
  renderCandidates([], null);
  const controller = new AbortController();
  activeRequest = controller;
  const submit = form?.querySelector('button[type="submit"]');
  setRequestBusy(submit, true);
  writeStatus(product.location?.searching ?? status.analyzing);

  try {
    const response = await apiClient.geocode(
      { query: address, locale },
      { signal: controller.signal }
    );
    if (controller.signal.aborted || activeRequest !== controller) return;
    const location = response.location;
    const candidates = Array.isArray(location?.candidates) ? location.candidates : [];
    if (!candidates.length) {
      updateLocationStage({ message: product.location?.noResult });
      writeStatus(product.location?.noResult, true);
      return;
    }
    renderCandidates(candidates, location.source);
    if (candidates.length === 1) {
      locationCandidates?.querySelector('button')?.click();
    } else {
      updateLocationStage({ message: product.location?.copy });
    }
    trackProductEvent('geocode_candidates_received', { count: candidates.length });
  } catch (error) {
    if (error instanceof ProductApiError && error.code === 'ABORTED') return;
    updateLocationStage({
      message: errorCopy(error, product.location?.unavailable ?? product.status?.geocodeUnavailable)
    });
    writeStatus(errorCopy(error, product.status?.geocodeUnavailable), true);
    trackProductEvent('geocode_unavailable', { code: error?.code ?? 'UNAVAILABLE' });
  } finally {
    if (activeRequest === controller) {
      activeRequest = null;
      setRequestBusy(submit, false);
    }
  }
};

const numericRoofInput = (input, { minimum, maximum }) => {
  const value = Number(input?.value);
  return Number.isFinite(value) && value >= minimum && value <= maximum ? value : null;
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
  resultPanel?.classList.remove('is-updated');
  requestAnimationFrame(() => resultPanel?.classList.add('is-updated'));
  window.dispatchEvent(
    new CustomEvent('solar:analysis-updated', {
      detail: {
        analysis,
        passport,
        source: 'provider',
        commercialEstimate: analysis.commercialEstimate ?? null,
        priceBook: analysis.priceBook ?? null,
        tariffSource: analysis.financial?.tariff ?? null,
        confidence: analysis.confidence ?? null,
        scope: analysis.commercialEstimate?.scope ?? [],
        exclusions: analysis.commercialEstimate?.exclusions ?? [],
        validUntil: analysis.commercialEstimate?.validUntil ?? null
      }
    })
  );
};

const analyzeRoof = async () => {
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
  const roof = mapController?.getRoof() ?? currentRoof;
  if (!confirmedProperty?.coordinates || !roof?.complete) {
    writeStatus(product.roof?.minimumPoints ?? product.roof?.unavailable, true);
    return;
  }
  const tiltDegrees = numericRoofInput(roofTilt, { minimum: 0, maximum: 90 });
  const azimuthDegrees = numericRoofInput(roofOrientation, { minimum: 0, maximum: 359.999 });
  if (tiltDegrees === null || azimuthDegrees === null) {
    writeStatus(`${product.roof?.orientationLabel}: ${product.common?.required}`, true);
    return;
  }

  stopActiveRequest();
  const controller = new AbortController();
  activeRequest = controller;
  setRequestBusy(roofFinish, true);
  writeStatus(product.result?.preparing ?? status.analyzing);

  try {
    const response = await apiClient.analyze(
      {
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
          areaSqm: roof.areaSqm,
          polygonComplete: true,
          tiltDegrees,
          azimuthDegrees
        },
        system: {
          capacityKwp: DEFAULT_PVGIS_REQUEST_KWP,
          lossPercent: DEFAULT_PVGIS_LOSS_PERCENT
        }
      },
      { signal: controller.signal }
    );
    if (controller.signal.aborted || activeRequest !== controller) return;
    const analysis = response.analysis;
    const monthlyGeneration = analysis?.selectedScenario?.generation?.monthlyKwh;
    if (
      analysis?.mode !== 'real-analysis' ||
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
  void startGeocoding();
});
document.querySelector('[data-location-manual]')?.addEventListener('click', () => {
  void selectManualLocation();
});
document.querySelector('[data-location-manual-start]')?.addEventListener('click', () => {
  void selectManualLocation();
});
document.querySelector('[data-location-confirm]')?.addEventListener('click', () => {
  void confirmLocation();
});
document.querySelector('[data-roof-start]')?.addEventListener('click', () => {
  mapController?.setMode('roof');
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
