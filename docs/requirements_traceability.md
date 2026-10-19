# Requirements traceability checklist

## Source and scope

The uploaded requirements/performance document was not available to read as a file in this workspace. The user authorized proceeding from the chat requirements and then supplied SkillWallet screenshots. This checklist maps those chat and screenshot requirements and does not claim to implement unseen wording from an unavailable attachment.

The SkillWallet percentage is a separate platform status from repository evidence. See [`docs/skillwallet_submission_map.md`](skillwallet_submission_map.md) for the exact task mapping and remaining owner/hosting actions.

## Data inspection and preparation

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Inspect workspace and reuse existing project files | Existing Flask, SQL, docs, Tableau workbook, dashboard and Stories were preserved; the Flask experience was refreshed in place and Tableau package edits were made only to a separate handoff copy. | Complete |
| Find train/test CSVs and inspect schema, dimensions, types, missingness, duplicates, quality | docs/data_profile.md and scripts/inspect_data.py report both actual source files. | Complete |
| Keep data authentic and do not invent results | The application reads the actual local training CSV; test fixtures are explicitly synthetic. There is no sample-data fallback presented as real data. | Complete |
| Keep originals unchanged and avoid unnecessary data/credential redistribution | Source CSVs remain outside this repository; exports and local .env are ignored; .env.example contains placeholders only. | Complete |
| Epic: Data Collection & Extraction — download dataset | Source download files were found in the local Downloads archive and profiled. | Complete |
| Epic: Data Collection & Extraction — connect dataset with Tableau | CSV-to-extract workflow and public workbook are documented; SQL-table-to-extract export is implemented in scripts/prepare_tableau_csv.py. | Partial; current public extract came from CSV, and the database export has not been run against a configured MySQL service |

## Data preparation

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Epic: Data Preparation — prepare data for visualization | scripts/inspect_data.py and scripts/prepare_tableau_csv.py; in-memory app cleaning and rules in docs/methodology.md. | Complete |
| Do not mutate source rows/files | Exact duplicate removal and numeric parsing happen in the application or generated handoff export; original CSV is unchanged. | Complete |

## Visualizations and dashboard

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Epic: Data Visualizations — create/document unique visualizations | Flask renders 9 charts, including a customer-rating treemap and manufacturing-country choropleth with table fallback; titles, field mappings and aggregation rules appear in templates/index.html, public/static/js/dashboard.js, app.py and docs/performance_report.md. Tableau handoff preserves 7 existing chart worksheets. | Complete |
| Professional responsive dashboard | templates/index.html and public/static/css/style.css implement the dark/gold EV Insights design, responsive layout and navigation. | Implemented; manual browser/device verification pending |
| KPIs for annual sales, customer rating, manufacturers, CO2 where available | Seven cards include the required four plus distinct models, average range and average battery capacity. Formulas are stated in docs/methodology.md. | Complete |
| Sales by manufacturer, battery type, region and category | Four requested groupings, including a sales-mix doughnut by battery type. | Complete |
| Customer rating, range and energy-efficiency analysis | Rating, range and Wh/km are means by category; lower Wh/km is explained in the UI. | Complete |
| Country map or appropriate geography when reliable | Manufacturing-country sales map through recognized ISO-3 codes; unmatched labels or map-library errors fall back to a source-label sales table. | Implemented; browser map rendering pending |
| Manufacturer, battery, region, category and model-year filters | Filtered API and UI also provide manufacturing-country filter and sales sort. | Implemented; automated behavior covered |
| Sorting, tooltips, labels, legends, titles | Chart.js setup and chart headers in public/static/js/dashboard.js and templates/index.html. | Complete |
| Loading, empty, missing-data and error states | UI/API states plus automated missing/empty/error behavior coverage. | Implemented; browser manual verification pending |
| Epic: Dashboard — responsive design | Breakpoints and mobile navigation are in public/static/css/style.css and public/static/js/dashboard.js. | Implemented; manual viewport check pending |

