import { productsInCategory } from '../data/equipment/catalog.js';

const CATEGORY_ICONS = Object.freeze({
  'solar-panels': 'sun',
  inverters: 'zap',
  batteries: 'cycle',
  mounting: 'solar-mount',
  monitoring: 'satellite',
  'grid-inverters': 'zap',
  microinverters: 'zap',
  'home-ess': 'faq-home',
  'commercial-ess': 'chart-bars',
  'ev-chargers': 'zap',
  'system-components': 'faq-settings'
});

const HIGHLIGHT_ICONS = Object.freeze(['zap', 'shield-check', 'cycle', 'sun']);

const SPEC_LABELS = Object.freeze({
  cellOrientation: 'Схема ячеек',
  junctionBox: 'Распределительная коробка',
  glass: 'Стекло',
  frame: 'Рама',
  weight: 'Вес',
  dimensions: 'Размеры',
  operatingTemperature: 'Рабочая температура',
  maxSystemVoltage: 'Максимальное напряжение системы',
  protectionClass: 'Класс защиты',
  bifaciality: 'Бифациальность',
  frontStaticLoad: 'Фронтальная статическая нагрузка',
  rearStaticLoad: 'Тыльная статическая нагрузка',
  models: 'Модели',
  maxEfficiency: 'Максимальная эффективность',
  mpptEfficiency: 'Эффективность MPPT',
  batteryType: 'Тип батареи',
  batteryVoltageRange: 'Диапазон напряжения батареи',
  degreeOfProtection: 'Степень защиты',
  cooling: 'Охлаждение',
  warranty: 'Гарантия',
  moduleCapacity: 'Ёмкость модуля',
  maxSystemCapacity: 'Номинальная ёмкость системы',
  maxUsableCapacity: 'Полезная ёмкость системы',
  nominalVoltage: 'Номинальное напряжение',
  operatingVoltageRange: 'Рабочий диапазон напряжения',
  communication: 'Связь',
  cycleLife: 'Ресурс циклов',
  cellType: 'Тип ячеек',
  annualDegradation: 'Снижение мощности',
  material: 'Материал',
  inclination: 'Угол наклона',
  kitLength: 'Длина комплекта',
  railLength: 'Длина профиля',
  supplier: 'Поставщик',
  configuration: 'Комплектация'
});

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const createElement = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const createIcon = (icon) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  svg.classList.add('equipment-icon');
  svg.setAttribute('aria-hidden', 'true');
  use.setAttribute('href', `/icons.svg#${icon}`);
  svg.append(use);
  return svg;
};

const setProductImage = (image, placeholder, product) => {
  const showMissing = () => {
    image.hidden = true;
    placeholder.hidden = false;
  };
  image.onerror = showMissing;
  image.alt = `${product.brand} ${product.name}`;
  if (!product.image) {
    image.removeAttribute('src');
    showMissing();
    return;
  }
  image.hidden = false;
  placeholder.hidden = true;
  image.src = product.image;
};

const humanizeSpec = (key) =>
  SPEC_LABELS[key] ??
  key.replace(/([a-z])([A-Z])/gu, '$1 $2').replace(/^./u, (letter) => letter.toUpperCase());

