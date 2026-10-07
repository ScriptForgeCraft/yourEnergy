const UPDATE_EVENT = 'yourenergy:service-worker-update';
const HOME_WARM_DELAY_MS = 4000;

const hasConstrainedConnection = () => {
  const connection = navigator.connection;
  return Boolean(
    connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)
  );
};

const homeWarmUrls = () => {
  if (!document.querySelector('[data-home-hero]') || hasConstrainedConnection()) return [];
  const locale = document.documentElement.lang;
  const base = locale === 'hy' ? '' : `/${locale}`;
  return [
    `${base}/projects/`,
    `${base}/calculator/`,
    `${base}/equipment/`,
    `${base}/contacts/`,
    '/images/project-arabkir-480.avif',
    '/images/project-abovyan-480.avif',
    '/images/project-vagharshapat-480.avif',
    '/images/project-ararat-480.avif'
  ];
};

const scheduleHomeWarm = () => {
  const urls = homeWarmUrls();
  if (urls.length === 0) return;
  const warm = () => {
    void navigator.serviceWorker.ready.then((registration) =>
      registration.active?.postMessage({ type: 'YOUR_ENERGY_WARM_URLS', urls })
    );
  };
  window.setTimeout(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 5000 });
    else warm();
  }, HOME_WARM_DELAY_MS);
};

const updateSurface = () => {
  const surface = document.querySelector('[data-service-worker-update]');
  const reload = surface?.querySelector('[data-service-worker-reload]');
  return { surface, reload };
};

const showUpdate = (registration, onApply) => {
  const { surface, reload } = updateSurface();
  if (!surface || !reload || !registration.waiting || !surface.hidden) return;

  surface.hidden = false;
  const apply = () => {
    onApply();
    registration.waiting?.postMessage({ type: 'YOUR_ENERGY_SKIP_WAITING' });
  };
  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT, {
      detail: {
        apply
      }
    })
  );
  reload.addEventListener('click', apply, { once: true });
};

export const initServiceWorker = () => {
  if (
    !import.meta.env.PROD ||
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    window.location.protocol === 'file:'
  ) {
    return;
  }

  let reloadAfterActivation = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadAfterActivation) return;
    window.location.reload();
  });

  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          scheduleHomeWarm();
          const applyUpdate = () => {
            reloadAfterActivation = true;
          };
          if (registration.waiting) showUpdate(registration, applyUpdate);
          registration.addEventListener('updatefound', () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdate(registration, applyUpdate);
              }
            });
          });
        })
        .catch(() => {
          // Offline capability is progressive enhancement; normal navigation remains intact.
        });
    },
    { once: true }
  );
};
