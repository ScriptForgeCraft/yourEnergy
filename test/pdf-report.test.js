import assert from 'node:assert/strict';
import test from 'node:test';

import wizardCopy from '../src/content/calculator-wizard.js';
import { createCalculatorPdfReportHtml } from '../src/ui/calculator/pdf-report.js';

const months = [
  'Հնվ',
  'Փտր',
  'Մրտ',
  'Ապր',
  'Մյս',
  'Հնս',
  'Հլս',
  'Օգս',
  'Սեպ',
  'Հոկ',
  'Նոյ',
  'Դեկ'
].map((short) => ({ short }));

const createOptions = () => ({
  analysis: {
    property: { coordinates: { lat: 40.1813, lng: 44.51388 } },
    consumption: { annualKwh: 6454, mode: 'bill' },
    roof: {
      areaSqm: 118.9,
      usableAreaRatio: 0.7,
      orientationDegrees: 180,
      tiltDegrees: 30,
      mountingMode: 'parallel'
    },
    production: { annualYieldKwhPerKwp: 1411 },
    environmental: { avoidedCo2Tons: 1.01 },
    equipmentRecommendation: {
      solarModule: { panelBrand: 'LONGi', panelModel: 'LR7-72HVDF', watts: 650 },
      inverter: { brand: 'SolaX', productName: 'X1-HYB-LV', selectedAcPowerKw: 4 }
    },
    selectedScenario: {
      limitations: [],
      system: { capacityKwp: 3.9, panelCount: 6, panelWatts: 650, panelAreaSqm: 2.77 },
      generation: {
        annualKwh: 5504,
        monthlyKwh: [295, 360, 428, 472, 536, 574, 605, 598, 553, 448, 366, 268]
      },
      energyBalance: { annualConsumptionKwh: 6454, annualGenerationKwh: 5504 },
      coveragePercent: 85,
      financial: {
        annualSavingsAmd: 255811,
        paybackYears: 3,
        grossSavings25YearsAmd: 6395276
      },
      commercialEstimate: {
        available: true,
        primaryAmd: 760000,
        rangeAmd: { p25: 710000, p75: 810000 }
      }
    }
  },
  passport: { id: 'passport-20260925100140877-1', createdAt: '2026-09-25T10:01:00.000Z' },
  state: {
    addressNote: 'Home <private>',
    storageRequired: true,
    consumption: { annualKwh: 6454, mode: 'bill' },
    userTariff: { rateAmdPerKwh: 46.48 },
    sitePotential: {
      annualYieldKwhPerKwp: 1481,
      monthlyYieldKwhPerKwp: [81, 99, 116, 126, 141, 150, 160, 160, 150, 123, 101, 74],
      orientation: { azimuthDegrees: 182, tiltDegrees: 35 }
    }
  },
  wizard: wizardCopy.hy,
  product: { passport: { months } },
  locale: 'hy-AM'
});

test('PDF report renders the approved four-page A4 structure', () => {
  const html = createCalculatorPdfReportHtml(createOptions());

  assert.ok(html);
  assert.equal((html.match(/class="pdf-page pdf-page--/gu) ?? []).length, 4);
  assert.match(html, /@page \{ size: A4; margin: 0; \}/u);
  assert.match(html, /3\.9 kWp/u);
  assert.match(html, /5,504 kWh/u);
  assert.match(html, /1,481 kWh\/kWp\/տարի/u);
  assert.match(html, /30 մոդուլ/u);
  assert.match(html, /19\.5 kWp/u);
  assert.match(html, /data-monthly-chart="production"/u);
  assert.match(html, /data-monthly-chart="pvgis"/u);
  assert.equal((html.match(/data-monthly-bar=/gu) ?? []).length, 24);
  assert.doesNotMatch(html, /<polyline/iu);
  assert.doesNotMatch(html, /<script/iu);
  assert.doesNotMatch(html, /about:blank/iu);
});

test('Armenian PDF localizes internal input values and roof-specific yield', () => {
  const html = createCalculatorPdfReportHtml(createOptions());

  assert.match(html, /Միջին հաշիվ/u);
  assert.doesNotMatch(html, />bill</u);
  assert.match(html, /Տանիքի գնահատված տեսակարար արտադրություն/u);
  assert.doesNotMatch(html, /Տանիքի գնահատված yield/iu);
  assert.doesNotMatch(html, /CAPEX_REQUIRED/u);
  assert.doesNotMatch(html, /SURPLUS_COMPENSATION_NOT_CONFIGURED/u);
  assert.doesNotMatch(html, /VERIFIED_HISTORICAL_GRID_FACTOR_2022/u);
});

test('PDF report escapes localized copy before rendering HTML', () => {
  const options = createOptions();
  options.wizard = {
    ...options.wizard,
    pdfReport: {
      ...options.wizard.pdfReport,
      title: '<b>Unsafe title</b>',
      subtitle: 'A & B'
    }
  };

  const html = createCalculatorPdfReportHtml(options);

  assert.match(html, /&lt;b&gt;Unsafe title&lt;\/b&gt;/u);
  assert.match(html, /A &amp; B/u);
  assert.doesNotMatch(html, /<b>Unsafe title<\/b>/u);
});
