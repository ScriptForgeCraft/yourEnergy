import { createCalculatorSession } from './calculator-session.js';
import { gsap } from 'gsap';
import Swiper from 'swiper';
import { A11y, EffectFade, Keyboard, Mousewheel } from 'swiper/modules';

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));

const STORY_FRAME_TOLERANCE_PX = 1;

/**
 * The desktop storyboard has one exact visual viewport of height. Do not let
 * its wheel-driven navigation capture a visitor's scroll until that complete
 * frame is on screen.
 */
export const isSolutionsStoryFrameFullyVisible = ({ top, bottom, height, viewportHeight } = {}) => {
  if (![top, bottom, height, viewportHeight].every(Number.isFinite) || viewportHeight <= 0) {
    return false;
  }

  return (
    Math.abs(height - viewportHeight) <= STORY_FRAME_TOLERANCE_PX &&
    Math.abs(top) <= STORY_FRAME_TOLERANCE_PX &&
    Math.abs(bottom - viewportHeight) <= STORY_FRAME_TOLERANCE_PX
  );
};

export const moveSolutionsStoryStep = ({
  index,
  steps,
  swiper = null,
  setActive,
  isDesktop,
  reducedMotion
}) => {
  if (!steps.length) return null;

  const nextIndex = clamp(index, 0, steps.length - 1);
  if (swiper) {
    swiper.slideTo(nextIndex);
    return nextIndex;
  }

  setActive(nextIndex);
  if (!isDesktop) {
    steps[nextIndex]?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }
  return nextIndex;
};

const finite = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const meaningfulText = (value) =>
  typeof value === 'string' && value.trim().length >= 2 ? value.trim() : null;

const completeMonthlySeries = (value) =>
  Array.isArray(value) && value.length === 12 && value.every((item) => finite(item) !== null)
    ? value.map(Number)
    : null;

const localeWords = (locale = '') => {
  if (locale.startsWith('ru')) {
    return {
      perYear: 'в год',
      years: 'лет',
      trees: 'деревьев в год',
      confirmed: 'Подтверждённые данные'
    };
  }
  if (locale.startsWith('hy')) {
    return { perYear: 'տարում', years: 'տարի', trees: 'ծառ / տարի', confirmed: 'Հաստատված տվյալ' };
  }
  return {
    perYear: 'per year',
    years: 'years',
    trees: 'trees per year',
    confirmed: 'Confirmed input'
  };
};

/**
 * Presentation only: values are read from a completed SolarAnalysis snapshot.
 * This section never sizes a system or calculates financial/environmental data.
 */
export const buildSolutionsPresentation = (analysis, { status = 'idle' } = {}) => {
  const scenario = analysis?.selectedScenario ?? null;
  const property = analysis?.property ?? null;
  const roof = analysis?.roof ?? null;
  const system = scenario?.system ?? null;
  const generation = scenario?.generation ?? null;
  const financial = scenario?.financial ?? null;
  const hasResult = status === 'complete' || Boolean(analysis);

  return {
    hasResult,
    loading: status === 'loading',
    location: meaningfulText(property?.address),
    consumption: finite(analysis?.consumption?.annualKwh),
    solarResource: finite(analysis?.production?.annualYieldKwhPerKwp),
    roofArea: finite(roof?.areaSqm),
    roofDirection: finite(roof?.orientationDegrees),
    roofTilt: finite(roof?.tiltDegrees),
    systemSize: finite(system?.capacityKwp),
    panelCount: finite(system?.panelCount),
    annualProduction: finite(generation?.annualKwh),
    monthlyProduction: completeMonthlySeries(generation?.monthlyKwh),
    coverage: finite(scenario?.coveragePercent),
    annualSavings: finite(financial?.annualSavingsAmd),
    payback: finite(financial?.paybackYears),
    avoidedCo2: finite(analysis?.environmental?.avoidedCo2Tons),
    treeEquivalent: finite(analysis?.environmental?.treeEquivalent)
  };
};

const formatNumber = (value, locale, decimals = 0) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

const valueWithUnit = (value, unit, locale, decimals = 0) =>
  `${formatNumber(value, locale, decimals)}${unit ? ` ${unit}` : ''}`;

