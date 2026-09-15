import { gsap } from 'gsap';
import equipmentCopy from './data/equipment/equipment-copy.ru.json';
import { equipmentCatalog as equipmentData } from './data/equipment/catalog.js';
import { initEquipmentShowroom } from './ui/equipment-showroom.js';
import { initNavigation } from './ui/navigation.js';

document.documentElement.classList.add('js');

initNavigation();
initEquipmentShowroom({ data: equipmentData, copy: equipmentCopy, gsap });
