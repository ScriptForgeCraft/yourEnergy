import { PROCESS_INSPECTION_COPY } from '../content/process-inspection.js';
import { createCalculatorSession } from './calculator-session.js';

const INSPECTION_KEYS = Object.freeze([
  'roof-area',
  'orientation',
  'tilt',
  'shading',
  'electrical-panel'
]);

const INSPECTION_ICONS = Object.freeze({
  'roof-area': 'inspection-roof',
  orientation: 'inspection-compass',
  tilt: 'inspection-tilt',
  shading: 'inspection-shading',
  'electrical-panel': 'inspection-panel'
});

// Normalized to the overlay's 1000 × 600 SVG viewBox. The multi-segment paths
// intentionally resemble technical callouts rather than decorative straight lines.
const CONNECTORS = Object.freeze([
  { key: 'roof-area', points: '205,111 302,111 381,157 482,181', target: [482, 181] },
  { key: 'orientation', points: '585,103 585,145 571,181 566,211', target: [566, 211] },
  { key: 'tilt', points: '811,256 770,256 733,245 706,245', target: [706, 245] },
  { key: 'shading', points: '207,472 307,472 387,430 438,418', target: [438, 418] },
  {
    key: 'electrical-panel',
    points: '811,461 765,461 724,433 688,420',
    target: [688, 420]
  }
]);

const SHADING_ALIASES = Object.freeze({
  none: 'minimal',
  low: 'minimal',
  minimal: 'minimal',
  moderate: 'moderate',
  medium: 'moderate',
  high: 'high',
  heavy: 'high'
});

const ELECTRICAL_ALIASES = Object.freeze({
  ok: 'ready',
  ready: 'ready',
  compatible: 'ready',
  'ready-for-connection': 'ready',
  upgrade: 'upgradeRequired',
  'upgrade-required': 'upgradeRequired',
  'not-ready': 'upgradeRequired'
});

const localeKey = (locale = '') => {
  const normalized = String(locale).toLowerCase();
  if (normalized.startsWith('hy')) return 'hy';
  if (normalized.startsWith('ru')) return 'ru';
  return 'en';
};

const finite = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '') ?? null;

const activeAnalysis = (state = {}) => {
  if (state.professionalAnalysisStatus === 'complete' && state.professionalAnalysis) {
    return state.professionalAnalysis;
  }
  if (state.quickAnalysisStatus === 'complete' && state.quickAnalysis) return state.quickAnalysis;
  return null;
};

const statusValue = (value) => {
  if (!value || typeof value !== 'object') return { value, verified: false };
  return {
    value: firstDefined(value.status, value.level, value.value, value.label),
    verified: value.verifiedOnSite === true || value.verified === true
  };
};

const cleanStatus = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : null;
};

const mappedStatus = (rawValue, aliases, translations) => {
  const normalized = cleanStatus(rawValue);
  if (!normalized) return null;
  const key = normalized.toLowerCase().replaceAll('_', '-').replaceAll(' ', '-');
  const translationKey = aliases[key];
  return translationKey ? translations[translationKey] : normalized;
};

export const formatInspectionOrientation = (degrees, locale = 'en') => {
  const value = finite(degrees);
  if (value === null) return null;
  const copy = PROCESS_INSPECTION_COPY[localeKey(locale)];
  const normalized = ((value % 360) + 360) % 360;
  const directionIndex = Math.round(normalized / 45) % 8;
  return copy.directions[directionIndex];
};

const item = (text, source, copy) => ({
  text,
  source,
  note:
    source === 'verified'
      ? copy.verifiedNote
      : source === 'calculator'
        ? copy.calculatorNote
        : copy.fallbackNote
});

/**
 * Converts the calculator session into display-only values for the inspection scene.
 * No solar sizing, production or commercial calculation is performed here.
 */
