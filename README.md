# Electric Vehicle Market Performance & Insights

A responsive Flask dashboard and SQL workflow for the Electric Vehicle Market Classification Dataset. The one-click local launcher imports the training CSV into a private SQLite database on first use. SQLite is the project's active database; no hosted database provider is required. The project keeps the test split separate and never edits the source CSV.

## What is included

- Seven KPI cards: annual sales sum, unweighted average customer rating, distinct manufacturer and model counts, average range, average battery capacity, and annual CO₂ savings sum.
- Nine interactive visualizations: manufacturer, battery, region and category sales; customer-rating treemap; model-year sales trend; manufacturing-country map with table fallback; range and energy use.
- Interactive, unbranded EV concept artwork with filtered average battery-capacity and driving-range callouts; eight-step insight sequence updates with filters.
- Filters for manufacturer, battery type, region, category, manufacturing country, and model-year range; chart sorting, tooltips, labels, and legends.
- Story and insights sequence, overview, methodology, findings, and limitations.
- Loading, empty, missing-source, invalid-filter, and error states.
- SQLite schema and analysis queries, plus a safe repeatable CSV importer.
- Tableau-compatible CSV preparation from either a source CSV or configured SQL table, plus a refreshed Tableau packaged workbook that preserves the existing sheets, dashboard, filters, and Stories.
- Data profile, requirements traceability, final project report, database guide, Tableau Public guide, performance report, and demo outline under `docs/`.

The final report is available as a [readable Markdown document](docs/EV_Market_Performance_Final_Report.md) and a [Word document](docs/EV_Market_Performance_Final_Report.docx). It follows the supplied report outline and links to the live Tableau and GitHub Pages deliverables.

## Data source

The inspected source files were found in a local `Downloads/archive/` folder:

- `ev_market_train.csv` — 200,000 rows, 37 columns, 46,478,548 bytes.
- `ev_market_test.csv` — 100,000 rows, 37 columns, 23,238,435 bytes.

Together the two files contain 300,000 rows across matching 37-column schemas and occupy 69,716,983 bytes (about 66.49 MiB).

The application uses the training split only by default. The launcher looks for the source in `Downloads/archive/`, `data/`, then the project root, and keeps the CSV in place. No licensed source CSV or database file is bundled in this project. To use another file, set `EV_TRAIN_CSV` in a local `.env` file. The data profile contains inspected schema and quality results; see [`docs/data_profile.md`](docs/data_profile.md).

The training file has one exact duplicate row, which the app removes in memory. It does not modify the source. Missing measures remain null and are omitted from the relevant sum or mean. The UI includes distinct `model_name` and average `battery_capacity_kwh` summaries, plus annual sales grouped by `model_year`. Sales and CO₂ totals are dataset-field aggregates; the row grain and external interpretation of these fields should be confirmed before presenting them as market-wide totals.

## Run locally on Windows

Use Python 3.11 or later. From this project directory, open PowerShell:

For a one-click launch, double-click [`START_DASHBOARD.bat`](START_DASHBOARD.bat). It creates a private local `.env` from `.env.example` on first use, installs the project dependencies if needed, selects a free local port, and opens the Flask website in your browser. The default settings discover the training CSV in `Downloads/archive/` and load the public Tableau Dashboard and Story links. Keep its console window open while using the site; press Ctrl+C there to stop it.

To start it manually instead, use PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python scripts/launch_local.py
```

The launcher creates the local SQLite database from the training CSV when needed and opens the address shown in the console. To use another file, edit `.env` and set `EV_TRAIN_CSV` to its path. Do not put credentials in source files or commit a populated `.env`.

Chart.js, Plotly (used for the treemap and map), and fonts load from CDNs; the data API and Flask server run locally. An internet connection is needed for those external visual assets. If the Plotly map cannot load, the app shows a country-sales table; if no CSV or database is available, the page shows a clear data-loading state. Synthetic rows exist only in automated test fixtures and are not offered as real dataset results.

## Database and SQL

The required database workflow uses local SQLite through SQLAlchemy: `DATABASE_URL=sqlite:///ev_market.sqlite`. The one-click launcher imports the training CSV into `ev_market_train`; the repeatable importer validates the 37-column schema, drops exact duplicates, rejects conflicting or missing primary-key IDs, and protects a non-empty destination unless `--replace` is explicitly passed. The app and database remain on the user's computer during local use.

