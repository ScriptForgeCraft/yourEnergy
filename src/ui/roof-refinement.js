import { SolarPassportRepository } from '../domain/index.js';
import { ProductApiClient, ProductApiError } from '../services/api-client.js';
import { createPropertyMap } from '../services/property-map.js';
import { formatConsumerCommercialRange } from './commercial-range.js';
import { createCalculatorSession } from './calculator-session.js';

const CONSUMER_DEFAULT_TILT_DEGREES = 30;
const CONSUMER_DEFAULT_AZIMUTH_DEGREES = 180;

const finite = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};
const format = (value, locale, options = {}) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat(locale, options).format(Number(value))
    : '—';
const metric = (label, value) => {
  const wrap = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent = value;
  wrap.append(term, description);
  return wrap;
};

/** Minimal property refinement. It shares the session and /api/analysis model
 * with the professional calculator, without turning the homeowner screen into
 * a CAD-like engineering workspace. */
export const initRoofRefinement = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-roof-refinement]');
  if (!root) return null;
  const copy = config.refine ?? {};
  const quick = config.quick ?? {};
  const product = config.product ?? {};
  const locale = config.locale ?? 'en-US';
  const session = createCalculatorSession();
  const api = new ProductApiClient({ endpoints: config.endpoints ?? {} });
  const passportRepository = new SolarPassportRepository();
  const saved = session.read();
  const mapWrap = root.querySelector('[data-refine-map-wrap]');
  const mapElement = root.querySelector('[data-refine-map]');
  const roofHost = root.querySelector('[data-refine-roof-map-host]');
  const objectStep = root.querySelector('[data-refine-object]');
  const roofStep = root.querySelector('[data-refine-roof]');
  const resultStep = root.querySelector('[data-refine-result]');
  const status = root.querySelector('[data-refine-status]');
  const confirmation = root.querySelector('[data-refine-point-confirmation]');
  const pendingOutput = root.querySelector('[data-refine-pending-coordinates]');
  const area = root.querySelector('[data-refine-area]');
  const measured = root.querySelector('[data-refine-measured-area]');
  const measuredWrap = root.querySelector('[data-refine-measured]');
  const outline = root.querySelector('[data-refine-outline]');
  const dashboard = root.querySelector('[data-refine-result-dashboard]');
  const comparison = root.querySelector('[data-refine-comparison]');
  let mapController = null;
  let pendingLocation = null;
  let roof = saved.roof ?? { points: [], areaSqm: 0, complete: false };
  let analysisRequest = null;
  let potentialRequest = null;

  const setStatus = (message, error = false) => {
    status.textContent = message ?? '';
    status.classList.toggle('is-error', error);
  };
  const point = () => saved.property?.coordinates ?? null;
  const activeAreaMode = () =>
    root.querySelector('input[name="refine-area-mode"]:checked')?.value ?? 'outline';
  const renderRoof = () => {
    area.textContent =
      roof.areaSqm > 0 ? `${format(roof.areaSqm, locale, { maximumFractionDigits: 1 })} m²` : '—';
  };
  const store = (changes) => session.write(changes);
  const onRoofChange = (nextRoof) => {
    roof = nextRoof;
    renderRoof();
    store({
      roof: { ...roof, areaMethod: 'map-projected' },
      analysis: null,
      analysisStatus: 'idle',
      solarPassport: null
    });
  };
  const mountMap = async (mode) => {
    if (!mapController) {
      mapController = await createPropertyMap({
        container: mapElement,
        tileUrl: config.map?.tileUrl,
        tileAttribution: config.map?.tileAttribution,
        onLocationChange(next) {
          pendingLocation = next;
          pendingOutput.textContent = `${format(next.lat, locale, { maximumFractionDigits: 5 })}, ${format(next.lng, locale, { maximumFractionDigits: 5 })}`;
          confirmation.hidden = false;
        },
        onRoofChange
      });
      if (!mapController) return null;
    }
    if (mode === 'roof') {
      mapController.mount(roofHost);
      mapController.setMode('roof');
      mapController.setLocation(point(), { notify: false });
      if (roof.points?.length)
        mapController.setRoofPoints(roof.points, { complete: roof.complete });
    } else {
      mapController.setMode('location');
      if (point()) mapController.setLocation(point(), { notify: false });
    }
    mapController.resize();
    return mapController;
  };
  const showRoof = async () => {
    if (!point()) return;
    roofStep.hidden = false;
    objectStep.hidden = true;
    const map = await mountMap('roof');
    requestAnimationFrame(() => {
      // Keep the actual editing surface in view after the same Leaflet node is
      // moved out of the point-picker. Focusing the section without this
      // scroll can leave the first rows of the map behind the sticky header.
      roofHost?.scrollIntoView({ block: 'start', behavior: 'auto' });
      map?.resize();
      roofStep.focus({ preventScroll: true });
    });
  };
  const requestPotential = async (coordinates) => {
    potentialRequest?.abort();
    const controller = new AbortController();
    potentialRequest = controller;
    try {
      const response = await api.potential(
        {
          property: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            confirmed: true
          }
        },
        { signal: controller.signal }
      );
      if (!controller.signal.aborted && potentialRequest === controller && response?.potential) {
        store({ sitePotential: response.potential });
      }
    } catch (error) {
      // This enrichment is deliberately silent in the homeowner flow. The
      // detailed result still has to obtain its own PVGIS analysis, and a
      // failed potential request must never erase the point or roof.
      if (!(error instanceof ProductApiError) || error.code !== 'ABORTED') return;
    } finally {
      if (potentialRequest === controller) potentialRequest = null;
    }
  };
  const confirm = async () => {
    if (!pendingLocation) return;
    saved.property = {
      coordinates: { lat: pendingLocation.lat, lng: pendingLocation.lng },
      confirmed: true,
      source: { kind: 'manual', status: 'confirmed' }
    };
    store({
      property: saved.property,
      roof: null,
      analysis: null,
      analysisStatus: 'idle',
      solarPassport: null
    });
    roof = { points: [], areaSqm: 0, complete: false };
    confirmation.hidden = true;
    void requestPotential(pendingLocation);
    await showRoof();
  };
  const useCoordinates = async () => {
    const lat = finite(root.querySelector('[data-refine-latitude]')?.value, -90, 90);
    const lng = finite(root.querySelector('[data-refine-longitude]')?.value, -180, 180);
    if (lat === null || lng === null) {
      setStatus(copy.invalid, true);
      return;
    }
    pendingLocation = { lat, lng };
    pendingOutput.textContent = `${format(lat, locale, { maximumFractionDigits: 5 })}, ${format(lng, locale, { maximumFractionDigits: 5 })}`;
    confirmation.hidden = false;
    const map = await mountMap('location');
    map?.setLocation(pendingLocation, { notify: false });
  };
  const areaPayload = () => {
    const mode = activeAreaMode();
    if (mode === 'measured') {
      const planeAreaSqm = finite(measured.value, 0.01, 100_000);
      return planeAreaSqm === null
        ? null
        : { areaMethod: 'measured-plane', planeAreaSqm, polygonComplete: false };
    }
    if (!roof.complete || roof.areaSqm <= 0) return null;
    return {
      areaMethod: 'map-projected',
      projectedAreaSqm: roof.areaSqm,
      polygonComplete: true
    };
  };
  const renderResult = (analysis, quickAnalysis = null) => {
    const scenario = analysis.selectedScenario;
    const estimates = analysis.commercialEstimate;
    const values = document.createElement('dl');
    values.className = 'result-kpis';
    values.append(
      metric(
        quick.capacity,
        `${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
      ),
      metric(quick.panels, format(scenario.system?.panelCount, locale)),
      metric(quick.generation, `${format(scenario.generation?.annualKwh, locale)} kWh`),
      metric(
        product.roof?.planeAreaSummary ?? 'Roof area',
        `${format(analysis.roof?.areaSqm, locale, { maximumFractionDigits: 1 })} m²`
      )
    );
    const budgetRange = formatConsumerCommercialRange(estimates, locale);
    if (budgetRange) values.append(metric(quick.budget, budgetRange));
    if (scenario.financial?.annualSavingsAmd !== null)
      values.append(
        metric(quick.savings, `${format(scenario.financial.annualSavingsAmd, locale)} ֏`),
        metric(
          quick.payback,
          `≈ ${format(scenario.financial.paybackYears, locale, { maximumFractionDigits: 1 })}`
        )
      );
    dashboard.replaceChildren(values);
    const quickScenario =
      quickAnalysis?.scope === 'regional-preliminary' ? quickAnalysis.selectedScenario : null;
    if (comparison && quickScenario?.system?.capacityKwp !== undefined) {
      comparison.hidden = false;
      comparison.replaceChildren(
        metric(
          copy.quickCapacity,
          `${format(quickScenario.system.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
        ),
        metric(
          copy.refinedCapacity,
          `${format(scenario.system?.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
        )
      );
    }
    resultStep.hidden = false;
    requestAnimationFrame(() => resultStep.focus());
  };
  const analyze = async () => {
    const roofInput = areaPayload();
    const property = point();
    const current = session.read();
    if (!roofInput || !property || !current.consumption) {
      setStatus(copy.invalid, true);
      return;
    }
    const payload = {
      property: {
        latitude: property.lat,
        longitude: property.lng,
        confirmed: true,
        source: 'manual'
      },
      consumption:
        current.consumption.mode === 'bill'
          ? { averageMonthlyBillAmd: current.consumption.averageMonthlyBillAmd }
          : { averageMonthlyKwh: current.consumption.averageMonthlyKwh },
      ...(current.userTariff ? { tariff: current.userTariff } : {}),
      roof: {
        ...roofInput,
        mountingMode: 'roof-parallel',
        tiltDegrees: CONSUMER_DEFAULT_TILT_DEGREES,
        azimuthDegrees: CONSUMER_DEFAULT_AZIMUTH_DEGREES
      },
      system: { capacityKwp: 1, lossPercent: 14 }
    };
    analysisRequest?.abort();
    analysisRequest = new AbortController();
    store({ analysis: null, analysisStatus: 'loading', solarPassport: null });
    setStatus('');
    try {
      const response = await api.analyze(payload, { signal: analysisRequest.signal });
      if (analysisRequest.signal.aborted || !response?.analysis) return;
      const solarPassport = passportRepository.create(response.analysis, { locale });
      store({
        property: saved.property,
        roof: { ...roof, ...roofInput },
        analysis: response.analysis,
        analysisStatus: 'complete',
        solarPassport
      });
      renderResult(response.analysis, current.quickAnalysis ?? current.analysis);
    } catch (error) {
      if (error instanceof ProductApiError && error.code === 'ABORTED') return;
      store({ analysis: null, analysisStatus: 'unavailable', solarPassport: null });
      setStatus(copy.unavailable, true);
    } finally {
      analysisRequest = null;
    }
  };

  root.querySelector('[data-refine-open-map]')?.addEventListener('click', () => {
    mapWrap.hidden = false;
    void mountMap('location');
  });
  root
    .querySelector('[data-refine-confirm-point]')
    ?.addEventListener('click', () => void confirm());
  root
    .querySelector('[data-refine-use-coordinates]')
    ?.addEventListener('click', () => void useCoordinates());
  root.querySelectorAll('input[name="refine-area-mode"]').forEach((input) =>
    input.addEventListener('change', () => {
      const measuredMode = activeAreaMode() === 'measured';
      measuredWrap.hidden = !measuredMode;
      outline.hidden = measuredMode;
    })
  );
  root
    .querySelector('[data-refine-add]')
    ?.addEventListener('click', () => mapController?.addPointAtCenter());
  root.querySelector('[data-refine-undo]')?.addEventListener('click', () => mapController?.undo());
  root
    .querySelector('[data-refine-reset]')
    ?.addEventListener('click', () => mapController?.resetRoof());
  root.querySelector('[data-refine-finish]')?.addEventListener('click', () => {
    if (!mapController?.finishRoof()) setStatus(copy.invalid, true);
  });
  root.querySelector('[data-refine-analyze]')?.addEventListener('click', () => void analyze());
  renderRoof();
  if (point()) void showRoof();
  return { session };
};
