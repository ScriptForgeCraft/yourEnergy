const isProfessionalUrl = () => new URL(window.location.href).searchParams.get('mode') === 'pro';

const setModeUrl = (mode) => {
  const url = new URL(window.location.href);
  if (mode === 'professional') url.searchParams.set('mode', 'pro');
  else url.searchParams.delete('mode');
  return url;
};

const syncLanguageLinks = (mode) => {
  document.querySelectorAll('.language-link').forEach((link) => {
    const url = new URL(link.getAttribute('href') ?? '', window.location.href);
    // Calculator language links are rendered in the document header, outside
    // the mode stage. Keep the selected mode when the header stays mounted.
    if (!/\/calculator\/?$/u.test(url.pathname)) return;
    if (mode === 'professional') url.searchParams.set('mode', 'pro');
    else url.searchParams.delete('mode');
    link.href = `${url.pathname}${url.search}${url.hash}`;
  });
};

const errorView = (message, quickHref, quickLabel) => {
  const section = document.createElement('section');
  section.className = 'section calculator-mode-error';
  const container = document.createElement('div');
  container.className = 'container calculator-mode-error__card';
  const title = document.createElement('h1');
  title.textContent = message;
  const link = document.createElement('a');
  link.className = 'button button--outline';
  link.href = quickHref;
  link.textContent = quickLabel;
  container.append(title, link);
  section.append(container);
  return section;
};

/**
 * The public calculator starts with only its Quick markup. Professional
 * controls are fetched only after an explicit mode choice, preserving the
 * fast initial payload and avoiding an eager Leaflet import.
 */
export const initCalculatorMode = async ({ config = {} } = {}) => {
  const stage = document.querySelector('[data-calculator-mode-stage]');
  if (!stage) return null;

  const quickMarkup = stage.innerHTML;
  const professionalSource = stage.dataset.professionalSource;
  const quickHref = new URL('.', window.location.href).pathname;
  const modeCopy = config.modeControl ?? {};
  let professionalMarkup = null;
  let professionalMarkupRequest = null;
  let currentInstance = null;
  let renderEpoch = 0;
  let destroyed = false;

  const destroyCurrentInstance = () => {
    currentInstance?.destroy?.();
    currentInstance = null;
  };

  const isCurrentRender = (epoch) => !destroyed && epoch === renderEpoch;

  const stopProfessionalMarkupLoad = () => {
    professionalMarkupRequest?.abort();
    professionalMarkupRequest = null;
  };

  const bindModeControls = (render) => {
    stage.querySelectorAll('[data-calculator-mode]').forEach((control) => {
      control.addEventListener('click', (event) => {
        const targetMode = control.dataset.calculatorMode;
        if (!targetMode || control.getAttribute('aria-current') === 'page') return;
        event.preventDefault();
        const next = setModeUrl(targetMode);
        window.history.pushState({ calculatorMode: targetMode }, '', next);
        void render(targetMode);
      });
    });
  };

  const initializeQuick = async (render, epoch, { replace = false } = {}) => {
    if (!isCurrentRender(epoch)) return;
    if (replace) stage.innerHTML = quickMarkup;
    const { initQuickCalculator } = await import('./quick-calculator.js');
    if (!isCurrentRender(epoch)) return;
    currentInstance = initQuickCalculator({ config });
    bindModeControls(render);
  };

  const loadProfessionalMarkup = async () => {
    if (professionalMarkup) return professionalMarkup;
    stopProfessionalMarkupLoad();
    const controller = new AbortController();
    professionalMarkupRequest = controller;
    try {
      const response = await fetch(professionalSource, {
        credentials: 'same-origin',
        headers: { Accept: 'text/html' },
        signal: controller.signal
      });
      if (!response.ok)
        throw new Error(`Professional calculator request failed (${response.status})`);
      const documentFragment = new DOMParser().parseFromString(await response.text(), 'text/html');
      const main = documentFragment.querySelector('main');
      if (!main?.innerHTML) throw new Error('Professional calculator markup is unavailable.');
      professionalMarkup = {
        main: main.innerHTML,
        passport: documentFragment.querySelector('[data-passport-dialog]')?.outerHTML ?? ''
      };
      return professionalMarkup;
    } finally {
      if (professionalMarkupRequest === controller) professionalMarkupRequest = null;
    }
  };

  const render = async (mode) => {
    const epoch = ++renderEpoch;
    destroyCurrentInstance();
    stopProfessionalMarkupLoad();
    if (!isCurrentRender(epoch)) return;
    stage.setAttribute('aria-busy', 'true');
    document.body.classList.toggle('calculator-page--professional', mode === 'professional');
    document.body.classList.toggle('calculator-page--quick', mode !== 'professional');
    syncLanguageLinks(mode);
    try {
      if (mode !== 'professional') {
        await initializeQuick(render, epoch, { replace: true });
        return;
      }
      // Detach the retired Quick controls while the Professional markup is
      // loading. Their instance has already been destroyed above.
      stage.replaceChildren();
      const markup = await loadProfessionalMarkup();
      if (!isCurrentRender(epoch)) return;
      stage.innerHTML = `${markup.main}${markup.passport}`;
      const { initCalculatorWizard } = await import('./calculator-wizard.js');
      if (!isCurrentRender(epoch)) return;
      currentInstance = initCalculatorWizard({ config });
      bindModeControls(render);
    } catch {
      if (!isCurrentRender(epoch)) return;
      stage.replaceChildren(
        errorView(
          modeCopy.unavailable ?? 'Professional mode is temporarily unavailable.',
          quickHref,
          modeCopy.quick ?? 'Quick & Easy'
        )
      );
    } finally {
      if (isCurrentRender(epoch)) stage.removeAttribute('aria-busy');
    }
  };

  const onPopstate = () => {
    void render(isProfessionalUrl() ? 'professional' : 'quick');
  };
  window.addEventListener('popstate', onPopstate);

  await render(isProfessionalUrl() ? 'professional' : 'quick');
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    renderEpoch += 1;
    destroyCurrentInstance();
    stopProfessionalMarkupLoad();
    window.removeEventListener('popstate', onPopstate);
  };
  return { render, destroy };
};
