const views = {
  dashboard: {
    title: 'EV Market Performance dashboard',
    src: 'https://public.tableau.com/views/EV_Market_Performance_Public_Ready_Clean/Dashboard1',
    direct: 'https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Dashboard1'
  },
  story: {
    title: 'EV Market Performance data story',
    src: 'https://public.tableau.com/views/EV_Market_Performance_Public_Ready_Clean/Story2',
    direct: 'https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Story2'
  }
};

const host = document.querySelector('#viz-host');
const loading = document.querySelector('#viz-loading');
const error = document.querySelector('#viz-error');
const directLink = document.querySelector('#direct-view-link');
const frame = document.querySelector('#tableau-frame');
let loadTimer;

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
    }, { once: true });
    viz.addEventListener('vizloaderror', () => {
      clearTimeout(loadTimer);
      loading.hidden = true;
      error.hidden = false;
    }, { once: true });
    host.append(viz);
  } catch {
    clearTimeout(loadTimer);
    loading.hidden = true;
    error.hidden = false;
  }
}

document.querySelectorAll('.view-tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});
document.querySelector('[data-open-story]')?.addEventListener('click', () => showView('story'));
showView('dashboard');