const countElements = (root, field, value, unit, locale, decimals, reducedMotion) => {
  root.querySelectorAll(`[data-solutions-field='${field}']`).forEach((element) => {
    element.dataset.solutionsCountValue = String(value);
    element.dataset.solutionsCountUnit = unit;
    element.dataset.solutionsCountDecimals = String(decimals);
    element.dataset.solutionsCountLocale = locale;
    element.textContent = reducedMotion
      ? valueWithUnit(value, unit, locale, decimals)
      : valueWithUnit(0, unit, locale, decimals);
  });
};

const textElements = (root, field, value) => {
  root.querySelectorAll(`[data-solutions-field='${field}']`).forEach((element) => {
    delete element.dataset.solutionsCountValue;
    element.textContent = value ?? element.dataset.solutionsDefault ?? element.textContent;
  });
};

const renderTextOrNumber = ({
  root,
  field,
  value,
  unit = '',
  locale,
  decimals = 0,
  reducedMotion
}) => {
  if (value === null || value === undefined) {
    textElements(root, field, null);
    return;
  }
  countElements(root, field, value, unit, locale, decimals, reducedMotion);
};

const animateElement = (element, counters, reducedMotion, delay = 0) => {
  const target = finite(element.dataset.solutionsCountValue);
  if (target === null) return;
  const decimals = Math.max(
    0,
    Number.parseInt(element.dataset.solutionsCountDecimals ?? '0', 10) || 0
  );
  const locale = element.dataset.solutionsCountLocale || document.documentElement.lang || undefined;
  const unit = element.dataset.solutionsCountUnit ?? '';
  const state = counters.get(element) ?? { value: 0 };
  counters.set(element, state);
  gsap.killTweensOf(state);
  if (reducedMotion) {
    element.textContent = valueWithUnit(target, unit, locale, decimals);
    return;
  }

  state.value = 0;
  gsap.to(state, {
    value: target,
    duration: 0.82,
    delay,
    ease: 'power3.out',
    onUpdate: () => {
      element.textContent = valueWithUnit(state.value, unit, locale, decimals);
    }
  });
};

const updateChart = (root, monthlyProduction, { locale, copy }) => {
  const chart = root.querySelector('[data-solutions-chart]');
  if (!chart) return;
  const label = root.querySelector('[data-solutions-chart-label]');
  const bars = [...chart.querySelectorAll('.solutions-generation-chart__bars i')];
  if (!monthlyProduction) {
    chart.dataset.state = 'preview';
    chart.setAttribute('aria-label', copy.chartPreviewLabel);
    if (label) label.textContent = copy.chartPreviewLabel;
    bars.forEach((bar) => bar.style.setProperty('--solutions-bar', '14%'));
    return;
  }

  const maximum = Math.max(...monthlyProduction, 1);
  chart.dataset.state = 'ready';
  chart.setAttribute('aria-label', copy.chartReadyLabel);
  if (label) label.textContent = copy.chartReadyLabel;
  bars.forEach((bar, index) => {
    const value = monthlyProduction[index] ?? 0;
    bar.style.setProperty('--solutions-bar', `${Math.max(8, (value / maximum) * 100)}%`);
    bar.setAttribute('title', valueWithUnit(value, 'kWh', locale));
  });
};

