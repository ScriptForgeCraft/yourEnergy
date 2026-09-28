import assert from 'node:assert/strict';
import test from 'node:test';
import { format, formatApproximate } from '../src/ui/calculator/view-helpers.js';

test('missing calculator values never become numeric zero or a zero-year payback', () => {
  for (const locale of ['hy-AM', 'ru-RU', 'en-US']) {
    for (const value of [null, undefined, '', ' ', false, NaN, Infinity]) {
      assert.equal(format(value, locale), '—');
      assert.equal(formatApproximate(value, locale, 'years'), '—');
      assert.equal(formatApproximate(value, locale, '֏'), '—');
    }
    assert.equal(format(0, locale), '0');
    assert.equal(formatApproximate(0, locale, '֏'), '≈ 0 ֏');
  }
  assert.equal(
    formatApproximate(3.24, 'en-US', 'years', { maximumFractionDigits: 1 }),
    '≈ 3.2 years'
  );
});
