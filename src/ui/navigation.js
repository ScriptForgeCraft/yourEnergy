export const initNavigation = () => {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-mobile-menu]');
  const menuSummary = menu?.querySelector('summary');
  const menuBackdrop = menu?.querySelector('[data-mobile-menu-backdrop]');
  const languageMenu = header?.querySelector('.language-menu');
  const desktopNav = header?.querySelector('.desktop-nav');
  const headerActions = header?.querySelector('.header-actions');
  const documentElement = document.documentElement;
  const processDesktop = window.matchMedia(
    '(min-width: 1181px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)'
  );

  let processRequested = false;
  let menuCloseTimer = 0;

  const isProcessChromeActive = () => documentElement.classList.contains('process-chrome-active');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);

  const updateMenuState = () => {
    const open = Boolean(menu?.open);
    const lockPage = open && isProcessChromeActive();
    documentElement.classList.toggle('site-menu-open', lockPage);
    menuSummary?.setAttribute('aria-expanded', String(open));
  };

  const finishMenuClose = ({ restoreFocus = false } = {}) => {
    window.clearTimeout(menuCloseTimer);
    menuCloseTimer = 0;
    if (menu) {
      menu.open = false;
      menu.classList.remove('is-closing');
    }
    updateMenuState();
    if (restoreFocus) menuSummary?.focus({ preventScroll: true });
  };

  const closeMenu = ({ restoreFocus = false, animate = isProcessChromeActive() } = {}) => {
    if (!menu?.open) return;
    if (!animate) {
      finishMenuClose({ restoreFocus });
      return;
    }

    if (menu.classList.contains('is-closing')) return;
    menu.classList.add('is-closing');
    menuCloseTimer = window.setTimeout(() => finishMenuClose({ restoreFocus }), 220);
  };

  const applyProcessChrome = () => {
    const active = processRequested && processDesktop.matches;
    documentElement.classList.toggle('process-chrome-active', active);
    header?.classList.toggle('is-process-mode', active);

    [desktopNav, headerActions].forEach((element) => {
      if (!element) return;
      element.inert = active;
      if (active) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
    });

    if (active && languageMenu?.open) languageMenu.open = false;
    if (!active) closeMenu({ animate: false });
    else updateMenuState();
  };

  const onProcessChrome = (event) => {
    processRequested = Boolean(event.detail?.active);
    applyProcessChrome();
  };

  updateHeader();
  updateMenuState();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('solar:process-chrome', onProcessChrome);
  processDesktop.addEventListener('change', applyProcessChrome);

  menu?.addEventListener('toggle', () => {
    if (menu.open) menu.classList.remove('is-closing');
    updateMenuState();
  });

  menuSummary?.addEventListener('click', (event) => {
    if (!isProcessChromeActive()) return;
    event.preventDefault();
    if (menu?.open) closeMenu({ restoreFocus: true });
    else if (menu) {
      menu.classList.remove('is-closing');
      menu.open = true;
      updateMenuState();
    }
  });

  menuBackdrop?.addEventListener('click', () => closeMenu({ restoreFocus: true }));

  menu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu({ animate: false }));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }
  });
};
