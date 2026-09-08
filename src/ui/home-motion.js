import { initHeroAnalysisCard } from './hero-analysis-card.js';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const HERO_TIME_ZONE = 'Asia/Yerevan';

const heroTimeProfiles = Object.freeze([
  { hour: 8, assetHour: 8, kind: 'day', arcPoint: { x: 0.39, y: 0.456 } },
  { hour: 12, assetHour: 12, kind: 'day', arcPoint: { x: 0.54, y: 0.231 } },
  { hour: 14, assetHour: 14, kind: 'day', arcPoint: { x: 0.65, y: 0.148 } },
  { hour: 16, assetHour: 16, kind: 'day', arcPoint: { x: 0.75, y: 0.117 } },
  { hour: 18, assetHour: 18, kind: 'day', arcPoint: { x: 0.87, y: 0.137 } },
  { hour: 20, assetHour: 20, kind: 'evening', arcPoint: { x: 0.96, y: 0.213 } }
]);

// No night scene was supplied. The 08:00 image is the neutral fallback asset,
// but it is never presented as a current 08:00 solar position: the decorative
// sun marker is hidden and the Hero records a neutral state instead.
const neutralHeroTimeProfile = Object.freeze({
  hour: null,
  assetHour: 8,
  kind: 'neutral',
  arcPoint: { x: 0.39, y: 0.456 }
});

const yerevanTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: HERO_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

const heroImageWidths = [640, 1024, 1600];

const yerevanTimeParts = (date) => {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  try {
    return Object.fromEntries(
      yerevanTimeFormatter
        .formatToParts(date)
        .filter(({ type }) => ['hour', 'minute', 'second'].includes(type))
        .map(({ type, value }) => [type, Number(value)])
    );
  } catch {
    return null;
  }
};

export const getYerevanHour = (date = new Date()) => {
  const hour = yerevanTimeParts(date)?.hour;
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
};

/**
 * Chooses from supplied illustrative day-cycle frames using Asia/Yerevan,
 * not the visitor's browser timezone. This is visual storytelling, not an
 * astronomical calculation or a claim about sunlight at a specific property.
 */
export const getHeroTimeProfile = (date = new Date()) => {
  const hour = getYerevanHour(date);
  if (hour === null || hour < 8 || hour >= 22) return neutralHeroTimeProfile;
  if (hour >= 8 && hour < 10) return heroTimeProfiles[0];
  if (hour < 13) return heroTimeProfiles[1];
  if (hour < 15) return heroTimeProfiles[2];
  if (hour < 17) return heroTimeProfiles[3];
  if (hour < 19) return heroTimeProfiles[4];
  return heroTimeProfiles[5];
};

/**
 * A failed candidate must never replace a working Hero image with an evening
 * frame. Prefer the last distinct successful frame; otherwise use neutral.
 */
export const resolveHeroFrameFailure = (lastSuccessfulProfile, failedProfile) => {
  if (
    lastSuccessfulProfile?.assetHour &&
    lastSuccessfulProfile.assetHour !== failedProfile?.assetHour
  ) {
    return lastSuccessfulProfile;
  }
  return neutralHeroTimeProfile;
};

export const millisecondsUntilNextYerevanHour = (date = new Date()) => {
  const time = yerevanTimeParts(date);
  if (!time || !Number.isInteger(time.minute) || !Number.isInteger(time.second)) return 60_000;
  return Math.max(
    1_000,
    (60 - time.minute) * 60_000 - time.second * 1_000 - date.getMilliseconds() + 100
  );
};

export const getHeroTimeSrcset = (hour, extension) =>
  heroImageWidths
    .map((width) => `/images/hero-time-${hour}-${width}.${extension} ${width}w`)
    .join(', ');

export const getHeroFrameUrl = (hour, extension = 'jpg', width = 1600) =>
  `/images/hero-time-${hour}-${width}.${extension}`;

export const getHeroImageExtension = (source = '') => {
  const match = String(source).match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
  return match?.[1]?.toLowerCase() || null;
};

export const getHeroCounterTarget = (value) => {
  const source = typeof value === 'number' ? value : String(value ?? '').trim();
  if (source === '') return null;
  const target = Number(source);
  return Number.isFinite(target) ? target : null;
};

/**
 * The solar arc is embedded in each supplied time frame. Project its verified
 * source-image point through `object-fit: cover` so the decorative sun stays
 * on that arc when the hero aspect ratio changes.
 */
