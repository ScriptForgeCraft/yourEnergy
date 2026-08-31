import { formatCompactAmd, formatDecimal, formatNumber } from '../utils/format.js';

const finite = (value) => Number.isFinite(Number(value));

const setValue = (element, value, { preserveUnit = false } = {}) => {
  if (!element) return;
  if (value === null || value === undefined || value === '') {
    element.textContent = '—';
    return;
  }
  if (!preserveUnit) {
    element.textContent = value;
    return;
  }
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = `${value} `;
  } else {
    element.textContent = value;
  }
};

const createFinancePath = (timeline) => {
  const points = timeline.map(({ netAmd }) => Number(netAmd)).filter(Number.isFinite);
  if (points.length < 2) return null;

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const startX = 30;
  const endX = 623;
  const topY = 26;
  const bottomY = 192;
  const chartPoints = points.map((value, index) => ({
    x: startX + ((endX - startX) * index) / (points.length - 1),
    y: topY + ((max - value) / range) * (bottomY - topY)
  }));
  const path = chartPoints.reduce((result, point, index) => {
    if (index === 0) return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    const previous = chartPoints[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${result} C${midpoint.toFixed(1)} ${previous.y.toFixed(1)}, ${midpoint.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, '');
  const zeroY = topY + (max / range) * (bottomY - topY);
  return { chartPoints, path, zeroY };
};

const locationLabel = (property, locale) => {
  if (property?.address) return property.address;
  const coordinates = property?.coordinates;
  if (!finite(coordinates?.lat) || !finite(coordinates?.lng)) return '—';
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 5 });
  return `${formatter.format(coordinates.lat)}, ${formatter.format(coordinates.lng)}`;
};

const timelineYear = (year, locale) => {
  if (!finite(year)) return '—';
  if (Number(year) === 0) {
    return locale.startsWith('hy') ? 'Այսօր' : locale.startsWith('en') ? 'Today' : 'Сегодня';
  }
  return locale.startsWith('hy')
    ? `${year} տարի`
    : locale.startsWith('en')
      ? `${year} years`
      : `${year} лет`;
};

const token = (value, key, replacement) =>
  String(value ?? '').replaceAll(`{${key}}`, String(replacement ?? '—'));

const formatCommercialEstimate = (estimate, locale, strings) => {
  if (!estimate?.available) return null;
  const format = (value) => (finite(value) ? `${formatNumber(value, locale)} ֏` : '—');
  const validUntil = estimate.validUntil
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
        new Date(`${estimate.validUntil}T00:00:00`)
      )
    : '—';
  return token(
    token(
      token(
        token(
          token(
            strings.commercialEstimate ??
              'Preliminary YOUR ENERGY price · {version} · not an offer: {p25}–{p75}; P50 {p50}. Valid until {validUntil}.',
            'version',
            estimate.priceBook?.version ?? '—'
          ),
          'p25',
          format(estimate.rangeAmd?.p25)
        ),
        'p50',
        format(estimate.rangeAmd?.p50)
      ),
      'p75',
      format(estimate.rangeAmd?.p75)
    ),
    'validUntil',
    validUntil
  );
};

const hasUnavailablePriceBook = (estimate) =>
  typeof estimate?.reason === 'string' && estimate.reason.startsWith('PRICEBOOK_');

const resetFinance = (strings) => {
  document.querySelector('[data-finance-line-path]')?.setAttribute('d', '');
  document.querySelectorAll('[data-finance-point]').forEach((point) => {
    point.setAttribute('visibility', 'hidden');
  });
  document
    .querySelectorAll('[data-analysis-timeline]')
    .forEach((element) => setValue(element, null));
  document
    .querySelectorAll('[data-analysis-timeline-year]')
    .forEach((element) => setValue(element, null));
  document.querySelectorAll('[data-analysis-finance-disclaimer]').forEach((element) => {
    element.textContent = strings.noTariff ?? strings.noSavings ?? '';
  });
  const chart = document.querySelector('[data-finance-chart]');
  if (chart) chart.setAttribute('aria-label', strings.noTariff ?? strings.noSavings ?? '');
};