const renderPresentation = ({ root, presentation, config, reducedMotion }) => {
  const locale = config.locale || document.documentElement.lang || 'en-US';
  const copy = config.journey ?? {};
  const words = localeWords(locale);
  const hasRoofInputs = [
    presentation.roofArea,
    presentation.roofDirection,
    presentation.roofTilt
  ].some((value) => value !== null);
  const hasSystem = presentation.systemSize !== null || presentation.annualProduction !== null;
  const hasSavings = [
    presentation.coverage,
    presentation.annualSavings,
    presentation.payback,
    presentation.avoidedCo2,
    presentation.treeEquivalent
  ].some((value) => value !== null);

  root.dataset.solutionsData = presentation.hasResult ? 'analysis' : 'preview';
  root.dataset.solutionsLoading = String(presentation.loading);

  textElements(root, 'location', presentation.location);
  renderTextOrNumber({
    root,
    field: 'consumption',
    value: presentation.consumption,
    unit: `kWh ${words.perYear}`,
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'solar-resource',
    value: presentation.solarResource,
    unit: `kWh/kWp ${words.perYear}`,
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'roof-area',
    value: presentation.roofArea,
    unit: 'm²',
    locale,
    decimals: 1,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'roof-direction',
    value: presentation.roofDirection,
    unit: '°',
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'roof-tilt',
    value: presentation.roofTilt,
    unit: '°',
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'system-size',
    value: presentation.systemSize,
    unit: 'kWp',
    locale,
    decimals: 2,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'panel-count',
    value: presentation.panelCount,
    unit: '',
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'annual-production',
    value: presentation.annualProduction,
    unit: `kWh ${words.perYear}`,
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'coverage',
    value:
      presentation.coverage === null ? null : Math.min(100, Math.max(0, presentation.coverage)),
    unit: '%',
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'annual-savings',
    value: presentation.annualSavings,
    unit: `AMD ${words.perYear}`,
    locale,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'payback',
    value: presentation.payback,
    unit: words.years,
    locale,
    decimals: 1,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'co2',
    value: presentation.avoidedCo2,
    unit: `t CO₂ ${words.perYear}`,
    locale,
    decimals: 1,
    reducedMotion
  });
  renderTextOrNumber({
    root,
    field: 'trees',
    value: presentation.treeEquivalent,
    unit: words.trees,
    locale,
    reducedMotion
  });

  textElements(
    root,
    'home-status',
    presentation.location || presentation.consumption !== null
      ? copy.confirmedInput
      : copy.awaitingInput
  );
  textElements(root, 'roof-status', hasRoofInputs ? copy.confirmedInput : copy.awaitingInput);
  textElements(root, 'system-status', hasSystem ? words.confirmed : copy.availableAfterCalculation);
  textElements(
    root,
    'savings-status',
    hasSavings ? words.confirmed : copy.availableAfterCalculation
  );
  textElements(root, 'inverter', hasSystem ? copy.awaitingInput : null);

  root.querySelectorAll('[data-solutions-status]').forEach((element) => {
    const key = element.dataset.solutionsStatus;
    const label =
      key === 'savings'
        ? hasSavings
          ? words.confirmed
          : copy.availableAfterCalculation
        : key === 'roof'
          ? hasRoofInputs
            ? copy.confirmedInput
            : copy.awaitingInput
          : key === 'home'
            ? presentation.location || presentation.consumption !== null
              ? copy.confirmedInput
              : copy.awaitingInput
            : hasSystem
              ? words.confirmed
              : copy.previewLabel;
    element.textContent = presentation.loading ? copy.awaitingInput : label;
  });

  updateChart(root, presentation.monthlyProduction, { locale, copy });
};

