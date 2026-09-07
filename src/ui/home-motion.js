import { initHeroAnalysisCard } from './hero-analysis-card.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const heroTimeProfiles = Object.freeze([
  { hour: 8, sunX: '39%', sunY: '57%' },
  { hour: 12, sunX: '54%', sunY: '34%' },
  { hour: 14, sunX: '65%', sunY: '19%' },
  { hour: 16, sunX: '75%', sunY: '13%' },
  { hour: 18, sunX: '87%', sunY: '17%' },
  { hour: 20, sunX: '96%', sunY: '29%' }
]);

const heroImageWidths = [640, 1024, 1600];

/**
 * Chooses from the supplied illustrative day-cycle frames using only the
 * visitor's local browser clock. This is visual storytelling, not an
 * astronomical calculation or a claim about sunlight at a specific property.
 */
export const getHeroTimeProfile = (date = new Date()) => {
  const hour = date?.getHours?.();
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return heroTimeProfiles.at(-1);
  if (hour < 8) return heroTimeProfiles[5];
  if (hour >= 8 && hour < 10) return heroTimeProfiles[0];
  if (hour < 13) return heroTimeProfiles[1];
  if (hour < 15) return heroTimeProfiles[2];
  if (hour < 17) return heroTimeProfiles[3];
  if (hour < 19) return heroTimeProfiles[4];
  return heroTimeProfiles[5];
};

export const getHeroTimeSrcset = (hour, extension) =>
  heroImageWidths
    .map((width) => `/images/hero-time-${hour}-${width}.${extension} ${width}w`)
    .join(', ');

export const getHeroCounterTarget = (value) => {
  const source = typeof value === 'number' ? value : String(value ?? '').trim();
  if (source === '') return null;
  const target = Number(source);
  return Number.isFinite(target) ? target : null;
};

const initHeroTime = (hero) => {
  const image = hero.querySelector('[data-hero-time-image]');
  const sources = [...hero.querySelectorAll('[data-hero-time-source]')];
  if (!image || sources.length === 0) return () => {};

  let timer = 0;

  const update = () => {
    const profile = getHeroTimeProfile();
    hero.dataset.heroTime = String(profile.hour);
    setProperty(hero, '--hero-sun-x', profile.sunX);
    setProperty(hero, '--hero-sun-y', profile.sunY);

    for (const source of sources) {
      const extension = source.dataset.heroTimeSource;
      source.srcset = getHeroTimeSrcset(profile.hour, extension);
    }
    image.srcset = getHeroTimeSrcset(profile.hour, 'jpg');
    image.src = `/images/hero-time-${profile.hour}-1600.jpg`;
  };

  const scheduleUpdate = () => {
    window.clearTimeout(timer);
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 1, 0);
    timer = window.setTimeout(
      () => {
        update();
        scheduleUpdate();
      },
      Math.max(nextHour.getTime() - now.getTime(), 1000)
    );
  };

  update();
  scheduleUpdate();

  return () => window.clearTimeout(timer);
};

/**
 * Keeps animation policy testable and ensures touch/reduced-motion visitors
 * receive the same content without ornamental interaction.
 */
export const resolveHomeMotionCapabilities = ({
  reducedMotion = false,
  viewportWidth = 0
} = {}) => ({
  enabled: !reducedMotion,
  bridge: !reducedMotion && viewportWidth >= 860
});

const setProperty = (target, property, value) => target.style.setProperty(property, value);

