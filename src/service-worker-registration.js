const UPDATE_EVENT = 'yourenergy:service-worker-update';

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