const productCountLabel = (count) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} моделей`;
  if (last === 1) return `${count} модель`;
  if (last >= 2 && last <= 4) return `${count} модели`;
  return `${count} моделей`;
};

const getWarrantyItems = (product) => {
  const items = product.highlights.filter(({ label }) => /гарант/iu.test(label));
  if (product.specs?.warranty && !items.some(({ value }) => value === product.specs.warranty)) {
    items.push({ label: 'Гарантия производителя', value: product.specs.warranty });
  }
  return items;
};

const renderTitle = (title, target) => {
  const words = title.trim().split(/\s+/u);
  const accent = words.splice(-2).join(' ');
  target.replaceChildren(
    document.createTextNode(`${words.join(' ')} `),
    createElement('mark', '', accent)
  );
};

const renderHighlights = (product, target, { compact = false } = {}) => {
  target.replaceChildren();
  product.highlights.forEach(({ label, value }, index) => {
    const item = createElement('div', compact ? 'explorer-highlight' : 'product-highlight');
    if (!compact) item.append(createIcon(HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length]));
    const copy = createElement('span');
    copy.append(createElement('strong', '', value), createElement('small', '', label));
    item.append(copy);
    target.append(item);
  });
};

const renderHotspots = (product, target) => {
  target.replaceChildren();
  product.hotspots.forEach((hotspot, index) => {
    const button = createElement('button', 'product-hotspot');
    button.type = 'button';
    button.dataset.hotspot = hotspot.id;
    if (hotspot.position) {
      button.style.setProperty('--hotspot-x', `${hotspot.position.x}%`);
      button.style.setProperty('--hotspot-y', `${hotspot.position.y}%`);
    }
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', `${hotspot.label}: ${hotspot.text}`);

    const marker = createElement(
      'span',
      'product-hotspot__marker',
      String.fromCharCode(65 + index)
    );
    marker.setAttribute('aria-hidden', 'true');
    const card = createElement('span', 'product-hotspot__card');
    card.append(
      createElement('strong', '', hotspot.label),
      createElement('span', '', hotspot.text)
    );
    button.append(marker, card);

    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      $$('.product-hotspot', target).forEach((item) => item.setAttribute('aria-expanded', 'false'));
      button.setAttribute('aria-expanded', String(willOpen));
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });
    target.append(button);
  });
};

const renderBenefits = (product, target) => {
  const list = createElement('ul', 'equipment-benefit-list');
  (product.benefits ?? product.hotspots).forEach(({ label, text }) => {
    const item = createElement('li');
    item.append(createElement('strong', '', label), createElement('span', '', text));
    list.append(item);
  });
  target.replaceChildren(list);
};

const renderSpecs = (product, target, className = 'equipment-spec-list') => {
  const list = target.matches('dl') ? target : createElement('dl', className);
  list.className = className;
  list.replaceChildren();
  Object.entries(product.specs).forEach(([key, value]) => {
    const row = createElement('div');
    row.append(createElement('dt', '', humanizeSpec(key)), createElement('dd', '', value));
    list.append(row);
  });
  if (list !== target) target.replaceChildren(list);
};

const renderDocuments = (product, target, className = 'equipment-document-list') => {
  const list = createElement('div', className);
  product.documents.forEach(({ label, url, language, pages, sizeLabel }) => {
    const link = createElement('a');
    link.href = url;
    link.download = url.split('/').pop();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const copy = createElement('span', 'equipment-document-copy');
    copy.append(createElement('strong', '', label));
    copy.append(
      createElement(
        'small',
        '',
        ['PDF', language, pages && `${pages} стр.`, sizeLabel].filter(Boolean).join(' · ')
      )
    );
    link.append(createIcon('file'), copy, createIcon('download'));
    list.append(link);
  });
  if (product.documentsNote)
    list.append(createElement('p', 'equipment-document-note', product.documentsNote));
  target.replaceChildren(list);
};

const renderWarranty = (product, target, className = 'equipment-warranty-list') => {
  if (!getWarrantyItems(product).length) {
    target.replaceChildren(
      createElement(
        'p',
        'equipment-document-note',
        product.warrantyNote ?? 'Условия гарантии уточняются при подборе оборудования.'
      )
    );
    return;
  }
  const list = createElement('dl', className);
  getWarrantyItems(product).forEach(({ label, value }) => {
    const row = createElement('div');
    row.append(createElement('dt', '', label), createElement('dd', '', value));
    list.append(row);
  });
  target.replaceChildren(list);
};

const closeAccordion = (button, panel, gsap, animated) => {
  button.setAttribute('aria-expanded', 'false');
  if (!animated) {
    panel.hidden = true;
    panel.style.height = '';
    return;
  }
  gsap.to(panel, {
    height: 0,
    opacity: 0,
    duration: 0.24,
    ease: 'power2.inOut',
    onComplete: () => {
      panel.hidden = true;
      panel.style.height = '';
    }
  });
};

const openAccordion = (button, panel, gsap, animated) => {
  button.setAttribute('aria-expanded', 'true');
  panel.hidden = false;
  if (!animated) return;
  gsap.fromTo(
    panel,
    { height: 0, opacity: 0 },
    { height: 'auto', opacity: 1, duration: 0.32, ease: 'power2.out', clearProps: 'height' }
  );
};

const initAccordions = (root, gsap, animated) => {
  $$('[data-accordion-trigger]', root).forEach((button) => {
    const panel = $(`[data-accordion-panel="${button.dataset.accordionTrigger}"]`, root);
    if (!panel) return;
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      $$('[data-accordion-trigger]', root).forEach((otherButton) => {
        if (otherButton === button || otherButton.getAttribute('aria-expanded') !== 'true') return;
        const otherPanel = $(
          `[data-accordion-panel="${otherButton.dataset.accordionTrigger}"]`,
          root
        );
        if (otherPanel) closeAccordion(otherButton, otherPanel, gsap, animated);
      });
      if (isOpen) closeAccordion(button, panel, gsap, animated);
      else openAccordion(button, panel, gsap, animated);
    });
  });
};

const setAccordionCopy = (copy) => {
  $('[data-accordion-label="benefits"]').textContent = copy.product.keyBenefits;
  $('[data-accordion-label="specs"]').textContent = copy.product.technicalSpecs;
  $('[data-accordion-label="documents"]').textContent = copy.product.documents;
  $('[data-accordion-label="warranty"]').textContent = copy.product.warranty;
};

const renderExplorer = (product, copy, explorer) => {
  setProductImage(
    $('[data-explorer-image]', explorer),
    $('[data-explorer-image-missing]', explorer),
    product
  );
  $('[data-explorer-brand]', explorer).textContent = product.brand;
  $('[data-explorer-name]', explorer).textContent = product.name;
  $('[data-explorer-model]', explorer).textContent = `${product.model} · ${product.powerRange}`;
  $('[data-explorer-description]', explorer).textContent = product.shortDescription;
  $('[data-explorer-image-note]', explorer).textContent = product.imageNote ?? '';
  $('[data-explorer-image-note]', explorer).hidden = !product.imageNote;
  $('[data-explorer-specs-title]', explorer).textContent = copy.product.technicalSpecs;
  $('[data-explorer-warranty-title]', explorer).textContent = copy.product.warranty;
  renderHotspots(product, $('[data-explorer-hotspots]', explorer));
  renderHighlights(product, $('[data-explorer-highlights]', explorer), { compact: true });
  renderSpecs(product, $('[data-explorer-specs]', explorer), 'product-explorer__specs');
  renderWarranty(product, $('[data-explorer-warranty]', explorer), 'product-explorer__warranty');
  renderDocuments(
    product,
    $('[data-explorer-documents]', explorer),
    'product-explorer__document-list'
  );
};

const preloadProducts = (products) => {
  products
    .filter(({ image }) => image)
    .slice(0, 3)
    .forEach(({ image }) => {
      const preload = new Image();
      preload.src = image;
    });
};

export const initEquipmentShowroom = ({ data, copy, gsap }) => {
  const root = $('[data-equipment-showroom]');
  if (!root || !data?.products?.length) return;

  const products = data.products.filter((product) => product?.id);
  const categories = data.categories ?? [];
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryList = $('[data-category-list]', root);
  const railCategories = $('[data-rail-categories]', root);
  const productTrack = $('[data-product-track]', root);
  const productViewport = $('[data-product-viewport]', root);
  const productSelect = $('[data-product-select]', root);
  const productVisual = $('[data-product-visual]', root);
  const panelContent = $('[data-panel-content]', root);
  const explorer = $('[data-product-explorer]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !reducedMotion;
  let selectedProduct = products[0];
  let switching = false;
  let renderedCategory = null;
  const lastProductByCategory = new Map();

  root.style.setProperty('--equipment-background', `url("${data.hero.background}")`);
  renderTitle(copy.page.title, $('[data-page-title]', root));
  $('[data-page-subtitle]', root).textContent = copy.page.subtitle;
  $('[data-product-popular]', root).textContent = copy.product.popular;
  $('[data-request-price]', root).textContent = copy.product.requestPrice;
  $('[data-download-pdf]', root).textContent = copy.product.downloadPdf;
  $('[data-rotate-hint-text]', root).textContent = copy.product.rotateHint;
  $('[data-fullscreen-open]', root).setAttribute('aria-label', copy.product.openFullscreen);
  $('[data-fullscreen-open]', root).title = copy.product.openFullscreen;
  setAccordionCopy(copy);

  const selectCategory = (categoryId) => {
    const categoryProduct =
      productById.get(lastProductByCategory.get(categoryId)) ??
      products.find((product) => product.category === categoryId);
    if (categoryProduct) selectProduct(categoryProduct.id);
  };

  const renderCategories = () => {
    categoryList.replaceChildren();
    railCategories.replaceChildren();
    categories.forEach((category) => {
      const categoryProducts = productsInCategory(products, category.id);
      const button = createElement('button', 'equipment-category');
      button.type = 'button';
      button.dataset.category = category.id;
      button.disabled = !category.enabled || categoryProducts.length === 0;
      button.setAttribute('aria-pressed', String(selectedProduct.category === category.id));
      const icon = createElement('span', 'equipment-category__icon');
      icon.append(createIcon(CATEGORY_ICONS[category.id] ?? 'sun'));
      const text = createElement('span', 'equipment-category__copy');
      text.append(
        createElement('strong', '', category.label),
        createElement(
          'small',
          '',
          categoryProducts.length ? productCountLabel(categoryProducts.length) : ''
        )
      );
      button.append(icon, text);
      if (!button.disabled) button.addEventListener('click', () => selectCategory(category.id));
      categoryList.append(button);

      if (category.enabled && categoryProducts.length) {
        const tab = createElement('button', 'product-rail__tab', category.label);
        tab.type = 'button';
        tab.dataset.railCategory = category.id;
        tab.setAttribute('aria-pressed', String(selectedProduct.category === category.id));
        tab.addEventListener('click', () => selectCategory(category.id));
        railCategories.append(tab);
      }
    });
  };

  const renderRail = () => {
    productTrack.replaceChildren();
    productSelect.replaceChildren();
    const categoryProducts = productsInCategory(products, selectedProduct.category);
    categoryProducts.forEach((product) => {
      const option = createElement(
        'option',
        '',
        `${product.brand} ${product.name} · ${product.powerRange}`
      );
      option.value = product.id;
      productSelect.append(option);
      const card = createElement('button', 'product-card');
      card.type = 'button';
      card.dataset.productId = product.id;
      card.setAttribute('aria-pressed', String(product.id === selectedProduct.id));
      card.setAttribute('aria-label', `${product.brand} ${product.name}, ${product.powerRange}`);

      const imageWrap = createElement('span', 'product-card__image');
      if (product.image) {
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = '';
        image.loading = product.id === selectedProduct.id ? 'eager' : 'lazy';
        image.decoding = 'async';
        imageWrap.append(image);
      } else imageWrap.append(createElement('span', 'product-card__no-image', 'Фото позже'));

      const copyWrap = createElement('span', 'product-card__copy');
      copyWrap.append(
        createElement('small', '', product.brand),
        createElement('strong', '', product.name),
        createElement('span', '', product.powerRange)
      );
      const arrow = createElement('span', 'product-card__arrow');
      arrow.append(createIcon('arrow-right'));
      card.append(imageWrap, copyWrap, arrow);
      card.addEventListener('click', () => selectProduct(product.id));
      productTrack.append(card);
    });
    renderedCategory = selectedProduct.category;
    preloadProducts(categoryProducts);
    const single = categoryProducts.length < 2;
    $('[data-product-previous]', root).disabled = single;
    $('[data-product-next]', root).disabled = single;
  };

  const syncNavigationState = () => {
    productSelect.value = selectedProduct.id;
    const categoryProducts = productsInCategory(products, selectedProduct.category);
    $('[data-category-product-count]', root).textContent =
      `${categoryProducts.findIndex(({ id }) => id === selectedProduct.id) + 1} / ${categoryProducts.length}`;
    $$('[data-category]', root).forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.category === selectedProduct.category)
      );
    });
    $$('[data-rail-category]', root).forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.railCategory === selectedProduct.category)
      );
    });
    $$('[data-product-id]', root).forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.productId === selectedProduct.id));
    });
    const selectedCard = $(`[data-product-id="${selectedProduct.id}"]`, root);
    if (selectedCard) {
      productViewport.scrollTo({
        left:
          selectedCard.offsetLeft -
          Math.max(0, (productViewport.clientWidth - selectedCard.clientWidth) / 2),
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    }
  };

  const renderProduct = () => {
    const product = selectedProduct;
    lastProductByCategory.set(product.category, product.id);
    if (renderedCategory !== product.category) renderRail();
    const image = $('[data-product-image]', root);
    setProductImage(image, $('[data-product-image-missing]', root), product);
    $('[data-product-image-note]', root).textContent = product.imageNote ?? '';
    $('[data-product-image-note]', root).hidden = !product.imageNote;
    $('[data-product-popular]', root).textContent = product.badge ?? copy.product.popular;
    $('[data-product-brand]', root).textContent = product.brand;
    $('[data-product-brand]', root).dataset.brand = product.brand.toLowerCase();
    $('[data-product-name]', root).textContent = product.name;
    $('[data-product-model]', root).textContent = product.model;
    $('[data-product-power]', root).textContent = product.powerRange;
    $('[data-product-description]', root).textContent = product.shortDescription;
    $('[data-pdf-link]', root).href = product.datasheetPdf;
    $('[data-pdf-link]', root).download = product.datasheetPdf.split('/').pop();
    $('[data-download-pdf]', root).textContent = product.downloadLabel ?? copy.product.downloadPdf;
    $('[data-document-count]', root).textContent = `${product.documents.length} PDF`;
    renderHighlights(product, $('[data-product-highlights]', root));
    renderHotspots(product, $('[data-hotspots]', root));
    renderBenefits(product, $('[data-accordion-panel="benefits"]', root));
    renderSpecs(product, $('[data-accordion-panel="specs"]', root));
    renderDocuments(product, $('[data-accordion-panel="documents"]', root));
    renderWarranty(product, $('[data-accordion-panel="warranty"]', root));
    renderExplorer(product, copy, explorer);
    $('[data-product-status]', root).textContent = `${product.brand} ${product.name}`;
    root.dataset.productCategory = product.category;
    syncNavigationState();
  };

  function selectProduct(productId) {
    const product = productById.get(productId);
    if (!product || product.id === selectedProduct.id || switching) return;
    switching = true;

    const finishSwitch = () => {
      selectedProduct = product;
      renderProduct();
      if (!animate) {
        switching = false;
        return;
      }
      gsap.fromTo(
        productVisual,
        { autoAlpha: 0, scale: 0.93, rotateY: -5, y: 12 },
        { autoAlpha: 1, scale: 1, rotateY: 0, y: 0, duration: 0.66, ease: 'power3.out' }
      );
      gsap.fromTo(
        panelContent,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          delay: 0.08,
          ease: 'power2.out',
          onComplete: () => {
            switching = false;
          }
        }
      );
      gsap.from('.product-hotspot', {
        scale: 0.55,
        autoAlpha: 0,
        stagger: 0.06,
        duration: 0.42,
        delay: 0.18,
        ease: 'back.out(1.6)'
      });
    };

    if (!animate) {
      finishSwitch();
      return;
    }
    gsap.to(productVisual, {
      autoAlpha: 0,
      scale: 0.94,
      rotateY: 4,
      y: 8,
      duration: 0.26,
      ease: 'power2.in'
    });
    gsap.to(panelContent, {
      autoAlpha: 0,
      y: -8,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: finishSwitch
    });
  }

  const stepProduct = (direction) => {
    const categoryProducts = productsInCategory(products, selectedProduct.category);
    const index = categoryProducts.findIndex(({ id }) => id === selectedProduct.id);
    selectProduct(
      categoryProducts[(index + direction + categoryProducts.length) % categoryProducts.length].id
    );
  };

  productSelect.addEventListener('change', () => selectProduct(productSelect.value));

  $('[data-product-previous]', root).addEventListener('click', () => stepProduct(-1));
  $('[data-product-next]', root).addEventListener('click', () => stepProduct(1));
  productViewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault();
    if (event.key === 'ArrowLeft') stepProduct(-1);
    if (event.key === 'ArrowRight') stepProduct(1);
  });

  const openExplorer = () => {
    renderExplorer(selectedProduct, copy, explorer);
    document.body.classList.add('has-product-explorer');
    if (typeof explorer.showModal === 'function') explorer.showModal();
    else explorer.setAttribute('open', '');
    if (animate) {
      gsap.fromTo(
        $('.product-explorer__layout', explorer),
        { autoAlpha: 0, scale: 0.975, y: 18 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  };

  const closeExplorer = () => {
    document.body.classList.remove('has-product-explorer');
    if (typeof explorer.close === 'function') explorer.close();
    else explorer.removeAttribute('open');
  };

  $('[data-fullscreen-open]', root).addEventListener('click', openExplorer);
  $('[data-fullscreen-close]', explorer).addEventListener('click', closeExplorer);
  explorer.addEventListener('cancel', () => document.body.classList.remove('has-product-explorer'));
  explorer.addEventListener('click', (event) => {
    if (event.target === explorer) closeExplorer();
  });

  renderCategories();
  renderProduct();
  initAccordions(root, gsap, animate);
  root.setAttribute('aria-busy', 'false');

  if (animate) {
    gsap.set(root, { autoAlpha: 1 });
    gsap.from('[data-intro] > *', {
      autoAlpha: 0,
      x: -18,
      stagger: 0.07,
      duration: 0.72,
      ease: 'power3.out'
    });
    gsap.from(productVisual, {
      autoAlpha: 0,
      y: 24,
      scale: 0.93,
      rotateY: -4,
      duration: 1,
      delay: 0.12,
      ease: 'power3.out'
    });
    gsap.from('[data-product-panel]', {
      autoAlpha: 0,
      x: 26,
      duration: 0.82,
      delay: 0.2,
      ease: 'power3.out'
    });
    gsap.from('[data-product-rail]', {
      autoAlpha: 0,
      y: 22,
      duration: 0.72,
      delay: 0.32,
      ease: 'power3.out'
    });
  }
};
