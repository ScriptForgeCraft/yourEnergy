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

  const activateState = (index, { desktop = true } = {}) => {
    if (index === activeIndex && root.dataset.processInitialized === 'true') return;
    setProgress(index);
    root.dataset.processInitialized = 'true';
    states.forEach((state, stateIndex) => {
      const active = stateIndex === index;
      state.classList.toggle('is-active', active);
      state.classList.toggle('is-before', stateIndex < index);
      if (desktop) state.setAttribute('aria-hidden', String(!active));
      else state.removeAttribute('aria-hidden');
    });
    animateStepMetrics(index);
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
        mobileObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const index = states.indexOf(entry.target);
              entry.target.classList.add('is-in-view');
              setProgress(index);
              animateStepMetrics(index);
            });
          },
          { rootMargin: '-18% 0px -32%', threshold: 0.12 }
        );
        states.forEach((state) => mobileObserver.observe(state));
        if (reducedMotion) states.forEach((_, index) => animateStepMetrics(index));
        return () => mobileObserver?.disconnect();
      }

      const copies = states.map((state) => state.querySelector('[data-process-copy]'));
      const visuals = states.map((state) => state.querySelector('[data-process-visual]'));
      const ambient = root.querySelector('.process-stage__ambient');
      gsap.set(states.slice(1), { autoAlpha: 0 });
      gsap.set(copies.slice(1), { y: 26 });
      gsap.set(visuals.slice(1), { scale: 1.03 });
      activateState(0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          pin: frame,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 4.5)}`,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            const index = getProcessStepIndex(progress, states.length);
            if (index !== activeIndex) activateState(index);
            root.style.setProperty('--process-progress', String(progress));
          },
          onLeave: () => activateState(states.length - 1),
          onLeaveBack: () => activateState(0)
        },
        defaults: { ease: 'none' }
      });

      states.slice(1).forEach((state, offset) => {
        const index = offset + 1;
        const at = offset;
        const previous = states[index - 1];
        const previousCopy = copies[index - 1];
        const previousVisual = visuals[index - 1];
        const copyElement = copies[index];
        const visual = visuals[index];
        const cards = state.querySelectorAll('[data-process-card], [data-process-install-step]');
        timeline
          .to(previousCopy, { autoAlpha: 0, y: -20, duration: 0.28 }, at)
          .to(previousVisual, { autoAlpha: 0, scale: 1.035, duration: 0.38 }, at)
          .set(previous, { autoAlpha: 0 }, at + 0.36)
          .set(state, { autoAlpha: 1 }, at + 0.14)
          .fromTo(
            copyElement,
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: 0.34 },
            at + 0.17
          )
          .fromTo(
            visual,
            { autoAlpha: 0, scale: 1.03 },
            { autoAlpha: 1, scale: 1, duration: 0.48 },
            at + 0.12
          )
          .fromTo(
            cards,
            { autoAlpha: 0, y: 16, z: -24 },
            { autoAlpha: 1, y: 0, z: 0, duration: 0.32, stagger: 0.035 },
            at + 0.3
          );
      });
      timeline.to(ambient, { yPercent: -4, scale: 1.035, duration: states.length - 1 }, 0);

      const sun = root.querySelector('[data-process-sun]');
      const sunPath = root.querySelector('[data-process-solar-path]');
      if (sun && sunPath) {
        const pathLength = sunPath.getTotalLength();
        const solar = { progress: 0.44 };
        const placeSun = () => {
          const point = sunPath.getPointAtLength(pathLength * solar.progress);
          gsap.set(sun, { x: point.x, y: point.y });
        };
        placeSun();
        timeline.to(solar, { progress: 0.7, duration: 0.8, onUpdate: placeSun }, 0);
      }

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
        frame.removeEventListener('pointermove', onPointer);
        frame.removeEventListener('pointerleave', resetPointer);
        root.style.removeProperty('--process-progress');
        states.forEach((state) => state.removeAttribute('aria-hidden'));
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
