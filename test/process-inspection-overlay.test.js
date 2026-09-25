import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProcessInspectionValues,
  formatInspectionCardNote,
  formatInspectionOrientation
} from '../src/ui/process-inspection-overlay.js';
import { processStoryCopy } from '../src/content/process-story.js';

test('inspection orientation is localized to the nearest compass direction', () => {
  assert.equal(formatInspectionOrientation(180, 'en'), 'South');
  assert.equal(formatInspectionOrientation(180, 'ru'), 'Юг');
  assert.equal(formatInspectionOrientation(180, 'hy'), 'Հարավ');
  assert.equal(formatInspectionOrientation(44, 'en'), 'North-east');
  assert.equal(formatInspectionOrientation(359, 'en'), 'North');
});

test('inspection cards retain their localized on-site description beside a data source note', () => {
  assert.equal(
    formatInspectionCardNote('Measured on site', 'From calculator'),
    'Measured on site · From calculator'
  );
  assert.equal(
    formatInspectionCardNote('Проверяются условия подключения'),
    'Проверяются условия подключения'
  );
});

test('inspection values use calculator roof data when it exists', () => {
  const values = buildProcessInspectionValues(
    {
      roof: {
        areaSqm: 74.5,
        azimuthDegrees: 180,
        tiltDegrees: 28
      }
    },
    'en'
  );

  assert.equal(values['roof-area'].text, '74.5 m²');
  assert.equal(values.orientation.text, 'South');
  assert.equal(values.tilt.text, '28°');
  assert.equal(values['roof-area'].source, 'calculator');
  assert.equal(values['roof-area'].note, 'From calculator');
});

test('inspection values fall back silently when calculator data is missing', () => {
  const ru = buildProcessInspectionValues({}, 'ru');
  assert.equal(ru['roof-area'].text, '48 м²');
  assert.equal(ru.orientation.text, 'Юг');
  assert.equal(ru.tilt.text, '30°');
  assert.equal(ru.shading.text, 'Минимальное');
  assert.equal(ru['electrical-panel'].text, 'Готов');
  assert.equal(ru.shading.source, 'fallback');
  assert.equal(ru.shading.note, '');
});

test('future on-site shading and electrical data override fallbacks without changing the session schema', () => {
  const values = buildProcessInspectionValues(
    {
      siteSurvey: {
        shading: { level: 'moderate', verifiedOnSite: true },
        electricalPanel: { status: 'upgrade-required', verifiedOnSite: true }
      }
    },
    'hy'
  );

  assert.equal(values.shading.text, 'Միջին');
  assert.equal(values.shading.source, 'verified');
  assert.equal(values['electrical-panel'].text, 'Պետք է վերազինել');
  assert.equal(values['electrical-panel'].source, 'verified');
  assert.equal(values['electrical-panel'].note, 'Ստուգված է տեղում');
});

test('the second process step exposes the inspection value schema in every locale', () => {
  const expectedKeys = ['roof-area', 'orientation', 'tilt', 'shading', 'electrical-panel'];

  for (const locale of ['en', 'ru', 'hy']) {
    const step = processStoryCopy[locale].steps[1];
    assert.equal(step.visual, 'inspection');
    assert.deepEqual(
      step.cards.map(({ data }) => data),
      expectedKeys
    );
  }
});
