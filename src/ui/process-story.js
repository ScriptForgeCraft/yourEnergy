import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger.js';
import { createCalculatorSession } from './calculator-session.js';
import { getArmeniaRegionalBenchmark } from '../data/regions/armenia.js';
import { toNonNegativeNumberOrNull, toPositiveNumberOrNull } from '../domain/numbers.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const inputSignature = (state) =>
  JSON.stringify([
    state?.regionId ?? null,
    state?.consumption?.mode ?? null,
    state?.consumption?.averageMonthlyBillAmd ?? null,
    state?.consumption?.averageMonthlyKwh ?? null
  ]);

/** Input handoff only. All tariff and solar calculations remain in Quick Calculator. */
export const buildProcessStartState = ({ regionId, mode, amount }, previous = {}) => {
  const value = toPositiveNumberOrNull(amount);
  if (!getArmeniaRegionalBenchmark(regionId) || !['bill', 'usage'].includes(mode) || value === null)
    return null;

  const consumption =
    mode === 'bill' ? { mode, averageMonthlyBillAmd: value } : { mode, averageMonthlyKwh: value };
  const next = { regionId, consumption };

  if (inputSignature(next) !== inputSignature(previous)) {
    Object.assign(next, {
      analysis: null,
      quickAnalysis: null,
      solarPassport: null,
      analysisStatus: 'idle'
    });
  }
  if (previous.regionId !== regionId) {
    Object.assign(next, { property: null, roof: null, sitePotential: null, userTariff: null });
  }
  return next;
};

const finite = (value) => toNonNegativeNumberOrNull(value);

/**
 * Adapts persisted inputs and an existing SolarAnalysis to display-only values.
 * It intentionally performs no sizing, production, price or financial calculation.
 */
export const buildProcessPresentation = (state = {}) => {
  const candidate = state.analysis ?? state.quickAnalysis ?? null;
  const analysis =
    state.analysisStatus === 'complete' && candidate?.selectedScenario ? candidate : null;
  const scenario = analysis?.selectedScenario ?? null;
  const roof = analysis?.roof ?? state.roof ?? null;
  const estimate = scenario?.commercialEstimate ?? analysis?.commercialEstimate ?? null;
  const upperEstimate = estimate?.available === true ? finite(estimate?.rangeAmd?.p75) : null;
  const consumptionMode = state.consumption?.mode;
  const consumptionValue =
    consumptionMode === 'bill'
      ? finite(state.consumption?.averageMonthlyBillAmd)
      : consumptionMode === 'usage'
        ? finite(state.consumption?.averageMonthlyKwh)
        : null;

  return {
    hasAnalysis: Boolean(analysis),
    regionId: typeof state.regionId === 'string' ? state.regionId : null,
    consumptionMode,
    consumptionValue,
    solarResource: finite(analysis?.production?.annualYieldKwhPerKwp),
    source:
      typeof analysis?.production?.source?.provider === 'string'
        ? analysis.production.source.provider
        : null,
    roofArea: finite(roof?.areaSqm ?? roof?.planeAreaSqm ?? roof?.projectedAreaSqm),
    orientation: finite(roof?.orientationDegrees),
    tilt: finite(roof?.tiltDegrees),
    systemCapacity: finite(scenario?.system?.capacityKwp),
    panelCount: finite(scenario?.system?.panelCount),
    annualGeneration: finite(scenario?.generation?.annualKwh),
    commercialEstimateMax: upperEstimate,
    avoidedCo2Tons: finite(analysis?.environmental?.avoidedCo2Tons),
    passportReady: Boolean(state.solarPassport)
  };
};

export const getProcessStepIndex = (progress, stepCount = 6) =>
  clamp(Math.floor(clamp(Number(progress) || 0, 0, 1) * stepCount), 0, stepCount - 1);

