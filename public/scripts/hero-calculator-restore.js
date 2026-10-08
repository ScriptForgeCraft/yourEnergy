(() => {
  const sessionKey = 'yourenergy.calculator.v2';

  try {
    const state = JSON.parse(window.sessionStorage.getItem(sessionKey) ?? 'null');
    const activeAnalysis = state?.professionalAnalysis ?? state?.quickAnalysis;
    const activeStatus = state?.professionalAnalysis
      ? state.professionalAnalysisStatus
      : state?.quickAnalysisStatus;

    if (activeAnalysis || activeStatus === 'loading') {
      document.documentElement.dataset.heroCalculationState = 'restoring';
    }
  } catch {
    // Storage may be unavailable in a private or embedded browser context.
  }
})();
