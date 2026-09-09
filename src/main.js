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
const journeyConfig = readConfig('#journey-page-config');

initNavigation();
initScrollers();

if (document.querySelector('[data-home-hero]')) {
  void import('./ui/home-motion.js').then(({ initHomeMotion }) => initHomeMotion({ config }));
}

const solutionsStory = document.querySelector('[data-solutions-story]');

if (solutionsStory) {
  let storyStarted = false;
  const loadSolutionsStory = () => {
    if (storyStarted) return;
    storyStarted = true;
    void Promise.all([
      import('swiper/css'),
      import('swiper/css/effect-fade'),
      import('./ui/solutions-story.js')
    ]).then(([, , { initSolutionsStory }]) =>
      initSolutionsStory({ config: { ...config, ...journeyConfig } })
    );
  };

  if (typeof IntersectionObserver === 'undefined') {
    loadSolutionsStory();
  } else {
    const storyObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        storyObserver.disconnect();
        loadSolutionsStory();
      },
      { rootMargin: '800px 0px' }
    );
    storyObserver.observe(solutionsStory);
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
