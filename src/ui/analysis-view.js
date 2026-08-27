import { formatCompactAmd, formatDecimal, formatNumber } from '../utils/format.js';

const setLeadingText = (element, value) => {
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = `${value} `;
  } else {
    element.textContent = value;
  }
};

const createFinancePath = (timeline) => {
  const points = timeline.map(({ net }) => Number(net)).filter((value) => Number.isFinite(value));
  if (points.length < 2) {
    return null;
  }

  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const startX = 30;
  const endX = 623;
  const topY = 26;
  const bottomY = 192;
  const toPoint = (value, index) => ({
    x: startX + ((endX - startX) * index) / (points.length - 1),
    y: topY + ((max - value) / range) * (bottomY - topY)
  });
  const chartPoints = points.map(toPoint);
  const path = chartPoints.reduce((result, point, index) => {
    if (index === 0) {
      return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }
    const previous = chartPoints[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${result} C${midpoint.toFixed(1)} ${previous.y.toFixed(1)}, ${midpoint.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, '');
  const zeroY = topY + (max / range) * (bottomY - topY);

  return { chartPoints, path, zeroY };
};

export const createAnalysisView = ({ locale }) => {
  const isHy = locale.startsWith('hy');
  const years = isHy ? 'տարի' : 'лет';
  const area = isHy ? 'մ²' : 'м²';
  const timelineYear = (year) => {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return '';
    if (numericYear === 0) return isHy ? 'Այսօր' : 'Сегодня';
    return isHy ? `${numericYear} տարի` : `${numericYear} лет`;
  };
  const financeDisclaimer = (analysis) => {
    const capex = formatNumber(analysis.timeline[0]?.net * -1 || 0, locale);
    const annualSavings = formatNumber(analysis.savings.annual, locale);
    const payback = formatDecimal(analysis.payback.years, locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const grossSavings = formatDecimal(analysis.savings.gross25Years / 1_000_000, locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return isHy
      ? `${capex} ֏ ÷ ${annualSavings} ֏/տարի = ${payback} տարի։ Սակագնի աճը, դեգրադացիան, սպասարկումը, վարկն ու դիսկոնտավորումը չեն հաշվարկվել։ 25 տարվա համախառն խնայողությունը ${grossSavings} մլն ֏ է։`
      : `${capex} ֏ ÷ ${annualSavings} ֏/год = ${payback} года. Не учтены рост тарифа, деградация, сервис, кредит и дисконтирование. Валовая экономия за 25 лет — ${grossSavings} млн ֏.`;
  };

  const values = {
    generation: (analysis) => formatNumber(analysis.annualGeneration, locale),
    savings: (analysis) => formatNumber(analysis.savings.annual, locale),
    payback: (analysis) => `≈ ${formatDecimal(analysis.payback.displayYears, locale)}`,
    coverage: (analysis) => formatNumber(analysis.coverage, locale),
    capacity: (analysis) =>
      `${formatDecimal(analysis.system.capacityKwp, locale, { maximumFractionDigits: 2 })} kWp`,
    panels: (analysis) => `${analysis.system.panelCount} × ${analysis.system.panelWatts} W`
  };

  const update = (analysis) => {
    document.querySelectorAll('[data-analysis]').forEach((element) => {
      const key = element.dataset.analysis;
      if (!values[key]) {
        return;
      }
      if (key === 'capacity' || key === 'panels') {
        element.textContent = values[key](analysis);
      } else {
        setLeadingText(element, values[key](analysis));
      }
    });
    document.querySelectorAll('[data-analysis-location]').forEach((element) => {
      element.textContent = analysis.location.label;
    });
    document.querySelectorAll('[data-analysis-roof]').forEach((element) => {
      const key = element.dataset.analysisRoof;
      const value =
        key === 'area'
          ? `${formatNumber(analysis.roof.areaSqm, locale)} ${area}`
          : key === 'orientation'
            ? analysis.roof.orientationLabel
            : `${analysis.roof.tilt}°`;
      element.textContent = value;
    });
    document.querySelectorAll('[data-analysis-timeline]').forEach((element) => {
      const value = analysis.timeline[Number(element.dataset.analysisTimeline)]?.net;
      if (Number.isFinite(value)) {
        element.textContent = formatCompactAmd(value, locale);
      }
    });
    document.querySelectorAll('[data-analysis-timeline-year]').forEach((element, index) => {
      const year = analysis.timeline[index]?.year;
      if (Number.isFinite(year)) {
        element.textContent = timelineYear(year);
      }
    });
    document.querySelectorAll('[data-analysis-finance-disclaimer]').forEach((element) => {
      element.textContent = financeDisclaimer(analysis);
    });
    const financeLine = createFinancePath(analysis.timeline);
    if (financeLine) {
      document.querySelector('[data-finance-line-path]')?.setAttribute('d', financeLine.path);
      document
        .querySelector('[data-finance-baseline]')
        ?.setAttribute('d', `M30 ${financeLine.zeroY.toFixed(1)} H623`);
      document.querySelectorAll('[data-finance-point]').forEach((point, index) => {
        const chartPoint = financeLine.chartPoints[index];
        if (chartPoint) {
          point.setAttribute('cx', chartPoint.x.toFixed(1));
          point.setAttribute('cy', chartPoint.y.toFixed(1));
        }
      });
      const financeChart = document.querySelector('[data-finance-chart]');
      const timelineLabel = analysis.timeline
        .map(({ year, net }) => `${timelineYear(year)}: ${formatCompactAmd(net, locale)}`)
        .join(', ');
      financeChart?.setAttribute(
        'aria-label',
        `${financeChart.dataset.financeTitle}: ${timelineLabel}`
      );
    }
    document.querySelectorAll('[data-analysis="payback"] small').forEach((element) => {
      element.textContent = years;
    });
  };

  return { update };
};