const initHeroCounters = (hero, reducedMotion) => {
  const counters = [...hero.querySelectorAll('[data-hero-countup]')]
    .map((element) => ({
      element,
      original: element.textContent.trim(),
      target: getHeroCounterTarget(element.dataset.heroCountupValue),
      decimals: Math.max(0, Number.parseInt(element.dataset.heroCountupDecimals ?? '0', 10) || 0)
    }))
    .filter(({ target }) => target !== null);
  if (reducedMotion || counters.length === 0) return () => {};

  let frame = 0;
  const startTimer = window.setTimeout(() => {
    const startedAt = window.performance.now();
    const format = new Intl.NumberFormat(document.documentElement.lang || undefined);

    const step = (now) => {
      const progress = Math.min((now - startedAt) / 920, 1);
      const eased = 1 - (1 - progress) ** 3;
      for (const counter of counters) {
        const multiplier = 10 ** counter.decimals;
        const value = Math.round(counter.target * eased * multiplier) / multiplier;
        counter.element.textContent =
          progress === 1
            ? counter.original
            : format.format(value, {
                minimumFractionDigits: counter.decimals,
                maximumFractionDigits: counter.decimals
              });
      }
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
  }, 420);

  return () => {
    window.clearTimeout(startTimer);
    window.cancelAnimationFrame(frame);
  };
};

export const initHomeMotion = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-home-story]');
  const hero = document.querySelector('[data-home-hero]');
  const passport = document.querySelector('[data-passport-bridge]');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!root || !hero || !passport) return () => {};

  const disposeHeroTime = initHeroTime(hero);
  let disposeHeroCounters = () => {};
  const disposeHeroAnalysisCard = initHeroAnalysisCard({
    hero,
    copy: config.hero,
    locale: config.locale,
    onRender: () => {
      disposeHeroCounters();
      disposeHeroCounters = initHeroCounters(hero, reducedMotionQuery.matches);
    }
  });
  let animationFrame = 0;
  let capabilities = resolveHomeMotionCapabilities({
    reducedMotion: reducedMotionQuery.matches,
    viewportWidth: window.innerWidth
  });

  const resetBridge = () => {
    setProperty(root, '--story-copy-y', '0px');
    setProperty(root, '--story-copy-opacity', '1');
    setProperty(root, '--story-dashboard-y', '0px');
    setProperty(root, '--story-dashboard-opacity', '1');
    setProperty(root, '--story-dashboard-scale', '1');
    setProperty(root, '--passport-card-y', '0px');
    setProperty(root, '--passport-card-opacity', '1');
    setProperty(root, '--bridge-dashoffset', '1');
  };

  const updateBridge = () => {
    if (!capabilities.bridge) {
      resetBridge();
      return;
    }

    const heroBounds = hero.getBoundingClientRect();
    const viewportHeight = Math.max(window.innerHeight, 1);
    const progress = clamp((viewportHeight - heroBounds.bottom) / (viewportHeight * 0.9));
    setProperty(root, '--story-copy-y', `${-Math.round(progress * 36)}px`);
    setProperty(root, '--story-copy-opacity', `${1 - progress * 0.24}`);
    setProperty(root, '--story-dashboard-y', `${Math.round(progress * 58)}px`);
    setProperty(root, '--story-dashboard-opacity', `${1 - progress * 0.56}`);
    setProperty(root, '--story-dashboard-scale', `${1 + progress * 0.035}`);
    setProperty(root, '--passport-card-y', `${Math.round((1 - progress) * 36)}px`);
    setProperty(root, '--passport-card-opacity', `${0.42 + progress * 0.58}`);
    setProperty(root, '--bridge-dashoffset', `${1 - progress}`);
  };

  const requestBridgeUpdate = () => {
    if (animationFrame) return;
    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = 0;
      updateBridge();
    });
  };

  const updateCapabilities = () => {
    capabilities = resolveHomeMotionCapabilities({
      reducedMotion: reducedMotionQuery.matches,
      viewportWidth: window.innerWidth
    });
    hero.classList.toggle('is-motion-ready', capabilities.enabled);
    updateBridge();
  };

  updateCapabilities();
  window.addEventListener('scroll', requestBridgeUpdate, { passive: true });
  window.addEventListener('resize', updateCapabilities, { passive: true });
  reducedMotionQuery.addEventListener('change', updateCapabilities);

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener('scroll', requestBridgeUpdate);
    window.removeEventListener('resize', updateCapabilities);
    reducedMotionQuery.removeEventListener('change', updateCapabilities);
    disposeHeroTime();
    disposeHeroCounters();
    disposeHeroAnalysisCard();
    hero.classList.remove('is-motion-ready');
    resetBridge();
  };
};
