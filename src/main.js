import { HomeAnalysisService, AnalysisError, validateAddress } from './services/home-analysis.js';
import { enhanceRoofMap } from './services/roof-map.js';
import { createAnalysisView } from './ui/analysis-view.js';
import { initGenerationChart } from './ui/chart.js';
import { initPassportDialog } from './ui/dialogs.js';
import { initFileUpload } from './ui/file-upload.js';
import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';

document.documentElement.classList.add('js');

const readConfig = () => {
  try {
    return JSON.parse(document.querySelector('#page-config')?.textContent ?? '{}');
  } catch {
    return {};
  }
};

const config = readConfig();
const locale = config.locale ?? 'ru-RU';
const status = config.status ?? {};

initNavigation();
initPassportDialog();
initFileUpload({ status });
initScrollers();

const analysisView = createAnalysisView({ locale });
const chart = initGenerationChart({ locale, status });
const service = new HomeAnalysisService();
const form = document.querySelector('[data-address-form]');
const input = form?.querySelector('input[name="address"]');
const statusElement = document.querySelector('[data-analysis-status]');
const panel = document.querySelector('[data-result-panel]');
let activeRequest = null;
let latestAnalysis = null;
let mapController = null;

const profileStatusKey = {
  arabkir: 'profileArabkir',
  abovyan: 'profileAbovyan',
  ararat: 'profileArarat',
  yerevan: 'profileDefault'
};

const writeStatus = (message, isError = false) => {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message ?? '';
  statusElement.classList.toggle('is-error', isError);
};

const publishAnalysis = (analysis) => {
  latestAnalysis = analysis;
  analysisView.update(analysis);
  chart.update(analysis);
  mapController?.update(analysis);
  panel?.classList.remove('is-updated');
  requestAnimationFrame(() => panel?.classList.add('is-updated'));
  window.dispatchEvent(new CustomEvent('solar:analysis-updated', { detail: analysis }));
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const address = input?.value.trim() ?? '';
  if (!validateAddress(address)) {
    input?.setAttribute('aria-invalid', 'true');
    input?.classList.add('is-invalid');
    writeStatus(status.minAddress, true);
    input?.focus();
    return;
  }

  input?.removeAttribute('aria-invalid');
  input?.classList.remove('is-invalid');
  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;
  writeStatus(status.analyzing);
  form.querySelector('button[type="submit"]')?.setAttribute('aria-busy', 'true');

  try {
    const analysis = await service.analyze({ address }, { signal: controller.signal, locale });
    if (controller.signal.aborted || activeRequest !== controller) {
      return;
    }
    publishAnalysis(analysis);
    writeStatus(status[profileStatusKey[analysis.profileId]] ?? status.ready);
  } catch (error) {
    if (!(error instanceof AnalysisError) || error.code !== 'ABORTED') {
      writeStatus(status.unavailable ?? status.minAddress, true);
    }
  } finally {
    if (activeRequest === controller) {
      form.querySelector('button[type="submit"]')?.removeAttribute('aria-busy');
    }
  }
});

const mapContainer = document.querySelector('[data-leaflet-map]');
const mapShell = document.querySelector('[data-map-shell]');
const enableMap = async () => {
  if (!mapContainer || mapController) {
    return;
  }
  try {
    mapController = await enhanceRoofMap(mapContainer, config.map);
    mapController?.update(latestAnalysis);
  } catch {
    writeStatus(status.mapFailed);
  }
};

const queueMapEnhancement = () => {
  window.setTimeout(() => void enableMap(), 5000);
};

if (mapShell) {
  mapShell.addEventListener('pointerdown', () => void enableMap(), { once: true });
  window.addEventListener('load', queueMapEnhancement, { once: true });
} else {
  queueMapEnhancement();
}
