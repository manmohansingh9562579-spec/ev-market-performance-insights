# Electric Vehicle Market Performance & Insights

A responsive Flask dashboard and MySQL-ready data workflow for the Electric Vehicle Market Classification Dataset. The dashboard reads the local training CSV or a configured SQL database. It keeps the test split separate and never edits the source CSV.

## What is included

- Four correctly aggregated KPI cards: annual sales sum, unweighted average customer rating, distinct manufacturer count, and annual CO₂ savings sum.
- Eight interactive visualizations: sales by manufacturer, battery type, region, category, and manufacturing country; average rating, range, and energy use by category.
- Filters for manufacturer, battery type, region, category, and model-year range; chart sorting, tooltips, labels, and legends.
- Story and insights sequence, overview, methodology, findings, and limitations.
- Loading, empty, missing-source, invalid-filter, and error states.
- MySQL schema, analysis queries, safe repeatable CSV importer, and SQLite local-development support.
- Tableau-compatible CSV preparation workflow and a separate enhanced Tableau packaged workbook that preserves the existing sheets and Stories.
- Data profile, requirements traceability, project report, database guide, Tableau Public guide, performance report, and demo outline under `docs/`.

## Data source

The inspected source files were found in a local `Downloads/archive/` folder:

- `ev_market_train.csv` — 200,000 rows, 37 columns, 46,478,548 bytes.
- `ev_market_test.csv` — 100,000 rows, 37 columns, 23,238,435 bytes.

Together the two files contain 300,000 rows across matching 37-column schemas and occupy 69,716,983 bytes (about 66.49 MiB).

The application uses the training split only by default. Keep the originals at their current location or set `EV_TRAIN_CSV` in a local `.env` file. No licensed source CSV is bundled in this project. The data profile contains inspected schema and quality results; see [`docs/data_profile.md`](docs/data_profile.md).

The training file has one exact duplicate row, which the app removes in memory. It does not modify the source. Missing measures remain null and are omitted from the relevant sum or mean. Sales and CO₂ totals are dataset-field aggregates; the row grain and external interpretation of these fields should be confirmed before presenting them as market-wide totals.

## Run locally on Windows

Use Python 3.11 or later. From this project directory, open PowerShell:

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

The original Tableau workbooks remain untouched. See [`docs/tableau_public_workflow.md`](docs/tableau_public_workflow.md) for extract creation, Tableau Public steps, account/privacy limits, and the workbook delivered here. The packaged workbook inherits an extract that was not independently inspected and may still include the source duplicate; refresh from the prepared deduplicated CSV before presenting its sales totals as corrected or publishing. Flask is a separate application and does not replace a Tableau workbook or a Tableau Public submission. No Tableau Public URL is configured, so the Flask dashboard works independently; when a valid Public URL is added to `.env`, the app uses Tableau's Embedding API v3 web component.

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
