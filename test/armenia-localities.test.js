import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARMENIA_LOCALITIES,
  localitiesForRegion,
  localityCenter
} from '../src/data/locations/armenia.js';

test('locality picker offers only places from the selected Armenian region', () => {
  assert.equal(Object.keys(ARMENIA_LOCALITIES).length, 11);
  assert.deepEqual(localitiesForRegion('lori').slice(-2), ['Шаумян', 'Туманян']);
  assert.equal(localitiesForRegion('yerevan').includes('Кентрон'), true);
  assert.equal(localitiesForRegion('lori').includes('Кентрон'), false);
  assert.deepEqual(localitiesForRegion('unknown-region'), []);
  assert.deepEqual(localityCenter('lori', 'Шаумян'), { lat: 40.77482, lng: 44.54596 });
  for (const [region, localities] of Object.entries(ARMENIA_LOCALITIES)) {
    for (const locality of localities) {
      assert.notEqual(localityCenter(region, locality), null, `${region}: ${locality}`);
    }
  }
});
