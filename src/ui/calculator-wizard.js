import { calculateRoofPlaneArea, SolarPassportRepository } from '../domain/index.js';
import { toFiniteNumberOrNull } from '../domain/numbers.js';
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
import { createCalculatorSession } from './calculator-session.js';

const PVGIS_KWP = 1;
const PVGIS_LOSS = 14;
const POTENTIAL_COOLDOWN_MS = 10_000;
const ANALYSIS_COOLDOWN_MS = 15_000;

const number = (value, minimum = -Infinity, maximum = Infinity) => {
  const parsed = toFiniteNumberOrNull(value);
  return parsed !== null && parsed >= minimum && parsed <= maximum ? parsed : null;
};

const format = (value, locale, options = {}) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...options }).format(Number(value))
    : '—';

const text = (template, values) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template ?? ''
  );

const element = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = value;
  return node;
};

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
  root.querySelector('[data-roof-mounting-mode]:checked')?.value ?? 'roof-parallel';

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
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const passportRepository = new SolarPassportRepository();
  const steps = [...root.querySelectorAll('[data-wizard-step]')];
  const progress = [...root.querySelectorAll('[data-wizard-nav]')];
  const mobileProgress = root.querySelector('[data-wizard-mobile-progress]');
  const status = root.querySelector('[data-wizard-status]');
  const address = root.querySelector('[data-wizard-address]');
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
  const roofPoints = root.querySelector('[data-roof-points]');
  const roofPlaneWrap = root.querySelector('[data-roof-plane-area-wrap]');
  const roofPlaneArea = root.querySelector('[data-roof-plane-area]');
  const roofOrientation = root.querySelector('[data-roof-orientation]');
  const roofOrientationCustom = root.querySelector('[data-roof-orientation-custom]');
  const roofOrientationCustomInput = root.querySelector('[data-roof-orientation-custom-input]');
  const roofTilt = root.querySelector('[data-roof-tilt]');
  const resultDashboard = root.querySelector('[data-result-dashboard]');
  const resultSummary = root.querySelector('[data-result-summary]');
  const financeEmpty = root.querySelector('[data-finance-empty]');
  const financeResult = root.querySelector('[data-finance-result]');
  const financeValues = root.querySelector('[data-finance-values]');
  const passportDialog = document.querySelector('[data-passport-dialog]');
  const passportContent = document.querySelector('[data-passport-dialog-content]');

  const session = createCalculatorSession();
  const savedSession = session.read();
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
    analysis: savedSession.analysis ?? null,
    solarPassport: savedSession.solarPassport ?? null,
    analysisStatus: savedSession.analysis
      ? WIZARD_STEP_STATUSES.COMPLETE
      : WIZARD_STEP_STATUSES.LOCKED
  });
  let mapController = null;
  let potentialRequest = null;
  let analysisRequest = null;
  let lastPotential = null;
  let lastAnalysis = null;
  let passportOpener = null;

  const persistSession = () =>
    session.write({
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
      analysis: state.analysis,
      analysisStatus: state.analysisStatus,
      solarPassport: state.solarPassport
    });

  const writeStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message ?? '';
    status.classList.toggle('is-error', Boolean(error));
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

  const setStep = (nextStep, { focus = true } = {}) => {
    const target = Math.max(0, Math.min(Number(nextStep), steps.length - 1));
    if (!isStepAccessible(target)) return false;
    state.currentStep = target;
    steps.forEach((step, index) => {
      step.hidden = index !== target;
    });
    updateProgress();
    if (target === 2) {
      // The map is moved from the Object step into this ordinary in-flow
      // container. Focus the active map only after the move and position it
      // in the viewport; otherwise a long wizard page can appear to jump to
      // the top while leaving the roof map outside the visible area.
      void mountMap('roof').then((controller) => {
        if (!controller || state.currentStep !== 2) return;
        requestAnimationFrame(() => {
          roofMapHost?.scrollIntoView({ block: 'start', behavior: 'auto' });
          controller.resize();
          mapElement?.focus({ preventScroll: true });
        });
      });
    }
    if (focus && target !== 2) {
      requestAnimationFrame(() => steps[target]?.focus({ preventScroll: false }));
    }
    return true;
  };

  const stopPotential = () => {
    potentialRequest?.abort();
    potentialRequest = null;
  };
  const stopAnalysis = () => {
    analysisRequest?.abort();
    analysisRequest = null;
  };
  const clearAnalysis = () => {
    stopAnalysis();
    state.analysis = null;
    state.analysisStatus = WIZARD_STEP_STATUSES.LOCKED;
    state.solarPassport = null;
    resultDashboard?.replaceChildren();
    if (resultSummary) resultSummary.textContent = '';
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
    const lat = number(coordinates?.lat, -90, 90);
    const lng = number(coordinates?.lng, -180, 180);
    if (lat === null || lng === null) return false;
    state.pendingLocation = { lat, lng };
    state.confirmedProperty = null;
    clearPotentialAndBelow();
    if (pendingCoordinates)
      pendingCoordinates.textContent = `${format(lat, locale, { maximumFractionDigits: 5 })}, ${format(lng, locale, { maximumFractionDigits: 5 })}`;
    if (pointConfirmation) pointConfirmation.hidden = false;
    updateProgress();
    return true;
  };

  const onRoofChange = (roof) => {
    state.roof = roof;
    if (roofPoints)
      roofPoints.textContent = text(product.roof?.pointsLabel, { count: roof.points.length });
    updateRoofAreaSummary();
    clearAnalysis();
    updateProgress();
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
  };

  const mountMap = async (mode) => {
    const host = mode === 'roof' ? roofMapHost : locationMapWrap;
    if (!mapElement || !host) return null;
    if (mode === 'location' && locationMapWrap) locationMapWrap.hidden = false;
    try {
      if (!mapController) {
        mapController = await createPropertyMap({
          container: mapElement,
          tileUrl: config.map?.tileUrl,
          tileAttribution: config.map?.tileAttribution,
          locationPointLabel: product.location?.resultLabel,
          roofPointLabel: (index) => text(product.roof?.pointSelectLabel, { index: index + 1 }),
          onLocationChange: setPendingLocation,
          onRoofChange
        });
      }
      mapController?.mount(host);
      mapController?.setMode(mode);
      if (state.confirmedProperty)
        mapController?.setLocation(state.confirmedProperty, { notify: false });
      if (mode === 'roof' && state.roof?.points?.length) {
        mapController?.setRoofPoints(state.roof.points, { complete: state.roof.complete });
      }
      mapController?.resize();
      return mapController;
    } catch {
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
    if (!state.confirmedProperty || potentialRequest) return;
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
    const controller = new AbortController();
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
      if (controller.signal.aborted || potentialRequest !== controller) return;
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
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      setPotentialOutcome({ status: WIZARD_STEP_STATUSES.UNAVAILABLE });
      if (potentialLoading) potentialLoading.textContent = describeError(error, product);
      if (potentialRetry) potentialRetry.hidden = false;
      if (potentialSkip) potentialSkip.hidden = false;
      updateProgress();
    } finally {
      if (potentialRequest === controller) potentialRequest = null;
    }
  };

  const confirmLocation = async () => {
    if (!state.pendingLocation) return;
    state.addressNote = address?.value.trim() ?? '';
    state.confirmedProperty = { ...state.pendingLocation };
    setPotentialOutcome({ status: WIZARD_STEP_STATUSES.AVAILABLE });
    pointConfirmation.hidden = true;
    await mountMap('location');
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
    const projectedAreaSqm = number(state.roof?.areaSqm, 0.01);
    const planeAreaSqm = number(roofPlaneArea?.value, 0.01);
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
  const hasRoof = () => {
    const roof = roofGeometry();
    return (
      roof.tiltDegrees !== null &&
      roof.azimuthDegrees !== null &&
      roof.effectiveAreaSqm !== null &&
      (roof.areaMethod === 'measured-plane' || roof.polygonComplete)
    );
  };

  const syncRoofControls = () => {
    const measured = activeAreaMethod(root) === 'measured-plane';
    if (roofPlaneWrap) roofPlaneWrap.hidden = !measured;
    if (roofPlaneArea) roofPlaneArea.disabled = !measured;
    if (roofOrientationCustom) roofOrientationCustom.hidden = roofOrientation?.value !== 'custom';
    updateRoofAreaSummary();
    clearAnalysis();
    updateProgress();
  };

  const dashboardMetric = (label, value) => {
    const wrapper = element('div', 'result-metric');
    wrapper.append(element('dt', '', label), element('dd', '', value));
    return wrapper;
  };

  const renderResult = (analysis) => {
    const scenario = analysis.selectedScenario;
    if (!scenario || !resultDashboard) return;
    const monthly = scenario.generation?.monthlyKwh ?? [];
    const estimate = scenario.commercialEstimate ?? analysis.commercialEstimate;
    resultDashboard.replaceChildren();
    const metrics = element('dl', 'wizard-kpis result-kpis');
    metrics.append(
      dashboardMetric(
        'kWp',
        `${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
      ),
      dashboardMetric(
        wizard.metrics?.panels ?? 'Panels',
        `${format(scenario.system?.panelCount, locale)} × ${format(scenario.system?.panelWatts, locale)} W`
      ),
      dashboardMetric(
        wizard.metrics?.annualGeneration ?? 'kWh/year',
        `${format(scenario.generation?.annualKwh, locale)} kWh`
      ),
      dashboardMetric(
        wizard.metrics?.coverage ?? 'Coverage',
        `${format(scenario.coveragePercent, locale, { maximumFractionDigits: 0 })}%`
      ),
      dashboardMetric(
        product.roof?.planeAreaSummary ?? 'Roof area',
        `${format(analysis.roof?.areaSqm, locale, { maximumFractionDigits: 1 })} m²`
      )
    );
    resultDashboard.append(metrics);
    if (scenario.limitations?.includes('ROOF_CAPACITY_LIMIT')) {
      const limit = element('p', 'result-notice result-notice--warning', wizard.roofLimit);
      limit.append(
        ` ${format(scenario.system?.requestedCapacityKwp, locale, { maximumFractionDigits: 2 })} kWp → ${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp; ${format(scenario.system?.maximumPanelCount, locale)} panels.`
      );
      resultDashboard.append(limit);
    }
    if (estimate?.available) {
      const budget = element('section', 'result-budget');
      budget.append(element('h3', '', wizard.budget));
      budget.append(
        element(
          'p',
          '',
          `P25 ${format(estimate.rangeAmd?.p25, locale)} ֏ · P50 ${format(estimate.primaryAmd, locale)} ֏ · P75 ${format(estimate.rangeAmd?.p75, locale)} ֏`
        )
      );
      budget.append(
        element(
          'small',
          '',
          `${estimate.priceBook?.version ?? ''} · ${estimate.validUntil ?? ''} · ${product.result?.commercialEstimate ?? ''}`
        )
      );
      resultDashboard.append(budget);
    }
    const chart = element('figure', 'wizard-chart');
    chart.append(element('figcaption', '', wizard.production));
    const bars = element('div', 'chart-bars');
    renderBars(bars, monthly, product.passport?.months ?? [], 'kWh');
    chart.append(bars);
    resultDashboard.append(chart);
    if (resultSummary) resultSummary.textContent = product.result?.ready ?? '';
    const hasTariff = Number.isFinite(Number(analysis.financial?.tariff?.rateAmdPerKwh));
    if (financeEmpty) financeEmpty.hidden = hasTariff;
    if (financeResult) financeResult.hidden = !hasTariff;
    if (hasTariff && financeValues) {
      financeValues.replaceChildren(
        dashboardMetric(
          wizard.metrics?.annualSavings ?? 'Annual savings',
          `${format(scenario.financial?.annualSavingsAmd, locale)} ֏`
        ),
        dashboardMetric(
          wizard.metrics?.payback ?? 'Payback',
          `≈ ${format(scenario.financial?.paybackYears, locale, { maximumFractionDigits: 1 })}`
        )
      );
    }
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
      system: { capacityKwp: PVGIS_KWP, lossPercent: PVGIS_LOSS }
    };
  };

  const runAnalysis = async () => {
    const consumption = consumptionInput?.read();
    if (!consumption?.valid) {
      writeStatus(consumption?.message ?? product.consumption?.noConsumption, true);
      return;
    }
    if (!hasRoof()) {
      writeStatus(product.roof?.parametersRequired, true);
      setStep(2);
      return;
    }
    state.consumption = consumption.value;
    state.userTariff = consumption.tariff;
    const fingerprint = JSON.stringify(buildPayload());
    const remaining =
      lastAnalysis?.fingerprint === fingerprint
        ? ANALYSIS_COOLDOWN_MS - (Date.now() - lastAnalysis.startedAt)
        : 0;
    if (remaining > 0) {
      writeStatus(text(product.status?.analysisCooldown, { seconds: Math.ceil(remaining / 1000) }));
      return;
    }
    stopAnalysis();
    const controller = new AbortController();
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
      const response = await api.analyze(buildPayload(), { signal: controller.signal });
      if (controller.signal.aborted || analysisRequest !== controller) return;
      state.analysis = response?.analysis ?? null;
      if (!state.analysis) throw new ProductApiError('MALFORMED_RESPONSE');
      state.analysisStatus = WIZARD_STEP_STATUSES.COMPLETE;
      state.solarPassport = passportRepository.create(state.analysis, { locale });
      renderResult(state.analysis);
      writeStatus('');
      setStep(3);
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      state.analysisStatus = WIZARD_STEP_STATUSES.UNAVAILABLE;
      writeStatus(describeError(error, product), true);
      updateProgress();
    } finally {
      if (analysisRequest === controller) analysisRequest = null;
      button?.removeAttribute('aria-busy');
      button?.removeAttribute('disabled');
    }
  };

  const renderPassport = () => {
    if (!passportContent || !state.solarPassport) return;
    const analysis = state.solarPassport.analysis;
    passportContent.replaceChildren();
    const list = element('dl', 'passport-ledger');
    const add = (label, value) => list.append(dashboardMetric(label, value));
    add(
      wizard.steps?.[0] ?? 'Property',
      `${format(analysis.property?.coordinates?.lat, locale, { maximumFractionDigits: 5 })}, ${format(analysis.property?.coordinates?.lng, locale, { maximumFractionDigits: 5 })}`
    );
    add(
      wizard.steps?.[2] ?? 'Roof',
      `${format(analysis.roof?.areaSqm, locale, { maximumFractionDigits: 1 })} m² · ${format(analysis.roof?.orientationDegrees, locale)}° · ${format(analysis.roof?.tiltDegrees, locale)}°`
    );
    add(
      wizard.metrics?.pvgis ?? 'PVGIS',
      `${format(analysis.production?.annualYieldKwhPerKwp, locale)} kWh/kWp · ${analysis.providerRetrievedAt ?? '—'} · 14%`
    );
    add(
      wizard.metrics?.system ?? 'System',
      `${format(analysis.selectedScenario?.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp · ${format(analysis.selectedScenario?.system?.panelCount, locale)} × ${format(analysis.selectedScenario?.system?.panelWatts, locale)} W`
    );
    const estimate = analysis.commercialEstimate;
    add(
      wizard.budget,
      estimate?.available
        ? `P25 ${format(estimate.rangeAmd?.p25, locale)} ֏ · P50 ${format(estimate.primaryAmd, locale)} ֏ · P75 ${format(estimate.rangeAmd?.p75, locale)} ֏`
        : '—'
    );
    add(
      wizard.metrics?.tariff ?? product.consumption?.tariffLabel ?? 'Tariff',
      analysis.financial?.tariff?.rateAmdPerKwh
        ? `${format(analysis.financial.tariff.rateAmdPerKwh, locale)} AMD/kWh`
        : (product.result?.noTariff ?? '—')
    );
    const environmental = analysis.environmental;
    if (Number.isFinite(Number(environmental?.avoidedCo2Tons))) {
      const factor = environmental.factor ?? {};
      const historicalFactor = `${wizard.environmental?.historical ?? 'Verified historical factor'}${
        factor.dataYear ? ` (${factor.dataYear})` : ''
      }`;
      add(
        wizard.environmental?.co2 ?? 'Avoided CO₂ emissions',
        `${format(environmental.avoidedCo2Tons, locale, { maximumFractionDigits: 3 })} t CO₂ · ${historicalFactor} · ${format(factor.valueKgCo2PerKwh, locale, { maximumFractionDigits: 3 })} kgCO₂/kWh`
      );
      if (Number.isFinite(Number(environmental?.treeEquivalent))) {
        add(
          wizard.environmental?.trees ?? 'Tree CO₂ absorption equivalent',
          `≈ ${format(environmental.treeEquivalent, locale, { maximumFractionDigits: 0 })}`
        );
      }
    }
    passportContent.append(list);
    const limitations = element('ul', 'check-list');
    [...(analysis.assumptions ?? []), ...(analysis.limitations ?? [])].forEach((note) =>
      limitations.append(element('li', '', product.ledger?.assumptions?.[note] ?? note))
    );
    passportContent.append(limitations);
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
    const mount = root.querySelector(
      `[data-roof-mounting-mode][value="${state.roof.mountingMode}"]`
    );
    if (mount) mount.checked = true;
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
    ?.addEventListener('click', () => void mountMap('location'));
  root
    .querySelector('[data-confirm-location]')
    ?.addEventListener('click', () => void confirmLocation());
  root.querySelector('[data-location-coordinates-submit]')?.addEventListener('click', () => {
    const lat = number(root.querySelector('[data-location-latitude]')?.value, -90, 90);
    const lng = number(root.querySelector('[data-location-longitude]')?.value, -180, 180);
    if (lat === null || lng === null) {
      writeStatus(product.location?.invalidCoordinates, true);
      return;
    }
    setPendingLocation({ lat, lng });
    void mountMap('location').then((map) => map?.setLocation({ lat, lng }, { notify: false }));
  });
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
  root
    .querySelector('[data-roof-add-center]')
    ?.addEventListener('click', () => mapController?.addPointAtCenter());
  root.querySelector('[data-roof-undo]')?.addEventListener('click', () => mapController?.undo());
  root
    .querySelector('[data-roof-reset]')
    ?.addEventListener('click', () => mapController?.resetRoof());
  root.querySelector('[data-roof-finish]')?.addEventListener('click', () => {
    if (!mapController?.finishRoof()) {
      writeStatus(product.roof?.minimumPoints, true);
      return;
    }
    writeStatus(product.roof?.finishHelp);
  });
  root
    .querySelectorAll(
      '[data-roof-area-method], [data-roof-mounting-mode], [data-roof-tilt], [data-roof-plane-area], [data-roof-orientation], [data-roof-orientation-custom-input]'
    )
    .forEach((input) => input.addEventListener('input', syncRoofControls));
  root
    .querySelectorAll('[data-roof-area-method], [data-roof-mounting-mode], [data-roof-orientation]')
    .forEach((input) => input.addEventListener('change', syncRoofControls));
  root.querySelector('[data-run-analysis]')?.addEventListener('click', () => void runAnalysis());
  root.querySelector('[data-add-tariff]')?.addEventListener('click', () => {
    setStep(1);
    requestAnimationFrame(() => root.querySelector('[data-consumption-tariff]')?.focus());
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

  syncRoofControls();
  updateProgress();
  return { state, getSelectedBillFile: () => fileUpload.getFile() };
};
