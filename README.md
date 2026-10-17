# Electric Vehicle Market Performance & Insights

A responsive Flask dashboard and MySQL-ready data workflow for the Electric Vehicle Market Classification Dataset. The dashboard reads the local training CSV or a configured SQL database. It keeps the test split separate and never edits the source CSV.

## What is included

- Seven KPI cards: annual sales sum, unweighted average customer rating, distinct manufacturer and model counts, average range, average battery capacity, and annual CO₂ savings sum.
- Nine interactive visualizations: manufacturer, battery, region, category and country sales; customer rating, model-year sales trend, range and energy use.
- Filters for manufacturer, battery type, region, category, manufacturing country, and model-year range; chart sorting, tooltips, labels, and legends.
- Story and insights sequence, overview, methodology, findings, and limitations.
- Loading, empty, missing-source, invalid-filter, and error states.
- MySQL schema, analysis queries, safe repeatable CSV importer, and SQLite local-development support.
- Tableau-compatible CSV preparation workflow and a refreshed Tableau packaged workbook that preserves the existing sheets, dashboard, filters, and Stories.
- Data profile, requirements traceability, project report, database guide, Tableau Public guide, performance report, and demo outline under `docs/`.

## Data source

The inspected source files were found in a local `Downloads/archive/` folder:

- `ev_market_train.csv` — 200,000 rows, 37 columns, 46,478,548 bytes.
- `ev_market_test.csv` — 100,000 rows, 37 columns, 23,238,435 bytes.

Together the two files contain 300,000 rows across matching 37-column schemas and occupy 69,716,983 bytes (about 66.49 MiB).

The application uses the training split only by default. Keep the originals at their current location or set `EV_TRAIN_CSV` in a local `.env` file. No licensed source CSV is bundled in this project. The data profile contains inspected schema and quality results; see [`docs/data_profile.md`](docs/data_profile.md).

The training file has one exact duplicate row, which the app removes in memory. It does not modify the source. Missing measures remain null and are omitted from the relevant sum or mean. The UI includes distinct `model_name` and average `battery_capacity_kwh` summaries, plus annual sales grouped by `model_year`. Sales and CO₂ totals are dataset-field aggregates; the row grain and external interpretation of these fields should be confirmed before presenting them as market-wide totals.

## Run locally on Windows

Use Python 3.11 or later. From this project directory, open PowerShell:

For a one-click launch, double-click [`START_DASHBOARD.bat`](START_DASHBOARD.bat). It installs the project dependencies on first use if needed, selects a free local port, and opens the Flask website in your browser. Keep its console window open while using the site; press Ctrl+C there to stop it.

To start it manually instead, use PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

Open `http://127.0.0.1:5000`. The default loader checks `~/Downloads/archive/ev_market_train.csv`, `data/ev_market_train.csv`, then the project root. To use another file, edit `.env` and set `EV_TRAIN_CSV` to its path. Do not put credentials in source files or commit a populated `.env`.

Chart.js and fonts load from CDNs; the data API and Flask server run locally. An internet connection is needed for those external visual assets. If no CSV or database is available, the page shows a clear data-loading state. Synthetic rows exist only in automated test fixtures and are not offered as real dataset results.

## Database

Read [`docs/database_setup.md`](docs/database_setup.md) before using MySQL. Run `sql/schema.sql` in MySQL 8+, configure environment variables, then import using `scripts/import_csv.py`. The importer validates the 37-column schema, drops exact duplicates, rejects conflicting or missing primary-key IDs, and protects a non-empty destination unless `--replace` is explicitly passed.

For a local SQLite database, set `DATABASE_URL=sqlite:///ev_market.sqlite` in `.env` and use the same importer. The automated suite exercised this SQLite path. **MySQL installation, connection, import, and query performance have not been tested in this environment.**

## Tableau

The original Tableau workbooks remain untouched. The refreshed local package `EV_Market_Performance_Public_Ready_Clean.twbx` uses the prepared, deduplicated 199,999-row training CSV through one embedded Hyper extract, and its seven existing chart worksheets use that source. The existing dashboard and Stories are preserved. The packaged workbook and prepared CSV are kept outside this source repository because they contain the dataset. Open the [full Dashboard 1](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Dashboard1) or the [Story 2 narrative](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Story2) on Tableau Public. The initial save URL opened only the Manufacturer Sales worksheet; Dashboard 1 shows the full dashboard. Its embedded extract is public. The dataset owner confirmed they checked the dataset terms and authorized publication; the assistant could not independently read Kaggle's license statement. See [`docs/tableau_public_workflow.md`](docs/tableau_public_workflow.md) for preparation evidence, account requirements, and publishing details. Flask remains a separate application and does not replace the Tableau workbook or Tableau Public submission. Set `TABLEAU_PUBLIC_URL` and `TABLEAU_STORY_URL` in local `.env` to the Dashboard 1 and Story 2 links to enable the official Embedding API v3 views; local charts remain functional without either URL.

## Public demo landing page

The static `docs/site/` page is configured for GitHub Pages and embeds the already-published Tableau Dashboard and Story. The workflow is `.github/workflows/pages.yml`. After the first successful deployment, the expected link is `https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/`. If GitHub Pages is not enabled for the repository, an owner must select **Settings → Pages → Build and deployment → GitHub Actions** once. GitHub Pages hosts only the static landing page; Flask and database features still need a Python-capable host. See [`docs/site/README.md`](docs/site/README.md).

## Checks

```powershell
python -m unittest discover -s tests -v
python scripts/benchmark_inprocess.py
python scripts/benchmark_dashboard.py --runs 20
python scripts/benchmark_sql.py
```

The unit suite uses small synthetic fixtures, not Kaggle results. `benchmark_inprocess.py` measures real-data loading and warmed Flask test-client responses and compares an actual manufacturer-filter result to a direct pandas calculation. `benchmark_dashboard.py` requires a reachable local HTTP server; this environment blocked local socket/browser access, so HTTP and visual browser timings are pending. SQL timings are pending until a database is configured. See [`docs/performance_report.md`](docs/performance_report.md).

## Repository map

```text
app.py                         Flask routes and data aggregation
templates/index.html           Dashboard, Story, and conditional Tableau embed
static/css/style.css           Responsive styles
static/js/dashboard.js         Filters, charts, states, and interactions
sql/schema.sql                 MySQL schema and indexes
sql/analysis_queries.sql       Parameterized analysis examples
scripts/                       Inspection, import, Tableau prep, and benchmarks
tests/                         Synthetic unit and SQLite integration tests
docs/                          Profile, methodology, traceability, reports, and guides
```
