import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';
import { initOfferCheckerWorkspace } from './tools.js';

document.documentElement.classList.add('js');

const readConfig = (selector = '#page-config, #home-page-config') => {
  try {
    return JSON.parse(document.querySelector(selector)?.textContent ?? '{}');
  } catch {
    return {};
  }
};

const config = readConfig();
const processConfig = readConfig('#process-page-config');

initNavigation();
initScrollers();

if (document.querySelector('[data-home-hero]')) {
  void import('./ui/home-motion.js').then(({ initHomeMotion }) => initHomeMotion({ config }));
}

const processStory = document.querySelector('[data-process-story]');

if (processStory) {
  let storyStarted = false;
  const loadProcessStory = () => {
    if (storyStarted) return;
    storyStarted = true;
    void import('./ui/process-story.js').then(({ initProcessStory }) => {
      initProcessStory({ config: { ...config, ...processConfig } });
      if (window.location.hash === '#process') {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => processStory.scrollIntoView({ block: 'start' }));
        });
      }
    });
  };

  if (window.location.hash === '#process' || typeof IntersectionObserver === 'undefined') {
    loadProcessStory();
  } else {
    const storyObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        storyObserver.disconnect();
        loadProcessStory();
      },
      { rootMargin: '800px 0px' }
    );
    storyObserver.observe(processStory);
  }
}

if (document.querySelector('[data-quick-calculator]')) {
  void import('./ui/quick-calculator.js').then(({ initQuickCalculator }) =>
    initQuickCalculator({ config })
  );
}

if (document.querySelector('[data-roof-refinement]')) {
  void import('./ui/roof-refinement.js').then(({ initRoofRefinement }) =>
    initRoofRefinement({ config })
  );
}

if (document.querySelector('[data-professional-calculator]')) {
  void import('./ui/calculator-wizard.js').then(({ initCalculatorWizard }) =>
    initCalculatorWizard({ config })
  );
}

if (document.querySelector('[data-offer-checker]')) {
  initOfferCheckerWorkspace(config.offerChecker);
}
