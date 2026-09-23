import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { createAsyncRequestLifecycle } from '../src/ui/async-request-lifecycle.js';

const root = resolve(import.meta.dirname, '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

const deferred = () => {
  let resolve;
  const promise = new Promise((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

test('a delayed Quick response cannot overwrite Professional state after a mode switch', async () => {
  const quick = createAsyncRequestLifecycle();
  const professional = createAsyncRequestLifecycle();
  const request = quick.createController();
  const currentQuickRequest = request;
  const session = { quickAnalysis: null, professionalAnalysis: { scope: 'manual-roof-plane' } };
  const response = deferred();

  const pendingQuickWrite = response.promise.then((analysis) => {
    if (quick.canCommit(request, currentQuickRequest)) session.quickAnalysis = analysis;
  });

  // Switching to Professional destroys the prior Quick UI before replacing it.
  quick.destroy();
  assert.equal(request.signal.aborted, true);
  assert.equal(professional.isActive(), true);
  response.resolve({ scope: 'regional-preliminary' });
  await pendingQuickWrite;

  assert.equal(session.quickAnalysis, null);
  assert.deepEqual(session.professionalAnalysis, { scope: 'manual-roof-plane' });
});

test('a delayed Professional response cannot overwrite Quick state after a mode switch', async () => {
  const professional = createAsyncRequestLifecycle();
  const quick = createAsyncRequestLifecycle();
  const request = professional.createController();
  const currentProfessionalRequest = request;
  const session = { quickAnalysis: { scope: 'regional-preliminary' }, professionalAnalysis: null };
  const response = deferred();

  const pendingProfessionalWrite = response.promise.then((analysis) => {
    if (professional.canCommit(request, currentProfessionalRequest))
      session.professionalAnalysis = analysis;
  });

  // Switching back to Quick destroys the property-level calculator first.
  professional.destroy();
  assert.equal(request.signal.aborted, true);
  assert.equal(quick.isActive(), true);
  response.resolve({ scope: 'manual-roof-plane' });
  await pendingProfessionalWrite;

  assert.deepEqual(session.quickAnalysis, { scope: 'regional-preliminary' });
  assert.equal(session.professionalAnalysis, null);
});

test('request ownership prevents an earlier same-mode response from committing after a newer request', async () => {
  const lifecycle = createAsyncRequestLifecycle();
  const first = lifecycle.createController();
  const second = lifecycle.createController();
  const currentRequest = second;
  const response = deferred();
  let committed = false;

  const pending = response.promise.then(() => {
    if (lifecycle.canCommit(first, currentRequest)) committed = true;
  });

  first.abort();
  response.resolve();
  await pending;

  assert.equal(committed, false);
  assert.equal(lifecycle.canCommit(second, currentRequest), true);
});

test('Back and Forward teardown keeps every abandoned calculator response inert', async () => {
  const quickOnBack = createAsyncRequestLifecycle();
  const professionalOnForward = createAsyncRequestLifecycle();
  const quickRequest = quickOnBack.createController();
  const professionalRequest = professionalOnForward.createController();
  const session = { quickAnalysis: null, professionalAnalysis: null };
  const quickResponse = deferred();
  const professionalResponse = deferred();

  const writes = Promise.all([
    quickResponse.promise.then((analysis) => {
      if (quickOnBack.canCommit(quickRequest, quickRequest)) session.quickAnalysis = analysis;
    }),
    professionalResponse.promise.then((analysis) => {
      if (professionalOnForward.canCommit(professionalRequest, professionalRequest))
        session.professionalAnalysis = analysis;
    })
  ]);

  // A popstate render destroys the UI it leaves, just like a mode-control click.
  quickOnBack.destroy();
  professionalOnForward.destroy();
  quickResponse.resolve({ scope: 'regional-preliminary' });
  professionalResponse.resolve({ scope: 'manual-roof-plane' });
  await writes;

  assert.deepEqual(session, { quickAnalysis: null, professionalAnalysis: null });
});

test('calculator instances expose destroy and the mode manager tears down before a DOM replacement', async () => {
  const [quick, professional, modes] = await Promise.all([
    source('src/ui/quick-calculator.js'),
    source('src/ui/calculator-wizard.js'),
    source('src/ui/calculator-mode.js')
  ]);

  assert.match(quick, /return \{ session, clearAnalysis, destroy \}/u);
  assert.match(professional, /getSelectedBillFile: \(\) => fileUpload\.getFile\(\), destroy/u);
  assert.match(quick, /lifecycle\.canCommit\(controller, request\)/u);
  assert.match(professional, /lifecycle\.canCommit\(controller, analysisRequest\)/u);
  assert.match(modes, /currentInstance\?\.destroy\?\.\(\)/u);
  assert.match(modes, /const epoch = \+\+renderEpoch;\s+destroyCurrentInstance\(\);/u);
  assert.match(modes, /stage\.replaceChildren\(\);\s+const markup = await loadProfessionalMarkup/u);
  assert.match(modes, /window\.addEventListener\('popstate', onPopstate\)/u);
  assert.match(modes, /window\.removeEventListener\('popstate', onPopstate\)/u);
});
