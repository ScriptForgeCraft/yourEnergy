export const MONTHS_PER_YEAR = 12;

export const toFiniteNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
