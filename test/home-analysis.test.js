import assert from 'node:assert/strict';
import test from 'node:test';

import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import { CONTENT_LOCALE_SCHEMA, GENERATED_CONTENT_LOCALES } from '../src/content/schema.js';
import { BASE_MONTHLY, BASE_PROFILE, buildAnalysis } from '../src/data/demo-profiles.js';
import {
  AnalysisError,
  HomeAnalysisService,
  validateAddress
} from '../src/services/home-analysis.js';
import {
  formatCurrency,
  formatDecimal,
  formatCompactAmd,
  formatNumber,
  isFiniteDisplayValue
} from '../src/utils/format.js';
import { MAX_UPLOAD_BYTES, validateUploadFile } from '../src/ui/file-upload.js';

const ADDRESS = 'Yerevan, Arabkir, Komitas 12';
const EXPECTED_MONTHLY = [600, 750, 1050, 1350, 1600, 1750, 1850, 1750, 1450, 1100, 750, 600];

function assertFiniteTree(value, trail = 'analysis', seen = new WeakSet()) {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${trail} must be a finite number`);
    return;
  }

  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);

  for (const [key, nested] of Object.entries(value)) {
    assertFiniteTree(nested, `${trail}.${key}`, seen);
  }
}

function contentShape(value) {
  if (Array.isArray(value)) return value.map(contentShape);
  if (!value || typeof value !== 'object') return typeof value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, contentShape(value[key])])
  );
}

test('address validation accepts a meaningful address and rejects incomplete input', () => {
  assert.equal(validateAddress(ADDRESS), true);
  assert.equal(validateAddress(''), false);
  assert.equal(validateAddress('   '), false);
  assert.equal(validateAddress('abcd'), false);
  assert.equal(validateAddress(null), false);
});

test('base data preserves the agreed Optimum model', () => {
  assert.deepEqual(BASE_MONTHLY, EXPECTED_MONTHLY);
  assert.equal(
    BASE_MONTHLY.reduce((total, value) => total + value, 0),
    14_600
  );
  assert.equal(BASE_PROFILE.system.capacityKwp, 9.86);
  assert.equal(BASE_PROFILE.system.panelCount, 17);
  assert.equal(BASE_PROFILE.system.panelWatts, 580);
});

test('buildAnalysis returns the documented financial model without non-finite values', () => {
  const analysis = buildAnalysis(BASE_PROFILE);

  assert.equal(analysis.system.capacityKwp, 9.86);
  assert.deepEqual(analysis.monthlyGeneration, EXPECTED_MONTHLY);
  assert.equal(
    analysis.monthlyGeneration.reduce((total, value) => total + value, 0),
    14_600
  );
  assert.equal(analysis.savings.annual, 720_000);
  assert.ok(Math.abs(analysis.payback.years - 4_300_000 / 720_000) < 0.01);
  assert.equal(Math.round(analysis.payback.years * 10) / 10, 6);

  const timeline = Object.fromEntries(analysis.timeline.map((point) => [point.year, point.net]));
  assert.deepEqual(timeline, {
    0: -4_300_000,
    5: -700_000,
    6: 20_000,
    10: 2_900_000,
    25: 13_700_000
  });
  assert.equal(analysis.savings.gross25Years, 18_000_000);
  assertFiniteTree(analysis);
});

test('English has a full published route in the content schema', () => {
  const english = buildAnalysis(BASE_PROFILE, { locale: 'en-US' });
  const englishRoute = CONTENT_LOCALE_SCHEMA.find(({ key }) => key === 'en');

  assert.equal(english.location.label, 'Yerevan · standard demo profile');
  assert.equal(english.roof.orientationLabel, 'South-west (236°)');
  assert.equal(formatCompactAmd(18_000_000, 'en-US'), '18 M ֏');
  assert.deepEqual(
    GENERATED_CONTENT_LOCALES.map(({ key }) => key),
    ['hy', 'ru', 'en']
  );
  assert.deepEqual(englishRoute, {
    key: 'en',
    locale: 'en-US',
    path: '/en/',
    file: 'en/index.html',
    published: true
  });
});

test('all locale dictionaries have the same template data shape', () => {
  assert.deepEqual(contentShape(en), contentShape(hy));
  assert.deepEqual(contentShape(en), contentShape(ru));
});

test('bill upload validation permits supported files through 10 MiB only', () => {
  assert.equal(
    validateUploadFile({ name: 'bill.pdf', type: 'application/pdf', size: MAX_UPLOAD_BYTES }),
    null
  );
  assert.equal(validateUploadFile({ name: 'roof.JPG', type: '', size: 1024 }), null);
  assert.equal(validateUploadFile({ name: 'bill.txt', type: 'text/plain', size: 1024 }), 'INVALID_FILE');
  assert.equal(
    validateUploadFile({ name: 'bill.png', type: 'image/png', size: MAX_UPLOAD_BYTES + 1 }),
    'FILE_TOO_LARGE'
  );
});

test('HomeAnalysisService exposes a demo analysis through the public async contract', async () => {
  const service = new HomeAnalysisService();
  const analysis = await service.analyze({ address: ADDRESS });

  assert.equal(analysis.source, 'demo');
  assert.equal(analysis.system.capacityKwp, 9.86);
  assert.equal(
    analysis.monthlyGeneration.reduce((total, value) => total + value, 0),
    14_600
  );
  assert.ok(Math.abs(analysis.payback.years - 4_300_000 / 720_000) < 0.01);
  assertFiniteTree(analysis);
});

test('HomeAnalysisService returns documented errors for invalid input and aborted work', async () => {
  const service = new HomeAnalysisService();

  await assert.rejects(
    service.analyze({ address: 'no' }),
    (error) => error instanceof AnalysisError && error.code === 'INVALID_INPUT'
  );

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    service.analyze({ address: ADDRESS }, { signal: controller.signal }),
    (error) => error instanceof AnalysisError && error.code === 'ABORTED'
  );
});

test('HomeAnalysisService normalizes unavailable provider failures and in-flight aborts', async () => {
  const unavailable = new HomeAnalysisService({
    provider: {
      analyze: async () => {
        throw new Error('offline');
      }
    }
  });

  await assert.rejects(
    unavailable.analyze({ address: ADDRESS }),
    (error) => error instanceof AnalysisError && error.code === 'UNAVAILABLE'
  );

  const abortable = new HomeAnalysisService({
    provider: {
      analyze: (_input, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              const error = new Error('The operation was aborted.');
              error.name = 'AbortError';
              reject(error);
            },
            { once: true }
          );
        })
    }
  });
  const controller = new AbortController();
  const pending = abortable.analyze({ address: ADDRESS }, { signal: controller.signal });
  controller.abort();

  await assert.rejects(
    pending,
    (error) => error instanceof AnalysisError && error.code === 'ABORTED'
  );
});

test('formatters use Armenian and Russian locale conventions and never leak NaN/Infinity', () => {
  const values = [
    formatNumber(14_600, 'hy-AM'),
    formatNumber(14_600, 'ru-RU'),
    formatDecimal(9.86, 'hy-AM', { maximumFractionDigits: 2 }),
    formatDecimal(9.86, 'ru-RU', { maximumFractionDigits: 2 }),
    formatCurrency(720_000, 'hy-AM'),
    formatCurrency(720_000, 'ru-RU')
  ];

  assert.match(values[0], /14[\s\u00a0\u202f]600/u);
  assert.match(values[1], /14[\s\u00a0\u202f]600/u);
  assert.match(values[2], /9,86/u);
  assert.match(values[3], /9,86/u);
  assert.match(values[4], /720[\s\u00a0\u202f]000/u);
  assert.match(values[5], /720[\s\u00a0\u202f]000/u);

  for (const value of values) {
    assert.doesNotMatch(value, /(?:NaN|Infinity)/u);
    assert.equal(isFiniteDisplayValue(value), true);
  }

  for (const unsafeValue of [
    formatNumber(Number.NaN, 'hy-AM'),
    formatDecimal(Infinity, 'ru-RU'),
    formatCurrency(-Infinity, 'hy-AM')
  ]) {
    assert.doesNotMatch(unsafeValue, /(?:NaN|Infinity)/u);
  }
  assert.equal(isFiniteDisplayValue('NaN'), false);
  assert.equal(isFiniteDisplayValue('Infinity'), false);
});
