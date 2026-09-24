const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const initReveal = (page) => {
  const items = [...page.querySelectorAll('[data-about-reveal]')];
  if (!items.length) return;

  if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -7% 0px' }
  );

  items.forEach((item) => observer.observe(item));
};

const initHeroParallax = (page) => {
  if (reducedMotion()) return;

  const hero = page.querySelector('.about-hero');
  const media = page.querySelector('.about-hero__media');
  if (!hero || !media) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    if (window.scrollY > hero.offsetTop + hero.offsetHeight) return;
    const offset = Math.min(22, Math.max(0, window.scrollY * 0.04));
    media.style.setProperty('--about-parallax', `${offset}px`);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
};

const initPartnerRail = (page) => {
  const track = page.querySelector('[data-about-partners-track]');
  const buttons = [...page.querySelectorAll('[data-about-partners-direction]')];
  if (!track || !buttons.length) return;

  const sync = () => {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    buttons.forEach((button) => {
      const direction = Number(button.dataset.aboutPartnersDirection);
      button.disabled =
        max <= 1 || (direction < 0 ? track.scrollLeft <= 1 : track.scrollLeft >= max - 1);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.aboutPartnersDirection);
      track.scrollBy({
        left: direction * Math.max(280, track.clientWidth * 0.7),
        behavior: reducedMotion() ? 'auto' : 'smooth'
      });
    });
  });

  track.addEventListener('scroll', sync, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(sync).observe(track);
  sync();
};

const initCertificationLightbox = (page) => {
  const lightbox = document.querySelector('[data-about-lightbox]');
  const image = lightbox?.querySelector('[data-about-lightbox-image]');
  const caption = lightbox?.querySelector('[data-about-lightbox-caption]');
  const close = lightbox?.querySelector('[data-about-lightbox-close]');
  const previous = lightbox?.querySelector('[data-about-lightbox-previous]');
  const next = lightbox?.querySelector('[data-about-lightbox-next]');
  const items = [...page.querySelectorAll('[data-about-certification-item]')];

  if (
    !(lightbox instanceof HTMLDialogElement) ||
    !image ||
    !caption ||
    !close ||
    !previous ||
    !next ||
    !items.length
  )
    return;

  let currentIndex = 0;

  const showItem = (index) => {
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];

    image.src = item.dataset.src ?? '';
    image.alt = item.dataset.alt ?? '';
    caption.textContent = item.dataset.caption ?? '';
  };

  const closeLightbox = () => {
    if (lightbox.open) lightbox.close();
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => {
      showItem(index);
      lightbox.showModal();
    });
  });

  close.addEventListener('click', closeLightbox);
  previous.addEventListener('click', () => showItem(currentIndex - 1));
  next.addEventListener('click', () => showItem(currentIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showItem(currentIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showItem(currentIndex + 1);
    }
  });
};

export const initAboutMotion = () => {
  const page = document.querySelector('[data-about-page]');
  if (!page) return;

  initReveal(page);
  initHeroParallax(page);
  initPartnerRail(page);
  initCertificationLightbox(page);
};
