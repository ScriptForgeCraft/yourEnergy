export const initGenerationChart = ({ locale, status }) => {
  const bars = [...document.querySelectorAll('[data-chart-bar]')];
  const tableValues = [...document.querySelectorAll('[data-chart-value]')];
  if (!bars.length) {
    return { update() {} };
  }

  const label = (short, month, value) =>
    `${short} · ${status.monthTooltip
      .replace('{month}', month)
      .replace('{value}', new Intl.NumberFormat(locale).format(value))}`;
  bars.forEach((bar) => {
    const text = label(bar.dataset.short, bar.dataset.month, Number(bar.dataset.value));
    bar.setAttribute('aria-label', text);
    bar.title = text;
  });

  return {
    update(analysis) {
      const maximum = Math.max(...analysis.monthlyGeneration, 1);
      bars.forEach((bar, index) => {
        const value = analysis.monthlyGeneration[index] ?? 0;
        bar.dataset.value = String(value);
        bar.style.setProperty('--bar-height', `${Math.round((value / maximum) * 100)}%`);
        const text = label(bar.dataset.short, bar.dataset.month, value);
        bar.setAttribute('aria-label', text);
        bar.title = text;
      });
      tableValues.forEach((cell, index) => {
        cell.textContent = new Intl.NumberFormat(locale).format(
          analysis.monthlyGeneration[index] ?? 0
        );
      });
    }
  };
};
