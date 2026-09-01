const CASES = {
  1: {
    photo: 'assets/case-1-renovation-configurator.png',
    tags: ['B2B SaaS', 'Climate Tech'],
    title: 'Configurator',
    desc: 'A platform that helps home owners plan and implement energy renovation measures with confidence.'
  },
  // Placeholder copy — replace with the real description for this case study.
  2: {
    photo: 'assets/case-2-portfolio-dashboard.jpg',
    tags: ['B2B SaaS', 'Climate Tech'],
    title: 'Portfolio Overview',
    desc: 'A dashboard that gives property owners a clear, at-a-glance view of every asset in their portfolio.'
  },
  // Description/problem are filler copied from case 1 until real copy is provided.
  3: {
    photo: 'assets/case-3-onboarding.jpg',
    tags: ['B2B SaaS', 'Climate Tech'],
    title: 'Onboarding',
    desc: 'A platform that helps home owners plan and implement energy renovation measures with confidence.',
    // Static screen content composited into the laptop mockup — same photo +
    // screen-rect pair the ScrollStory pinned laptop uses for this case
    // (js/data/onboarding-story.js `laptop`), so the two line up exactly
    // during the hero → story handoff.
    screenshot: {
      src: 'assets/story/onboarding-01-address.png',
      imageWidth: 1401,
      imageHeight: 768,
      screen: { left: 417, top: 184, right: 995, bottom: 570 }
    }
  }
};

// Extra zoom applied (centered on the hero) to the background photo and, in
// positionScreen(), to the matching screen-rect overlay in lockstep, so the
// laptop reads bigger without the two layers drifting out of alignment. Only
// used for cases with a screen overlay, where the screen content is the thing
// that needs to be legible.
const LAPTOP_ZOOM = 1.1;

function renderCase(id) {
  const data = CASES[id];
  if (!data) return;

  document.getElementById('case-title').textContent = data.title;
  document.getElementById('case-desc').textContent = data.desc;

  const photoEl = document.getElementById('hero-photo');
  photoEl.style.transform = data.screenshot ? `scale(${LAPTOP_ZOOM})` : '';
  if (data.photo) {
    photoEl.classList.add('is-loading');
    const preload = new Image();
    preload.onload = () => {
      photoEl.src = data.photo;
      photoEl.classList.remove('is-loading');
    };
    preload.src = data.photo;
  } else {
    photoEl.classList.add('is-loading');
  }

  layoutScreen(data.screenshot);
}

let activeScreenshot = null;

function layoutScreen(screenshot) {
  activeScreenshot = screenshot || null;
  const screenEl = document.getElementById('hero-screen');

  if (!activeScreenshot) {
    screenEl.classList.remove('is-visible');
    screenEl.removeAttribute('src');
    return;
  }

  screenEl.src = activeScreenshot.src;
  positionScreen();
  screenEl.classList.add('is-visible');
}

function positionScreen() {
  if (!activeScreenshot) return;
  const screenEl = document.getElementById('hero-screen');
  const hero = document.querySelector('.hero');
  const rect = LaptopMockup.computeScreenRect(hero, activeScreenshot, LAPTOP_ZOOM);

  screenEl.style.left = `${rect.left}px`;
  screenEl.style.top = `${rect.top}px`;
  screenEl.style.width = `${rect.width}px`;
  screenEl.style.height = `${rect.height}px`;
  screenEl.style.borderRadius = `${Math.max(3, rect.width * 0.015)}px`;
}

function initScreenResize() {
  let raf = null;
  window.addEventListener('resize', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      positionScreen();
    });
  });
}

function initCaseNav() {
  const tabs = document.querySelectorAll('.case-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      renderCase(tab.dataset.case);
      document.dispatchEvent(new CustomEvent('onboarding:case-change', { detail: { id: tab.dataset.case } }));
    });
  });
}

function initAbout() {
  const aboutSection = document.getElementById('about');
  const aboutTab = document.getElementById('about-tab');

  function setView(view) {
    const isAbout = view === 'about';
    document.body.classList.toggle('about-open', isAbout);
    aboutSection.setAttribute('aria-hidden', String(!isAbout));
    const label = aboutTab.querySelector('.side-tab__text');
    if (label) label.textContent = isAbout ? 'Close' : 'About';
    aboutTab.setAttribute('aria-selected', String(isAbout));
  }

  aboutTab.addEventListener('click', (e) => {
    e.preventDefault();
    setView(document.body.classList.contains('about-open') ? 'work' : 'about');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('about-open')) {
      setView('work');
    }
  });
}

initCaseNav();
initAbout();
initScreenResize();