export const projectHeroArcPoint = (
  profile,
  { sourceWidth, sourceHeight, frameWidth, frameHeight } = {}
) => {
  const point = profile?.arcPoint;
  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    !Number.isFinite(frameWidth) ||
    !Number.isFinite(frameHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }

  const scale = Math.max(frameWidth / sourceWidth, frameHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  return {
    x: (frameWidth - renderedWidth) / 2 + point.x * renderedWidth,
    y: (frameHeight - renderedHeight) / 2 + point.y * renderedHeight
  };
};

const initHeroTime = (hero) => {
  const image = hero.querySelector('[data-hero-time-image]');
  const sources = [...hero.querySelectorAll('[data-hero-time-source]')];
  if (!image || sources.length === 0) return () => {};

  let timer = 0;
  let disposed = false;
  let isUpdating = false;
  let lastSuccessfulProfile = null;
  let appliedProfile = neutralHeroTimeProfile;
  let restoringFrame = false;

  const sunMarker = hero.querySelector('[data-hero-time-sun]');

  const syncSunMarker = () => {
    if (!sunMarker || appliedProfile.kind === 'neutral') return;
    const frame = hero.getBoundingClientRect();
    const projected = projectHeroArcPoint(appliedProfile, {
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      frameWidth: frame.width,
      frameHeight: frame.height
    });
    if (!projected) return;
    setProperty(hero, '--hero-sun-x', `${projected.x}px`);
    setProperty(hero, '--hero-sun-y', `${projected.y}px`);
  };

  const queueSunMarkerSync = () => window.requestAnimationFrame(syncSunMarker);
  const heroResizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(queueSunMarkerSync);

  const applyFrame = (profile, { jpegOnly = false } = {}) => {
    const frameHour = profile.assetHour;
    appliedProfile = profile;
    hero.dataset.heroTime = profile.hour === null ? 'neutral' : String(profile.hour);
    hero.dataset.heroTimeKind = profile.kind;
    setProperty(hero, '--hero-sun-x', `${profile.arcPoint.x * 100}%`);
    setProperty(hero, '--hero-sun-y', `${profile.arcPoint.y * 100}%`);
    if (sunMarker) sunMarker.hidden = profile.kind === 'neutral';

    for (const source of sources) {
      if (jpegOnly) {
        source.removeAttribute('srcset');
      } else {
        const sourceExtension = source.dataset.heroTimeSource;
        source.srcset = getHeroTimeSrcset(frameHour, sourceExtension);
      }
    }
    image.srcset = getHeroTimeSrcset(frameHour, 'jpg');
    image.src = getHeroFrameUrl(frameHour, 'jpg');
    queueSunMarkerSync();
  };

  const preload = (source) =>
    new Promise((resolve) => {
      const frame = new Image();
      frame.onload = () => resolve(true);
      frame.onerror = () => resolve(false);
      frame.src = source;
    });

  const update = async () => {
    if (disposed || isUpdating || hero.dataset.heroImageState === 'fallback') return;
    isUpdating = true;
    try {
      const profile = getHeroTimeProfile();
      const extension =
        getHeroImageExtension(image.currentSrc) ?? sources[0]?.dataset.heroTimeSource ?? 'jpg';
      const isReady = await preload(getHeroFrameUrl(profile.assetHour, extension));

      if (disposed) return;
      if (isReady) {
        lastSuccessfulProfile = profile;
        hero.dataset.heroImageState = 'ready';
        applyFrame(profile);
      } else {
        // Keep the visible, already-loaded frame in place. A request failure
        // must not manufacture a different time of day or blank the Hero.
        hero.dataset.heroImageState = lastSuccessfulProfile ? 'retained' : 'neutral';
      }
    } finally {
      isUpdating = false;
    }
  };

  const scheduleUpdate = () => {
    window.clearTimeout(timer);
    const now = new Date();
    timer = window.setTimeout(() => {
      void update();
      scheduleUpdate();
    }, millisecondsUntilNextYerevanHour(now));
  };

  const handleError = async () => {
    if (disposed || restoringFrame) return;
    restoringFrame = true;
    try {
      const fallback = resolveHeroFrameFailure(lastSuccessfulProfile, appliedProfile);
      const isReady = await preload(getHeroFrameUrl(fallback.assetHour, 'jpg'));
      if (disposed) return;
      if (isReady) {
        lastSuccessfulProfile = fallback;
        hero.dataset.heroImageState = fallback.kind === 'neutral' ? 'neutral' : 'retained';
        // The selected AVIF/WebP resource just failed. Keep the recovery on a
        // JPEG we have preloaded instead of selecting that failing source again.
        applyFrame(fallback, { jpegOnly: true });
      } else {
        hero.dataset.heroImageState = 'unavailable';
      }
    } finally {
      restoringFrame = false;
    }
  };

  applyFrame(neutralHeroTimeProfile);
  image.addEventListener('error', handleError);
  image.addEventListener('load', queueSunMarkerSync);
  window.addEventListener('resize', queueSunMarkerSync, { passive: true });
  heroResizeObserver?.observe(hero);
  void update();
  scheduleUpdate();

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    image.removeEventListener('error', handleError);
    image.removeEventListener('load', queueSunMarkerSync);
    window.removeEventListener('resize', queueSunMarkerSync);
    heroResizeObserver?.disconnect();
  };
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
