(() => {
  'use strict';

  const chartInstances = new Map();
  const filterIds = {
    manufacturer: 'filterManufacturer',
    battery_type: 'filterBattery',
    region: 'filterRegion',
    category: 'filterCategory',
    model_year_min: 'modelYearMin',
    model_year_max: 'modelYearMax',
    sort: 'sortOrder'
  };
  const palette = ['#168f88', '#4d82ab', '#d9ab58', '#e7896f', '#8f81bf', '#64a6a0', '#6b91ae', '#b7c66c', '#c785a4', '#98a7b3', '#d18c57', '#6b9e79'];
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const decimalFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

  const el = (id) => document.getElementById(id);

  function setSourceStatus(state, label) {
    const dot = el('sidebarStatusDot');
    const text = el('sidebarStatus');
    const pill = el('connectionPill');
    const pillText = pill.querySelector('span:last-child');
    dot.className = `source-dot ${state}`;
    text.textContent = label;
    pill.classList.remove('ready', 'error');
    if (state === 'ready') pill.classList.add('ready');
    if (state === 'error') pill.classList.add('error');
    pillText.textContent = label;
  }

  function showState({ state = 'loading', title, message, help = '' }) {
    const panel = el('statePanel');
    panel.hidden = false;
    panel.className = `state-panel ${state === 'error' ? 'error' : state === 'warning' ? 'ready-warning' : ''}`;
    el('stateIcon').textContent = state === 'error' ? '!' : state === 'loading' ? '…' : 'i';
    el('stateTitle').textContent = title;
    el('stateMessage').textContent = message;
    el('stateHelp').textContent = help;
  }

  function hideState() {
    el('statePanel').hidden = true;
  }

  function clearCharts(message = 'No records match these filters.') {
    for (const [key, chart] of chartInstances.entries()) {
      chart.destroy();
      chartInstances.delete(key);
    }
    document.querySelectorAll('.chart-wrap').forEach((wrap) => {
      const canvas = wrap.querySelector('canvas');
      const state = wrap.querySelector('.chart-state');
      canvas.hidden = true;
      state.hidden = false;
      state.textContent = message;
    });
  }

  function fillSelect(selectId, values, emptyLabel, preserve = true) {
    const select = el(selectId);
    const oldValue = preserve ? select.value : '';
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = emptyLabel;
    select.append(first);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      select.append(option);
    });
    if (values.map(String).includes(oldValue)) select.value = oldValue;
  }

  function fillYearRange(years, selected = {}) {
    const yearValues = years.values || [];
    fillSelect('modelYearMin', yearValues, 'From', false);
    fillSelect('modelYearMax', yearValues, 'To', false);
    if (selected.model_year_min) el('modelYearMin').value = String(selected.model_year_min);
    if (selected.model_year_max) el('modelYearMax').value = String(selected.model_year_max);
    if (!selected.model_year_min && years.min != null) el('modelYearMin').value = String(years.min);
    if (!selected.model_year_max && years.max != null) el('modelYearMax').value = String(years.max);
  }

  function setFilters(options, selected = {}) {
    fillSelect('filterManufacturer', options.manufacturer || [], 'All manufacturers');
    fillSelect('filterBattery', options.battery_type || [], 'All battery types');
    fillSelect('filterRegion', options.region || [], 'All regions');
    fillSelect('filterCategory', options.category || [], 'All categories');
    fillYearRange(options.model_year || { values: [] }, selected);
    if (selected.manufacturer) el('filterManufacturer').value = selected.manufacturer;
    if (selected.battery_type) el('filterBattery').value = selected.battery_type;
    if (selected.region) el('filterRegion').value = selected.region;
    if (selected.category) el('filterCategory').value = selected.category;
    if (selected.sort) el('sortOrder').value = selected.sort;
  }

  function queryString() {
    const params = new URLSearchParams();
    Object.entries(filterIds).forEach(([key, id]) => {
      if (key === 'model_year_min' || key === 'model_year_max') return;
      const value = el(id).value;
      if (value && !(key === 'sort' && value === 'desc')) params.set(key, value);
    });
    const minimum = el('modelYearMin').value;
    const maximum = el('modelYearMax').value;
    const years = [...el('modelYearMin').options].slice(1).map((option) => option.value);
    const fullMinimum = years[0] || '';
    const fullMaximum = years[years.length - 1] || '';
    if (minimum && minimum !== fullMinimum) params.set('model_year_min', minimum);
    if (maximum && maximum !== fullMaximum) params.set('model_year_max', maximum);
    return params.toString();
  }

  function formatNumber(value, decimals = false) {
    if (value == null || !Number.isFinite(Number(value))) return '—';
    return (decimals ? decimalFormatter : formatter).format(Number(value));
  }

  function showChartState(canvasId, message) {
    const canvas = el(canvasId);
    const state = canvas.parentElement.querySelector('.chart-state');
    canvas.hidden = true;
    state.hidden = false;
    state.textContent = message;
  }

  function renderHorizontalBar(canvasId, rows, options = {}) {
    const canvas = el(canvasId);
    const state = canvas.parentElement.querySelector('.chart-state');
    const previous = chartInstances.get(canvasId);
    if (previous) previous.destroy();
    chartInstances.delete(canvasId);

    if (!Array.isArray(rows) || rows.length === 0) {
      showChartState(canvasId, 'No valid values are available for this view.');
      return;
    }
    if (!window.Chart) {
      showChartState(canvasId, 'The chart library did not load. Check your internet connection, then reload this page.');
      return;
    }
    canvas.hidden = false;
    state.hidden = true;
    const axisTitle = options.axisTitle || '';
    const color = options.color || '#168f88';
    const axisMin = options.axisMin;
    const axisMax = options.axisMax;
    const chart = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: rows.map((row) => row.label),
        datasets: [{
          label: axisTitle,
          data: rows.map((row) => row.value),
          backgroundColor: rows.map((_, index) => options.multicolor ? palette[index % palette.length] : color),
          borderRadius: 5,
          borderSkipped: false,
          maxBarThickness: 20,
          records: rows.map((row) => row.records)
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: { padding: { top: 1, right: 11, bottom: 0, left: 1 } },
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: '#102a43',
            padding: 10,
            titleFont: { family: 'DM Sans', size: 10, weight: '700' },
            bodyFont: { family: 'DM Sans', size: 10 },
            callbacks: {
              label: (context) => `${axisTitle}: ${formatNumber(context.parsed.x, options.decimals)}`,
              afterLabel: (context) => `${formatNumber(context.dataset.records[context.dataIndex])} records`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: axisMin == null,
            min: axisMin,
            max: axisMax,
            grid: { color: '#edf1f3', drawBorder: false },
            border: { display: false },
            ticks: {
              color: '#8c9aa6',
              font: { family: 'DM Sans', size: 8 },
              maxTicksLimit: 5,
              callback: (value) => formatNumber(value, options.decimals)
            },
            title: { display: Boolean(axisTitle), text: axisTitle, color: '#758696', font: { family: 'DM Sans', size: 8, weight: '600' } }
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#657b8d', autoSkip: false, font: { family: 'DM Sans', size: 8 }, padding: 5 }
          }
        }
      }
    });
    chartInstances.set(canvasId, chart);
  }

  function renderKpis(kpis) {
    const sales = kpis.annual_sales;
    const rating = kpis.average_rating;
    const makers = kpis.manufacturer_count;
    const co2 = kpis.co2_savings;
    el('kpiSales').textContent = sales.value == null ? '—' : formatNumber(sales.value);
    el('kpiRating').textContent = rating.value == null ? '—' : formatNumber(rating.value, true);
    el('kpiManufacturers').textContent = formatNumber(makers.value);
    el('kpiCo2').textContent = co2.value == null ? '—' : `${formatNumber(co2.value, true)} t`;
    el('kpiSalesNote').textContent = `${formatNumber(sales.valid_records)} records with sales · sum`;
    el('kpiRatingNote').textContent = `${formatNumber(rating.valid_records)} ratings · unweighted mean`;
    el('kpiManufacturersNote').textContent = 'Distinct names after filters';
    el('kpiCo2Note').textContent = `${formatNumber(co2.valid_records)} records with CO₂ values · sum`;
  }

  function renderInsights(data) {
    const { kpis, insights, metadata } = data;
    const quality = metadata.data_quality;
    const salesText = kpis.annual_sales.value == null ? 'No sales values are available.' : `${formatNumber(kpis.annual_sales.value)} annual sales units are represented across ${formatNumber(insights.filtered_records)} filtered records.`;
    el('insightScale').textContent = salesText;
    const topMaker = insights.top_manufacturer;
    const topRegion = insights.top_region;
    const topBattery = insights.top_battery;
    const mixParts = [];
    if (topMaker) mixParts.push(`${topMaker.label} leads the displayed manufacturers with ${formatNumber(topMaker.value)} units`);
    if (topRegion) mixParts.push(`${topRegion.label} is the highest-sales region`);
    if (topBattery) mixParts.push(`${topBattery.label} is the highest-sales battery type`);
    el('insightMix').textContent = mixParts.length ? `${mixParts.join('; ')}.` : 'No sales mix values are available for the current filters.';
    const rated = insights.highest_rated_category;
    el('insightExperience').textContent = rated
      ? `${rated.label} has the highest average rating at ${formatNumber(rated.value, true)} out of 5, using ${formatNumber(rated.records)} non-missing ratings.`
      : 'No customer ratings are available for the current filters.';
    const efficient = insights.lowest_wh_per_km_category;
    el('insightCapability').textContent = efficient
      ? `${efficient.label} has the lowest average energy use at ${formatNumber(efficient.value, true)} Wh/km. Range is shown separately in kilometers.`
      : 'Range and efficiency details will appear when those fields have valid values.';
    if (quality.exact_duplicate_rows_removed || quality.conflicting_vehicle_ids_excluded) {
      showState({
        state: 'warning',
        title: 'Data quality handling applied',
        message: metadata.data_quality.exact_duplicate_rows_removed
          ? `Removed ${formatNumber(quality.exact_duplicate_rows_removed)} exact duplicate row(s) before aggregating.`
          : `Excluded rows from ${formatNumber(quality.conflicting_vehicle_ids_excluded)} conflicting vehicle ID(s).`,
        help: 'Totals are calculated from unique vehicle IDs; review the methodology and source limitations below.'
      });
    } else {
      hideState();
    }
  }

  function renderDashboard(data) {
    setFilters(data.filters, data.selected_filters);
    let activeCount = Object.entries(data.selected_filters).filter(([key, value]) => !['sort', 'model_year_min', 'model_year_max'].includes(key) && value).length;
    const yearValues = data.filters.model_year.values || [];
    const selectedMin = el('modelYearMin').value;
    const selectedMax = el('modelYearMax').value;
    if (yearValues.length && (selectedMin !== String(yearValues[0]) || selectedMax !== String(yearValues[yearValues.length - 1]))) activeCount += 1;
    el('filterSummary').textContent = `${formatNumber(data.metadata.filtered_rows)} of ${formatNumber(data.metadata.rows_analyzed)} records · ${activeCount} active filter${activeCount === 1 ? '' : 's'}`;
    el('dataPeriod').textContent = `${data.metadata.backend === 'database' ? 'Database source' : 'Training split'} · ${formatNumber(data.metadata.rows_analyzed)} records`;
    renderKpis(data.kpis);
    renderInsights(data);
    if (data.metadata.filtered_rows === 0) {
      clearCharts('No records match the selected filters. Adjust or reset your filters to continue.');
      return;
    }
    const charts = data.charts;
    renderHorizontalBar('chartManufacturer', charts.manufacturer_sales, { axisTitle: 'Annual sales units', color: '#168f88' });
    renderHorizontalBar('chartBattery', charts.battery_sales, { axisTitle: 'Annual sales units', color: '#4d82ab', multicolor: true });
    renderHorizontalBar('chartRegion', charts.region_sales, { axisTitle: 'Annual sales units', color: '#d9ab58', multicolor: true });
    renderHorizontalBar('chartCategorySales', charts.category_sales, { axisTitle: 'Annual sales units', color: '#4d82ab' });
    renderHorizontalBar('chartCountry', charts.country_sales, { axisTitle: 'Annual sales units', color: '#168f88', multicolor: true });
    renderHorizontalBar('chartRating', charts.rating_by_category, { axisTitle: 'Average rating', color: '#d9ab58', decimals: true, axisMin: 1, axisMax: 5 });
    renderHorizontalBar('chartRange', charts.range_by_category, { axisTitle: 'Average range (km)', color: '#4d82ab', decimals: true });
    renderHorizontalBar('chartEfficiency', charts.efficiency_by_category, { axisTitle: 'Average energy use (Wh/km)', color: '#168f88', decimals: true });
  }

  async function refreshDashboard() {
    showState({ state: 'loading', title: 'Updating your dashboard', message: 'Applying the selected filters to the connected data.' });
    try {
      const query = queryString();
      const response = await fetch(`/api/dashboard${query ? `?${query}` : ''}`, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `Dashboard request failed (${response.status}).`);
      }
      if (!data.available) {
        clearCharts(data.state === 'empty' ? 'The connected source has no rows.' : 'Charts are unavailable until a valid dataset is connected.');
        setSourceStatus(data.state === 'error' ? 'error' : '', data.state === 'missing' ? 'No dataset' : data.message || 'Dataset unavailable');
        showState({
          state: data.state === 'error' ? 'error' : 'warning',
          title: data.state === 'missing' ? 'Load the EV training CSV' : data.state === 'empty' ? 'Dataset is empty' : 'Dataset could not be loaded',
          message: data.message || 'Check your data source and try again.',
          help: data.state === 'missing'
            ? 'Set EV_TRAIN_CSV to the path of ev_market_train.csv, or configure DATABASE_URL. The original CSV does not need to be copied into this project.'
            : 'Review the data source path, column names and database table, then restart the app.'
        });
        el('filterSummary').textContent = 'Connect a data source to begin';
        return;
      }
      setSourceStatus('ready', data.metadata.backend === 'database' ? 'Database connected' : 'CSV connected');
      renderDashboard(data);
      if (data.metadata.data_quality.conflicting_vehicle_ids_excluded > 0) {
        showState({ state: 'warning', title: 'Conflicting duplicate IDs excluded', message: `Excluded ${formatNumber(data.metadata.data_quality.conflicting_vehicle_rows_excluded)} rows from ${formatNumber(data.metadata.data_quality.conflicting_vehicle_ids_excluded)} vehicle IDs because their records disagree.` });
      }
    } catch (error) {
      clearCharts('A data response is not available for this view.');
      setSourceStatus('error', 'Load error');
      showState({ state: 'error', title: 'Dashboard request failed', message: error.message, help: 'Check the Flask server and data source, then retry.' });
      el('filterSummary').textContent = 'Unable to load dashboard data';
    }
  }

  function resetFilters() {
    ['filterManufacturer', 'filterBattery', 'filterRegion', 'filterCategory'].forEach((id) => { el(id).value = ''; });
    const years = el('modelYearMin').options;
    if (years.length > 1) el('modelYearMin').value = years[1].value;
    const maxYears = el('modelYearMax').options;
    if (maxYears.length > 1) el('modelYearMax').value = maxYears[maxYears.length - 1].value;
    el('sortOrder').value = 'desc';
    refreshDashboard();
  }

  el('applyFilters').addEventListener('click', refreshDashboard);
  el('resetFilters').addEventListener('click', resetFilters);
  el('sortOrder').addEventListener('change', refreshDashboard);
  ['filterManufacturer', 'filterBattery', 'filterRegion', 'filterCategory', 'modelYearMin', 'modelYearMax'].forEach((id) => {
    el(id).addEventListener('keydown', (event) => {
      if (event.key === 'Enter') refreshDashboard();
    });
  });

  clearCharts('Loading data…');
  refreshDashboard();
})();
