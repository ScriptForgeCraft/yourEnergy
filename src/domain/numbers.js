export const MONTHS_PER_YEAR = 12;

/**
 * Parses a number that was typed or pasted in either common decimal notation.
 * Whitespace is treated as a grouping separator, while a single dot or comma
 * is a decimal separator. Mixed dot/comma values use the rightmost separator
 * as the decimal separator and validate the other as a thousands separator.
 */
export const parseDecimalNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const compact = value.trim().replace(/[\s\u00a0\u202f]/gu, '');
  if (!compact || !/^[+-]?[\d.,]+$/u.test(compact)) return null;

  const sign = compact.startsWith('-') ? '-' : compact.startsWith('+') ? '+' : '';
  const unsigned = sign ? compact.slice(1) : compact;
  const dotCount = (unsigned.match(/\./gu) ?? []).length;
  const commaCount = (unsigned.match(/,/gu) ?? []).length;
  const lastDot = unsigned.lastIndexOf('.');
  const lastComma = unsigned.lastIndexOf(',');
  const hasMixedSeparators = dotCount > 0 && commaCount > 0;

  let decimalSeparator = null;
  if (hasMixedSeparators) decimalSeparator = lastDot > lastComma ? '.' : ',';
  else if (dotCount === 1) decimalSeparator = '.';
  else if (commaCount === 1) decimalSeparator = ',';

  const isGroupedInteger = (integer, separator) => {
    const escapedSeparator = separator === '.' ? '\\.' : ',';
    return new RegExp(`^\\d{1,3}(?:${escapedSeparator}\\d{3})*$`, 'u').test(integer);
  };

  let normalized;
  if (decimalSeparator === null) {
    if (dotCount === 0 && commaCount === 0) {
      normalized = unsigned;
    } else {
      const groupingSeparator = dotCount > 0 ? '.' : ',';
      if (!isGroupedInteger(unsigned, groupingSeparator)) return null;
      normalized = unsigned.replaceAll(groupingSeparator, '');
    }
  } else {
    const decimalIndex = unsigned.lastIndexOf(decimalSeparator);
    const integer = unsigned.slice(0, decimalIndex);
    const fraction = unsigned.slice(decimalIndex + 1);
    const groupingSeparator = decimalSeparator === '.' ? ',' : '.';
    const integerIsValid =
      /^\d+$/u.test(integer) ||
      (hasMixedSeparators && isGroupedInteger(integer, groupingSeparator));
    if (!integerIsValid || !/^\d+$/u.test(fraction)) return null;
    normalized = `${integer.replaceAll(groupingSeparator, '')}.${fraction}`;
  }

  const number = Number(`${sign}${normalized}`);
  return Number.isFinite(number) ? number : null;
};

export const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  return parseDecimalNumber(value);
};

export const toPositiveNumberOrNull = (value) => {
  const number = toFiniteNumberOrNull(value);
  return number !== null && number > 0 ? number : null;
};

export const toNonNegativeNumberOrNull = (value) => {
  const number = toFiniteNumberOrNull(value);
  return number !== null && number >= 0 ? number : null;
};

export const round = (value, precision = 2) => {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const sum = (values) =>
  Array.isArray(values)
    ? values.reduce((total, value) => (Number.isFinite(value) ? total + value : total), 0)
    : 0;

export const cleanString = (value) => {
  const result = String(value ?? '').trim();
  return result || null;
};

export const cloneSerializable = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map(cloneSerializable);
  if (!value || typeof value !== 'object') return value ?? null;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, cloneSerializable(nestedValue)])
  );
};

export const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
  return value;
};
