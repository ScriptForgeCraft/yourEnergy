const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const initAboutMotion = () => {
  const page = document.querySelector('[data-about-page]');
  if (!page) return;

  const revealItems = [...page.querySelectorAll('[data-about-reveal]')];
  if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8%', threshold: 0.08 }
  );

  revealItems.forEach((item) => observer.observe(item));

  const hero = page.querySelector('.about-hero');
  const media = page.querySelector('.about-hero__media');
  if (!hero || !media) return;

  let ticking = false;
  const updateParallax = () => {
    ticking = false;
    const offset = Math.min(26, Math.max(0, window.scrollY * 0.055));
    media.style.setProperty('--about-parallax', `${offset}px`);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateParallax);
    },
    { passive: true }
  );
  updateParallax();
};
