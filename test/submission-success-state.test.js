import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { calculatorModes } from '../src/content/calculator-modes.js';
import calculatorWizardCopy from '../src/content/calculator-wizard.js';
import { contactPageCopy } from '../src/content/contacts.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

const successCopy = Object.freeze({
  hy: Object.freeze({
    title: 'Շնորհակալություն։ Ձեր հայտը ուղարկված է։',
    text: 'Ինժեները շուտով կկապվի ձեզ հետ։',
    close: 'Փակել'
  }),
  ru: Object.freeze({
    title: 'Спасибо! Ваша заявка отправлена.',
    text: 'Инженер скоро свяжется с вами.',
    close: 'Закрыть'
  }),
  en: Object.freeze({
    title: 'Thank you! Your request has been sent.',
    text: 'An engineer will contact you shortly.',
    close: 'Close'
  })
});

test('every lead surface uses the same complete success copy in HY, RU and EN', () => {
  for (const locale of Object.keys(successCopy)) {
    assert.deepEqual(contactPageCopy[locale].success, successCopy[locale]);
    assert.deepEqual(contactPageCopy[locale].meeting.success, successCopy[locale]);
    assert.deepEqual(calculatorModes[locale].quick.lead.success, successCopy[locale]);
    assert.deepEqual(calculatorWizardCopy[locale].lead.success, successCopy[locale]);
  }
});

test('each data-submission form replaces its pre-submit UI only after API success', async () => {
  const [
    contactTemplate,
    contactController,
    meetingController,
    quickTemplate,
    quickController,
    professionalTemplate,
    professionalController
  ] = await Promise.all([
    source('src/templates/contacts.hbs'),
    source('src/ui/contact-form.js'),
    source('src/ui/meeting-scheduler.js'),
    source('src/templates/calculator-quick.hbs'),
    source('src/ui/quick-calculator.js'),
    source('src/templates/calculator.hbs'),
    source('src/ui/calculator-wizard.js')
  ]);

  for (const marker of [
    'data-contact-pre-submit',
    'data-contact-success',
    'data-contact-success-close',
    'data-meeting-flow',
    'data-meeting-success',
    'data-meeting-success-close'
  ]) {
    assert.ok(contactTemplate.includes(marker), `contact and meeting markup is missing ${marker}`);
  }
  for (const marker of [
    'data-quick-lead-content',
    'data-quick-lead-success',
    'data-quick-lead-dismiss'
  ]) {
    assert.ok(quickTemplate.includes(marker), `quick lead markup is missing ${marker}`);
  }
  for (const marker of [
    'data-professional-lead-content',
    'data-professional-lead-success',
    'data-professional-lead-dismiss'
  ]) {
    assert.ok(professionalTemplate.includes(marker), `professional lead markup is missing ${marker}`);
  }

  assert.match(contactController, /await api\.submitLead[\s\S]*preSubmit\.hidden = true/u);
  assert.match(meetingController, /await api\.submitLead[\s\S]*flow\.hidden = true/u);
  assert.match(quickController, /await api\.submitLead[\s\S]*leadContent\.hidden = true/u);
  assert.match(
    professionalController,
    /await api\.submitLead[\s\S]*professionalLeadContent\.hidden = true/u
  );
});

test('lead failures preserve form access and every close path resets the completed state', async () => {
  const [contactController, meetingController, quickController, professionalController] = await Promise.all([
    source('src/ui/contact-form.js'),
    source('src/ui/meeting-scheduler.js'),
    source('src/ui/quick-calculator.js'),
    source('src/ui/calculator-wizard.js')
  ]);

  assert.match(contactController, /setStatus\(copy\.unavailable, true\)/u);
  assert.match(contactController, /successClose\?\.addEventListener\('click', reset\)/u);
  assert.match(contactController, /complete = false/u);
  assert.match(meetingController, /setStatus\(copy\.unavailable, true\)/u);
  assert.match(meetingController, /successClose\?\.addEventListener\('click', closeDialog\)/u);
  assert.match(meetingController, /resetDialog\(\);/u);
  assert.match(quickController, /setLeadStatus\(copy\.lead\?\.unavailable, true\)/u);
  assert.match(quickController, /leadComplete = false/u);
  assert.match(professionalController, /setProfessionalLeadStatus\(wizard\.lead\?\.unavailable, true\)/u);
  assert.match(professionalController, /professionalLeadComplete = false/u);
});
