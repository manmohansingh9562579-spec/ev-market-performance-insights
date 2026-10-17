(() => {
  'use strict';
  const instances = new Map();
  const filters = { manufacturer: 'filterManufacturer', battery_type: 'filterBattery', region: 'filterRegion', category: 'filterCategory', country: 'filterCountry', sort: 'sortOrder' };
  const palette = ['#e8aa19','#64ad9b','#6584a7','#d47c70','#a08bc5','#b5c66c','#c785a4','#7e9da1','#c68d53','#739c76','#7196bc','#beaa79','#8e8b7c'];
  const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const el = (id) => document.getElementById(id);
  const fmt = (value, decimals = false) => value == null || !Number.isFinite(Number(value)) ? '—' : (decimals ? decimal : integer).format(Number(value));

  function sourceStatus(state, label, rows) {
    const source = document.querySelector('.source-state');
    source.classList.remove('ready', 'error');
    if (state === 'ready') source.classList.add('ready');
    if (state === 'error') source.classList.add('error');
    el('connectionLabel').textContent = label;
    el('heroDataNote').textContent = rows == null ? label : fmt(rows) + ' deduplicated training records · actual source';
  }
  function showState(state, title, message, help = '') {
    const panel = el('statePanel');
    panel.hidden = false;
    panel.dataset.state = state;
    el('stateIcon').textContent = state === 'error' ? '!' : state === 'loading' ? '…' : 'i';
    el('stateTitle').textContent = title;
    el('stateMessage').textContent = message;
    el('stateHelp').textContent = help;
  }
  function hideState() { el('statePanel').hidden = true; }
  function clearCharts(message) {
    instances.forEach((chart) => chart.destroy());
    instances.clear();
    document.querySelectorAll('.chart-wrap').forEach((wrap) => {
      wrap.querySelector('canvas').hidden = true;
      const state = wrap.querySelector('.chart-state');
      state.hidden = false;
      state.textContent = message;
    });
  }
  function fillSelect(id, values, label, preserve = true) {
    const select = el(id);
    const old = preserve ? select.value : '';
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = label;
    select.append(first);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      select.append(option);
    });
    if (values.map(String).includes(old)) select.value = old;
  }
  function setFilters(options, selected = {}) {
    fillSelect('filterManufacturer', options.manufacturer || [], 'All manufacturers');
    fillSelect('filterBattery', options.battery_type || [], 'All battery types');
    fillSelect('filterRegion', options.region || [], 'All regions');
    fillSelect('filterCategory', options.category || [], 'All categories');
    fillSelect('filterCountry', options.country || [], 'All countries');
    const years = options.model_year || { values: [] };
    fillSelect('modelYearMin', years.values || [], 'From', false);
    fillSelect('modelYearMax', years.values || [], 'To', false);
    el('modelYearMin').value = String(selected.model_year_min || years.min || '');
    el('modelYearMax').value = String(selected.model_year_max || years.max || '');
    Object.entries(filters).forEach(([key, id]) => { if (selected[key]) el(id).value = selected[key]; });
  }
  function queryString() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, id]) => {
      const value = el(id).value;
      if (value && !(key === 'sort' && value === 'desc')) params.set(key, value);
    });
    const years = [...el('modelYearMin').options].slice(1).map((option) => option.value);
    if (el('modelYearMin').value && el('modelYearMin').value !== years[0]) params.set('model_year_min', el('modelYearMin').value);
    if (el('modelYearMax').value && el('modelYearMax').value !== years.at(-1)) params.set('model_year_max', el('modelYearMax').value);
    return params.toString();
  }
  function destroy(id) { if (instances.has(id)) instances.get(id).destroy(); instances.delete(id); }
  function chartState(id, message) {
    const canvas = el(id);
    canvas.hidden = true;
    const state = canvas.parentElement.querySelector('.chart-state');
    state.hidden = false;
    state.textContent = message;
  }
  const baseOptions = () => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: {
      displayColors: false, backgroundColor: '#22231f', borderColor: 'rgba(232,170,25,.28)', borderWidth: 1,
      titleColor: '#f2eee3', bodyColor: '#cbc6b8', padding: 10,
      titleFont: { family: 'DM Sans', size: 10, weight: '700' }, bodyFont: { family: 'DM Sans', size: 10 }
    } }
  });
  function renderBar(id, rows, title, decimals = false, min = undefined, max = undefined, multicolor = true) {
    destroy(id);
    const canvas = el(id);
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    canvas.parentElement.querySelector('.chart-state').hidden = true;
    const options = baseOptions();
    options.indexAxis = 'y';
    options.layout = { padding: { top: 2, right: 10, bottom: 0, left: 2 } };
    options.plugins.tooltip.callbacks = {
      label: (ctx) => title + ': ' + fmt(ctx.parsed.x, decimals),
      afterLabel: (ctx) => fmt(ctx.dataset.records[ctx.dataIndex]) + ' records'
    };
    options.scales = {
      x: { beginAtZero: min == null, min, max, grid: { color: 'rgba(235,230,215,.08)' }, border: { display: false },
        ticks: { color: '#8d8a81', font: { family: 'DM Sans', size: 8 }, maxTicksLimit: 5, callback: (v) => fmt(v, decimals) },
        title: { display: true, text: title, color: '#9b978d', font: { family: 'DM Sans', size: 8 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: '#c3bfb4', autoSkip: false, font: { family: 'DM Sans', size: 8 }, padding: 5 } }
    };
    instances.set(id, new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels: rows.map((row) => row.label), datasets: [{
        label: title, data: rows.map((row) => row.value),
        backgroundColor: rows.map((_, i) => multicolor ? palette[i % palette.length] : '#e8aa19'),
        borderRadius: 4, borderSkipped: false, maxBarThickness: 19, records: rows.map((row) => row.records)
      }] },
      options
    }));
  }
  function renderDoughnut(id, rows) {
    destroy(id);
    const canvas = el(id);
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    canvas.parentElement.querySelector('.chart-state').hidden = true;
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const options = baseOptions();
    options.cutout = '59%';
    options.plugins.legend = { display: true, position: 'bottom', labels: { color: '#c3bfb4', padding: 12, boxWidth: 8, boxHeight: 8, font: { family: 'DM Sans', size: 9 } } };
    options.plugins.tooltip.callbacks = {
      label: (ctx) => ctx.label + ': ' + fmt(ctx.parsed) + ' units (' + fmt(total ? ctx.parsed / total * 100 : 0, true) + '%)',
      afterLabel: (ctx) => fmt(ctx.dataset.records[ctx.dataIndex]) + ' records'
    };
    instances.set(id, new window.Chart(canvas.getContext('2d'), { type: 'doughnut', data: {
      labels: rows.map((row) => row.label),
      datasets: [{ data: rows.map((row) => row.value), backgroundColor: palette.slice(0, rows.length), borderColor: '#141512', borderWidth: 3, hoverOffset: 5, records: rows.map((row) => row.records) }]
    }, options }));
  }
  function renderLine(id, rows) {
    destroy(id);
    const canvas = el(id);
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    canvas.parentElement.querySelector('.chart-state').hidden = true;
    const options = baseOptions();
    options.plugins.legend = { display: true, position: 'bottom', labels: { color: '#c3bfb4', boxWidth: 9, font: { family: 'DM Sans', size: 9 } } };
    options.plugins.tooltip.callbacks = {
      label: (ctx) => 'Sales units: ' + fmt(ctx.parsed.y),
      afterLabel: (ctx) => fmt(ctx.dataset.records[ctx.dataIndex]) + ' records'
    };
    options.scales = {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a9a59b', font: { family: 'DM Sans', size: 9 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(235,230,215,.08)' }, border: { display: false }, ticks: { color: '#8d8a81', font: { family: 'DM Sans', size: 8 }, callback: (v) => fmt(v) } }
    };
    instances.set(id, new window.Chart(canvas.getContext('2d'), { type: 'line', data: {
      labels: rows.map((row) => row.label),
      datasets: [{ label: 'Annual sales units', data: rows.map((row) => row.value), records: rows.map((row) => row.records),
        borderColor: '#e8aa19', backgroundColor: 'rgba(232,170,25,.12)', fill: true, tension: .28,
        pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#f4c75e', pointBorderColor: '#151613', borderWidth: 2 }]
    }, options }));
  }
  function renderKpis(kpis) {
    const assign = (id, value) => { el(id).textContent = value; };
    assign('kpiManufacturers', fmt(kpis.manufacturer_count.value));
    assign('kpiModels', fmt(kpis.model_count.value));
    assign('kpiSales', fmt(kpis.annual_sales.value));
    assign('kpiRating', kpis.average_rating.value == null ? '—' : fmt(kpis.average_rating.value, true) + ' / 5');
    assign('kpiRange', kpis.average_range.value == null ? '—' : fmt(kpis.average_range.value, true) + ' km');
    assign('kpiCapacity', kpis.average_battery_capacity.value == null ? '—' : fmt(kpis.average_battery_capacity.value, true) + ' kWh');
    assign('kpiCo2', kpis.co2_savings.value == null ? '—' : fmt(kpis.co2_savings.value, true) + ' t');
    assign('kpiManufacturersNote', 'Distinct manufacturer names after filters');
    assign('kpiModelsNote', fmt(kpis.model_count.records_with_model_name) + ' records with a model name');
    assign('kpiSalesNote', fmt(kpis.annual_sales.valid_records) + ' valid records · sum');
    assign('kpiRatingNote', fmt(kpis.average_rating.valid_records) + ' ratings · unweighted mean');
    assign('kpiRangeNote', fmt(kpis.average_range.valid_records) + ' records · unweighted mean');
    assign('kpiCapacityNote', fmt(kpis.average_battery_capacity.valid_records) + ' records · unweighted mean');
    assign('kpiCo2Note', fmt(kpis.co2_savings.valid_records) + ' records · sum of annual field');
  }
  function renderStory(data) {
    const k = data.kpis;
    const s = data.insights;
    const salesText = k.annual_sales.value == null ? 'No sales values are available.' :
      fmt(k.annual_sales.value) + ' annual sales units appear across ' + fmt(s.filtered_records) + ' filtered records. ' + fmt(k.model_count.value) + ' distinct model names and ' + fmt(k.manufacturer_count.value) + ' manufacturers are represented.';
    el('insightScale').textContent = salesText;
    const mix = [];
    if (s.top_manufacturer) mix.push(s.top_manufacturer.label + ' has the largest supplied sales sum');
    if (s.top_region) mix.push(s.top_region.label + ' is the leading market region');
    if (s.top_battery) mix.push(s.top_battery.label + ' has the highest battery sales sum');
    el('insightMix').textContent = mix.length ? mix.join('; ') + '.' : 'No sales mix values are available for these filters.';
    const rated = s.highest_rated_category;
    el('insightExperience').textContent = rated
      ? rated.label + ' has the highest average rating at ' + fmt(rated.value, true) + ' out of 5, from ' + fmt(rated.records) + ' non-missing ratings.'
      : 'No customer ratings are available for these filters.';
    const efficient = s.lowest_wh_per_km_category;
    el('insightCapability').textContent = efficient
      ? efficient.label + ' has the lowest mean energy use at ' + fmt(efficient.value, true) + ' Wh/km. Average range is ' + fmt(k.average_range.value, true) + ' km.'
      : 'Range and efficiency details will appear when those fields have valid values.';
    const q = data.metadata.data_quality;
    if (q.exact_duplicate_rows_removed || q.conflicting_vehicle_ids_excluded) {
      showState('warning', 'Data quality handling applied', fmt(q.exact_duplicate_rows_removed) + ' exact duplicate row(s) removed before aggregation.', 'Totals are dataset-field aggregates; review the methodology and source limitations below.');
    } else hideState();
  }
  function render(data) {
    setFilters(data.filters, data.selected_filters);
    const selected = data.selected_filters;
    let active = Object.entries(selected).filter(([key, value]) => !['sort','model_year_min','model_year_max'].includes(key) && value).length;
    const years = data.filters.model_year.values || [];
    if (years.length && (el('modelYearMin').value !== String(years[0]) || el('modelYearMax').value !== String(years.at(-1)))) active += 1;
    el('filterSummary').textContent = fmt(data.metadata.filtered_rows) + ' of ' + fmt(data.metadata.rows_analyzed) + ' records · ' + active + ' active filter' + (active === 1 ? '' : 's');
    el('dataPeriod').textContent = (data.metadata.backend === 'database' ? 'Database source' : 'Training split') + ' · ' + fmt(data.metadata.rows_analyzed) + ' records';
    renderKpis(data.kpis);
    renderStory(data);
    if (data.metadata.filtered_rows === 0) return clearCharts('No records match the selected filters. Adjust or reset your filters to continue.');
    const c = data.charts;
    renderBar('chartManufacturer', c.manufacturer_sales, 'Annual sales units', false, undefined, undefined, false);
    renderDoughnut('chartBattery', c.battery_mix);
    renderBar('chartRegion', c.region_sales, 'Annual sales units');
    renderBar('chartCategorySales', c.category_sales, 'Annual sales units');
    renderBar('chartRating', c.rating_by_category, 'Average rating', true, 1, 5);
    renderLine('chartYear', c.annual_sales_by_year);
    renderBar('chartRange', c.range_by_category, 'Average range (km)', true);
    renderBar('chartCountry', c.country_sales, 'Annual sales units');
    renderBar('chartEfficiency', c.efficiency_by_category, 'Average energy use (Wh/km)', true);
  }
  async function refresh() {
    showState('loading', 'Updating your dashboard', 'Applying the selected filters to the connected data.');
    try {
      const query = queryString();
      const response = await fetch('/api/dashboard' + (query ? '?' + query : ''), { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Dashboard request failed (' + response.status + ').');
      if (!data.available) {
        clearCharts(data.state === 'empty' ? 'The connected source has no rows.' : 'Charts are unavailable until a valid dataset is connected.');
        const state = data.state === 'error' ? 'error' : 'warning';
        sourceStatus(state, data.state === 'missing' ? 'No dataset connected' : 'Source unavailable');
        const title = data.state === 'missing' ? 'Load the EV training CSV' : data.state === 'empty' ? 'Dataset is empty' : 'Dataset could not be loaded';
        const help = data.state === 'missing'
          ? 'Set EV_TRAIN_CSV to ev_market_train.csv or configure DATABASE_URL. Keep the original CSV where it is.'
          : 'Review the source path, required columns and database table, then restart the app.';
        showState(state, title, data.message || 'Check the configured data source and try again.', help);
        el('filterSummary').textContent = 'Connect a data source to begin';
        el('heroDataNote').textContent = 'No real data connected · load the source CSV';
        return;
      }
      sourceStatus('ready', data.metadata.backend === 'database' ? 'Database connected' : 'Training CSV connected', data.metadata.rows_analyzed);
      render(data);
      if (data.metadata.data_quality.conflicting_vehicle_ids_excluded > 0) {
        showState('warning', 'Conflicting duplicate IDs excluded', 'Excluded ' + fmt(data.metadata.data_quality.conflicting_vehicle_rows_excluded) + ' rows from ' + fmt(data.metadata.data_quality.conflicting_vehicle_ids_excluded) + ' vehicle IDs because their records disagree.');
      }
    } catch (error) {
      clearCharts('A data response is not available for this view.');
      sourceStatus('error', 'Load error');
      showState('error', 'Dashboard request failed', error.message, 'Check the Flask server and data source, then retry.');
      el('filterSummary').textContent = 'Unable to load dashboard data';
    }
  }
  function resetFilters() {
    ['filterManufacturer','filterBattery','filterRegion','filterCategory','filterCountry'].forEach((id) => { el(id).value = ''; });
    const years = [...el('modelYearMin').options].slice(1).map((option) => option.value);
    if (years.length) { el('modelYearMin').value = years[0]; el('modelYearMax').value = years.at(-1); }
    el('sortOrder').value = 'desc';
    refresh();
  }
  el('applyFilters').addEventListener('click', refresh);
  el('resetFilters').addEventListener('click', resetFilters);
  Object.values(filters).forEach((id) => {
    el(id).addEventListener('change', (event) => { if (event.target.id === 'sortOrder') refresh(); });
    el(id).addEventListener('keydown', (event) => { if (event.key === 'Enter') refresh(); });
  });
  ['modelYearMin','modelYearMax'].forEach((id) => el(id).addEventListener('keydown', (event) => { if (event.key === 'Enter') refresh(); }));
  const toggle = el('menuToggle');
  const nav = el('mainNav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('.tableau-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tableau-tab').forEach((button) => button.classList.toggle('active', button === tab));
    document.querySelectorAll('.tableau-frame').forEach((panel) => { panel.hidden = panel.dataset.tableauPanel !== tab.dataset.tableauView; });
  }));
  clearCharts('Loading data…');
  refresh();
})();
