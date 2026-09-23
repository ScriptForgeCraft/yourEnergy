import { PROFESSIONAL_ANALYSIS_SCOPE } from './professional-analysis-identity.js';

const SESSION_KEY = 'yourenergy.calculator.v2';
const SESSION_VERSION = 4;
const LEGACY_SESSION_VERSIONS = new Set([2, 3]);

const cloneSafe = (value) => {
  if (!value || typeof value !== 'object') return value ?? null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const emptyState = () => ({
  version: SESSION_VERSION,
  currentStep: 0,
  regionId: null,
  consumption: null,
  userTariff: null,
  property: null,
  roof: null,
  sitePotential: null,
  selectedPanelId: null,
  storageRequired: false,
  quickAnalysis: null,
  quickAnalysisStatus: 'idle',
  professionalAnalysis: null,
  professionalAnalysisStatus: 'idle',
  professionalAnalysisIdentity: null,
  professionalSolarPassport: null
});

const isQuickAnalysis = (analysis) => analysis?.scope === 'regional-preliminary';
const isProfessionalAnalysis = (analysis) => analysis?.scope === PROFESSIONAL_ANALYSIS_SCOPE;

/**
 * Versions 2 and 3 can contain financial output that valued annual generation
 * above consumption at the retail tariff. Retain reusable inputs but discard
 * every cached result so an old payback value is never restored.
 */
const migrateFinancialModelState = (stored = {}) => ({
  ...emptyState(),
  ...stored,
  version: SESSION_VERSION,
  quickAnalysis: null,
  quickAnalysisStatus: 'idle',
  professionalAnalysis: null,
  professionalAnalysisStatus: 'idle',
  professionalAnalysisIdentity: null,
  professionalSolarPassport: null
});

const readStoredState = (stored) => {
  const state =
    stored?.version === SESSION_VERSION
      ? { ...emptyState(), ...stored }
      : LEGACY_SESSION_VERSIONS.has(stored?.version)
        ? migrateFinancialModelState(stored)
        : emptyState();
  delete state.analysis;
  delete state.analysisStatus;
  delete state.solarPassport;
  if (!isQuickAnalysis(state.quickAnalysis)) {
    state.quickAnalysis = null;
    state.quickAnalysisStatus = 'idle';
  }
  if (
    !isProfessionalAnalysis(state.professionalAnalysis) ||
    typeof state.professionalAnalysisIdentity !== 'string' ||
    !state.professionalAnalysisIdentity
  ) {
    state.professionalAnalysis = null;
    state.professionalAnalysisStatus = 'idle';
    state.professionalAnalysisIdentity = null;
    state.professionalSolarPassport = null;
  }
  return state;
};

const activeAnalysis = (state) => {
  if (state.professionalAnalysis || state.professionalAnalysisStatus !== 'idle')
    return { analysis: state.professionalAnalysis, status: state.professionalAnalysisStatus };
  if (state.quickAnalysis || state.quickAnalysisStatus !== 'idle')
    return { analysis: state.quickAnalysis, status: state.quickAnalysisStatus };
  return { analysis: null, status: 'idle' };
};

/**
 * Session-only handoff between Quick, roof refinement and professional
 * calculator modes. Files are deliberately omitted: browsers cannot safely
 * recreate an uploaded File after navigation and it must never enter storage.
 */
const resolveSessionStorage = () => {
  try {
    // Resolve lazily in the document realm. Some embedded browser contexts do
    // not expose Storage through an imported module's global object, although
    // the page's Window still provides the normal session-scoped store.
    const storage = window.sessionStorage;
    if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') {
      return storage;
    }
  } catch {
    // Some embedded or privacy-restricted contexts deny sessionStorage.
  }
  return null;
};

const publishAnalysisUpdate = (state) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(
      new CustomEvent('solar:analysis-updated', {
        detail: {
          ...activeAnalysis(state)
        }
      })
    );
  } catch {
    // Session storage remains the durable same-tab handoff when CustomEvent is
    // unavailable in a constrained browser environment.
  }
};

export const createCalculatorSession = ({ storage } = {}) => {
  const activeStorage = storage ?? resolveSessionStorage();
  const read = () => {
    try {
      const stored = JSON.parse(activeStorage?.getItem(SESSION_KEY) ?? 'null');
      return readStoredState(stored);
    } catch {
      return emptyState();
    }
  };

  const write = (changes = {}) => {
    const next = { ...read(), ...cloneSafe(changes), version: SESSION_VERSION };
    // File objects and other opaque values are intentionally not persisted.
    delete next.selectedBillFile;
    // The generic v2 result fields must never be written back alongside the
    // scoped records. That prevents a later route from accidentally reviving
    // the legacy handoff path.
    delete next.analysis;
    delete next.analysisStatus;
    delete next.solarPassport;
    try {
      activeStorage?.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // A restricted browser mode may deny session storage. The active view
      // still works; only cross-route convenience is unavailable.
    }
    if (
      'quickAnalysis' in changes ||
      'quickAnalysisStatus' in changes ||
      'professionalAnalysis' in changes ||
      'professionalAnalysisStatus' in changes
    )
      publishAnalysisUpdate(next);
    return next;
  };

  const clearQuickAnalysis = () => write({ quickAnalysis: null, quickAnalysisStatus: 'idle' });

  const clearProfessionalAnalysis = () =>
    write({
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });

  const saveQuickAnalysis = (analysis, status = 'complete') =>
    write({
      quickAnalysis: isQuickAnalysis(analysis) ? analysis : null,
      quickAnalysisStatus: status
    });

  const saveProfessionalAnalysis = ({
    analysis,
    status = 'complete',
    identity,
    solarPassport
  } = {}) =>
    write({
      professionalAnalysis: isProfessionalAnalysis(analysis) ? analysis : null,
      professionalAnalysisStatus: status,
      professionalAnalysisIdentity: typeof identity === 'string' ? identity : null,
      professionalSolarPassport: solarPassport ?? null
    });

  /**
   * A calculation panel affects Professional roof fit and installed kWp. Keep
   * the visitor's inputs and independent regional Quick result intact.
   */
  const selectPanel = (panelId) => {
    const selectedPanelId =
      typeof panelId === 'string' ? panelId.trim().slice(0, 160) || null : null;
    return write({
      selectedPanelId,
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });
  };

  const clear = () => {
    const next = emptyState();
    try {
      activeStorage?.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // The active page still resets when storage is unavailable.
    }
    publishAnalysisUpdate(next);
    return next;
  };

  return Object.freeze({
    key: SESSION_KEY,
    read,
    write,
    clearQuickAnalysis,
    clearProfessionalAnalysis,
    saveQuickAnalysis,
    saveProfessionalAnalysis,
    selectPanel,
    clear
  });
};