export const initSolutionsStory = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-solutions-story]');
  if (!root) return () => {};

  const sliderElement = root.querySelector('[data-solutions-slider]');
  const scrollFrame = root.querySelector('.solutions-story__scroll');
  const steps = [...root.querySelectorAll('[data-solutions-step]')];
  const progressItems = [...root.querySelectorAll('[data-solutions-progress-step]')];
  const progressControls = progressItems
    .map((item) => item.querySelector('button'))
    .filter(Boolean);
  const previousButtons = [...root.querySelectorAll('[data-solutions-previous]')];
  const nextButtons = [...root.querySelectorAll('[data-solutions-next]')];
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopQuery = window.matchMedia('(min-width: 768px)');
  let activeIndex = -1;
  let swiper = null;
  let scrollCaptureFrame = 0;
  let storyScrollReady = false;
  const counters = new Map();

  const syncStoryScrollCapture = () => {
    scrollCaptureFrame = 0;
    const bounds = scrollFrame?.getBoundingClientRect();
    const ready =
      Boolean(swiper) &&
      desktopQuery.matches &&
      isSolutionsStoryFrameFullyVisible({
        top: bounds?.top,
        bottom: bounds?.bottom,
        height: bounds?.height,
        viewportHeight: window.innerHeight
      });

    if (ready === storyScrollReady) return;
    storyScrollReady = ready;
    root.dataset.solutionsScrollReady = String(ready);
    if (ready) {
      swiper?.mousewheel?.enable();
      swiper?.keyboard?.enable();
    } else {
      swiper?.mousewheel?.disable();
      swiper?.keyboard?.disable();
    }
  };

  const requestStoryScrollCaptureSync = () => {
    if (scrollCaptureFrame) return;
    scrollCaptureFrame = window.requestAnimationFrame(syncStoryScrollCapture);
  };

  const animateStep = (step) => {
    const countTargets = [...step.querySelectorAll('[data-solutions-count-value]')];
    const eyebrow = step.querySelector('.solutions-story__eyebrow');
    const headline = step.querySelector('.solutions-story__copy h3');
    const intro = step.querySelector('.solutions-story__intro');
    const status = step.querySelector('.solutions-story__status');
    const copyTargets = [eyebrow, headline, intro, status].filter(Boolean);
    const metricTargets = [...step.querySelectorAll('.solutions-story__metric')];
    const timeline = step.querySelector('.solutions-story__timeline');
    const actions = step.querySelector('.solutions-story__actions');
    const visual = step.querySelector('.solutions-visual');
    const visualCards = [...step.querySelectorAll('.solutions-visual-card')];
    const chart = step.querySelector('.solutions-generation-chart');
    const visualImage = step.querySelector('.solutions-visual__media img');
    const entranceTargets = [
      ...copyTargets,
      ...metricTargets,
      timeline,
      actions,
      visual,
      ...visualCards,
      chart
    ].filter(Boolean);

    gsap.killTweensOf(entranceTargets);
    countTargets.forEach((element, index) =>
      animateElement(element, counters, reducedMotionQuery.matches, 0.28 + index * 0.045)
    );
    if (reducedMotionQuery.matches) return;

    if (eyebrow) {
      gsap.fromTo(
        eyebrow,
        { autoAlpha: 0, x: -16 },
        { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power3.out' }
      );
    }
    if (headline) {
      gsap.fromTo(
        headline,
        { autoAlpha: 0, x: -28, clipPath: 'inset(0 100% 0 0)' },
        {
          autoAlpha: 1,
          x: 0,
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.68,
          delay: 0.06,
          ease: 'power4.out'
        }
      );
    }
    const introTargets = [intro, status].filter(Boolean);
    if (introTargets.length) {
      gsap.fromTo(
        introTargets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          delay: 0.2,
          ease: 'power3.out',
          stagger: 0.07
        }
      );
    }
    if (metricTargets.length) {
      gsap.fromTo(
        metricTargets,
        { autoAlpha: 0, x: -18, y: 12 },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.52,
          delay: 0.17,
          ease: 'power3.out',
          stagger: 0.055
        }
      );
    }
    const supportingTargets = [timeline, actions].filter(Boolean);
    if (supportingTargets.length) {
      gsap.fromTo(
        supportingTargets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.48,
          delay: 0.28,
          ease: 'power3.out',
          stagger: 0.08
        }
      );
    }
    if (visual) {
      gsap.fromTo(
        visual,
        { autoAlpha: 0, x: 42, scale: 0.975, clipPath: 'inset(0 0 0 7% round 30px)' },
        {
          autoAlpha: 1,
          x: 0,
          scale: 1,
          clipPath: 'inset(0 0 0 0% round 30px)',
          duration: 0.82,
          ease: 'power3.out'
        }
      );
    }
    if (visualImage) {
      gsap.fromTo(
        visualImage,
        { scale: 1.075 },
        { scale: 1.01, duration: 1.25, ease: 'power2.out' }
      );
    }
    const floatingTargets = [...visualCards, chart].filter(Boolean);
    if (floatingTargets.length) {
      gsap.fromTo(
        floatingTargets,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.52,
          delay: 0.32,
          ease: 'power3.out',
          stagger: 0.08
        }
      );
    }

    const bars = step.querySelectorAll('.solutions-generation-chart__bars i');
    if (bars.length) {
      gsap.fromTo(
        bars,
        { scaleY: 0.08 },
        { scaleY: 1, duration: 0.68, ease: 'power3.out', stagger: 0.035, transformOrigin: 'bottom' }
      );
    }
  };

  const setActive = (index, { force = false } = {}) => {
    const nextIndex = clamp(index, 0, steps.length - 1);
    if (!force && nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    root.style.setProperty('--solutions-progress', String(progressForStep(nextIndex)));
    steps.forEach((step, stepIndex) => {
      const active = stepIndex === nextIndex;
      step.classList.toggle('is-active', active);
      step.setAttribute('aria-hidden', desktopQuery.matches && !active ? 'true' : 'false');
      if (active) animateStep(step);
    });
    progressItems.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === nextIndex);
      item.classList.toggle('is-complete', itemIndex < nextIndex);
      progressControls[itemIndex]?.setAttribute(
        'aria-current',
        itemIndex === nextIndex ? 'step' : 'false'
      );
    });
  };

  const progressForStep = (index) =>
    steps.length > 1 ? clamp(index, 0, steps.length - 1) / (steps.length - 1) : 0;

  const setupSwiper = () => {
    swiper?.destroy(true, true);
    swiper = null;
    storyScrollReady = false;
    root.dataset.solutionsScrollReady = 'false';

    if (!desktopQuery.matches || !sliderElement) {
      setActive(0, { force: true });
      return;
    }

    swiper = new Swiper(sliderElement, {
      modules: [A11y, EffectFade, Keyboard, Mousewheel],
      direction: 'vertical',
      slidesPerView: 1,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: reducedMotionQuery.matches ? 0 : 720,
      threshold: 1,
      followFinger: false,
      preventInteractionOnTransition: true,
      mousewheel: {
        enabled: false,
        forceToAxis: true,
        releaseOnEdges: true,
        thresholdDelta: 1,
        thresholdTime: 620
      },
      touchReleaseOnEdges: true,
      keyboard: {
        enabled: false,
        onlyInViewport: true,
        pageUpDown: true
      },
      a11y: { enabled: true },
      on: {
        init: (instance) => setActive(instance.activeIndex, { force: true }),
        slideChangeTransitionStart: (instance) => setActive(instance.activeIndex)
      }
    });
    syncStoryScrollCapture();
  };

  const session = createCalculatorSession();
  const refreshPresentation = ({ analysis, status } = {}) => {
    const snapshot = analysis === undefined ? session.read() : null;
    renderPresentation({
      root,
      presentation: buildSolutionsPresentation(
        analysis ?? snapshot?.analysis ?? snapshot?.quickAnalysis,
        {
          status: status ?? snapshot?.analysisStatus ?? 'idle'
        }
      ),
      config,
      reducedMotion: reducedMotionQuery.matches
    });
    activeIndex = -1;
    swiper?.update();
    setActive(swiper?.activeIndex ?? 0, { force: true });
  };

  const onAnalysisUpdate = (event) => refreshPresentation(event.detail ?? {});
  const onMotionChange = () => {
    setupSwiper();
    refreshPresentation();
  };
  const onBreakpointChange = () => {
    setupSwiper();
    refreshPresentation();
  };

  const moveTo = (index) => {
    moveSolutionsStoryStep({
      index,
      steps,
      swiper,
      setActive: (nextIndex) => setActive(nextIndex, { force: true }),
      isDesktop: desktopQuery.matches,
      reducedMotion: reducedMotionQuery.matches
    });
  };

  const onProgressActivate = (event) => {
    const index = Number(event.currentTarget.dataset.solutionsProgressStep);
    if (Number.isInteger(index)) moveTo(index);
  };
  const moveFromStep = (event, direction) => {
    const index = Number(
      event.currentTarget.closest('[data-solutions-step]')?.dataset.solutionsStep
    );
    if (Number.isInteger(index)) moveTo(index + direction);
  };
  const onPrevious = (event) => moveFromStep(event, -1);
  const onNext = (event) => moveFromStep(event, 1);

  progressItems.forEach((item) => {
    item.addEventListener('click', onProgressActivate);
  });
  previousButtons.forEach((button) => button.addEventListener('click', onPrevious));
  nextButtons.forEach((button) => button.addEventListener('click', onNext));
  refreshPresentation();
  setupSwiper();
  window.addEventListener('solar:analysis-updated', onAnalysisUpdate);
  window.addEventListener('scroll', requestStoryScrollCaptureSync, { passive: true });
  window.addEventListener('resize', requestStoryScrollCaptureSync, { passive: true });
  reducedMotionQuery.addEventListener('change', onMotionChange);
  desktopQuery.addEventListener('change', onBreakpointChange);

  return () => {
    swiper?.destroy(true, true);
    window.cancelAnimationFrame(scrollCaptureFrame);
    counters.forEach((state) => gsap.killTweensOf(state));
    gsap.killTweensOf(root.querySelectorAll('.solutions-generation-chart__bars i'));
    window.removeEventListener('solar:analysis-updated', onAnalysisUpdate);
    window.removeEventListener('scroll', requestStoryScrollCaptureSync);
    window.removeEventListener('resize', requestStoryScrollCaptureSync);
    reducedMotionQuery.removeEventListener('change', onMotionChange);
    desktopQuery.removeEventListener('change', onBreakpointChange);
    progressItems.forEach((item) => {
      item.removeEventListener('click', onProgressActivate);
    });
    previousButtons.forEach((button) => button.removeEventListener('click', onPrevious));
    nextButtons.forEach((button) => button.removeEventListener('click', onNext));
  };
};
