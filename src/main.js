import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';
import { initOfferCheckerWorkspace } from './tools.js';

document.documentElement.classList.add('js');

const readConfig = () => {
  try {
    return JSON.parse(
      document.querySelector('#page-config, #home-page-config')?.textContent ?? '{}'
    );
  } catch {
    return {};
  }
};

const config = readConfig();

initNavigation();
initScrollers();

if (document.querySelector('[data-home-hero]')) {
  void import('./ui/home-motion.js').then(({ initHomeMotion }) => initHomeMotion({ config }));
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
