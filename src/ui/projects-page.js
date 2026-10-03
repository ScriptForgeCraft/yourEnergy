const grid = document.querySelector('[data-projects-grid]');
const toolbar = document.querySelector('[data-projects-toolbar]');
const PROJECTS_PER_PAGE = 20;

if (grid && toolbar) {
  const cards = [...grid.querySelectorAll('[data-project-card]')];
  const categoryButtons = [...toolbar.querySelectorAll('[data-project-filter]')];
  const regionSelect = toolbar.querySelector('[data-project-region]');
  const sortSelect = toolbar.querySelector('[data-project-sort]');
  const emptyState = document.querySelector('[data-projects-empty]');
  const pagination = document.querySelector('[data-projects-pagination]');
  const previousPageButton = pagination?.querySelector('[data-projects-page-previous]');
  const nextPageButton = pagination?.querySelector('[data-projects-page-next]');
  const pageStatus = pagination?.querySelector('[data-projects-page-status]');
  const originalOrder = new Map(cards.map((card, index) => [card, index]));

  let category = 'all';
  let region = 'all';
  let sort = 'default';

  let currentPage = 1;

  const numericData = (card, key) => Number(card.dataset[key] || 0);

  const sortCards = () => {
    const ordered = [...cards].sort((a, b) => {
      if (sort === 'power') return numericData(b, 'power') - numericData(a, 'power');
      if (sort === 'production') return numericData(b, 'production') - numericData(a, 'production');
      return originalOrder.get(a) - originalOrder.get(b);
    });
    for (const card of ordered) grid.append(card);
  };

  const pageStatusText = (start, end, total) => {
    const template = pagination?.dataset.statusTemplate || 'Showing {start}–{end} of {total}';
    return template
      .replace('{start}', String(start))
      .replace('{end}', String(end))
      .replace('{total}', String(total));
  };

  const applyFilters = ({ resetPage = false } = {}) => {
    if (resetPage) currentPage = 1;
    sortCards();
    const matchingCards = cards.filter((card) => {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const regionMatch = region === 'all' || card.dataset.region === region;
      return categoryMatch && regionMatch;
    });
    const totalPages = Math.max(1, Math.ceil(matchingCards.length / PROJECTS_PER_PAGE));
    currentPage = Math.min(currentPage, totalPages);
    const firstCard = (currentPage - 1) * PROJECTS_PER_PAGE;
    const lastCard = firstCard + PROJECTS_PER_PAGE;
    const currentCards = new Set(matchingCards.slice(firstCard, lastCard));

    for (const card of cards) card.hidden = !currentCards.has(card);

    if (emptyState) emptyState.hidden = matchingCards.length !== 0;
    if (pagination) pagination.hidden = matchingCards.length <= PROJECTS_PER_PAGE;
    if (previousPageButton) previousPageButton.disabled = currentPage === 1;
    if (nextPageButton) nextPageButton.disabled = currentPage === totalPages;
    if (pageStatus && matchingCards.length) {
      pageStatus.textContent = pageStatusText(
        firstCard + 1,
        Math.min(lastCard, matchingCards.length),
        matchingCards.length
      );
    } else if (pageStatus) {
      pageStatus.textContent = '';
    }
  };

  for (const button of categoryButtons) {
    button.addEventListener('click', () => {
      category = button.dataset.projectFilter || 'all';
      for (const item of categoryButtons) {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      }
      applyFilters({ resetPage: true });
    });
  }

  regionSelect?.addEventListener('change', () => {
    region = regionSelect.value || 'all';
    applyFilters({ resetPage: true });
  });

  sortSelect?.addEventListener('change', () => {
    sort = sortSelect.value || 'default';
    applyFilters({ resetPage: true });
  });

  previousPageButton?.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    applyFilters();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  nextPageButton?.addEventListener('click', () => {
    currentPage += 1;
    applyFilters();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  applyFilters();
}
