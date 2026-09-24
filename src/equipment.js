import { gsap } from 'gsap';
import { EQUIPMENT_COPY } from './data/equipment/showroom/translations.js';
import { createEquipmentCatalog } from './data/equipment/showroom/catalog.js';
import { initEquipmentShowroom } from './ui/equipment-showroom.js';
import { initNavigation } from './ui/navigation.js';

document.documentElement.classList.add('js');

initNavigation();
const locale = document.documentElement.lang.split('-')[0];
const copy = EQUIPMENT_COPY[locale] ?? EQUIPMENT_COPY.hy;
initEquipmentShowroom({ data: createEquipmentCatalog(locale), copy, locale, gsap });
