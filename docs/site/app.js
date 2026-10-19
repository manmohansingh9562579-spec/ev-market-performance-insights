const views = {
  dashboard: {
    title: 'EV Market Performance dashboard',
    src: 'https://public.tableau.com/views/EV_Market_Performance_Rating_Corrected/Dashboard1',
    direct: 'https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1'
  },
  story: {
    title: 'EV Market Performance data story',
    src: 'https://public.tableau.com/views/EV_Market_Performance_Rating_Corrected/Story2',
    direct: 'https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2'
  }
};

const host = document.querySelector('#viz-host');
const loading = document.querySelector('#viz-loading');
const error = document.querySelector('#viz-error');
const directLink = document.querySelector('#direct-view-link');
const frame = document.querySelector('#tableau-frame');
const progressBar = document.querySelector('#scroll-progress-bar');
const backTop = document.querySelector('.back-top');
let loadTimer;
let scrollQueued = false;

const menuToggle = document.querySelector('#menu-toggle');
const mainNav = document.querySelector('#main-nav');
menuToggle?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mainNav.classList.remove('is-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
}));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mainNav?.classList.contains('is-open')) {
    mainNav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
    menuToggle?.focus();
  }
});

function updateScrollDetails() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (backTop) backTop.hidden = window.scrollY < 520;

  const sections = [...(mainNav?.querySelectorAll('a[href^="#"]') || [])]
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);
  const active = sections.filter((item) => item.section.getBoundingClientRect().top <= 150).at(-1);
  sections.forEach(({ link }) => {
    if (link === active?.link) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}

window.addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  window.requestAnimationFrame(updateScrollDetails);
}, { passive: true });
window.addEventListener('resize', updateScrollDetails, { passive: true });
updateScrollDetails();

async function showView(name) {
  const view = views[name] || views.dashboard;
  const selectedTab = document.querySelector(`[data-view="${name}"]`);
  document.querySelectorAll('.view-tab').forEach((tab) => {
    const active = tab === selectedTab;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  frame.setAttribute('aria-labelledby', selectedTab?.id || 'dashboard-tab');
  directLink.href = view.direct;
  loading.hidden = false;
  error.hidden = true;
  frame.setAttribute('aria-busy', 'true');
  host.replaceChildren();
  clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    loading.hidden = true;
    error.hidden = false;
  }, 18000);

  try {
    await customElements.whenDefined('tableau-viz');
    const viz = document.createElement('tableau-viz');
    viz.setAttribute('src', view.src);
    viz.setAttribute('toolbar', 'bottom');
    viz.setAttribute('hide-tabs', '');
    viz.setAttribute('device', 'desktop');
    viz.setAttribute('aria-label', view.title);
    viz.addEventListener('firstinteractive', () => {
      clearTimeout(loadTimer);
      loading.hidden = true;
      error.hidden = true;
      frame.setAttribute('aria-busy', 'false');
    }, { once: true });
    viz.addEventListener('vizloaderror', () => {
      clearTimeout(loadTimer);
      loading.hidden = true;
      error.hidden = false;
      frame.setAttribute('aria-busy', 'false');
    }, { once: true });
    host.append(viz);
  } catch {
    clearTimeout(loadTimer);
    loading.hidden = true;
    error.hidden = false;
    frame.setAttribute('aria-busy', 'false');
  }
}

document.querySelectorAll('.view-tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});
document.querySelectorAll('[data-focus-view]').forEach((card) => {
  card.addEventListener('click', () => showView(card.dataset.focusView));
});
document.querySelector('[data-open-story]')?.addEventListener('click', () => showView('story'));
showView('dashboard');