const metricDescriptor = (key, presentation, copy, locale, regionLabels) => {
  const number = (value, options, suffix = '', note = '') =>
    value === null
      ? null
      : {
          value,
          text: new Intl.NumberFormat(locale, options).format(value),
          suffix,
          note
        };

  switch (key) {
    case 'location':
      return presentation.regionId
        ? {
            text: regionLabels.get(presentation.regionId) ?? presentation.regionId,
            note: copy.data.country
          }
        : null;
    case 'consumption': {
      const suffix =
        presentation.consumptionMode === 'bill' ? copy.data.billUnit : copy.data.usageUnit;
      return number(presentation.consumptionValue, { maximumFractionDigits: 0 }, ` ${suffix}`);
    }
    case 'solar-resource':
      return number(
        presentation.solarResource,
        { maximumFractionDigits: 0 },
        ' kWh/kWp',
        presentation.source ? `${copy.data.source}: ${presentation.source}` : ''
      );
    case 'roof-area':
      return number(presentation.roofArea, { maximumFractionDigits: 1 }, ' m²');
    case 'orientation':
      return number(presentation.orientation, { maximumFractionDigits: 0 }, '°');
    case 'tilt':
      return number(presentation.tilt, { maximumFractionDigits: 0 }, '°');
    case 'system-capacity':
      return number(presentation.systemCapacity, { maximumFractionDigits: 2 }, ' kWp');
    case 'panel-count':
      return number(presentation.panelCount, { maximumFractionDigits: 0 });
    case 'annual-generation':
    case 'production-context':
      return number(presentation.annualGeneration, { maximumFractionDigits: 0 }, ' kWh/year');
    case 'commercial-estimate':
      return presentation.commercialEstimateMax === null
        ? null
        : {
            text: `${copy.data.upTo} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(presentation.commercialEstimateMax)} ֏`,
            suffix: '',
            note: copy.data.preliminary
          };
    case 'solar-passport':
      return presentation.passportReady ? { text: copy.data.passportReady, note: '' } : null;
    default:
      return null;
  }
};

