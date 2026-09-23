/**
 * Tracks requests owned by one replaceable UI instance. A provider may settle
 * after `abort()` (for example, a mocked or already-buffered response), so
 * callers must also use `canCommit` before writing session state or the DOM.
 */
export const createAsyncRequestLifecycle = () => {
  let active = true;
  const controllers = new Set();

  const createController = () => {
    const controller = new AbortController();
    if (active) controllers.add(controller);
    else controller.abort();
    return controller;
  };

  const release = (controller) => controllers.delete(controller);

  const canCommit = (controller, currentController) =>
    active && !controller?.signal.aborted && currentController === controller;

  const destroy = () => {
    if (!active) return false;
    active = false;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
    return true;
  };

  return Object.freeze({
    createController,
    release,
    canCommit,
    isActive: () => active,
    destroy
  });
};
