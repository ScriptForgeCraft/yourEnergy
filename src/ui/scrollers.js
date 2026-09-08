const bindProjectScroller = (trackSelector, buttonSelector) => {
  const track = document.querySelector(trackSelector);
  if (!track) {
    return;
  }
  const buttons = [...document.querySelectorAll(buttonSelector)];
  const syncButtons = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    for (const button of buttons) {
      const direction = Number(button.dataset.projectDirection);
      button.disabled =
        maxScroll <= 1 ||
        (direction < 0 ? track.scrollLeft <= 1 : track.scrollLeft >= maxScroll - 1);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      track.scrollBy({
        left: Number(button.dataset.projectDirection) * Math.max(240, track.clientWidth * 0.72),
        behavior: 'smooth'
      });
    });
  });

  track.addEventListener('scroll', syncButtons, { passive: true });
  new ResizeObserver(syncButtons).observe(track);
  syncButtons();
};

export const initScrollers = () => {
  bindProjectScroller('[data-projects-track]', '[data-project-direction]');
};