export const buildProcessInspectionValues = (state = {}, locale = 'en') => {
  const key = localeKey(locale);
  const copy = PROCESS_INSPECTION_COPY[key];
  const analysis = activeAnalysis(state);
  const roof = analysis?.roof ?? state.roof ?? {};
  const survey =
    analysis?.siteSurvey ?? analysis?.inspection ?? state.siteSurvey ?? state.inspection ?? null;
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  const area = finite(
    firstDefined(roof.areaSqm, roof.effectiveAreaSqm, roof.planeAreaSqm, roof.projectedAreaSqm)
  );
  const orientation = finite(firstDefined(roof.orientationDegrees, roof.azimuthDegrees));
  const tilt = finite(roof.tiltDegrees);

  const shadingStatus = statusValue(
    firstDefined(survey?.shading, roof.shading, state.shading, state.roofShading)
  );
  const electricalStatus = statusValue(
    firstDefined(
      survey?.electricalPanel,
      survey?.electrical,
      state.electricalPanel,
      state.electrical?.panel
    )
  );

  const shadingText = mappedStatus(shadingStatus.value, SHADING_ALIASES, copy.shading);
  const electricalText = mappedStatus(
    electricalStatus.value,
    ELECTRICAL_ALIASES,
    copy.electrical
  );

  return {
    'roof-area':
      area === null
        ? item(copy.fallbacks['roof-area'], 'fallback', copy)
        : item(`${formatter.format(area)} m²`, 'calculator', copy),
    orientation:
      orientation === null
        ? item(copy.fallbacks.orientation, 'fallback', copy)
        : item(formatInspectionOrientation(orientation, locale), 'calculator', copy),
    tilt:
      tilt === null
        ? item(copy.fallbacks.tilt, 'fallback', copy)
        : item(`${formatter.format(tilt)}°`, 'calculator', copy),
    shading: shadingText
      ? item(shadingText, shadingStatus.verified ? 'verified' : 'calculator', copy)
      : item(copy.fallbacks.shading, 'fallback', copy),
    'electrical-panel': electricalText
      ? item(electricalText, electricalStatus.verified ? 'verified' : 'calculator', copy)
      : item(copy.fallbacks['electrical-panel'], 'fallback', copy)
  };
};

const removeMetricAnimationState = (element) => {
  for (const name of [
    'data-process-number',
    'data-process-final',
    'data-process-suffix',
    'data-process-decimals',
    'data-process-metric-signature'
  ]) {
    element.removeAttribute(name);
  }
};

const svgElement = (name, attributes = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
};

const ensureConnectors = (visual) => {
  let svg = visual.querySelector('[data-inspection-connectors]');
  if (svg) return svg;

  svg = svgElement('svg', {
    class: 'process-inspection-connectors',
    viewBox: '0 0 1000 600',
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
    'data-inspection-connectors': ''
  });

  for (const connector of CONNECTORS) {
    const group = svgElement('g', {
      class: 'process-inspection-connector',
      'data-inspection-connector': connector.key
    });
    group.append(
      svgElement('polyline', {
        points: connector.points,
        class: 'process-inspection-connector__line',
        'vector-effect': 'non-scaling-stroke',
        pathLength: 1
      }),
      svgElement('circle', {
        cx: connector.target[0],
        cy: connector.target[1],
        r: 5.2,
        class: 'process-inspection-connector__halo',
        'vector-effect': 'non-scaling-stroke'
      }),
      svgElement('circle', {
        cx: connector.target[0],
        cy: connector.target[1],
        r: 2.8,
        class: 'process-inspection-connector__dot',
        'vector-effect': 'non-scaling-stroke'
      })
    );
    svg.append(group);
  }

  visual.prepend(svg);
  return svg;
};

export const initProcessInspectionOverlay = ({ config = {} } = {}) => {
  const story = document.querySelector('[data-process-story]');
  const inspection = story?.querySelector('.process-state--inspection');
  const visual = inspection?.querySelector('.process-visual--inspection');
  if (!inspection || !visual) return () => {};

  const session = createCalculatorSession();
  const locale = config.locale || document.documentElement.lang || 'en';
  let queuedFrame = 0;
  let disposed = false;

  ensureConnectors(visual);

  const render = () => {
    queuedFrame = 0;
    if (disposed) return;
    const values = buildProcessInspectionValues(session.read(), locale);

    for (const metricKey of INSPECTION_KEYS) {
      const element = inspection.querySelector(`[data-process-value="${metricKey}"]`);
      if (!element) continue;
      const descriptor = values[metricKey];
      removeMetricAnimationState(element);
      if (element.textContent !== descriptor.text) element.textContent = descriptor.text;

      const card = element.closest('[data-process-card]');
      if (card) {
        card.dataset.inspectionSource = descriptor.source;
        card.dataset.inspectionKey = metricKey;
        const use = card.querySelector('.inline-icon use');
        const icon = INSPECTION_ICONS[metricKey];
        if (use && icon) use.setAttribute('href', `/icons.svg#${icon}`);
      }

      // The original localized inspection description is rendered by Handlebars
      // in a separate element. Do not overwrite it with calculator/fallback status text.
    }
  };

  const queueRender = () => {
    if (queuedFrame || disposed) return;
    queuedFrame = window.requestAnimationFrame(render);
  };

  const observer = new MutationObserver(queueRender);
  observer.observe(inspection, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'data-process-number',
      'data-process-final',
      'data-process-suffix',
      'data-process-decimals',
      'data-process-metric-signature'
    ]
  });

  window.addEventListener('solar:analysis-updated', queueRender);
  window.addEventListener('pageshow', queueRender);
  render();

  return () => {
    disposed = true;
    observer.disconnect();
    window.cancelAnimationFrame(queuedFrame);
    window.removeEventListener('solar:analysis-updated', queueRender);
    window.removeEventListener('pageshow', queueRender);
  };
};
