const bindProjectScroller = (trackSelector, buttonSelector, distance) => {
  const track = document.querySelector(trackSelector);
  if (!track) {
    return;
  }
  document.querySelectorAll(buttonSelector).forEach((button) => {
    button.addEventListener('click', () => {
      track.scrollBy({
        left: Number(button.dataset.projectDirection) * distance,
        behavior: 'smooth'
      });
    });
  });
};

export const initScrollers = () => {
  bindProjectScroller('[data-projects-track]', '[data-project-direction]', 420);
};
