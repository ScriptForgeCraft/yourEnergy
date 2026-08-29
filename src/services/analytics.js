const prohibitedKeys = new Set([
  'address',
  'email',
  'phone',
  'name',
  'message',
  'coordinates',
  'lat',
  'lng'
]);

const safeDetail = (detail = {}) =>
  Object.fromEntries(
    Object.entries(detail).filter(([key, value]) => !prohibitedKeys.has(key) && value !== undefined)
  );

/**
 * Vendor-neutral, opt-in event boundary. The site has no analytics vendor by
 * default; consumers may listen to these safe browser events later.
 */
export const trackProductEvent = (name, detail = {}) => {
  if (!/^[-a-z0-9_]+$/iu.test(name)) return;
  window.dispatchEvent(
    new CustomEvent('solar:analytics', { detail: { name, ...safeDetail(detail) } })
  );
};
