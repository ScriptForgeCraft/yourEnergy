import { toFiniteNumberOrNull } from '../../domain/numbers.js';

export const number = (value, minimum = -Infinity, maximum = Infinity) => {
  const parsed = toFiniteNumberOrNull(value);
  return parsed !== null && parsed >= minimum && parsed <= maximum ? parsed : null;
};

export const format = (value, locale, options = {}) => {
  const parsed = number(value);
  return parsed === null
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...options }).format(parsed);
};

export const formatApproximate = (value, locale, suffix = '', options = {}) =>
  number(value) === null ? '—' : `≈ ${format(value, locale, options)}${suffix ? ` ${suffix}` : ''}`;

export const text = (template, values) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template ?? ''
  );

export const element = (tag, className, value) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = value;
  return node;
};

export const localeCode = (locale) => locale?.split('-')[0] ?? 'hy';
