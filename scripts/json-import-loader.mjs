export const load = (url, context, nextLoad) => {
  if (url.endsWith('.json') && context.importAttributes.type !== 'json') {
    return nextLoad(url, {
      ...context,
      importAttributes: { ...context.importAttributes, type: 'json' }
    });
  }
  return nextLoad(url, context);
};
