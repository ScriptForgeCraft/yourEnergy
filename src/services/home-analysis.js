import { buildAnalysis, selectDemoProfile } from '../data/demo-profiles.js';

export class AnalysisError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'AnalysisError';
    this.code = code;
  }
}

export const validateAddress = (value) =>
  typeof value === 'string' && value.trim().length >= 5 && value.trim().length <= 160;

const throwIfAborted = (signal) => {
  if (signal?.aborted) {
    throw new AnalysisError('ABORTED');
  }
};

const waitForNextTask = (signal) =>
  new Promise((resolve, reject) => {
    const onAbort = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new AnalysisError('ABORTED'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    queueMicrotask(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    });
  });

/**
 * Demo-only legacy adapter. It is intentionally not imported by the production
 * homepage: the P0 flow uses ProductApiClient plus a confirmed point and roof
 * outline. The supplied address is used only to choose a labelled illustration
 * profile and is never returned as a geocoded or property-specific result.
 */
export class DemoHomeAnalysisService {
  constructor({ provider } = {}) {
    this.provider = provider;
  }

  async analyze(input, { signal, locale = 'ru' } = {}) {
    const address = typeof input === 'string' ? input : input?.address;
    if (!validateAddress(address)) {
      throw new AnalysisError('INVALID_INPUT');
    }

    throwIfAborted(signal);

    if (this.provider) {
      try {
        const analysis = await this.provider.analyze({ address }, { signal, locale });
        throwIfAborted(signal);
        return { ...analysis, source: 'provider' };
      } catch (error) {
        if (error instanceof AnalysisError) {
          throw error;
        }
        if (signal?.aborted || error?.name === 'AbortError') {
          throw new AnalysisError('ABORTED');
        }
        throw new AnalysisError('UNAVAILABLE');
      }
    }

    await waitForNextTask(signal);
    throwIfAborted(signal);
    const localeKey = String(locale).toLowerCase().startsWith('hy')
      ? 'hy'
      : String(locale).toLowerCase().startsWith('en')
        ? 'en'
        : 'ru';
    return {
      ...buildAnalysis(selectDemoProfile(address), { locale: localeKey }),
      mode: 'demo',
      disclosure: 'Illustrative demo profile only; this is not an analysis of the entered address.'
    };
  }
}

/**
 * @deprecated Use DemoHomeAnalysisService only for explicitly labelled static
 * examples. The homepage uses the real-analysis P0 flow in src/main.js.
 */
export const HomeAnalysisService = DemoHomeAnalysisService;
