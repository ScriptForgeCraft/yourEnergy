import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProfessionalLeadContext,
  validateProfessionalLeadForm
} from '../src/ui/professional-lead.js';

test('Professional lead form validates contact fields before an engineer handoff', () => {
  assert.equal(validateProfessionalLeadForm({ name: 'A', phone: '+374 91 095950' }).valid, false);
  assert.equal(
    validateProfessionalLeadForm({ name: 'Arman', phone: 'invalid', email: 'a@example.test' })
      .field,
    'phone'
  );
  assert.equal(
    validateProfessionalLeadForm({ name: 'Arman', phone: '+374 91 095950', email: 'invalid' })
      .field,
    'email'
  );
  assert.deepEqual(
    validateProfessionalLeadForm({
      name: ' Arman  Petrosyan ',
      phone: '+374 91 095950',
      email: ' arman@example.test ',
      message: ' Please call after 18:00 '
    }),
    {
      valid: true,
      field: null,
      values: {
        name: 'Arman Petrosyan',
        phone: '+374 91 095950',
        email: 'arman@example.test',
        message: 'Please call after 18:00'
      }
    }
  );
});

test('Professional lead context includes entered inputs, calculated result and equipment', () => {
  const context = buildProfessionalLeadContext({
    state: {
      addressNote: 'Arabkir, Yerevan',
      confirmedProperty: { lat: 40.20512, lng: 44.51234 },
      consumption: { mode: 'usage', averageMonthlyKwh: 540 },
      userTariff: { rateAmdPerKwh: 46.48 },
      roof: {
        areaMethod: 'map-projected',
        areaSqm: 40,
        tiltDegrees: 30,
        orientationDegrees: 180,
        mountingMode: 'roof-parallel',
        points: [
          { lat: 40.2051, lng: 44.5123 },
          { lat: 40.2052, lng: 44.5124 },
          { lat: 40.205, lng: 44.5125 }
        ]
      },
      storageRequired: true
    },
    analysis: {
      property: { coordinates: { lat: 40.20512, lng: 44.51234 } },
      consumption: { annualKwh: 6480 },
      roof: {
        areaSqm: 42.4,
        orientationDegrees: 180,
        tiltDegrees: 30,
        mountingMode: 'roof-parallel'
      },
      production: { annualYieldKwhPerKwp: 1495, source: { provider: 'PVGIS' } },
      environmental: { avoidedCo2Tons: 2.2 },
      equipment: { panelBrand: 'LONGi', panelModel: 'Hi-MO X10', panelWatts: 650 },
      inverterRecommendation: { brand: 'SolaX', productName: 'X3-MIC', selectedAcPowerKw: 4 },
      mountingHardwareRecommendation: {
        brand: 'K2',
        productName: 'Roof mount',
        practicalInclinationDeg: 30
      },
      selectedScenario: {
        system: { capacityKwp: 7.15, panelCount: 11, panelWatts: 650 },
        generation: { annualKwh: 10686, monthlyKwh: Array(12).fill(890.5) },
        energyBalance: {
          annualConsumptionKwh: 6480,
          offsetEnergyKwh: 6480,
          surplusEnergyKwh: 4206
        },
        coveragePercent: 164.9,
        financial: { annualSavingsAmd: 302120 }
      }
    }
  });

  assert.equal(context.kind, 'professional');
  assert.deepEqual(context.property, {
    address: 'Arabkir, Yerevan',
    latitude: 40.20512,
    longitude: 44.51234
  });
  assert.equal(context.consumption.annualKwh, 6480);
  assert.equal(context.roof.areaSqm, 42.4);
  assert.equal(context.roof.outlinePoints.length, 3);
  assert.equal(context.result.panelCount, 11);
  assert.equal(context.result.monthlyGenerationKwh.length, 12);
  assert.equal(context.equipment.solarModule, 'LONGi Hi-MO X10 · 650 W');
  assert.equal(context.equipment.inverter, 'SolaX X3-MIC · 4 kW AC');
  assert.equal('billFileName' in context, false);
});
