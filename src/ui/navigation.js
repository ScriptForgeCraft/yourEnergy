export const initNavigation = () => {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-mobile-menu]');
  const menuSummary = menu?.querySelector('summary');
  const menuBackdrop = menu?.querySelector('[data-mobile-menu-backdrop]');
  const languageMenu = header?.querySelector('.language-menu');
  const desktopNav = header?.querySelector('.desktop-nav');
  const headerActions = header?.querySelector('.header-actions');
  const homeLinks = header?.querySelectorAll('[data-home-link]') ?? [];
  const documentElement = document.documentElement;
  const page = document.body;
  const usesConditionalMobileHeader = page?.matches(
    '.page-equipment, .blog-page, .calculator-page'
  );
  const compactScreen = window.matchMedia('(max-width: 680px)');
  const processDesktop = window.matchMedia(
    '(min-width: 1181px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)'
  );

  let processRequested = false;
  let menuCloseTimer = 0;
  let headerModeFrame = 0;

  const isProcessChromeActive = () => documentElement.classList.contains('process-chrome-active');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 10);

  const updateMobileHeaderMode = () => {
    if (!usesConditionalMobileHeader || !page) return;
    const headerIsFixed = page.classList.contains('has-mobile-fixed-header');
    const contentHeight =
      documentElement.scrollHeight - (headerIsFixed ? 0 : (header?.offsetHeight ?? 0));
    page.classList.toggle(
      'has-mobile-fixed-header',
      compactScreen.matches && contentHeight > window.innerHeight * 3
    );
  };

  const scheduleMobileHeaderMode = () => {
    if (!usesConditionalMobileHeader || headerModeFrame) return;
    headerModeFrame = window.requestAnimationFrame(() => {
      headerModeFrame = 0;
      updateMobileHeaderMode();
    });
  };

  const updateMenuState = () => {
    const open = Boolean(menu?.open);
    const lockPage = open && isProcessChromeActive();
    documentElement.classList.toggle('site-menu-open', lockPage);
    menuSummary?.setAttribute('aria-expanded', String(open));
  };

  const returnToHomeTop = (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    const destination = new URL(event.currentTarget.href, window.location.href);
    const current = window.location;
    const isCurrentHomeDocument =
      !destination.hash &&
      destination.origin === current.origin &&
      destination.pathname === current.pathname &&
      destination.search === current.search;
    if (!isCurrentHomeDocument) return;

    // A link to the current home URL is otherwise a no-op. In particular,
    // it leaves the pinned #process experience active instead of returning
    // visitors to the beginning of the page.
    event.preventDefault();
    window.history.replaceState(
      window.history.state,
      '',
      `${destination.pathname}${destination.search}`
    );

    const previousScrollBehavior = documentElement.style.scrollBehavior;
    documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });
    window.requestAnimationFrame(() => {
      documentElement.style.scrollBehavior = previousScrollBehavior;
    });
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
  updateMobileHeaderMode();
  updateMenuState();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', scheduleMobileHeaderMode, { passive: true });
  compactScreen.addEventListener('change', scheduleMobileHeaderMode);
  if (usesConditionalMobileHeader && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(scheduleMobileHeaderMode).observe(page);
  }
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
  homeLinks.forEach((link) => link.addEventListener('click', returnToHomeTop));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && languageMenu?.open) {
      event.preventDefault();
      languageMenu.open = false;
      languageMenu.querySelector('summary')?.focus();
    }
    if (event.key === 'Escape' && menu?.open) {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
    }
  });
  document.addEventListener('click', (event) => {
    if (languageMenu?.open && !languageMenu.contains(event.target)) languageMenu.open = false;
  });
  languageMenu?.addEventListener('focusout', (event) => {
    if (!languageMenu.contains(event.relatedTarget)) languageMenu.open = false;
  });
};
