const activateOffice = ({ frame, buttons, activeButton }) => {
  const src = activeButton?.dataset.officeMapSrc?.trim();
  if (!frame || !src) return;

  if (frame.getAttribute('src') !== src) {
    frame.setAttribute('src', src);
  }

  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    button.closest('[data-office-card]')?.classList.toggle('is-active', isActive);
  });
};

export const initContactMap = () => {
  const root = document.querySelector('[data-office-map]');
  const frame = root?.querySelector('[data-office-map-frame]');
  const buttons = [...(root?.querySelectorAll('[data-office-map-option]') ?? [])];

  if (!root || !frame || !buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      activateOffice({ frame, buttons, activeButton: button });
    });
  });
};
