(() => {
  'use strict';
  const instances = new Map();
  const filters = { manufacturer: 'filterManufacturer', battery_type: 'filterBattery', region: 'filterRegion', category: 'filterCategory', country: 'filterCountry', sort: 'sortOrder' };
  const palette = ['#438956','#e6a72d','#78ad68','#4e9a9b','#ed9149','#88bb8a','#a9bc5a','#5f9b79','#cd845e','#619d9e','#8caa55','#b89656','#799079'];
  const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const el = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const node = el(id);
    if (node) node.textContent = value;
  };
  const fmt = (value, decimals = false) => value == null || !Number.isFinite(Number(value)) ? '—' : (decimals ? decimal : integer).format(Number(value));

  function sourceStatus(state, label, rows) {
    const source = document.querySelector('.source-state');
    if (source) {
      source.classList.remove('ready', 'error');
      if (state === 'ready') source.classList.add('ready');
      if (state === 'error') source.classList.add('error');
    }
    setText('connectionLabel', label);
    setText('heroDataNote', rows == null ? label : fmt(rows) + ' deduplicated training records · actual source');
  }
  function showState(state, title, message, help = '') {
    const panel = el('statePanel');
    if (!panel) return;
    panel.hidden = false;
    panel.dataset.state = state;
    setText('stateIcon', state === 'error' ? '!' : state === 'loading' ? '…' : 'i');
    setText('stateTitle', title);
    setText('stateMessage', message);
    setText('stateHelp', help);
  }
  function hideState() {
    const panel = el('statePanel');
    if (panel) panel.hidden = true;
  }
  function clearCharts(message) {
    instances.forEach((chart) => chart.destroy());
    instances.clear();
    document.querySelectorAll('.chart-wrap').forEach((wrap) => {
      const canvas = wrap.querySelector('canvas');
      if (canvas) canvas.hidden = true;
      const plot = wrap.querySelector('.plotly-chart');
      if (plot) {
        if (window.Plotly) window.Plotly.purge(plot);
        plot.replaceChildren();
      }
      const fallback = wrap.querySelector('.country-map-fallback');
      if (fallback) { fallback.hidden = true; fallback.replaceChildren(); }
      const state = wrap.querySelector('.chart-state');
      if (state) {
        state.hidden = false;
        state.textContent = message;
      }
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
    if (!canvas) return;
    canvas.hidden = true;
    const state = canvas.parentElement.querySelector('.chart-state');
    if (state) {
      state.hidden = false;
      state.textContent = message;
    }
  }
  const baseOptions = () => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: {
      displayColors: false, backgroundColor: '#ffffff', borderColor: 'rgba(75,132,83,.35)', borderWidth: 1,
      titleColor: '#26382d', bodyColor: '#526458', padding: 10,
      titleFont: { family: 'DM Sans', size: 10, weight: '700' }, bodyFont: { family: 'DM Sans', size: 10 }
    } }
  });
  function renderBar(id, rows, title, decimals = false, min = undefined, max = undefined, multicolor = true) {
    destroy(id);
    const canvas = el(id);
    if (!canvas) return;
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    const state = canvas.parentElement.querySelector('.chart-state');
    if (state) state.hidden = true;
    const options = baseOptions();
    options.indexAxis = 'y';
    options.layout = { padding: { top: 2, right: 10, bottom: 0, left: 2 } };
    options.plugins.tooltip.callbacks = {
      label: (ctx) => title + ': ' + fmt(ctx.parsed.x, decimals),
      afterLabel: (ctx) => fmt(ctx.dataset.records[ctx.dataIndex]) + ' records'
    };
    options.scales = {
      x: { beginAtZero: min == null, min, max, grid: { color: 'rgba(69,101,75,.11)' }, border: { display: false },
        ticks: { color: '#6a7b6f', font: { family: 'DM Sans', size: 8 }, maxTicksLimit: 5, callback: (v) => fmt(v, decimals) },
        title: { display: true, text: title, color: '#718176', font: { family: 'DM Sans', size: 8 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: '#526458', autoSkip: false, font: { family: 'DM Sans', size: 8 }, padding: 5 } }
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
    if (!canvas) return;
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    const state = canvas.parentElement.querySelector('.chart-state');
    if (state) state.hidden = true;
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const options = baseOptions();
    options.cutout = '59%';
    options.plugins.legend = { display: true, position: 'bottom', labels: { color: '#526458', padding: 12, boxWidth: 8, boxHeight: 8, font: { family: 'DM Sans', size: 9 } } };
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
    if (!canvas) return;
    if (!Array.isArray(rows) || !rows.length) return chartState(id, 'No valid values are available for this view.');
    if (!window.Chart) return chartState(id, 'Chart library did not load. Check the connection and reload this page.');
    canvas.hidden = false;
    const state = canvas.parentElement.querySelector('.chart-state');
    if (state) state.hidden = true;
    const options = baseOptions();
    options.plugins.legend = { display: true, position: 'bottom', labels: { color: '#c3bfb4', boxWidth: 9, font: { family: 'DM Sans', size: 9 } } };
    options.plugins.tooltip.callbacks = {
      label: (ctx) => 'Sales units: ' + fmt(ctx.parsed.y),
      afterLabel: (ctx) => fmt(ctx.dataset.records[ctx.dataIndex]) + ' records'
    };
    options.scales = {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#65786b', font: { family: 'DM Sans', size: 9 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(69,101,75,.11)' }, border: { display: false }, ticks: { color: '#6a7b6f', font: { family: 'DM Sans', size: 8 }, callback: (v) => fmt(v) } }
    };
    instances.set(id, new window.Chart(canvas.getContext('2d'), { type: 'line', data: {
      labels: rows.map((row) => row.label),
      datasets: [{ label: 'Annual sales units', data: rows.map((row) => row.value), records: rows.map((row) => row.records),
        borderColor: '#e8aa19', backgroundColor: 'rgba(232,170,25,.12)', fill: true, tension: .28,
        pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#f4c75e', pointBorderColor: '#151613', borderWidth: 2 }]
    }, options }));
  }
  function renderRatingTreemap(rows) {
    const plot = el('chartRating');
    if (!plot || !plot.parentElement) return;
    const state = plot.parentElement.querySelector('.chart-state');
    if (!state) return;
    if (!Array.isArray(rows) || !rows.length) {
      if (window.Plotly) window.Plotly.purge(plot);
      plot.replaceChildren();
      state.hidden = false;
      state.textContent = 'No valid customer ratings are available for this view.';
      return;
    }
    if (!window.Plotly) {
      state.hidden = false;
      state.textContent = 'Treemap library did not load. Check the connection and reload this page.';
      return;
    }
    state.hidden = true;
    const trace = {
      type: 'treemap', labels: rows.map((row) => row.label), parents: rows.map(() => ''),
      values: rows.map((row) => row.records), branchvalues: 'total',
      marker: { colors: rows.map((row) => row.value), cmin: 1, cmax: 5,
        colorscale: [[0, '#345e67'], [.5, '#287c72'], [1, '#3e916f']],
        line: { color: '#f7fbf4', width: 2 }, showscale: false },
      customdata: rows.map((row) => [row.value, row.records]),
      texttemplate: '%{label}<br>%{customdata[0]:.1f} / 5',
      textfont: { size: 11, color: '#f7fff5' },
      hovertemplate: '<b>%{label}</b><br>Average rating: %{customdata[0]:.2f} / 5<br>Non-missing ratings: %{customdata[1]:,}<extra></extra>'
    };
    const layout = { autosize: true, height: 210, margin: { l: 3, r: 3, t: 3, b: 3 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'DM Sans, Segoe UI, sans-serif', color: '#f5f3ec' } };
    window.Plotly.react(plot, [trace], layout, { responsive: true, displayModeBar: false, displaylogo: false })
      .catch(() => { state.hidden = false; state.textContent = 'Rating treemap could not be drawn. Reload the page to try again.'; });
  }
  const countryIso3 = {
    'usa': 'USA', 'united states': 'USA', 'uk': 'GBR', 'united kingdom': 'GBR',
    'south korea': 'KOR', 'republic of korea': 'KOR', 'korea, republic of': 'KOR',
    'china': 'CHN', 'india': 'IND', 'vietnam': 'VNM', 'france': 'FRA',
    'germany': 'DEU', 'sweden': 'SWE', 'japan': 'JPN', 'canada': 'CAN',
    'italy': 'ITA', 'spain': 'ESP', 'norway': 'NOR', 'netherlands': 'NLD',
    'australia': 'AUS', 'brazil': 'BRA', 'mexico': 'MEX', 'thailand': 'THA',
    'indonesia': 'IDN', 'turkey': 'TUR', 'türkiye': 'TUR'
  };
  function countryCode(label) { return countryIso3[String(label).trim().toLocaleLowerCase()] || null; }
  function showCountryTable(container, rows, note) {
    container.replaceChildren();
    const message = document.createElement('p');
    message.className = 'map-fallback-note';
    message.textContent = note;
    container.append(message);
    const table = document.createElement('table');
    table.className = 'country-fallback-table';
    table.innerHTML = '<thead><tr><th scope="col">Manufacturing country</th><th scope="col">Annual sales units</th></tr></thead>';
    const body = document.createElement('tbody');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const name = document.createElement('th'); name.scope = 'row'; name.textContent = row.label;
      const value = document.createElement('td'); value.textContent = fmt(row.value);
      tr.append(name, value); body.append(tr);
    });
    table.append(body); container.append(table);
  }
  function renderCountryMap(rows) {
    const plot = el('chartCountry');
    if (!plot || !plot.parentElement) return;
    const wrap = plot.parentElement;
    const state = wrap.querySelector('.chart-state');
    const fallback = el('countryMapFallback');
    if (!state || !fallback) return;
    if (!Array.isArray(rows) || !rows.length) {
      if (window.Plotly) window.Plotly.purge(plot);
      plot.replaceChildren(); fallback.hidden = true; fallback.replaceChildren();
      state.hidden = false; state.textContent = 'No country sales values are available for this view.';
      return;
    }
    const mapped = rows.map((row) => ({ ...row, iso3: countryCode(row.label) })).filter((row) => row.iso3);
    if (!window.Plotly || !mapped.length) {
      if (window.Plotly) window.Plotly.purge(plot);
      plot.replaceChildren(); state.hidden = true;
      showCountryTable(fallback, rows, !window.Plotly
        ? 'The map library is unavailable. Country sales are shown in this table.'
        : 'These country labels do not match the available map boundary codes. Country sales are shown as supplied.');
      fallback.hidden = false;
      return;
    }
    state.hidden = true;
    const unmapped = rows.filter((row) => !countryCode(row.label));
    if (unmapped.length) {
      showCountryTable(fallback, unmapped, 'Some supplied country labels could not be matched to map boundaries; these sales remain listed here.');
      fallback.hidden = false;
    } else { fallback.hidden = true; fallback.replaceChildren(); }
    const trace = {
      type: 'choropleth', locationmode: 'ISO-3', locations: mapped.map((row) => row.iso3),
      z: mapped.map((row) => row.value), text: mapped.map((row) => row.label),
      customdata: mapped.map((row) => [row.records]),
      colorscale: [[0, '#c8dfbd'], [.5, '#78aa70'], [1, '#33784c']],
      marker: { line: { color: '#f7fbf4', width: .65 } }, showscale: true,
      colorbar: { title: { text: 'Sales units', side: 'right' }, tickfont: { color: '#53685a', size: 8 }, titlefont: { color: '#53685a', size: 8 }, thickness: 8, len: .72 },
      hovertemplate: '<b>%{text}</b><br>Annual sales units: %{z:,}<br>Records: %{customdata[0]:,}<extra></extra>'
    };
    const layout = { autosize: true, height: 225, margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'DM Sans, Segoe UI, sans-serif', color: '#53685a' },
      geo: { projection: { type: 'natural earth' }, showframe: false, showcoastlines: false,
        showcountries: true, countrycolor: '#cedccc', showland: true, landcolor: '#e6ece2',
        showocean: true, oceancolor: '#f7faf4', bgcolor: 'rgba(0,0,0,0)' } };
    window.Plotly.react(plot, [trace], layout, { responsive: true, displayModeBar: false, displaylogo: false })
      .catch(() => {
        plot.replaceChildren();
        showCountryTable(fallback, rows, 'The world map could not load. Country sales are shown in this table.');
        fallback.hidden = false;
      });
  }
  function renderKpis(kpis) {
    const assign = setText;
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
    assign('heroBatteryValue', kpis.average_battery_capacity.value == null ? '—' : fmt(kpis.average_battery_capacity.value, true) + ' kWh');
    assign('heroRangeValue', 'Mean driving range · ' + (kpis.average_range.value == null ? '—' : fmt(kpis.average_range.value, true) + ' km'));
    assign('dashboardBatteryValue', kpis.average_battery_capacity.value == null ? '—' : fmt(kpis.average_battery_capacity.value, true) + ' kWh');
    assign('dashboardRangeValue', kpis.average_range.value == null ? '—' : fmt(kpis.average_range.value, true) + ' km');
  }
  function renderStory(data) {
    const k = data.kpis;
    const s = data.insights;
    const c = data.charts;
    const salesText = k.annual_sales.value == null ? 'No sales values are available.' :
      fmt(k.annual_sales.value) + ' annual sales units appear across ' + fmt(s.filtered_records) + ' filtered records. ' + fmt(k.model_count.value) + ' distinct model names and ' + fmt(k.manufacturer_count.value) + ' manufacturers are represented.';
    setText('insightScale', salesText);
    const top = (rows) => Array.isArray(rows) && rows.length ? rows.reduce((best, row) => row.value > best.value ? row : best) : null;
    const category = top(c.category_sales);
    const manufacturer = s.top_manufacturer;
    const battery = s.top_battery;
    const region = s.top_region;
    const country = top(c.country_sales);
    setText('insightCategory', category
      ? category.label + ' leads category sales with ' + fmt(category.value) + ' summed annual units across ' + fmt(category.records) + ' records.'
      : 'No category sales values are available for these filters.');
    setText('insightManufacturer', manufacturer
      ? manufacturer.label + ' has the largest manufacturer sales sum: ' + fmt(manufacturer.value) + ' annual units across ' + fmt(manufacturer.records) + ' records.'
      : 'No manufacturer sales values are available for these filters.');
    setText('insightBattery', battery
      ? battery.label + ' leads battery sales mix with ' + fmt(battery.value) + ' summed annual units. Values are sales totals, not vehicle counts.'
      : 'No battery sales values are available for these filters.');
    const geography = [];
    if (country) geography.push(country.label + ' has the largest supplied country sales sum (' + fmt(country.value) + ' units)');
    if (region) geography.push(region.label + ' leads region sales (' + fmt(region.value) + ' units)');
    setText('insightGeography', geography.length
      ? geography.join('; ') + '. Country spellings are taken from the dataset.'
      : 'No country or region sales values are available for these filters.');
    const rated = s.highest_rated_category;
    setText('insightExperience', rated
      ? rated.label + ' has the highest average rating at ' + fmt(rated.value, true) + ' out of 5, from ' + fmt(rated.records) + ' non-missing ratings.'
      : 'No customer ratings are available for these filters.');
    const efficient = s.lowest_wh_per_km_category;
    setText('insightCapability', efficient
      ? efficient.label + ' has the lowest mean energy use at ' + fmt(efficient.value, true) + ' Wh/km. Average range is ' + fmt(k.average_range.value, true) + ' km.'
      : 'Range and efficiency details will appear when those fields have valid values.');
    setText('insightCo2', k.co2_savings.value == null
      ? 'The CO₂ savings field is missing or has no valid values in these filtered records.'
      : fmt(k.co2_savings.value, true) + ' tons/year summed from ' + fmt(k.co2_savings.valid_records) + ' non-missing records. This is a dataset-field total; overlapping record scope has not been independently validated.');
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
    setText('filterSummary', fmt(data.metadata.filtered_rows) + ' of ' + fmt(data.metadata.rows_analyzed) + ' records · ' + active + ' active filter' + (active === 1 ? '' : 's'));
    setText('dataPeriod', (data.metadata.backend === 'database' ? 'Database source' : 'Training split') + ' · ' + fmt(data.metadata.rows_analyzed) + ' records');
    renderKpis(data.kpis);
    renderStory(data);
    if (data.metadata.filtered_rows === 0) return clearCharts('No records match the selected filters. Adjust or reset your filters to continue.');
    const c = data.charts;
    renderBar('chartManufacturer', c.manufacturer_sales, 'Annual sales units', false, undefined, undefined, false);
    renderDoughnut('chartBattery', c.battery_mix);
    renderBar('chartRegion', c.region_sales, 'Annual sales units');
    renderBar('chartCategorySales', c.category_sales, 'Annual sales units');
    renderRatingTreemap(c.rating_by_category);
    renderLine('chartYear', c.annual_sales_by_year);
    renderBar('chartRange', c.range_by_category, 'Average range (km)', true);
    renderCountryMap(c.country_sales);
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
        setText('filterSummary', 'Connect a data source to begin');
        setText('heroDataNote', 'No real data connected · load the source CSV');
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
      setText('filterSummary', 'Unable to load dashboard data');
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
  const vehicleStage = document.querySelector('.hero-visual');
  const vehicleIllustration = document.querySelector('.ev-render');
  if (vehicleStage && vehicleIllustration && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    vehicleStage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = vehicleStage.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      vehicleIllustration.style.transform = 'rotateY(' + (-10 + x * 6).toFixed(2) + 'deg) rotateX(' + (2 - y * 4).toFixed(2) + 'deg) rotateZ(-1deg)';
    });
    vehicleStage.addEventListener('pointerleave', () => vehicleIllustration.style.removeProperty('transform'));
  }
  document.querySelectorAll('.tableau-tab').forEach((tab) => tab.addEventListener('click', () => {
    document.querySelectorAll('.tableau-tab').forEach((button) => button.classList.toggle('active', button === tab));
    document.querySelectorAll('.tableau-frame').forEach((panel) => { panel.hidden = panel.dataset.tableauPanel !== tab.dataset.tableauView; });
  }));
  clearCharts('Loading data…');
  refresh();
})();
