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
 * Browser-only adapter boundary. It deliberately stays local until a public,
 * authenticated backend adapter is configured. No input is geocoded here.
 */
export class HomeAnalysisService {
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
    return buildAnalysis(selectDemoProfile(address), {
      locale: localeKey
    });
  }
}