const resetScenarioCards = () => {
  document.querySelectorAll('[data-analysis-scenario]').forEach((card) => {
    card.querySelectorAll('[data-static-value]').forEach((element) => {
      element.textContent = element.dataset.staticValue ?? '—';
    });
    card
      .querySelectorAll('[data-analysis-solution-badge]')
      .forEach((badge) => badge.removeAttribute('hidden'));
    card
      .querySelectorAll('[data-analysis-scenario-live]')
      .forEach((badge) => badge.setAttribute('hidden', ''));
  });
  document.querySelectorAll('[data-analysis-scenario-disclosure]').forEach((element) => {
    element.textContent = element.dataset.staticValue ?? '';
  });
};

const updateScenarioCards = (scenarios, locale, strings) => {
  if (!Array.isArray(scenarios)) return;

  document.querySelectorAll('[data-analysis-scenario]').forEach((card, index) => {
    const scenario = scenarios[index];
    if (!scenario) return;
    const financial = scenario.financial ?? {};
    const capacity = finite(scenario.system?.capacityKwp)
      ? `${formatDecimal(scenario.system.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
      : null;
    const generation = finite(scenario.generation?.annualKwh)
      ? `${formatNumber(scenario.generation.annualKwh, locale)} kWh`
      : null;
    const unavailablePriceMessage = hasUnavailablePriceBook(scenario.commercialEstimate)
      ? strings.priceUnavailable
      : strings.financialUnavailable;
    const price = finite(scenario.commercialEstimate?.primaryAmd)
      ? `P50 · ${formatNumber(scenario.commercialEstimate.primaryAmd, locale)} ֏`
      : finite(financial.capexAmd)
        ? `${formatNumber(financial.capexAmd, locale)} ֏`
        : (unavailablePriceMessage ?? strings.noTariff ?? strings.noSavings ?? '—');

    setValue(card.querySelector('[data-analysis-scenario-capacity]'), capacity);
    setValue(card.querySelector('[data-analysis-scenario-generation]'), generation);
    setValue(card.querySelector('[data-analysis-scenario-price]'), price);
    card
      .querySelectorAll('[data-analysis-solution-badge]')
      .forEach((badge) => badge.setAttribute('hidden', ''));
    card
      .querySelectorAll('[data-analysis-scenario-live]')
      .forEach((badge) => badge.removeAttribute('hidden'));
  });
  document.querySelectorAll('[data-analysis-scenario-disclosure]').forEach((element) => {
    element.textContent = strings.liveCopy ?? '';
  });
};

/** Updates real-provider results only. Demo markup is reset instead of reused as data. */
export const createAnalysisView = ({ locale, strings = {}, solutionStrings = {} } = {}) => {
  const update = (analysis) => {
    const scenario = analysis?.selectedScenario;
    if (!scenario) return;
    const financial = scenario.financial ?? {};
    const values = {
      generation: finite(scenario.generation?.annualKwh)
        ? formatNumber(scenario.generation.annualKwh, locale)
        : null,
      savings: finite(financial.annualSavingsAmd)
        ? formatNumber(financial.annualSavingsAmd, locale)
        : null,
      payback: finite(financial.paybackYears)
        ? `≈ ${formatDecimal(financial.paybackYears, locale)}`
        : null,
      coverage: finite(scenario.coveragePercent)
        ? formatNumber(scenario.coveragePercent, locale)
        : null,
      capacity: finite(scenario.system?.capacityKwp)
        ? `${formatDecimal(scenario.system.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`
        : null,
      panels:
        finite(scenario.system?.panelCount) && finite(scenario.system?.panelWatts)
          ? `${scenario.system.panelCount} × ${scenario.system.panelWatts} W`
          : null
    };

    document.querySelectorAll('[data-analysis]').forEach((element) => {
      const key = element.dataset.analysis;
      if (!(key in values)) return;
      setValue(element, values[key], { preserveUnit: key !== 'capacity' && key !== 'panels' });
    });
    document.querySelectorAll('[data-analysis-location]').forEach((element) => {
      setValue(element, locationLabel(analysis.property, locale));
    });
    document.querySelectorAll('[data-analysis-roof]').forEach((element) => {
      const key = element.dataset.analysisRoof;
      const value =
        key === 'area'
          ? finite(analysis.roof?.areaSqm)
            ? `${formatNumber(analysis.roof.areaSqm, locale)} m²`
            : null
          : key === 'orientation'
            ? finite(analysis.roof?.orientationDegrees)
              ? `${formatNumber(analysis.roof.orientationDegrees, locale)}°`
              : null
            : finite(analysis.roof?.tiltDegrees)
              ? `${formatNumber(analysis.roof.tiltDegrees, locale)}°`
              : null;
      setValue(element, value);
    });
    document.querySelector('[data-analysis-score-row]')?.setAttribute('hidden', '');
    updateScenarioCards(analysis.scenarios, locale, {
      ...strings,
      ...solutionStrings
    });

    const commercialDisclosure = document.querySelector('[data-commercial-estimate]');
    if (commercialDisclosure) {
      const disclosure = formatCommercialEstimate(
        scenario.commercialEstimate ?? analysis.commercialEstimate,
        locale,
        strings
      );
      commercialDisclosure.textContent = disclosure ?? '';
      commercialDisclosure.hidden = !disclosure;
    }

    const timeline = Array.isArray(financial.timeline) ? financial.timeline : [];
    const financeLine = createFinancePath(timeline);
    if (!financeLine) {
      resetFinance(
        hasUnavailablePriceBook(scenario.commercialEstimate ?? analysis.commercialEstimate)
          ? { ...strings, noTariff: strings.priceUnavailable ?? strings.noTariff }
          : strings
      );
      return;
    }

    document.querySelector('[data-finance-line-path]')?.setAttribute('d', financeLine.path);
    document
      .querySelector('[data-finance-baseline]')
      ?.setAttribute('d', `M30 ${financeLine.zeroY.toFixed(1)} H623`);
    document.querySelectorAll('[data-finance-point]').forEach((point, index) => {
      const chartPoint = financeLine.chartPoints[index];
      if (!chartPoint) {
        point.setAttribute('visibility', 'hidden');
        return;
      }
      point.removeAttribute('visibility');
      point.setAttribute('cx', chartPoint.x.toFixed(1));
      point.setAttribute('cy', chartPoint.y.toFixed(1));
    });
    document.querySelectorAll('[data-analysis-timeline]').forEach((element) => {
      const point = timeline[Number(element.dataset.analysisTimeline)];
      setValue(element, finite(point?.netAmd) ? formatCompactAmd(point.netAmd, locale) : null);
    });
    document.querySelectorAll('[data-analysis-timeline-year]').forEach((element, index) => {
      setValue(element, timeline[index] ? timelineYear(timeline[index].year, locale) : null);
    });
    document.querySelectorAll('[data-analysis-finance-disclaimer]').forEach((element) => {
      const disclosure = formatCommercialEstimate(
        scenario.commercialEstimate ?? analysis.commercialEstimate,
        locale,
        strings
      );
      element.textContent = [disclosure, strings.ready ?? ''].filter(Boolean).join(' ');
    });
    const chart = document.querySelector('[data-finance-chart]');
    if (chart) {
      const label = timeline
        .map(
          ({ year, netAmd }) => `${timelineYear(year, locale)}: ${formatCompactAmd(netAmd, locale)}`
        )
        .join(', ');
      chart.setAttribute('aria-label', `${chart.dataset.financeTitle}: ${label}`);
    }
  };

  const reset = () => {
    document.querySelectorAll('[data-analysis]').forEach((element) => setValue(element, null));
    document
      .querySelectorAll('[data-analysis-location]')
      .forEach((element) => setValue(element, null));
    document.querySelectorAll('[data-analysis-roof]').forEach((element) => setValue(element, null));
    document.querySelector('[data-analysis-score-row]')?.removeAttribute('hidden');
    const commercialDisclosure = document.querySelector('[data-commercial-estimate]');
    if (commercialDisclosure) {
      commercialDisclosure.textContent = '';
      commercialDisclosure.hidden = true;
    }
    resetFinance(strings);
    resetScenarioCards();
  };

  return { update, reset };
};
