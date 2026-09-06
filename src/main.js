import { initCalculatorWizard } from './ui/calculator-wizard.js';
import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';
import { initOfferCheckerWorkspace } from './tools.js';

document.documentElement.classList.add('js');

const readConfig = () => {
  try {
    return JSON.parse(document.querySelector('#page-config')?.textContent ?? '{}');
  } catch {
    return {};
  }
};

const config = readConfig();

initNavigation();
initScrollers();

if (document.querySelector('[data-calculator-wizard]')) {
  initCalculatorWizard({ config });
}

if (document.querySelector('[data-offer-checker]')) {
  initOfferCheckerWorkspace(config.offerChecker);
}