export const initProcessStory = ({ config = {} } = {}) => {
  const story = document.querySelector('[data-process-story]');
  const root = story?.querySelector('[data-process-stage]');
  if (!story || !root) return () => {};

  gsap.registerPlugin(ScrollTrigger);
  const copy = config.processStory;
  if (!copy) return () => {};

  const locale = config.locale || document.documentElement.lang;
  const frame = root.querySelector('.process-stage__frame');
  const states = [...root.querySelectorAll('[data-process-state]')];
  const progressSteps = [...root.querySelectorAll('[data-process-progress-step]')];
  const session = createCalculatorSession();
  const media = gsap.matchMedia();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const regionLabels = new Map(copy.regions.map(({ id, label }) => [id, label]));
  const metricAnimations = new Map();
  const metricSignatures = new WeakMap();
  let activeIndex = 0;
  let mobileObserver = null;
  let disposed = false;
  let hasEditedInput = false;

  const setProgress = (index) => {
    activeIndex = clamp(index, 0, states.length - 1);
    root.dataset.processActive = String(activeIndex + 1);
    root.style.setProperty(
      '--process-progress',
      String(activeIndex / Math.max(states.length - 1, 1))
    );
    progressSteps.forEach((step, stepIndex) => {
      const active = stepIndex === activeIndex;
      const complete = stepIndex < activeIndex;
      step.classList.toggle('is-active', active);
      step.classList.toggle('is-complete', complete);
      step.classList.toggle('is-future', stepIndex > activeIndex);
      if (active) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  };

  const animateMetric = (element) => {
    const raw = Number(element.dataset.processNumber);
    if (!Number.isFinite(raw)) return;
    const signature = element.dataset.processMetricSignature;
    if (metricSignatures.get(element) === signature) return;
    metricSignatures.set(element, signature);
    metricAnimations.get(element)?.kill();
    if (reduce.matches) return;

    const state = { value: 0 };
    const format = new Intl.NumberFormat(locale, {
      maximumFractionDigits: Number(element.dataset.processDecimals || 0)
    });
    const suffix = element.dataset.processSuffix ?? '';
    element.textContent = `0${suffix}`;
    metricAnimations.set(
      element,
      gsap.to(state, {
        value: raw,
        duration: 0.9,
        ease: 'power2.out',
        onUpdate: () => {
          element.textContent = `${format.format(state.value)}${suffix}`;
        },
        onComplete: () => {
          element.textContent = element.dataset.processFinal;
          metricAnimations.delete(element);
        }
      })
    );
  };

  const animateStepMetrics = (index) => {
    states[index]?.querySelectorAll('[data-process-number]').forEach(animateMetric);
  };



  const form = root.querySelector('[data-process-form]');
  const region = form?.querySelector('[data-process-region]');
  const amount = form?.querySelector('[data-process-amount]');
  const modes = form ? [...form.querySelectorAll('[name="mode"]')] : [];
  const mode = () => modes.find((input) => input.checked)?.value ?? 'bill';
  const draft = () =>
    buildProcessStartState(
      { regionId: region?.value, mode: mode(), amount: amount?.value },
      session.read()
    );

  const render = () => {
    const saved = session.read();
    const currentDraft = draft();
    const sameInput = currentDraft && inputSignature(currentDraft) === inputSignature(saved);
    const visibleState =
      hasEditedInput && !sameInput
        ? { ...saved, analysis: null, quickAnalysis: null, analysisStatus: 'idle' }
        : saved;
    const presentation = buildProcessPresentation(visibleState);

    root.querySelectorAll('[data-process-value]').forEach((element) => {
      const descriptor = metricDescriptor(
        element.dataset.processValue,
        presentation,
        copy,
        locale,
        regionLabels
      );
      const note = element.parentElement.querySelector(
        `[data-process-value-note="${element.dataset.processValue}"]`
      );
      element.removeAttribute('data-process-number');
      element.removeAttribute('data-process-final');
      element.removeAttribute('data-process-suffix');
      element.removeAttribute('data-process-decimals');
      element.removeAttribute('data-process-metric-signature');
      if (!descriptor) {
        element.textContent = element.dataset.default;
        if (note) note.textContent = '';
        return;
      }
      const finalText = `${descriptor.text}${descriptor.suffix ?? ''}`;
      element.textContent = finalText;
      if (note) note.textContent = descriptor.note ?? '';
      if (Number.isFinite(descriptor.value)) {
        const decimals = ['system-capacity', 'roof-area'].includes(element.dataset.processValue)
          ? 2
          : 0;
        element.dataset.processNumber = String(descriptor.value);
        element.dataset.processFinal = finalText;
        element.dataset.processSuffix = descriptor.suffix ?? '';
        element.dataset.processDecimals = String(decimals);
        element.dataset.processMetricSignature = `${element.dataset.processValue}:${descriptor.value}`;
      }
    });
    animateStepMetrics(activeIndex);
  };

  const initial = session.read();
  if (region && getArmeniaRegionalBenchmark(initial.regionId)) region.value = initial.regionId;
  modes.forEach((input) => {
    input.checked = input.value === (initial.consumption?.mode ?? 'bill');
  });
  const amounts = {
    bill: initial.consumption?.averageMonthlyBillAmd ?? '',
    usage: initial.consumption?.averageMonthlyKwh ?? ''
  };
  let activeMode = mode();
  if (amount) amount.value = amounts[activeMode];
  const consumptionFields = form ? [...form.querySelectorAll('[data-process-consumption]')] : [];
  const submitLabel = form?.querySelector('[data-process-submit-label]');

  const setFormExpanded = (expanded) => {
    root.dataset.formExpanded = String(expanded);
    consumptionFields.forEach((element) => {
      element.hidden = !expanded;
    });
    if (submitLabel) submitLabel.textContent = expanded ? copy.form.submit : copy.form.continue;
  };
  const syncMode = () => {
    const bill = mode() === 'bill';
    root.querySelector('[data-process-amount-label]').textContent = bill
      ? copy.form.amountBill
      : copy.form.amountUsage;
    root.querySelector('[data-process-help]').textContent = bill
      ? copy.form.billHelp
      : copy.form.usageHelp;
    root.querySelector('[data-process-unit]').textContent = bill ? 'AMD' : 'kWh';
  };
  const onMode = () => {
    hasEditedInput = true;
    amounts[activeMode] = amount.value;
    activeMode = mode();
    amount.value = amounts[activeMode];
    syncMode();
    render();
  };
  const onInput = () => {
    hasEditedInput = true;
    render();
  };
  const onSubmit = (event) => {
    event.preventDefault();
    if (!region.reportValidity()) return;
    if (root.dataset.formExpanded !== 'true') {
      setFormExpanded(true);
      amount.focus({ preventScroll: true });
      if (!reduce.matches)
        gsap.fromTo(
          consumptionFields,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.38, stagger: 0.035, ease: 'power2.out' }
        );
      return;
    }
    if (!form.reportValidity()) return;
    const next = draft();
    if (!next) return;
    session.write(next);
    window.location.assign(form.action);
  };

  if (form && region && amount) {
    form.noValidate = true;
    setFormExpanded(Boolean(amount.value));
    syncMode();
    form.addEventListener('submit', onSubmit);
    region.addEventListener('change', onInput);
    amount.addEventListener('input', onInput);
    modes.forEach((input) => input.addEventListener('change', onMode));
  }
  window.addEventListener('solar:analysis-updated', render);
  window.addEventListener('pageshow', render);
  render();

  media.add(
    {
      desktop: '(min-width: 768px) and (min-height: 650px)',
      pointer: '(hover: hover) and (pointer: fine)',
      reduce: '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { desktop, pointer, reduce: reducedMotion } = context.conditions;
      mobileObserver?.disconnect();
      mobileObserver = null;

      if (!desktop || reducedMotion) {
        states.forEach((state) => {
          state.removeAttribute('aria-hidden');
          gsap.set(state, { clearProps: 'all' });
          gsap.set(state.querySelector('[data-process-copy]'), { clearProps: 'all' });
          gsap.set(state.querySelector('[data-process-visual]'), { clearProps: 'all' });
        });
        setProgress(0);

        let mobileNavigationTimer = 0;
        let mobileWheelBurstTimer = 0;
        let mobileWheelBurst = false;
        let mobileNavigating = false;
        let mobileTransition = null;
        let touchStartY = null;
        let touchDirection = 0;

        const mobileScrollOffset = () => {
          const header = document.querySelector('.site-header');
          const progress = root.querySelector('.process-progress');
          return (header?.offsetHeight ?? 0) + (progress?.offsetHeight ?? 0) + 8;
        };

        const activeStateOwnsViewport = () => {
          const state = states[activeIndex];
          if (!state) return false;
          const bounds = state.getBoundingClientRect();
          const offset = mobileScrollOffset();
          return bounds.top <= offset + 24 && bounds.bottom > offset + 24;
        };

        const animateMobileStep = (index, direction) => {
          const state = states[index];
          if (!state) return;
          const copyElement = state.querySelector('[data-process-copy]');
          const visual = state.querySelector('[data-process-visual]');
          const cards = state.querySelectorAll('[data-process-card], [data-process-install-step]');
          const forward = direction >= 0;

          mobileTransition?.kill();
          mobileTransition = gsap
            .timeline({ defaults: { ease: 'power2.out' } })
            .fromTo(
              copyElement,
              { autoAlpha: 0, y: forward ? 22 : -22 },
              { autoAlpha: 1, y: 0, duration: 0.36 },
              0
            )
            .fromTo(
              visual,
              { autoAlpha: 0.45, scale: 1.025 },
              { autoAlpha: 1, scale: 1, duration: 0.5 },
              0.04
            )
            .fromTo(
              cards,
              { autoAlpha: 0, y: forward ? 14 : -14, z: -18 },
              { autoAlpha: 1, y: 0, z: 0, duration: 0.3, stagger: 0.03 },
              0.16
            );
        };

        const scrollToMobileStep = (index, direction) => {
          const targetIndex = clamp(index, 0, states.length - 1);
          const state = states[targetIndex];
          if (!state) return;

          window.clearTimeout(mobileNavigationTimer);
          mobileNavigating = true;
          setProgress(targetIndex);
          animateStepMetrics(targetIndex);

          const top =
            window.scrollY + state.getBoundingClientRect().top - Math.max(0, mobileScrollOffset());
          window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
          animateMobileStep(targetIndex, direction);

          mobileNavigationTimer = window.setTimeout(() => {
            mobileNavigating = false;
          }, 560);
        };

        const mobileStepByDirection = (direction) => {
          const targetIndex = activeIndex + direction;
          if (targetIndex < 0 || targetIndex >= states.length) return false;
          scrollToMobileStep(targetIndex, direction);
          return true;
        };

        const wheelDirection = (event) => {
          const primary =
            Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
          return primary === 0 ? 0 : primary > 0 ? 1 : -1;
        };

        const onMobileWheel = (event) => {
          if (reducedMotion || event.ctrlKey || !activeStateOwnsViewport()) return;
          const direction = wheelDirection(event);
          if (!direction) return;

          const targetIndex = activeIndex + direction;
          if (targetIndex < 0 || targetIndex >= states.length) return;

          event.preventDefault();
          window.clearTimeout(mobileWheelBurstTimer);
          mobileWheelBurstTimer = window.setTimeout(() => {
            mobileWheelBurst = false;
          }, 140);
          if (mobileNavigating || mobileWheelBurst) {
            mobileWheelBurst = true;
            return;
          }
          mobileWheelBurst = true;
          mobileStepByDirection(direction);
        };

        const onMobileTouchStart = (event) => {
          if (reducedMotion || event.touches.length !== 1 || !activeStateOwnsViewport()) return;
          touchStartY = event.touches[0].clientY;
          touchDirection = 0;
        };

        const onMobileTouchMove = (event) => {
          if (reducedMotion || touchStartY === null || event.touches.length !== 1) return;
          if (mobileNavigating || touchDirection) {
            if (event.cancelable) event.preventDefault();
            return;
          }

          const delta = touchStartY - event.touches[0].clientY;
          if (Math.abs(delta) < 1) return;
          const direction = delta > 0 ? 1 : -1;
          const targetIndex = activeIndex + direction;
          if (targetIndex < 0 || targetIndex >= states.length) {
            touchStartY = null;
            return;
          }

          if (event.cancelable) event.preventDefault();
          touchDirection = direction;
        };

        const onMobileTouchEnd = () => {
          const direction = touchDirection;
          touchStartY = null;
          touchDirection = 0;
          if (direction && !mobileNavigating) mobileStepByDirection(direction);
        };
        mobileObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const index = states.indexOf(entry.target);
              entry.target.classList.add('is-in-view');
              if (!mobileNavigating) setProgress(index);
              animateStepMetrics(index);
            });
          },
          { rootMargin: '-18% 0px -32%', threshold: 0.12 }
        );
        states.forEach((state) => mobileObserver.observe(state));
        if (reducedMotion) states.forEach((_, index) => animateStepMetrics(index));
        else {
          story.addEventListener('wheel', onMobileWheel, { passive: false });
          story.addEventListener('touchstart', onMobileTouchStart, { passive: true });
          story.addEventListener('touchmove', onMobileTouchMove, { passive: false });
          story.addEventListener('touchend', onMobileTouchEnd, { passive: true });
          story.addEventListener('touchcancel', onMobileTouchEnd, { passive: true });
        }

        return () => {
          mobileObserver?.disconnect();
          mobileTransition?.kill();
          window.clearTimeout(mobileNavigationTimer);
          window.clearTimeout(mobileWheelBurstTimer);
          story.removeEventListener('wheel', onMobileWheel);
          story.removeEventListener('touchstart', onMobileTouchStart);
          story.removeEventListener('touchmove', onMobileTouchMove);
          story.removeEventListener('touchend', onMobileTouchEnd);
          story.removeEventListener('touchcancel', onMobileTouchEnd);
          states.forEach((state) => {
            gsap.set(state.querySelector('[data-process-copy]'), { clearProps: 'all' });
            gsap.set(state.querySelector('[data-process-visual]'), { clearProps: 'all' });
            gsap.set(state.querySelectorAll('[data-process-card], [data-process-install-step]'), {
              clearProps: 'all'
            });
          });
        };
      }

      const copies = states.map((state) => state.querySelector('[data-process-copy]'));
      const visuals = states.map((state) => state.querySelector('[data-process-visual]'));
      const ambient = root.querySelector('.process-stage__ambient');
      const sun = root.querySelector('[data-process-sun]');
      const sunPath = root.querySelector('[data-process-solar-path]');
      const solar = { progress: 0.44 };
      const sunPathLength = sun && sunPath ? sunPath.getTotalLength() : 0;
      let transition = null;
      let sceneTween = null;
      let sunTween = null;
      let pinTrigger = null;
      let programmaticScroll = false;
      let programmaticScrollFrame = 0;
      let transitionInProgress = false;
      let wheelBurst = false;
      let wheelBurstTimer = 0;
      let touchStartY = null;
      let touchHandled = false;

      const cardsFor = (index) =>
        states[index]?.querySelectorAll('[data-process-card], [data-process-install-step]') ?? [];

      const setExclusiveState = (index) => {
        const nextIndex = clamp(index, 0, states.length - 1);
        setProgress(nextIndex);
        root.dataset.processInitialized = 'true';
        states.forEach((state, stateIndex) => {
          const active = stateIndex === nextIndex;
          state.classList.toggle('is-active', active);
          state.classList.toggle('is-before', stateIndex < nextIndex);
          state.setAttribute('aria-hidden', String(!active));
          gsap.set(state, { autoAlpha: active ? 1 : 0 });
        });
        gsap.set(copies[nextIndex], { autoAlpha: 1, y: 0 });
        gsap.set(visuals[nextIndex], { autoAlpha: 1, scale: 1 });
        gsap.set(cardsFor(nextIndex), { autoAlpha: 1, y: 0, z: 0 });
        animateStepMetrics(nextIndex);
      };

      const placeSun = () => {
        if (!sun || !sunPath || !sunPathLength) return;
        const point = sunPath.getPointAtLength(sunPathLength * solar.progress);
        gsap.set(sun, { x: point.x, y: point.y });
      };

      const animateSceneToStep = (index, immediate = false) => {
        const progress = index / Math.max(states.length - 1, 1);
        sceneTween?.kill();
        sunTween?.kill();
        if (ambient) {
          if (immediate) {
            gsap.set(ambient, { yPercent: -4 * progress, scale: 1 + 0.035 * progress });
          } else {
            sceneTween = gsap.to(ambient, {
              yPercent: -4 * progress,
              scale: 1 + 0.035 * progress,
              duration: 0.7,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        }
        const targetSunProgress = 0.44 + 0.26 * progress;
        if (immediate) {
          solar.progress = targetSunProgress;
          placeSun();
        } else if (sun && sunPath) {
          sunTween = gsap.to(solar, {
            progress: targetSunProgress,
            duration: 0.7,
            ease: 'power2.out',
            onUpdate: placeSun,
            overwrite: true
          });
        }
      };

      const finishTransition = (index) => {
        transitionInProgress = false;
        transition = null;
        setExclusiveState(index);
      };

      const transitionToStep = (index, direction) => {
        const nextIndex = clamp(index, 0, states.length - 1);
        const previousIndex = activeIndex;
        if (nextIndex === previousIndex) return false;

        transition?.kill();
        transitionInProgress = true;
        const outgoing = states[previousIndex];
        const incoming = states[nextIndex];
        const outgoingCopy = copies[previousIndex];
        const outgoingVisual = visuals[previousIndex];
        const incomingCopy = copies[nextIndex];
        const incomingVisual = visuals[nextIndex];
        const incomingCards = cardsFor(nextIndex);
        const forward = direction >= 0;

        states.forEach((state, stateIndex) => {
          const visible = stateIndex === previousIndex;
          state.classList.toggle('is-active', visible);
          state.classList.toggle('is-before', stateIndex < previousIndex);
          state.setAttribute('aria-hidden', String(!visible));
          gsap.set(state, { autoAlpha: visible ? 1 : 0 });
        });
        gsap.set(outgoingCopy, { autoAlpha: 1, y: 0 });
        gsap.set(outgoingVisual, { autoAlpha: 1, scale: 1 });

        root.dataset.processInitialized = 'true';
        animateSceneToStep(nextIndex);

        transition = gsap
          .timeline({
            defaults: { ease: 'power2.out' },
            onComplete: () => finishTransition(nextIndex)
          })
          .to(outgoingCopy, { autoAlpha: 0, y: forward ? -20 : 20, duration: 0.24 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, scale: 1.025, duration: 0.28 }, 0)
          .set(outgoing, { autoAlpha: 0 }, 0.28)
          .call(
            () => {
              setProgress(nextIndex);
              states.forEach((state, stateIndex) => {
                const visible = stateIndex === nextIndex;
                state.classList.toggle('is-active', visible);
                state.classList.toggle('is-before', stateIndex < nextIndex);
                state.setAttribute('aria-hidden', String(!visible));
              });
              gsap.set(incoming, { autoAlpha: 1 });
              gsap.set(incomingCopy, { autoAlpha: 0, y: forward ? 26 : -26 });
              gsap.set(incomingVisual, { autoAlpha: 0, scale: 1.03 });
              gsap.set(incomingCards, {
                autoAlpha: 0,
                y: forward ? 16 : -16,
                z: -24
              });
              animateStepMetrics(nextIndex);
            },
            [],
            0.29
          )
          .to(incomingCopy, { autoAlpha: 1, y: 0, duration: 0.34 }, 0.3)
          .to(incomingVisual, { autoAlpha: 1, scale: 1, duration: 0.48 }, 0.3)
          .to(
            incomingCards,
            { autoAlpha: 1, y: 0, z: 0, duration: 0.32, stagger: 0.035 },
            0.42
          );
        return true;
      };

      const stepScrollTop = (index) => {
        if (!pinTrigger) return window.scrollY;
        const padding = Math.min(2, Math.max(0, (pinTrigger.end - pinTrigger.start) / 4));
        const start = pinTrigger.start + padding;
        const end = pinTrigger.end - padding;
        const progress = index / Math.max(states.length - 1, 1);
        return start + (end - start) * progress;
      };

      const setScrollTop = (top) => {
        programmaticScroll = true;
        window.cancelAnimationFrame(programmaticScrollFrame);
        window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        programmaticScrollFrame = window.requestAnimationFrame(() => {
          programmaticScroll = false;
          ScrollTrigger.update();
        });
      };

      const moveToStep = (index, direction) => {
        if (!pinTrigger || transitionInProgress) return false;
        const nextIndex = clamp(index, 0, states.length - 1);
        if (nextIndex === activeIndex) return false;
        setScrollTop(stepScrollTop(nextIndex));
        return transitionToStep(nextIndex, direction);
      };

      const leavePinnedStory = (direction) => {
        if (!pinTrigger) return;
        transition?.kill();
        transitionInProgress = false;
        if (direction > 0) {
          setExclusiveState(states.length - 1);
          animateSceneToStep(states.length - 1, true);
          setScrollTop(pinTrigger.end + 2);
        } else {
          setExclusiveState(0);
          animateSceneToStep(0, true);
          setScrollTop(pinTrigger.start - 2);
        }
      };

      const moveByDirection = (direction) => {
        if (!direction || !pinTrigger?.isActive || transitionInProgress) return;
        const targetIndex = activeIndex + direction;
        if (targetIndex < 0 || targetIndex >= states.length) {
          leavePinnedStory(direction);
          return;
        }
        moveToStep(targetIndex, direction);
      };

      const wheelDirection = (event) => {
        const primary =
          Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
        return primary === 0 ? 0 : primary > 0 ? 1 : -1;
      };

      const onWheel = (event) => {
        if (!pinTrigger?.isActive || event.ctrlKey) return;
        const direction = wheelDirection(event);
        if (!direction) return;

        // Consume every wheel delta while pinned. Only the first delta in a wheel/trackpad burst
        // may advance the story, so +1px and +1000px both mean exactly one next step.
        event.preventDefault();
        window.clearTimeout(wheelBurstTimer);
        wheelBurstTimer = window.setTimeout(() => {
          wheelBurst = false;
        }, 140);
        if (wheelBurst || transitionInProgress) return;
        wheelBurst = true;
        moveByDirection(direction);
      };

      const onTouchStart = (event) => {
        if (!pinTrigger?.isActive || event.touches.length !== 1) return;
        touchStartY = event.touches[0].clientY;
        touchHandled = false;
      };

      const onTouchMove = (event) => {
        if (!pinTrigger?.isActive || touchStartY === null || event.touches.length !== 1) return;
        if (touchHandled || transitionInProgress) {
          if (event.cancelable) event.preventDefault();
          return;
        }

        const delta = touchStartY - event.touches[0].clientY;
        if (Math.abs(delta) < 1) return;
        if (event.cancelable) event.preventDefault();
        touchHandled = true;
        moveByDirection(delta > 0 ? 1 : -1);
      };

      const onTouchEnd = () => {
        touchStartY = null;
        touchHandled = false;
      };

      const onKeyDown = (event) => {
        if (!pinTrigger?.isActive || event.defaultPrevented) return;
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          target.closest('input, select, textarea, button, a, [contenteditable="true"]')
        )
          return;

        let direction = 0;
        if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey))
          direction = 1;
        if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey))
          direction = -1;
        if (!direction) return;
        event.preventDefault();
        moveByDirection(direction);
      };

      setExclusiveState(0);
      animateSceneToStep(0, true);

      pinTrigger = ScrollTrigger.create({
        trigger: root,
        pin: frame,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * 4.5)}`,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          if (programmaticScroll) return;
          transition?.kill();
          transitionInProgress = false;
          setExclusiveState(0);
          animateSceneToStep(0, true);
          window.requestAnimationFrame(() => setScrollTop(stepScrollTop(0)));
        },
        onEnterBack: () => {
          if (programmaticScroll) return;
          transition?.kill();
          transitionInProgress = false;
          setExclusiveState(states.length - 1);
          animateSceneToStep(states.length - 1, true);
          window.requestAnimationFrame(() => setScrollTop(stepScrollTop(states.length - 1)));
        },
        onLeave: () => {
          setExclusiveState(states.length - 1);
          animateSceneToStep(states.length - 1, true);
        },
        onLeaveBack: () => {
          setExclusiveState(0);
          animateSceneToStep(0, true);
        }
      });

      window.addEventListener('wheel', onWheel, { passive: false, capture: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
      window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
      window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
      window.addEventListener('keydown', onKeyDown, { capture: true });

      const moveX = gsap.quickTo(ambient, 'x', { duration: 0.8, ease: 'power3.out' });
      const moveY = gsap.quickTo(ambient, 'y', { duration: 0.8, ease: 'power3.out' });
      const onPointer = (event) => {
        const bounds = frame.getBoundingClientRect();
        moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 10);
        moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 8);
      };
      const resetPointer = () => {
        moveX(0);
        moveY(0);
      };
      if (pointer) {
        frame.addEventListener('pointermove', onPointer);
        frame.addEventListener('pointerleave', resetPointer);
      }

      return () => {
        transition?.kill();
        sceneTween?.kill();
        sunTween?.kill();
        pinTrigger?.kill();
        window.clearTimeout(wheelBurstTimer);
        window.cancelAnimationFrame(programmaticScrollFrame);
        frame.removeEventListener('pointermove', onPointer);
        frame.removeEventListener('pointerleave', resetPointer);
        window.removeEventListener('wheel', onWheel, true);
        window.removeEventListener('touchstart', onTouchStart, true);
        window.removeEventListener('touchmove', onTouchMove, true);
        window.removeEventListener('touchend', onTouchEnd, true);
        window.removeEventListener('touchcancel', onTouchEnd, true);
        window.removeEventListener('keydown', onKeyDown, true);
        root.style.removeProperty('--process-progress');
        states.forEach((state) => {
          state.removeAttribute('aria-hidden');
          gsap.set(state, { clearProps: 'all' });
          gsap.set(state.querySelector('[data-process-copy]'), { clearProps: 'all' });
          gsap.set(state.querySelector('[data-process-visual]'), { clearProps: 'all' });
          gsap.set(state.querySelectorAll('[data-process-card], [data-process-install-step]'), {
            clearProps: 'all'
          });
        });
      };
    }
  );

  document.fonts?.ready.then(() => {
    if (!disposed) ScrollTrigger.refresh();
  });

  return () => {
    disposed = true;
    mobileObserver?.disconnect();
    media.revert();
    metricAnimations.forEach((animation) => animation.kill());
    if (form && region && amount) {
      form.noValidate = false;
      form.removeEventListener('submit', onSubmit);
      region.removeEventListener('change', onInput);
      amount.removeEventListener('input', onInput);
      modes.forEach((input) => input.removeEventListener('change', onMode));
    }
    window.removeEventListener('solar:analysis-updated', render);
    window.removeEventListener('pageshow', render);
  };
};
