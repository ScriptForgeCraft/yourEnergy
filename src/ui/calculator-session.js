const SESSION_KEY = 'yourenergy.calculator.v2';
const SESSION_VERSION = 2;

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
  regionId: null,
  consumption: null,
  userTariff: null,
  property: null,
  roof: null,
  sitePotential: null,
  analysis: null,
  solarPassport: null
});

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
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const createCalculatorSession = ({ storage } = {}) => {
  const activeStorage = storage ?? resolveSessionStorage();
  const read = () => {
    try {
      const stored = JSON.parse(activeStorage?.getItem(SESSION_KEY) ?? 'null');
      return stored?.version === SESSION_VERSION ? { ...emptyState(), ...stored } : emptyState();
    } catch {
      return emptyState();
    }
  };

  const write = (changes = {}) => {
    const next = { ...read(), ...cloneSafe(changes), version: SESSION_VERSION };
    // File objects and other opaque values are intentionally not persisted.
    delete next.selectedBillFile;
    try {
      activeStorage?.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      // A restricted browser mode may deny session storage. The active view
      // still works; only cross-route convenience is unavailable.
    }
    return next;
  };

  const clearAnalysis = () => write({ analysis: null, solarPassport: null });

  return Object.freeze({ key: SESSION_KEY, read, write, clearAnalysis });
};
