import { initPassportDialog } from './ui/dialogs.js';
import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';

document.documentElement.classList.add('js');

initNavigation();
initPassportDialog();
initScrollers();