Use [`sql/schema_sqlite.sql`](sql/schema_sqlite.sql) and [`sql/analysis_queries.sql`](sql/analysis_queries.sql) for the project SQL operations and [`docs/database_setup.md`](docs/database_setup.md) for setup and export steps. `scripts/prepare_tableau_csv.py --from-database` exports a local Tableau-ready extract source from SQLite. The project's required workflow uses only the local SQLite database; no remote database service is part of the submission.

The Flask site also supports optional sign-up and login, storing password hashes in the configured local database. These account routes are for local demonstration and do not create a hosted public account service. See [`docs/hosted_backend.md`](docs/hosted_backend.md) for the local Flask + SQLite setup.

## Tableau

The original Tableau workbooks remain untouched. The current public workbook is `EV_Market_Performance_Rating_Corrected`; it preserves the dashboard and Stories with the corrected 4.09/5 rating KPI. Open the [Dashboard 1](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1) or [Story 2](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2) on Tableau Public. Its embedded extract is public. The older Overlap Fixed, Green Executive Refresh, and Public Ready Clean views have been removed from the Tableau profile. The local `.twbx` packages and prepared CSV are kept outside this source repository because they contain the dataset. The dataset owner confirmed checking the dataset terms and authorized publication; the assistant could not independently read Kaggle's license statement. See [`docs/tableau_public_workflow.md`](docs/tableau_public_workflow.md) and the exact [`SkillWallet submission map`](docs/skillwallet_submission_map.md). Flask remains a separate application and does not replace Tableau Public submission. Set `TABLEAU_PUBLIC_URL` and `TABLEAU_STORY_URL` in local `.env` to the corrected Dashboard 1 and Story 2 links; Flask embeds the views when these values are configured.

## Public demo landing page

The static `docs/site/` page is configured for GitHub Pages and embeds the already-published Tableau Dashboard and Story. The workflow is `.github/workflows/pages.yml`. After the first successful deployment, the expected link is `https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/`. If GitHub Pages is not enabled for the repository, an owner must select **Settings → Pages → Build and deployment → GitHub Actions** once. GitHub Pages hosts only the static landing page; Flask and database features still need a Python-capable host. See [`docs/site/README.md`](docs/site/README.md).

The Flask dashboard is a local companion to the public Tableau deliverable. Online Flask hosting and a remote database are not required by the project guidance. GitHub Pages hosts only the static landing page; it does not run Flask or SQLite. Follow [`docs/hosted_backend.md`](docs/hosted_backend.md) to run the Flask + SQLite app locally.

## Checks

```powershell
python -m unittest discover -s tests -v
python scripts/benchmark_inprocess.py
python scripts/benchmark_dashboard.py --runs 20
python scripts/benchmark_sql.py
```

The unit suite uses small synthetic fixtures, not Kaggle results. `benchmark_inprocess.py` measures real-data loading and warmed Flask test-client responses and compares an actual manufacturer-filter result to a direct pandas calculation. `benchmark_dashboard.py` requires a reachable local HTTP server; HTTP and local Flask browser timings are pending. Remote-database timings are outside the required project scope. See [`docs/performance_report.md`](docs/performance_report.md).

## Repository map

```text
app.py                         Flask routes and data aggregation
templates/index.html           Dashboard, Story, and conditional Tableau embed
public/static/css/style.css    Responsive styles served by Flask locally
public/static/js/dashboard.js  Filters, charts, states, and interactions
sql/schema_sqlite.sql          Active SQLite schema and indexes
sql/analysis_queries.sql       SQL analysis examples
sql/analysis_queries.sql       Parameterized analysis examples
scripts/                       Inspection, import, Tableau prep, and benchmarks
tests/                         Synthetic unit and SQLite integration tests
docs/                          Profile, methodology, traceability, reports, and guides
```
