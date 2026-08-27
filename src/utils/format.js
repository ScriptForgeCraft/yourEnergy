const safeNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export const formatNumber = (value, locale = 'ru-RU', options = {}) =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    ...options
  }).format(safeNumber(value));

export const formatDecimal = (value, locale = 'ru-RU', options = {}) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options
  }).format(safeNumber(value));

export const formatCurrency = (value, locale = 'ru-RU', options = {}) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'AMD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    ...options
  }).format(safeNumber(value));

export const formatCompactAmd = (value, locale = 'ru-RU') => {
  const amount = safeNumber(value);
  const isMillion = Math.abs(amount) >= 1_000_000;
  const magnitude = isMillion ? amount / 1_000_000 : amount / 1_000;
  const suffix = locale.startsWith('hy')
    ? isMillion
      ? 'մլն'
      : 'հազ.'
    : isMillion
      ? 'млн'
      : 'тыс.';
  return `${formatDecimal(magnitude, locale, { maximumFractionDigits: 1 })} ${suffix} ֏`;
};

export const isFiniteDisplayValue = (value) => !/NaN|Infinity/.test(String(value));
