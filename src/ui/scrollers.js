const bindProjectScroller = (trackSelector, buttonSelector) => {
  const track = document.querySelector(trackSelector);

  if (!track) {
    return;
  }

  const buttons = [...document.querySelectorAll(buttonSelector)];
  const tolerance = 2;

  // Пока идёт smooth-scroll, здесь хранится его конечная позиция.
  let pendingTarget = null;

  const getCards = () => [...track.querySelectorAll('.portfolio-project-card')];

  const getMaxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);

  const syncButtons = (scrollPosition = track.scrollLeft) => {
    const maxScroll = getMaxScroll();

    const atStart = maxScroll <= tolerance || scrollPosition <= tolerance;

    const atEnd = maxScroll <= tolerance || scrollPosition >= maxScroll - tolerance;

    for (const button of buttons) {
      const direction = Number(button.dataset.projectDirection);

      button.disabled = direction < 0 ? atStart : atEnd;
    }
  };

  const getStep = () => {
    const cards = getCards();

    if (!cards.length) {
      return 0;
    }

    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;

    return cards[0].getBoundingClientRect().width + gap;
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const step = getStep();

      if (!step) {
        return;
      }

      const direction = Number(button.dataset.projectDirection);

      const maxScroll = getMaxScroll();

      const targetScroll = Math.min(maxScroll, Math.max(0, track.scrollLeft + direction * step));

      pendingTarget = targetScroll;

      syncButtons(targetScroll);

      track.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    });
  });

  track.addEventListener(
    'scroll',
    () => {
      if (pendingTarget !== null) {
        syncButtons(pendingTarget);

        const reachedTarget = Math.abs(track.scrollLeft - pendingTarget) <= tolerance;

        if (reachedTarget) {
          pendingTarget = null;
          syncButtons();
        }

        return;
      }

      syncButtons();
    },
    {
      passive: true
    }
  );

  const cancelPendingScroll = () => {
    pendingTarget = null;
    syncButtons();
  };

  track.addEventListener('pointerdown', cancelPendingScroll, {
    passive: true
  });

  track.addEventListener('wheel', cancelPendingScroll, {
    passive: true
  });

  track.addEventListener('touchstart', cancelPendingScroll, {
    passive: true
  });

  new ResizeObserver(() => {
    pendingTarget = null;
    syncButtons();
  }).observe(track);

  syncButtons();
};

export const initScrollers = () => {
  bindProjectScroller('[data-projects-track]', '[data-project-direction]');
};
