# SkillWallet submission map

This checklist maps the SkillWallet brief to the actual EV project files and public deliverables. It records implementation evidence; it does **not** change SkillWallet task statuses or claim mentor approval.

## Current project state

- SkillWallet showed **3% overall progress** on 2026-10-19: one task in progress, 13 to do, and none reviewed or completed.
- The GitHub Pages site now embeds the corrected Tableau Public Dashboard/Story; the live page returned HTTP 200. The Tableau profile has one viz, `EV_Market_Performance_Rating_Corrected`; the three older duplicate/incorrect vizzes were deleted. GitHub Pages is static; the Flask app is local and is not connected to a hosted backend.
- The local `.env` uses SQLite. No MySQL connection is configured in this checkout, so hosted MySQL import, query performance, and database-backed deployment remain pending.
- The dataset files are available locally and ignored by Git. The public repository contains no source CSV or database file.
- The current published Tableau Public workbook is `EV_Market_Performance_Rating_Corrected` and its rating KPI shows **4.09/5**, matching the dataset profile's 4.088754 mean. Dashboard 1 and Story 2 links on GitHub Pages point to this workbook; the Flask `.env` also uses these corrected links.

## Requirement-to-evidence checklist

| SkillWallet requirement | Evidence in this project | Status and remaining work |
|---|---|---|
| Define problem / problem understanding | `README.md`, `docs/project_report.md`, project overview with three EV-market personas and questions | Ready |
| Download the dataset | `docs/data_profile.md`, `scripts/inspect_data.py`; local train/test CSVs | Evidence ready locally; CSVs stay out of GitHub |
| Store data in a database | `sql/schema.sql`, `scripts/import_csv.py`, local `ev_market.sqlite` | SQLite local workflow available; MySQL service/import pending |
| Perform SQL operations | `sql/analysis_queries.sql`, indexed schema, SQLAlchemy dashboard path | Queries and implementation are present; remote MySQL execution is pending |
| Connect database data to Tableau | `scripts/prepare_tableau_csv.py` supports exporting a prepared CSV from a configured SQL table; Tableau Public workbook uses an embedded extract | Export path is implemented; current published extract was prepared from CSV, so complete the database-to-extract handoff after MySQL is available |
| Prepare data for visualization | `scripts/inspect_data.py`, `scripts/import_csv.py`, `scripts/prepare_tableau_csv.py`, `docs/methodology.md` | Ready; source remains unchanged and one exact duplicate is excluded |
| Number of unique visualizations | `docs/performance_report.md`: 9 Flask views and 7 Tableau chart worksheets, counted separately | Ready and documented |
| Responsive dashboard design | `templates/index.html`, `public/static/css/style.css`, `docs/site/` | Implemented; finish manual desktop/mobile review before marking reviewed |
| Story scene count | Tableau Story 2 is embedded on the site; the project documents 8 story points and the Flask view has 8 insight steps | Ready; confirm the Story point count in Tableau before mentor review |
| Amount of data rendered | `docs/data_profile.md`, `docs/performance_report.md`: 200,000 train rows, 199,999 analyzed after deduplication; test split kept separate | Ready; do not describe these as independently validated market-wide totals |
| Utilization of filters | Flask filters manufacturer, battery, region, category, country, and model-year range; sorting is separate. The current public Tableau view exposes its workbook filters. | Flask filters work in the local app; custom Flask filters are not publicly hosted yet |
| Number of calculated fields | `docs/performance_report.md` distinguishes 7 KPI formulas, 9 chart aggregations, and 0 new named Tableau calculated fields | Count documented; do not imply Tableau calculated fields were created |
| Number of visualizations / graphs | 9 Flask views and 7 Tableau worksheets; `docs/performance_report.md` defines the counting rule | Ready |
| Publish Dashboard and Story to Tableau Public | Public Dashboard 1 and Story 2 are linked in `README.md` and `docs/tableau_public_workflow.md` | Published as the corrected workbook; GitHub Pages embeds Dashboard 1 and Story 2 from this view |
| Embed Dashboard and Story with Flask | Conditional Tableau Embedding API v3 components in `templates/index.html`; local `.env` has both view URLs | Implemented locally; no hosted Flask URL is connected to GitHub Pages |
| Record end-to-end explanation video | `docs/demo_outline.md` | Outline ready; owner must record and submit the video |
| Step-by-step project documentation | `README.md` and the `docs/` guides | Ready; database-to-Tableau flow is documented here and in `docs/tableau_public_workflow.md` |

## Exact SkillWallet Kanban tasks

SkillWallet groups the work into 14 task cards: 2 Data Collection & Extraction, 1 Data Preparation, 1 Data Visualizations, 1 Dashboard, 1 Story, 4 Performance Testing, 2 Web Integration, and 2 Project Demonstration & Documentation. The evidence above covers these task titles. Record completion in SkillWallet only after attaching the matching evidence and completing the checks listed above.

## Brief wording to correct

The Data Collection & Extraction description on SkillWallet refers to an online-learning dataset, and the Data Visualizations description refers to online-learning engagement. Those paragraphs do not describe this EV project. Use the EV task titles and scope here; ask the course owner to correct those generic descriptions if they affect grading.

## Final completion order

1. Complete — publish the rating-corrected Tableau package, update GitHub Pages links to Dashboard 1 and Story 2, and verify the live Pages deployment.
2. Configure the selected free MySQL service and import the training split; run the database-backed Tableau export and verify the row count.
3. Deploy Flask only after the database is reachable; set the private production secrets and Tableau view URLs, then connect the hosted Flask dashboard from the landing page.
4. Review dashboard and map at desktop/mobile sizes, record the demo video, and attach repository/site evidence to the corresponding SkillWallet cards.
