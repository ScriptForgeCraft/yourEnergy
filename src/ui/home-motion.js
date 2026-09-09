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

const HERO_INTRO_MAX_DURATION_MS = 5_200;
const HERO_INTRO_TRANSITION_MAX_MS = 1_150;

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
 * On the first view, let a supplied daytime sequence catch up with the
 * current Yerevan frame. The neutral night fallback intentionally skips this
 * decorative sequence and stays honest about the unavailable night scene.
 */
export const getHeroIntroProfiles = (targetProfile) => {
  if (targetProfile?.kind === 'neutral') return [];
  const targetIndex = heroTimeProfiles.findIndex(
    ({ assetHour }) => assetHour === targetProfile?.assetHour
  );
  return targetIndex === -1 ? [] : heroTimeProfiles.slice(0, targetIndex + 1);
};

export const getHeroIntroTransitionDuration = (profileCount) => {
  const transitions = Math.max(1, profileCount - 1);
  return Math.min(
    HERO_INTRO_TRANSITION_MAX_MS,
    Math.floor(HERO_INTRO_MAX_DURATION_MS / transitions)
  );
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
 * The solar arc is embedded in each supplied time frame. The backdrop fills
 * the hero without `object-fit: cover`, so project its normalized source point
 * straight into the rendered hero rectangle. This keeps the marker on the
 * visible sun in every time-of-day frame, including non-16:9 viewports.
 */
export const projectHeroArcPoint = (profile, { frameWidth, frameHeight } = {}) => {
  const point = profile?.arcPoint;
  if (
    !point ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    !Number.isFinite(frameWidth) ||
    !Number.isFinite(frameHeight) ||
    frameWidth <= 0 ||
    frameHeight <= 0
  ) {
    return null;
  }

  return {
    x: point.x * frameWidth,
    y: point.y * frameHeight
  };
};

const initHeroTime = (hero, { reducedMotion = false } = {}) => {
  const image = hero.querySelector('[data-hero-time-image]');
  const sources = [...hero.querySelectorAll('[data-hero-time-source]')];
  const transitionImages = [...hero.querySelectorAll('[data-hero-time-transition]')];
  if (!image || sources.length === 0) return () => {};

  let timer = 0;
  let disposed = false;
  let isUpdating = false;
  let lastSuccessfulProfile = null;
  let appliedProfile = neutralHeroTimeProfile;
  let restoringFrame = false;
  let sunAnimationFrame = 0;
  let isSunAnimating = false;
  let persistentTransitionLayer = null;
  const transitionAnimations = new Map();

  const sunMarker = hero.querySelector('[data-hero-time-sun]');

  const syncSunMarker = () => {
    if (!sunMarker || isSunAnimating || appliedProfile.kind === 'neutral') return;
    const frame = hero.getBoundingClientRect();
    const projected = projectHeroArcPoint(appliedProfile, {
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

  const applyProfileState = (profile, { positionSun = true, syncSun = true } = {}) => {
    appliedProfile = profile;
    hero.dataset.heroTime = profile.hour === null ? 'neutral' : String(profile.hour);
    hero.dataset.heroTimeKind = profile.kind;
    if (positionSun) {
      setProperty(hero, '--hero-sun-x', `${profile.arcPoint.x * 100}%`);
      setProperty(hero, '--hero-sun-y', `${profile.arcPoint.y * 100}%`);
    }
    if (sunMarker) sunMarker.hidden = profile.kind === 'neutral';
    if (syncSun) queueSunMarkerSync();
  };

  const applyFrame = (profile, { jpegOnly = false, positionSun = true, syncSun = true } = {}) => {
    const frameHour = profile.assetHour;
    applyProfileState(profile, { positionSun, syncSun });

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
  };

  const preload = (source) =>
    new Promise((resolve) => {
      const frame = new Image();
      frame.onload = async () => {
        if (typeof frame.decode === 'function') {
          try {
            await frame.decode();
          } catch {
            // The browser has already loaded the asset. A decode hint failing
            // here must not turn a usable visual frame into an error state.
          }
        }
        resolve(true);
      };
      frame.onerror = () => resolve(false);
      frame.src = source;
    });

  const waitForImageLoad = (target, expectedHour = null) => {
    const isExpectedFrame = () =>
      expectedHour === null || target.currentSrc.includes(`/hero-time-${expectedHour}-`);
    if (target.complete && isExpectedFrame()) return Promise.resolve(target.naturalWidth > 0);
    return new Promise((resolve) => {
      const settle = (successful) => {
        target.removeEventListener('load', onLoad);
        target.removeEventListener('error', onError);
        resolve(successful);
      };
      const onLoad = () => settle(isExpectedFrame());
      const onError = () => settle(false);
      target.addEventListener('load', onLoad, { once: true });
      target.addEventListener('error', onError, { once: true });
    });
  };

  const hideTransitionLayer = (transitionImage) => {
    transitionAnimations.get(transitionImage)?.cancel();
    transitionAnimations.delete(transitionImage);
    transitionImage.style.transition = 'none';
    transitionImage.style.opacity = '0';
    transitionImage.classList.remove('is-visible');
    void transitionImage.offsetWidth;
    transitionImage.style.removeProperty('transition');
    transitionImage.style.removeProperty('opacity');
  };

  const resetTransition = () => {
    for (const transitionImage of transitionImages) hideTransitionLayer(transitionImage);
  };

  const interpolateSunArc = (profiles, progress) => {
    const segmentProgress = Math.min(Math.max(progress, 0), 1) * (profiles.length - 1);
    const index = Math.min(Math.floor(segmentProgress), profiles.length - 2);
    const localProgress = segmentProgress - index;
    const first = profiles[Math.max(0, index - 1)].arcPoint;
    const second = profiles[index].arcPoint;
    const third = profiles[index + 1].arcPoint;
    const fourth = profiles[Math.min(profiles.length - 1, index + 2)].arcPoint;
    const t = localProgress;
    const t2 = t * t;
    const t3 = t2 * t;
    const blend = (key) =>
      0.5 *
      (2 * second[key] +
        (-first[key] + third[key]) * t +
        (2 * first[key] - 5 * second[key] + 4 * third[key] - fourth[key]) * t2 +
        (-first[key] + 3 * second[key] - 3 * third[key] + fourth[key]) * t3);
    return { x: blend('x'), y: blend('y') };
  };

  const animateSunAcrossDayCycle = (profiles, duration) => {
    if (!sunMarker || profiles.length < 2 || duration <= 0) {
      syncSunMarker();
      return Promise.resolve();
    }

    isSunAnimating = true;
    const startedAt = window.performance.now();
    return new Promise((resolve) => {
      const frame = (now) => {
        if (disposed) {
          isSunAnimating = false;
          sunAnimationFrame = 0;
          resolve();
          return;
        }

        const progress = Math.min((now - startedAt) / duration, 1);
        const point = interpolateSunArc(profiles, progress);
        const bounds = hero.getBoundingClientRect();
        setProperty(hero, '--hero-sun-x', `${point.x * bounds.width}px`);
        setProperty(hero, '--hero-sun-y', `${point.y * bounds.height}px`);

        if (progress < 1) {
          sunAnimationFrame = window.requestAnimationFrame(frame);
          return;
        }
        isSunAnimating = false;
        sunAnimationFrame = 0;
        syncSunMarker();
        resolve();
      };
      sunAnimationFrame = window.requestAnimationFrame(frame);
    });
  };

  const prepareTransitionLayer = async (transitionImage, profile, extension, preloaded) => {
    if (!preloaded || disposed) return false;
    transitionImage.src = getHeroFrameUrl(profile.assetHour, extension);
    const isLoaded =
      transitionImage.complete && transitionImage.naturalWidth > 0
        ? true
        : await waitForImageLoad(transitionImage);
    if (!isLoaded || disposed) return false;

    if (typeof transitionImage.decode === 'function') {
      try {
        await transitionImage.decode();
      } catch {
        // The network preload has already completed. A browser-specific decode
        // hint must not discard a usable layer.
      }
    }
    return !disposed;
  };

  const startTransitionFade = (transitionImage, { delay = 0, duration }) => {
    setProperty(hero, '--hero-day-cycle-duration', `${duration}ms`);
    transitionAnimations.get(transitionImage)?.cancel();
    transitionImage.style.transition = 'none';
    transitionImage.style.opacity = '0';
    transitionImage.classList.add('is-visible');
    void transitionImage.offsetWidth;

    const animation = transitionImage.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration,
      delay,
      easing: 'cubic-bezier(0.45, 0, 0.55, 1)',
      fill: 'both'
    });
    transitionAnimations.set(transitionImage, animation);
    return animation;
  };

  const finishTransitionFade = async (transitionImage, animation) => {
    try {
      await animation.finished;
    } catch {
      return false;
    }
    if (transitionAnimations.get(transitionImage) !== animation) return false;
    transitionAnimations.delete(transitionImage);
    transitionImage.style.opacity = '1';
    animation.cancel();
    return true;
  };

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
        if (persistentTransitionLayer) {
          const transitionLayer = persistentTransitionLayer;
          const baseFrameReady = await waitForImageLoad(image, profile.assetHour);
          if (baseFrameReady && persistentTransitionLayer === transitionLayer) {
            hideTransitionLayer(transitionLayer);
            persistentTransitionLayer = null;
          }
        }
      } else {
        // Keep the visible, already-loaded frame in place. A request failure
        // must not manufacture a different time of day or blank the Hero.
        hero.dataset.heroImageState = lastSuccessfulProfile ? 'retained' : 'neutral';
      }
    } finally {
      isUpdating = false;
    }
  };

  const runDayCycleIntro = async () => {
    const targetProfile = getHeroTimeProfile();
    const introProfiles = reducedMotion ? [] : getHeroIntroProfiles(targetProfile);
    const transitionCount = introProfiles.length - 1;
    if (introProfiles.length < 2 || transitionImages.length < transitionCount) {
      await update();
      return;
    }

    isUpdating = true;
    try {
      const firstProfile = introProfiles[0];
      hero.dataset.heroDayCycle = 'playing';
      applyFrame(firstProfile);
      lastSuccessfulProfile = firstProfile;
      hero.dataset.heroImageState = 'intro';

      const extension =
        getHeroImageExtension(image.currentSrc) ?? sources[0]?.dataset.heroTimeSource ?? 'jpg';
      const preloadedFrames = new Map(
        await Promise.all(
          introProfiles
            .slice(1)
            .map(async (profile) => [
              profile.assetHour,
              await preload(getHeroFrameUrl(profile.assetHour, extension))
            ])
        )
      );
      if (disposed) return;

      const transitionDuration = getHeroIntroTransitionDuration(introProfiles.length);
      const totalDuration = transitionDuration * transitionCount;
      const transitionPlan = introProfiles.slice(1).map((profile, index) => ({
        profile,
        layer: transitionImages[index],
        delay: index * transitionDuration
      }));
      const preparedTransitions = await Promise.all(
        transitionPlan.map(async (transition) => ({
          ...transition,
          ready: await prepareTransitionLayer(
            transition.layer,
            transition.profile,
            extension,
            preloadedFrames.get(transition.profile.assetHour)
          )
        }))
      );
      if (disposed || preparedTransitions.some(({ ready }) => !ready)) return;

      // All layers have been decoded before a visual timer begins. Fades are
      // created together with fixed offsets, so no late frame can begin after
      // the solar arc has reached its final coordinate.
      applyProfileState(targetProfile, { positionSun: false, syncSun: false });
      const sunMotion = animateSunAcrossDayCycle(introProfiles, totalDuration);
      const startedTransitions = preparedTransitions.map((transition) => ({
        ...transition,
        animation: startTransitionFade(transition.layer, {
          delay: transition.delay,
          duration: transitionDuration
        })
      }));
      const completedTransitions = await Promise.all(
        startedTransitions.map(async (transition) => ({
          ...transition,
          completed: await finishTransitionFade(transition.layer, transition.animation)
        }))
      );
      await sunMotion;
      if (disposed || completedTransitions.some(({ completed }) => !completed)) return;

      const finalTransition = completedTransitions.at(-1);
      for (const { layer } of completedTransitions) {
        if (layer !== finalTransition.layer) hideTransitionLayer(layer);
      }
      applyFrame(targetProfile, { positionSun: false, syncSun: false });
      lastSuccessfulProfile = targetProfile;
      persistentTransitionLayer = finalTransition.layer;
      if (!disposed) hero.dataset.heroImageState = 'ready';
    } finally {
      delete hero.dataset.heroDayCycle;
      queueSunMarkerSync();
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
    if (persistentTransitionLayer) {
      resetTransition();
      persistentTransitionLayer = null;
    }
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
  void runDayCycleIntro();
  scheduleUpdate();

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    window.cancelAnimationFrame(sunAnimationFrame);
    persistentTransitionLayer = null;
    resetTransition();
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

  const disposeHeroTime = initHeroTime(hero, { reducedMotion: reducedMotionQuery.matches });
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
