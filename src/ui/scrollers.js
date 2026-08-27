const bindScroller = (trackSelector, buttonSelector, distance) => {
  const track = document.querySelector(trackSelector);
  if (!track) {
    return;
  }
  document.querySelectorAll(buttonSelector).forEach((button) => {
    button.addEventListener('click', () => {
      track.scrollBy({
        left:
          Number(
            button.dataset[
              buttonSelector.includes('project') ? 'projectDirection' : 'testimonialDirection'
            ]
          ) * distance,
        behavior: 'smooth'
      });
    });
  });
};

export const initScrollers = () => {
  bindScroller('[data-projects-track]', '[data-project-direction]', 420);
  bindScroller('[data-testimonials-track]', '[data-testimonial-direction]', 380);
};
