try {
  const state = window.history.state?.processReloadState;
  if (
    state &&
    state.location ===
      `${window.location.pathname}${window.location.search}${window.location.hash}` &&
    Number.isInteger(state.step) &&
    Date.now() - Number(state.updatedAt) <= 15000 &&
    'scrollRestoration' in window.history
  ) {
    window.history.scrollRestoration = 'manual';
    window.__yourEnergyProcessReload = true;
  }
} catch {
  // Native restoration is the fallback when browser history is unavailable.
}
