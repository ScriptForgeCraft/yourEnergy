const grid = document.querySelector('[data-projects-grid]');
const toolbar = document.querySelector('[data-projects-toolbar]');

if (grid && toolbar) {
  const cards = [...grid.querySelectorAll('[data-project-card]')];
  const categoryButtons = [...toolbar.querySelectorAll('[data-project-filter]')];
  const regionSelect = toolbar.querySelector('[data-project-region]');
  const sortSelect = toolbar.querySelector('[data-project-sort]');
  const emptyState = document.querySelector('[data-projects-empty]');
  const originalOrder = new Map(cards.map((card, index) => [card, index]));

  let category = 'all';
  let region = 'all';
  let sort = 'default';


  const numericData = (card, key) => Number(card.dataset[key] || 0);

  const sortCards = () => {
    const ordered = [...cards].sort((a, b) => {
      if (sort === 'power') return numericData(b, 'power') - numericData(a, 'power');
      if (sort === 'production')
        return numericData(b, 'production') - numericData(a, 'production');
      return originalOrder.get(a) - originalOrder.get(b);
    });
    for (const card of ordered) grid.append(card);
  };

  const applyFilters = () => {
    sortCards();
    let visible = 0;
    for (const card of cards) {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const regionMatch = region === 'all' || card.dataset.region === region;
      const show = categoryMatch && regionMatch;
      card.hidden = !show;
      if (show) visible += 1;
    }
    if (emptyState) emptyState.hidden = visible !== 0;
  };

  for (const button of categoryButtons) {
    button.addEventListener('click', () => {
      category = button.dataset.projectFilter || 'all';
      for (const item of categoryButtons) {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      }
      applyFilters();
    });
  }

  regionSelect?.addEventListener('change', () => {
    region = regionSelect.value || 'all';
    applyFilters();
  });

  sortSelect?.addEventListener('change', () => {
    sort = sortSelect.value || 'default';
    applyFilters();
  });

}
