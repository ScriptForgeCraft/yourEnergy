export const initNavigation = () => {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-mobile-menu]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.open = false;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
};
