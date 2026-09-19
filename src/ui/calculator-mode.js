const isProfessionalUrl = () => new URL(window.location.href).searchParams.get('mode') === 'pro';

const setModeUrl = (mode) => {
  const url = new URL(window.location.href);
  if (mode === 'professional') url.searchParams.set('mode', 'pro');
  else url.searchParams.delete('mode');
  return url;
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

  const initializeQuick = async (render, { replace = false } = {}) => {
    if (replace) stage.innerHTML = quickMarkup;
    const { initQuickCalculator } = await import('./quick-calculator.js');
    initQuickCalculator({ config });
    bindModeControls(render);
  };

  const loadProfessionalMarkup = async () => {
    if (professionalMarkup) return professionalMarkup;
    const response = await fetch(professionalSource, {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' }
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
  };

  const render = async (mode) => {
    stage.setAttribute('aria-busy', 'true');
    try {
      if (mode !== 'professional') {
        await initializeQuick(render, { replace: true });
        return;
      }
      const markup = await loadProfessionalMarkup();
      stage.innerHTML = `${markup.main}${markup.passport}`;
      const { initCalculatorWizard } = await import('./calculator-wizard.js');
      initCalculatorWizard({ config });
      bindModeControls(render);
    } catch {
      stage.replaceChildren(
        errorView(
          modeCopy.unavailable ?? 'Professional mode is temporarily unavailable.',
          quickHref,
          modeCopy.quick ?? 'Quick & Easy'
        )
      );
    } finally {
      stage.removeAttribute('aria-busy');
    }
  };

  window.addEventListener('popstate', () => {
    void render(isProfessionalUrl() ? 'professional' : 'quick');
  });

  await render(isProfessionalUrl() ? 'professional' : 'quick');
  return { render };
};
