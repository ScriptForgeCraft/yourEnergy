import { initCalculatorMode } from './calculator-mode.js';

const readConfig = () => {
  try {
    return JSON.parse(document.querySelector('#page-config')?.textContent ?? '{}');
  } catch {
    return {};
  }
};

// This page-specific entry is discovered with the document instead of waiting
// for main.js to load and issue a second dynamic import. It lets a direct
// Professional URL request its shell and stylesheet on the first module turn.
void initCalculatorMode({ config: readConfig() });
