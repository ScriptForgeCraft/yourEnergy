const hashName = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return window.location.hash.slice(1);
  }
};

const updateHash = (value) => {
  const url = new URL(window.location.href);
  url.hash = value;
  window.history.pushState(null, '', url);
};

export const initFaq = () => {
  const page = document.querySelector('[data-faq-page]');
  if (!page) return;

  const faqArea = page.querySelector('[data-faq-answers]');
  const search = page.querySelector('[data-faq-search]');
  const noResults = page.querySelector('[data-faq-no-results]');
  const title = page.querySelector('[data-faq-results-title]');
  const count = page.querySelector('[data-faq-results-count]');
  const categories = [...page.querySelectorAll('[data-faq-category]')];
  const items = [...page.querySelectorAll('[data-faq-item]')];
  const categoryIds = new Set(categories.map((category) => category.dataset.faqCategory));
  let activeCategory = 'all';
  let syncingLocation = false;

  const categoryButton = (id) =>
    categories.find((category) => category.dataset.faqCategory === id) ?? categories[0];

  const closeItems = (except = null) => {
    items.forEach((item) => {
      if (item !== except) item.open = false;
    });
  };

  const render = () => {
    const query = search?.value.trim().toLocaleLowerCase() ?? '';
    const activeButton = categoryButton(activeCategory);
    let visibleCount = 0;

    categories.forEach((category) => {
      const active = category === activeButton;
      category.classList.toggle('is-active', active);
      category.setAttribute('aria-pressed', String(active));
    });

    items.forEach((item) => {
      const matchesCategory =
        Boolean(query) || activeCategory === 'all' || item.dataset.faqCategory === activeCategory;
      const matchesQuery = !query || item.textContent.toLocaleLowerCase().includes(query);
      const visible = matchesCategory && matchesQuery;
      item.hidden = !visible;
      if (visible) {
        visibleCount += 1;
        const number = item.querySelector('[data-faq-number]');
        if (number) number.textContent = String(visibleCount);
      }
    });

    if (title)
      title.textContent =
        (query ? categoryButton('all') : activeButton)?.dataset.faqCategoryLabel ?? '';
    if (count) count.textContent = String(visibleCount);
    if (noResults) noResults.hidden = visibleCount !== 0;
  };

  const scrollToTarget = (target) => {
    window.requestAnimationFrame(() => {
      const destination = target ?? faqArea;
      destination?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    });
  };

  const syncFromLocation = ({ scroll = false } = {}) => {
    const hash = hashName();
    const categoryHash = hash.match(/^category-([a-z-]+)$/u)?.[1];
    const question = hash.match(/^faq-([a-z-]+)$/u)?.[1];
    const targetItem = question ? items.find((item) => item.dataset.faqId === question) : null;

    syncingLocation = true;
    if (targetItem) {
      activeCategory = targetItem.dataset.faqCategory;
      closeItems(targetItem);
      targetItem.open = true;
    } else {
      activeCategory = categoryIds.has(categoryHash) ? categoryHash : 'all';
      closeItems();
    }
    render();
    syncingLocation = false;

    if (scroll && (targetItem || categoryHash)) scrollToTarget(targetItem ?? faqArea);
  };

  categories.forEach((category) => {
    category.addEventListener('click', () => {
      const nextCategory = category.dataset.faqCategory;
      if (!categoryIds.has(nextCategory)) return;
      activeCategory = nextCategory;
      syncingLocation = true;
      closeItems();
      render();
      syncingLocation = false;
      updateHash(`category-${nextCategory}`);
      scrollToTarget(faqArea);
    });
  });

  search?.addEventListener('input', render);

  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (syncingLocation) return;
      const id = item.dataset.faqId;
      if (!id) return;

      if (item.open) {
        syncingLocation = true;
        closeItems(item);
        syncingLocation = false;
        updateHash(`faq-${id}`);
      } else if (hashName() === `faq-${id}`) {
        updateHash(`category-${activeCategory}`);
      }
    });
  });

  window.addEventListener('hashchange', () => syncFromLocation({ scroll: true }));
  window.addEventListener('popstate', () => syncFromLocation({ scroll: true }));
  syncFromLocation({ scroll: Boolean(hashName()) });
};
