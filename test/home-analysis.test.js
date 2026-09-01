import assert from 'node:assert/strict';
import test from 'node:test';

import en from '../src/content/en.js';
import hy from '../src/content/hy.js';
import ru from '../src/content/ru.js';
import { CONTENT_LOCALE_SCHEMA, GENERATED_CONTENT_LOCALES } from '../src/content/schema.js';
import {
  formatCurrency,
  formatDecimal,
  formatCompactAmd,
  formatNumber,
  isFiniteDisplayValue
} from '../src/utils/format.js';
import { MAX_UPLOAD_BYTES, validateUploadFile } from '../src/ui/file-upload.js';

function contentShape(value) {
  if (Array.isArray(value)) return value.map(contentShape);
  if (!value || typeof value !== 'object') return typeof value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, contentShape(value[key])])
  );
}

test('English has a full published route in the content schema', () => {
  const englishRoute = CONTENT_LOCALE_SCHEMA.find(({ key }) => key === 'en');

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
  assert.equal(
    validateUploadFile({ name: 'bill.txt', type: 'text/plain', size: 1024 }),
    'INVALID_FILE'
  );
  assert.equal(
    validateUploadFile({ name: 'bill.png', type: 'image/png', size: MAX_UPLOAD_BYTES + 1 }),
    'FILE_TOO_LARGE'
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
