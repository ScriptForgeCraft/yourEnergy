import { initNavigation } from './ui/navigation.js';
import { initScrollers } from './ui/scrollers.js';

document.documentElement.classList.add('js');

const readConfig = (selector = '#page-config, #home-page-config') => {
  try {
    return JSON.parse(document.querySelector(selector)?.textContent ?? '{}');
  } catch {
    return {};
  }
};

const config = readConfig();
const processConfig = readConfig('#process-page-config');
const contactConfig = readConfig('#contact-page-config');

initNavigation();
initScrollers();

if (document.querySelector('[data-home-hero]')) {
  void import('./ui/home-motion.js').then(({ initHomeMotion }) => initHomeMotion({ config }));
}

const processStory = document.querySelector('[data-process-story]');

if (processStory) {
  let storyStarted = false;
  const loadProcessStory = () => {
    if (storyStarted) return;
    storyStarted = true;
    void Promise.all([
      import('./ui/process-story.js'),
      import('./ui/process-inspection-overlay.js')
    ]).then(([{ initProcessStory }, { initProcessInspectionOverlay }]) => {
      const processOptions = { config: { ...config, ...processConfig } };
      initProcessStory(processOptions);
      initProcessInspectionOverlay(processOptions);
      if (window.location.hash === '#process') {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => processStory.scrollIntoView({ block: 'start' }));
        });
      }
    });
  };

  if (window.location.hash === '#process' || typeof IntersectionObserver === 'undefined') {
    loadProcessStory();
  } else {
    const storyObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        storyObserver.disconnect();
        loadProcessStory();
      },
      { rootMargin: '800px 0px' }
    );
    storyObserver.observe(processStory);
  }
}

if (document.querySelector('[data-calculator-mode-stage]')) {
  void import('./ui/calculator-mode.js').then(({ initCalculatorMode }) =>
    initCalculatorMode({ config })
  );
} else if (document.querySelector('[data-quick-calculator]')) {
  void import('./ui/quick-calculator.js').then(({ initQuickCalculator }) =>
    initQuickCalculator({ config })
  );
}

if (document.querySelector('[data-professional-calculator]')) {
  void import('./ui/calculator-wizard.js').then(({ initCalculatorWizard }) =>
    initCalculatorWizard({ config })
  );
}

if (document.querySelector('[data-contact-form]')) {
  void import('./ui/contact-form.js').then(({ initContactForm }) =>
    initContactForm({ config: contactConfig })
  );
}

if (document.querySelector('[data-meeting-dialog]')) {
  void import('./ui/meeting-scheduler.js').then(({ initMeetingScheduler }) =>
    initMeetingScheduler({ config: contactConfig })
  );
}

if (document.querySelector('[data-office-map]')) {
  void import('./ui/contact-map.js').then(({ initContactMap }) => initContactMap());
}

if (document.querySelector('[data-about-page]')) {
  void import('./ui/about-motion.js')
    .then(({ initAboutMotion }) => {
      document.querySelector('[data-about-page]')?.classList.add('about-motion-ready');
      initAboutMotion();
    })
    .catch(() =>
      document.querySelector('[data-about-page]')?.classList.remove('about-motion-ready')
    );
}

if (document.querySelector('[data-blog-page], [data-blog-article]')) {
  void import('./ui/blog.js').then(({ initBlog }) => initBlog());
}

const projectsVideo = document.querySelector('[data-projects-video]');
const projectsVideoToggle = document.querySelector('[data-projects-video-toggle]');

if (projectsVideo && projectsVideoToggle) {
  const label = projectsVideoToggle.querySelector('[data-projects-video-label]');
  const setVideoState = (isPlaying) => {
    projectsVideo.classList.toggle('is-playing', isPlaying);
    projectsVideoToggle.setAttribute('aria-pressed', String(isPlaying));
    if (label) {
      label.textContent = isPlaying
        ? projectsVideoToggle.dataset.projectsVideoPause
        : projectsVideoToggle.dataset.projectsVideoWatch;
    }
  };

  projectsVideo.addEventListener('playing', () => setVideoState(true));
  projectsVideo.addEventListener('pause', () => setVideoState(false));
  projectsVideoToggle.addEventListener('click', () => {
    if (!projectsVideo.currentSrc) return;
    if (projectsVideo.paused) {
      void projectsVideo.play().catch(() => setVideoState(false));
    } else {
      projectsVideo.pause();
    }
  });
}
