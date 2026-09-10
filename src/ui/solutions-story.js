import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger.js';
import { createCalculatorSession } from './calculator-session.js';
import { getArmeniaRegionalBenchmark } from '../data/regions/armenia.js';
import { toNonNegativeNumberOrNull, toPositiveNumberOrNull } from '../domain/numbers.js';

const signature = (state) =>
  JSON.stringify([
    state?.regionId ?? null,
    state?.consumption?.mode ?? null,
    state?.consumption?.averageMonthlyBillAmd ?? null,
    state?.consumption?.averageMonthlyKwh ?? null
  ]);

/** Input handoff only. Tariff confirmation and calculations stay in Quick. */
export const buildSolutionsStartState = ({ regionId, mode, amount }, previous = {}) => {
  const value = toPositiveNumberOrNull(amount);
  if (!getArmeniaRegionalBenchmark(regionId) || !['bill', 'usage'].includes(mode) || value === null)
    return null;
  const consumption =
    mode === 'bill' ? { mode, averageMonthlyBillAmd: value } : { mode, averageMonthlyKwh: value };
  const next = { regionId, consumption };
  if (signature(next) !== signature(previous)) {
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

/** Only read completed results, never synthesize personalized metrics. */
export const buildSolutionsPresentation = (analysis, { status = 'idle' } = {}) => {
  const valid = status === 'complete' && Boolean(analysis?.selectedScenario);
  const result = valid ? analysis : null;
  return {
    hasResult: valid,
    solarResource: toNonNegativeNumberOrNull(result?.production?.annualYieldKwhPerKwp),
    source:
      typeof result?.production?.source?.provider === 'string'
        ? result.production.source.provider
        : null,
    systemSize: toNonNegativeNumberOrNull(result?.selectedScenario?.system?.capacityKwp),
    panelCount: toNonNegativeNumberOrNull(result?.selectedScenario?.system?.panelCount),
    annualProduction: toNonNegativeNumberOrNull(result?.selectedScenario?.generation?.annualKwh)
  };
};

export const initSolutionsStory = ({ config = {} } = {}) => {
  const root = document.querySelector('[data-solutions-home]');
  if (!root) return () => {};
  gsap.registerPlugin(ScrollTrigger);
  const copy = config.journey;
  const locale = config.locale || document.documentElement.lang;
  const frame = root.querySelector('.stage-home__frame');
  const form = root.querySelector('[data-stage-form]');
  const region = root.querySelector('[data-stage-region]');
  const amount = root.querySelector('[data-stage-amount]');
  const modes = [...form.querySelectorAll('[name="mode"]')];
  const session = createCalculatorSession();
  const media = gsap.matchMedia();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lighting = root.querySelector('[data-stage-lighting]');
  const lightButtons = [...root.querySelectorAll('[data-stage-light]')];
  const setLighting = (event) => {
    const selected = event.currentTarget.dataset.stageLight;
    root.dataset.lighting = selected;
    lightButtons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.stageLight === selected))
    );
  };
  lightButtons.forEach((button) => button.addEventListener('click', setLighting));
  if (lighting) lighting.hidden = false;
  const counters = new Map();
  const seen = new Set();
  let isVisible = false;
  let disposed = false;
  let activePresentation = null;
  let hasEditedInput = false;
  const mode = () => modes.find((input) => input.checked)?.value ?? 'bill';
  const draft = () =>
    buildSolutionsStartState(
      { regionId: region.value, mode: mode(), amount: amount.value },
      session.read()
    );
  const initial = session.read();
  if (getArmeniaRegionalBenchmark(initial.regionId)) region.value = initial.regionId;
  modes.forEach((input) => {
    input.checked = input.value === (initial.consumption?.mode ?? 'bill');
  });
  const amounts = {
    bill: initial.consumption?.averageMonthlyBillAmd ?? '',
    usage: initial.consumption?.averageMonthlyKwh ?? ''
  };
  let activeMode = mode();
  amount.value = amounts[activeMode];
  const consumptionFields = [...form.querySelectorAll('[data-stage-consumption]')];
  const submitLabel = form.querySelector('[data-stage-submit-label]');
  const setFormExpanded = (expanded) => {
    root.dataset.formExpanded = String(expanded);
    consumptionFields.forEach((element) => {
      element.hidden = !expanded;
    });
    if (submitLabel) submitLabel.textContent = expanded ? copy.submit : copy.continue;
  };
  form.noValidate = true;
  setFormExpanded(Boolean(amount.value));
  const syncMode = () => {
    const bill = mode() === 'bill';
    root.querySelector('[data-stage-amount-label]').textContent = bill
      ? copy.amountBill
      : copy.amountUsage;
    root.querySelector('[data-stage-help]').textContent = bill ? copy.billHelp : copy.usageHelp;
    root.querySelector('[data-stage-unit]').textContent = bill ? 'AMD' : 'kWh';
  };
  const animateCounts = () => {
    for (const [element, entry] of counters) {
      if (!isVisible && !reduced.matches) continue;
      const key = JSON.stringify([element.dataset.stageCount, entry.value, entry.resultKey]);
      if (seen.has(key)) {
        if (!gsap.isTweening(entry)) element.textContent = entry.format.format(entry.value);
        continue;
      }
      seen.add(key);
      if (reduced.matches) {
        element.textContent = entry.format.format(entry.value);
      } else {
        entry.current = 0;
        gsap.to(entry, {
          current: entry.value,
          duration: 0.85,
          ease: 'power2.out',
          onUpdate: () => {
            element.textContent = entry.format.format(entry.current);
          }
        });
      }
    }
  };
  const render = () => {
    const saved = session.read();
    const current = draft();
    const sameInput = current && signature(current) === signature(saved);
    const analysis = saved.analysis ?? saved.quickAnalysis;
    // A completed professional analysis may not carry Quick's optional form
    // metadata. Show it on arrival, but never label it as matching edited input.
    const presentation = buildSolutionsPresentation(
      !hasEditedInput || sameInput ? analysis : null,
      {
        status: saved.analysisStatus
      }
    );
    root.querySelector('[data-stage-location]').textContent =
      copy.regions.find(({ id }) => id === region.value)?.label ?? copy.chooseRegion;
    root.querySelector('[data-stage-resource]').textContent =
      presentation.solarResource === null
        ? copy.pending
        : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
            presentation.solarResource
          ) + ' kWh/kWp';
    root.querySelector('[data-stage-source]').textContent = presentation.source
      ? copy.source + ': ' + presentation.source
      : '';
    const resultKey = JSON.stringify([presentation, analysis?.providerRetrievedAt]);
    if (resultKey === activePresentation) return;
    activePresentation = resultKey;
    counters.forEach((entry) => gsap.killTweensOf(entry));
    counters.clear();
    root.querySelector('[data-stage-results]').hidden = ![
      'annualProduction',
      'systemSize',
      'panelCount'
    ].some((key) => presentation[key] !== null);
    root.querySelectorAll('[data-stage-count]').forEach((element) => {
      const value = presentation[element.dataset.stageCount];
      element.parentElement.hidden = value === null;
      if (value === null) {
        element.textContent = '';
        return;
      }
      const format = new Intl.NumberFormat(locale, {
        maximumFractionDigits: element.dataset.stageCount === 'systemSize' ? 2 : 0
      });
      element.textContent = format.format(value);
      counters.set(element, { value, format, resultKey, current: value });
    });
    animateCounts();
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
      if (!reduced.matches)
        gsap.fromTo(
          consumptionFields,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.04 }
        );
      return;
    }
    if (!form.reportValidity()) return;
    const next = draft();
    if (!next) return;
    session.write(next);
    window.location.assign(form.action);
  };
  form.addEventListener('submit', onSubmit);
  region.addEventListener('change', onInput);
  amount.addEventListener('input', onInput);
  modes.forEach((input) => input.addEventListener('change', onMode));
  window.addEventListener('solar:analysis-updated', render);
  window.addEventListener('pageshow', render);
  syncMode();
  render();
  const visibility = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) animateCounts();
    },
    { threshold: 0.12 }
  );
  visibility.observe(frame);
  media.add(
    {
      desktop: '(min-width: 768px) and (min-height: 650px)',
      pointer: '(hover: hover) and (pointer: fine)',
      reduce: '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { desktop, pointer, reduce } = context.conditions;
      if (reduce) {
        counters.forEach((entry, element) => {
          gsap.killTweensOf(entry);
          element.textContent = entry.format.format(entry.value);
        });
        return;
      }
      const reveals = root.querySelectorAll('[data-stage-reveal]');
      const cards = root.querySelectorAll('[data-stage-card]');
      const arc = root.querySelector('[data-stage-arc]');
      const backdrop = root.querySelector('.stage-home__backdrop');
      const art = root.querySelector('[data-solutions-visual]');
      const progress = root.querySelector('.stage-home__progress');
      const entrance = gsap.timeline({
        scrollTrigger: { trigger: frame, start: 'top 75%', once: true },
        defaults: { duration: 0.7, ease: 'power3.out' }
      });
      entrance
        .from(backdrop, { opacity: 0 }, 0)
        .from(reveals, { opacity: 0, y: 18, stagger: 0.09 }, 0.08)
        .from(cards, { opacity: 0, y: 12, stagger: 0.12 }, 0.42)
        .fromTo(arc, { opacity: 0 }, { opacity: 1 }, 0.64)
        .from(progress, { opacity: 0, x: 8 }, 0.76);
      if (!desktop) return;
      // CSS reserves the short runway before initialization. Native scrolling
      // drives one scene, with no wheel/touch capture or slide snapping.
      const sun = root.querySelector('[data-stage-sun]');
      const path = root.querySelector('[data-stage-arc-path]');
      const pathLength = path.getTotalLength();
      const solar = { progress: 0.6 };
      const placeSun = () => {
        const point = path.getPointAtLength(pathLength * solar.progress);
        gsap.set(sun, { x: point.x, y: point.y });
      };
      placeSun();
      const depth = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          pin: frame,
          pinSpacing: false,
          start: 'top top',
          end: () => '+=' + Math.min(frame.offsetHeight * 0.45, 400),
          scrub: 0.65,
          invalidateOnRefresh: true
        },
        defaults: { duration: 1, ease: 'none' }
      });
      depth
        .fromTo(art, { scale: 1.03, y: 0 }, { scale: 1.01, y: -4 }, 0)
        .to(cards[0], { y: -8 }, 0)
        .to(cards[1], { y: -16 }, 0)
        .to(solar, { progress: 0.72, onUpdate: placeSun }, 0);
      const pointerLayer = root.querySelector('[data-stage-pointer]');
      const moveX = gsap.quickTo(pointerLayer, 'x', { duration: 0.7, ease: 'power3.out' });
      const moveY = gsap.quickTo(pointerLayer, 'y', { duration: 0.7, ease: 'power3.out' });
      const onPointer = (event) => {
        const bounds = frame.getBoundingClientRect();
        moveX(
          Math.max(
            -6,
            Math.min(6, ((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 12)
          )
        );
        moveY(
          Math.max(
            -6,
            Math.min(6, ((event.clientY - bounds.top - bounds.height / 2) / bounds.height) * 12)
          )
        );
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
      };
    }
  );
  document.fonts?.ready.then(() => {
    if (!disposed) ScrollTrigger.refresh();
  });
  return () => {
    disposed = true;
    lightButtons.forEach((button) => button.removeEventListener('click', setLighting));
    gsap.killTweensOf(consumptionFields);
    form.noValidate = false;
    setFormExpanded(true);
    visibility.disconnect();
    media.revert();
    counters.forEach((entry) => gsap.killTweensOf(entry));
    form.removeEventListener('submit', onSubmit);
    region.removeEventListener('change', onInput);
    amount.removeEventListener('input', onInput);
    modes.forEach((input) => input.removeEventListener('change', onMode));
    window.removeEventListener('solar:analysis-updated', render);
    window.removeEventListener('pageshow', render);
  };
};
