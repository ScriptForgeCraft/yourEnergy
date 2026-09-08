const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);

/**
 * Consumer-facing presentation intentionally exposes a single preliminary
 * range. The PriceBook percentiles remain intact in the shared analysis for
 * the professional calculator and source ledger.
 */
export const formatConsumerCommercialRange = (estimate, locale) => {
  if (estimate?.available !== true) return null;
  const lower = number(estimate?.rangeAmd?.p25);
  const upper = number(estimate?.rangeAmd?.p75);
  if (lower === null || upper === null) return null;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return `${format.format(lower)} ֏ – ${format.format(upper)} ֏`;
};
