import { gsap } from 'gsap';

const reveal = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = [...document.querySelectorAll('[data-blog-reveal]')];
  if (!items.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        gsap.fromTo(
          entry.target,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.52, ease: 'power2.out' }
        );
      });
    },
    { rootMargin: '0px 0px -5%' }
  );
  items.forEach((item) => observer.observe(item));
};

const initCatalog = () => {
  const page = document.querySelector('[data-blog-page]');
  if (!page) return;
  const search = page.querySelector('[data-blog-search]');
  const cards = [...page.querySelectorAll('[data-blog-card]')];
  const filters = [...page.querySelectorAll('[data-blog-filter]')];
  const noResults = page.querySelector('[data-blog-no-results]');
  let category = 'all';

  const render = () => {
    const query = search?.value.trim().toLocaleLowerCase() ?? '';
    let matched = 0;
    cards.forEach((card) => {
      const visible =
        (category === 'all' || card.dataset.category === category) &&
        (!query || card.dataset.search?.includes(query));
      card.hidden = !visible;
      if (visible) matched += 1;
    });
    if (noResults) noResults.hidden = matched !== 0;
  };

  search?.addEventListener('input', render);
  filters.forEach((filter) =>
    filter.addEventListener('click', () => {
      category = filter.dataset.blogFilter ?? 'all';
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      render();
    })
  );

  const grid = page.querySelector('[data-blog-grid]');
  const viewButtons = [...page.querySelectorAll('[data-blog-view]')];
  viewButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const list = button.dataset.blogView === 'list';
      grid?.classList.toggle('is-list', list);
      viewButtons.forEach((viewButton) => {
        const active = viewButton === button;
        viewButton.classList.toggle('is-active', active);
        viewButton.setAttribute('aria-pressed', String(active));
      });
    })
  );
};

export const initBlog = () => {
  initCatalog();
  reveal();
};
