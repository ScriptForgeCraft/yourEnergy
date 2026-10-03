import { PROFESSIONAL_ANALYSIS_SCOPE } from './professional-analysis-identity.js';
import {
  createQuickAnalysisIdentity,
  isRestorableQuickAnalysis,
  QUICK_ANALYSIS_SCOPE
} from './quick-analysis-identity.js';
import { createStandardFinancialRate, normalizeFinancialRate } from '../domain/financial-rate.js';

const SESSION_KEY = 'yourenergy.calculator.v2';
const SESSION_VERSION = 9;
const LEGACY_SESSION_VERSIONS = new Set([2, 3, 4, 5, 6, 7, 8]);

const cloneSafe = (value) => {
  if (!value || typeof value !== 'object') return value ?? null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const normalizeConsumptionState = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.mode === 'bill') {
    return {
      mode: 'bill',
      averageMonthlyBillAmd: value.averageMonthlyBillAmd ?? null,
      ...(value.billedKwh !== undefined || value.averageMonthlyKwh !== undefined
        ? { billedKwh: value.billedKwh ?? value.averageMonthlyKwh }
        : {})
    };
  }
  if (value.mode === 'usage') {
    return { mode: 'usage', averageMonthlyKwh: value.averageMonthlyKwh ?? null };
  }
  if (value.mode === 'monthly') {
    return { mode: 'monthly', monthlyKwh: cloneSafe(value.monthlyKwh) };
  }
  return null;
};

const normalizeCompleteState = (value = {}) => {
  const state = { ...emptyState(), ...(cloneSafe(value) ?? {}) };
  state.consumption = normalizeConsumptionState(state.consumption);
  state.financialRate = normalizeFinancialRate(state.financialRate, state.consumption);
  delete state.financialTariffMode;
  delete state.effectiveRateOverride;
  delete state.standardDayNightReadings;
  delete state.actualDayNight;
  delete state.userTariff;
  return state;
};

const emptyState = () => ({
  version: SESSION_VERSION,
  currentStep: 0,
  regionId: null,
  consumption: null,
  financialRate: createStandardFinancialRate(),
  property: null,
  roof: null,
  sitePotential: null,
  selectedPanelId: null,
  storageRequired: false,
  quickAnalysis: null,
  quickAnalysisStatus: 'idle',
  quickAnalysisIdentity: null,
  professionalAnalysis: null,
  professionalAnalysisStatus: 'idle',
  professionalAnalysisIdentity: null,
  professionalSolarPassport: null
});

const isQuickAnalysis = (analysis) => analysis?.scope === QUICK_ANALYSIS_SCOPE;
const isProfessionalAnalysis = (analysis) => analysis?.scope === PROFESSIONAL_ANALYSIS_SCOPE;

/**
 * Version 8 and earlier did not distinguish a bill-derived quotient from an
 * explicitly entered custom rate. Preserve the raw consumption, but reset the
 * financial source to standard instead of inventing provenance.
 */
const migrateFinancialModelState = (stored = {}) => {
  return normalizeCompleteState({
    ...emptyState(),
    ...stored,
    consumption: normalizeConsumptionState(stored.consumption),
    financialRate: createStandardFinancialRate({ explicit: true }),
    version: SESSION_VERSION,
    quickAnalysis: null,
    quickAnalysisStatus: 'idle',
    quickAnalysisIdentity: null,
    professionalAnalysis: null,
    professionalAnalysisStatus: 'idle',
    professionalAnalysisIdentity: null,
    professionalSolarPassport: null
  });
};

const readStoredState = (stored) => {
  const state =
    stored?.version === SESSION_VERSION
      ? normalizeCompleteState(stored)
      : LEGACY_SESSION_VERSIONS.has(stored?.version)
        ? migrateFinancialModelState(stored)
        : emptyState();
  delete state.analysis;
  delete state.analysisStatus;
  delete state.solarPassport;
  state.consumption = normalizeConsumptionState(state.consumption);
  state.financialRate = normalizeFinancialRate(state.financialRate, state.consumption);
  const currentQuickIdentity = createQuickAnalysisIdentity({
    regionId: state.regionId,
    consumption: state.consumption,
    financialRate: state.financialRate
  });
  if (
    !isRestorableQuickAnalysis({
      analysis: state.quickAnalysis,
      status: state.quickAnalysisStatus,
      storedIdentity: state.quickAnalysisIdentity,
      currentIdentity: currentQuickIdentity
    })
  ) {
    state.quickAnalysis = null;
    state.quickAnalysisStatus = 'idle';
    state.quickAnalysisIdentity = null;
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
    const normalizedChanges = cloneSafe(changes) ?? {};
    const previous = read();
    if (
      Object.hasOwn(normalizedChanges, 'consumption') &&
      !Object.hasOwn(normalizedChanges, 'financialRate') &&
      normalizeConsumptionState(normalizedChanges.consumption)?.mode !== previous.consumption?.mode
    ) {
      normalizedChanges.financialRate = createStandardFinancialRate();
    }
    const next = normalizeCompleteState({
      ...previous,
      ...normalizedChanges,
      version: SESSION_VERSION
    });
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
      'quickAnalysis' in normalizedChanges ||
      'quickAnalysisStatus' in normalizedChanges ||
      'quickAnalysisIdentity' in normalizedChanges ||
      'professionalAnalysis' in normalizedChanges ||
      'professionalAnalysisStatus' in normalizedChanges
    )
      publishAnalysisUpdate(next);
    return next;
  };

  const clearQuickAnalysis = () =>
    write({ quickAnalysis: null, quickAnalysisStatus: 'idle', quickAnalysisIdentity: null });

  const clearProfessionalAnalysis = () =>
    write({
      professionalAnalysis: null,
      professionalAnalysisStatus: 'idle',
      professionalAnalysisIdentity: null,
      professionalSolarPassport: null
    });

  const saveQuickAnalysis = (analysis, { status = 'complete', identity } = {}) =>
    write({
      quickAnalysis: isQuickAnalysis(analysis) ? analysis : null,
      quickAnalysisStatus: status,
      quickAnalysisIdentity: typeof identity === 'string' ? identity : null
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