## Story and project documentation

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Epic: Story — count Story scenes and build logical analysis sequence | Preserved Tableau Stories; Tableau Public Story 2 is linked in README.md and docs/tableau_public_workflow.md. Flask now provides eight filter-responsive steps from scale through CO₂ context. | Complete |
| Project overview, methodology, findings and limitations | README.md, docs/project_report.md and docs/methodology.md. | Complete |
| Epic: Project Demonstration & Documentation — project docs | README, traceability, data profile, methodology, performance, DB, Tableau and demo documentation are included. | Complete |
| Epic: Project Demonstration & Documentation — record end-to-end video | docs/demo_outline.md provides a 5–7 minute walkthrough. Recording/uploading the video remains the owner's submission action. | Pending owner recording |

## Database and SQL

| Requirement | Implementation / evidence | Status |
|---|---|---|
| MySQL schema, suitable types, PK and indexes | sql/schema.sql. | Implemented; MySQL execution pending |
| Repeatable CSV import | scripts/import_csv.py protects populated destinations unless --replace is supplied. | SQLite path tested; MySQL pending |
| Meaningful EV analysis queries | sql/analysis_queries.sql covers supported sales, manufacturer, region, battery, rating, range, country, efficiency and CO2 metrics. | Complete |
| Environment variables and placeholder-only .env.example | .env.example and app.py. | Complete |
| SQLite fallback and setup instructions | docs/database_setup.md. | SQLite tested; MySQL pending |
| Do not claim MySQL success without testing | Connection, import and performance are marked pending throughout. | Complete |

## Tableau and web integration

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Epic: Web Integration — publish dashboard and Story to Tableau Public | Dashboard 1 and Story 2 are publicly linked from README.md; the separate handoff workbook preserves the existing Tableau structure. | Published |
| Tableau-compatible extract and workflow | scripts/prepare_tableau_csv.py, separate packaged handoff workbook, and docs/tableau_public_workflow.md. | Complete |
| Explain Tableau Public account, permissions, limitations and publishing | docs/tableau_public_workflow.md. | Complete |
| Epic: Web Integration — embed dashboard and Story with Flask | Optional official Tableau Embedding API v3 elements use TABLEAU_PUBLIC_URL and TABLEAU_STORY_URL. Local charts work if either URL is absent. | Implemented; automated template coverage |
| Preserve Tableau as a separate submission deliverable | README.md and docs/project_report.md state Flask does not replace Tableau/Public submission. | Complete |

## Performance test requirements

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Epic: Performance Testing — amount of data | docs/performance_report.md and docs/performance_measurements.json record actual rows, columns and bytes. | Complete |
| Epic: Performance Testing — field utilization | Report lists Flask's 14 used and 23 unused source fields; 14/37 = 37.84%. | Complete |
| Epic: Performance Testing — calculated fields/measures/transformations | Report distinguishes 7 KPIs, 9 chart aggregation expressions, 6 numeric measures, 3 preparation operations, and zero newly authored Tableau calculated fields. | Complete |
| Epic: Performance Testing — number of visualizations | Nine Flask analytical views (seven Chart.js and two Plotly); seven Tableau chart worksheets counted separately. | Complete |
| Load/response timing and SQL query performance | Actual in-process Flask timings recorded; HTTP/browser and MySQL SQL timing are explicitly pending. | Partial; pending checks labeled |
| Filtering correctness, responsiveness and error handling | Real-data manufacturer filter comparison and unit coverage recorded; responsive CSS implemented; manual browser/device check pending. | Partial; manual visual check pending |
| Repeatable test scripts and measured environment/method/limitations | tests/test_dashboard.py, benchmark scripts, docs/performance_report.md and docs/performance_measurements.json. | Complete |

## Deliverables and submission

| Deliverable | Location / evidence | Status |
|---|---|---|
| Flask app and frontend | app.py, templates/index.html, public/static/css/style.css, public/static/js/dashboard.js | Complete |
| Dependencies and safe environment template | requirements.txt, .env.example | Complete |
| MySQL / SQL assets | sql/schema.sql, sql/analysis_queries.sql | Complete |
| Data preparation, import and benchmarks | scripts/ | Complete |
| Automated tests | tests/test_dashboard.py | 14 test functions are present; earlier notes report 13 passing. Run the current suite before final submission. |
| Report and submission documentation | docs/ and README.md | Complete, with pending limits called out |
| Tableau Public dashboard | https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1 | Published |
| Tableau Public Story | https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2 | Published |
| GitHub source submission | https://github.com/manmohansingh9562579-spec/ev-market-performance-insights | Public repository; source/docs only |
