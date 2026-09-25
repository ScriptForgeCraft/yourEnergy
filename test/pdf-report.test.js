import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TEMPORARY_YOURENERGY_PRICEBOOK,
  buildSolarAnalysis,
  createUserTariffSelection
} from '../src/domain/index.js';
import { createCalculatorPdfReportHtml } from '../src/ui/calculator/pdf-report.js';

const createAnalysis = () =>
  buildSolarAnalysis({
    effectiveDate: '2026-08-31',
    property: {
      coordinates: { lat: 40.18, lng: 44.51 },
      confirmed: true,
      source: { kind: 'manual', status: 'confirmed' }
    },
    consumption: { annualKwh: 12_000 },
    roof: {
      areaSqm: 100,
      usableAreaRatio: 0.7,
      orientationDegrees: 180,
      tiltDegrees: 30,
      polygonComplete: true,
      source: { kind: 'manual', status: 'confirmed' }
    },
    production: {
      annualYieldKwhPerKwp: 1_500,
      monthlyYieldFactors: Array(12).fill(1),
      source: { kind: 'provider', status: 'confirmed', provider: 'PVGIS fixture' }
    },
    system: { panelWatts: 580, panelAreaSqm: 2 },
    priceBook: TEMPORARY_YOURENERGY_PRICEBOOK,
    tariffSelection: createUserTariffSelection({ rateAmdPerKwh: 52 }, '2026-08-31')
  });

test('PDF report is a self-contained escaped calculation snapshot with both charts', () => {
  const html = createCalculatorPdfReportHtml({
    analysis: createAnalysis(),
    passport: { id: 'passport-test', createdAt: '2026-08-31T12:00:00.000Z' },
    state: {
      addressNote: 'Home <private>',
      roof: null,
      consumption: null,
      userTariff: null,
      sitePotential: {
        annualYieldKwhPerKwp: 1520,
        monthlyYieldKwhPerKwp: Array(12).fill(126.67),
        orientation: { azimuthDegrees: 180, tiltDegrees: 30 }
      }
    },
    wizard: {
      pdfReport: { title: 'Solar report', inputs: 'Your inputs', results: 'Results' },
      steps: ['Property', 'Consumption', 'Roof'],
      metrics: { annualGeneration: 'Annual generation', coverage: 'Coverage' }
    },
    product: {
      passport: {
        months: Array.from({ length: 12 }, (_value, index) => ({ short: `${index + 1}` }))
      },
      ledger: { sources: {}, assumptions: {} }
    },
    locale: 'en-US'
  });

  assert.ok(html);
  assert.match(html, /<h1>Solar report<\/h1>/u);
  assert.match(html, /Home &lt;private&gt;/u);
  assert.match(html, /10,440 kWh/u);
  assert.match(html, /PVGIS reference yield/u);
  assert.match(html, /Physical DC capacity limit/u);
  assert.equal((html.match(/<rect /gu) ?? []).length, 24);
  assert.match(html, /<polyline /u);
  assert.doesNotMatch(html, /<script/iu);
});
