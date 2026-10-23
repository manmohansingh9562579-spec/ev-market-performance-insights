# Electric Vehicle Market Performance and Insights

## Final Project Report

**Prepared by:** Man Mohan Singh
**Report date:** 23 October 2026

## Executive summary

This project examines an electric-vehicle market classification dataset through a local Flask dashboard, a SQLite SQL workflow, and a published Tableau workbook. The dashboard uses the 200,000-row training file, excludes one exact duplicate during analysis, and keeps the 100,000-row test file separate. Its seven KPI cards, nine analytical charts, six filters, and eight-step insight sequence let viewers inspect the supplied data from several angles.

The published Tableau workbook provides Dashboard 1 and Story 2. A static GitHub Pages site embeds those public views and links to the project documentation. Flask and SQLite run locally; GitHub Pages does not host the Python application or database. Sales and CO₂ values in this report are sums of supplied dataset fields. The available source documentation does not establish that they are independently verified market-wide totals.

## 1 Introduction

### 1.1 Project overview

Electric Vehicle Market Performance and Insights is a data analytics project built around a public electric-vehicle market classification dataset. It combines data inspection and preparation, SQL analysis in SQLite, an interactive Flask dashboard, and a published Tableau dashboard and story.

The dashboard presents manufacturer and model counts, annual sales fields, customer ratings, battery capacity, driving range, energy use, manufacturing geography, and CO₂ savings fields. Filters allow a viewer to focus on selected manufacturers, battery types, market regions, vehicle categories, manufacturing countries, and model-year ranges.

### 1.2 Purpose

The purpose is to make the supplied dataset easier to inspect and compare. The project is designed to answer questions such as:

- How do annual-sales fields vary across manufacturers, battery types, vehicle categories, and regions?
- How do customer ratings, driving range, and energy-use values vary across categories?
- How does a selected manufacturer or vehicle segment change the dashboard summaries?
- What data preparation and aggregation rules sit behind each view?

The project does not claim to predict future adoption or independently validate global market totals. Its measures are descriptive summaries of the dataset fields.

## 2 Ideation phase

### 2.1 Problem statement

The dataset contains many vehicle records and fields, so a reader needs a clear way to compare manufacturers, technologies, vehicle segments, and supplied performance measures. A static table makes it difficult to move between these questions. The project addresses this by combining filtered visual analysis with a narrative sequence and documented data rules.

### 2.2 Empathy map canvas

The following canvas is a design hypothesis for people who may use the project. The project did not conduct participant interviews, so these points are not reported as measured user feedback.

| Viewer perspective | Design hypothesis |
|---|---|
| Needs to see | Clear labels, understandable units, a concise overview, and a way to compare selected vehicle groups. |
| May ask | Which records are included? What changes when a filter is applied? How are sales, rating, range, and battery measures calculated? |
| May do | Start from summary KPIs, select a manufacturer or category, compare charts, then open the story or methodology notes. |
| May find difficult | Long category names, crowded labels, unclear aggregation rules, missing values, and confusing the dataset extract with independently verified market totals. |

The dashboard addresses these needs with filter controls, chart tooltips, shorter chart labels in the Tableau workbook, methodology notes, and explicit data limitations.

### 2.3 Brainstorming and idea selection

The repository does not contain minutes from a formal brainstorming session. This table records the solution choices reflected in the delivered project.

| Idea | Fit for the project | Delivered choice |
|---|---|---|
| Static report or spreadsheet | Useful for fixed summaries, but viewers cannot explore combinations of filters in the same way. | Retained as supporting documentation, not the primary analysis interface. |
| Interactive local dashboard | Supports filters, KPI updates, sorting, and a guided insight sequence while using the required local SQL database. | Implemented with Flask, SQLite, and browser charts. |
| Tableau Public dashboard and story | Provides a public interactive workbook and a shareable narrative view. | Published as a separate Tableau deliverable and embedded on the public landing page. |

## 3 Requirement analysis

### 3.1 Customer journey map

This is a modeled journey based on the implemented interface, not the result of a user study.

| Stage | Viewer action | Interface or evidence | Project response |
|---|---|---|---|
| Discover | Opens the project link and identifies its purpose. | GitHub Pages landing page and project overview. | Introduces the EV analysis and links to the dashboard, story, source, and documentation. |
| Orient | Looks at the summary measures. | KPI cards and chart headings. | Shows the selected dataset summaries and their units. |
| Explore | Selects a manufacturer, region, category, battery type, country, or model-year range. | Flask filter controls or Tableau workbook controls. | Recomputes or filters the views for the chosen selection. |
| Interpret | Compares charts and follows the narrative. | Nine Flask views, Tableau worksheets, and eight insight steps. | Adds labels, tooltips, and explanations of aggregation and limitations. |
| Verify | Checks how data was prepared and where it came from. | Data profile, methodology, SQL files, and report. | Documents split handling, duplicate removal, missing-value treatment, and query examples. |

### 3.2 Solution requirements

**Functional requirements**

- Read the training split for analysis and keep the test split separate.
- Preserve the original CSV and remove the exact duplicate only from the analysis frame or generated import.
- Store the working data in SQLite and provide a repeatable importer and SQL analysis examples.
- Show KPI cards and charts for sales, ratings, battery technology, region, category, range, energy use, and manufacturing geography.
- Provide filters for manufacturer, battery type, market region, vehicle category, manufacturing country, and model-year range.
- Make dashboard summaries respond to active filters and provide sorting, tooltips, labels, and a useful map fallback.
- Publish a Tableau dashboard and story, then provide a public landing page linking to those views.

**Non-functional requirements**

- Keep the source dataset and local credentials out of the public source repository.
- Use responsive layouts and explain loading, empty, missing-source, invalid-filter, and error states.
- Document the aggregation rules, data limitations, and local setup steps.
- Keep claims tied to measured project evidence and avoid presenting field sums as independently verified market totals.

### 3.3 Data flow

1. The train and test CSV files are inspected separately for schema, missing values, duplicates, and field types.
2. The local SQLite importer validates the expected schema, removes exact duplicate rows, and loads the selected split into its corresponding table. The project dashboard uses the training table by default.
3. Flask reads the training data, applies the selected filters, computes KPI and chart aggregates, and returns data to the browser interface.
4. The browser renders charts and the eight-step insight sequence. The country map can fall back to a country sales table if map boundaries or the map library are unavailable.
5. A separate preparation script can export a Tableau-ready CSV from the inspected source file or the configured SQLite table.
6. Tableau Public stores a published extract in its workbook. GitHub Pages embeds the published Tableau Dashboard 1 and Story 2; it does not connect to the local Flask process or SQLite file.

### 3.4 Technology stack

| Layer | Technology | Role |
|---|---|---|
| Data analysis | Python and pandas | Inspect, prepare, and aggregate the source data. |
| Web application | Flask | Serve the local dashboard and data endpoints. |
| SQL database | SQLite with SQLAlchemy | Store the local project data and support SQL queries. |
| Browser interface | HTML, CSS, and JavaScript | Render the dashboard, filters, responsive layout, and story. |
| Visualizations | Chart.js and Plotly | Render the dashboard charts, treemap, and map. |
| Public analytics | Tableau Public | Host the published workbook, dashboard, and story extract. |
| Public landing page | GitHub Pages and GitHub Actions | Host the static project page and deploy updates from the repository. |

## 4 Project design

### 4.1 Problem and solution fit

The project combines a locally runnable data workflow with shareable public analytics. SQLite provides a database workflow without requiring a paid or hosted database service. Flask supports interactive filters and the local dashboard. Tableau Public supplies the separate published workbook required for public dashboard and story viewing.

### 4.2 Proposed solution

The proposed solution has three connected parts:

- **Local analysis:** import and query the training data in SQLite, then run the Flask dashboard locally.
- **Published visual analysis:** use the prepared extract in Tableau Public and publish a dashboard and story.
- **Public project entry point:** host a static GitHub Pages website that introduces the project, embeds the public Tableau views, and links to the source and documentation.

### 4.3 Solution architecture

| Component | Input | Output |
|---|---|---|
| Data inspection and preparation | Train and test CSV files | Profiled schema, quality notes, and a prepared train extract. |
| SQLite importer and SQL files | Selected CSV split | Local tables, indexes, and analysis query results. |
| Flask backend | SQLite training table or configured local source | Filtered KPI and chart data, status responses, and story context. |
| Browser dashboard | Flask data responses | Responsive KPI cards, filters, charts, map or table fallback, and story steps. |
| Tableau workbook | Prepared extract | Public Dashboard 1 and Story 2. |
| GitHub Pages site | Static web assets and Tableau Public URLs | Public landing page with embedded Tableau views and project links. |

The public GitHub Pages site is static. The Flask backend and SQLite database are not hosted by that site.

## 5 Project planning and scheduling

The repository records project phases and their evidence but does not contain a dated baseline schedule. This table summarizes the work sequence without inventing planned or actual dates.

| Phase | Work | Evidence in the repository or public deliverables |
|---|---|---|
| Data collection and inspection | Locate the train/test files, inspect schema and data quality. | Data profile and inspection script. |
| Data preparation and SQL | Define SQLite schema, import safeguards, and analytical queries. | SQLite schema, importer, database guide, and SQL query file. |
| Dashboard and story design | Build the Flask dashboard, filters, charts, and insight sequence. | Flask application, templates, static assets, and Tableau workbook. |
| Publishing and integration | Publish the Tableau views and embed them in GitHub Pages. | Tableau Public links, static site, and Pages workflow. |
| Verification and submission | Review responsive behavior, run current checks, capture output evidence, and record the walkthrough. | Performance report and demo outline; final owner review and video upload remain submission actions unless separately recorded. |

## 6 Functional and performance testing

### 6.1 Functional behavior

The Flask dashboard supports six filters, chart sorting, KPI recomputation, loading and empty states, and a country map fallback. The repository contains fourteen dashboard test functions covering aggregations, deduplication, combined and invalid filters, empty results, missing data, Tableau embedding, the story, and SQLite import behavior.

The last repository performance note says the current fourteen-function suite needs a fresh run before final submission. It records earlier runs of thirteen tests, so this report does not claim that all fourteen currently pass. The real-data manufacturer filter benchmark selected AmpereAuto and compared API output against a separate calculation from the deduplicated training frame; the comparison was marked as passed.

### 6.2 Performance testing

The recorded benchmark used an in-process Flask test client on Windows 11 with Python 3.14.2 and pandas 3.0.2. It loaded the actual training CSV, measured an initial dashboard request, and then measured twenty warmed requests. It did not include a browser, network socket, CDN, concurrent users, or production server.

| Measurement | Recorded result |
|---|---:|
| Training data load and health response | 1,465.877 ms |
| First dashboard API response | 260.409 ms |
| Twenty warmed calls, median | 253.895 ms |
| Twenty warmed calls, 95th percentile | 268.841 ms |
| Twenty warmed calls, maximum | 276.799 ms |

All twenty warmed calls returned HTTP 200. These are application response measurements, not browser page-load or chart-rendering measurements. Manual browser rendering, responsive desktop/mobile review, and end-to-end load time remain unverified in the recorded performance report.

### 6.3 Data and measurement limitations

The training file has 200,000 source rows and one exact duplicate. The dashboard analyzes 199,999 rows after excluding that duplicate in memory. The separate test file has 100,000 rows and is not combined with training totals. The training file has 18,996 missing cells; missing measures remain null and are omitted from the relevant aggregation.

Sales and CO₂ totals sum supplied fields across analyzed records. The available source material does not establish whether the rows represent non-overlapping market-period observations, so the sums should be described as dataset aggregates rather than independently verified global market totals. Tableau Public also publishes the workbook extract publicly. The project owner confirmed checking the dataset terms and authorizing publication; this project review did not independently verify the dataset-specific license statement.

## 7 Results

### 7.1 Output screenshots and live views

The repository does not currently include captured image files of the final application screens. The public outputs can be reviewed at these links; capture the live screens separately if the course portal specifically requires screenshot attachments.

| Output | Link | What it contains |
|---|---|---|
| GitHub Pages project site | [Open the project website](https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/) | Public landing page with embedded Tableau views and project resources. |
| Tableau Dashboard 1 | [Open the published dashboard](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1) | Published EV market performance dashboard. |
| Tableau Story 2 | [Open the published story](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2) | Published narrative view with the project's story points. |
| GitHub source repository | [Browse the source repository](https://github.com/manmohansingh9562579-spec/ev-market-performance-insights) | Flask application, SQLite schema and queries, scripts, and documentation. |

### 7.2 Delivered scope

| Measure | Project evidence |
|---|---|
| Training rows analyzed | 199,999 after one exact duplicate is excluded. |
| Flask KPI cards | 7, covering annual sales, customer rating, manufacturers, CO₂ savings, models, range, and battery capacity. |
| Flask analytical views | 9, counted separately from Tableau worksheets. |
| Flask filters | 6, covering manufacturer, battery type, region, category, manufacturing country, and model-year range. |
| Flask insight sequence | 8 filter-responsive steps. |
| Tableau worksheets | 7 existing chart worksheets in the published workbook. |
| New named Tableau calculated fields | 0 in the refreshed copy; existing workbook aggregations were preserved. |

The corrected Tableau rating KPI displays 4.09/5, consistent with the profiled train-split mean of 4.088754 after rounding. This is a dataset rating average, not a rating of the project or a market-wide survey result.

## 8 Advantages and disadvantages

### Advantages

- The project provides both local Flask analysis and a separate public Tableau deliverable.
- SQLite supports the required SQL workflow without requiring a paid database account or a hosted database service.
- Viewers can filter by six fields and compare seven KPI cards with nine Flask analytical views.
- The data profile and methodology document duplicate handling, missing values, metric definitions, and aggregation limits.
- The public landing page links the dashboard, story, code, and supporting project evidence.

### Disadvantages and constraints

- The Flask dashboard and SQLite database are local; the public GitHub Pages site cannot run the Python backend.
- The published Tableau extract is a public copy and must be refreshed and republished when data changes.
- Missing source values affect the number of records used by individual measures.
- Browser rendering, mobile behavior, and production concurrency were not measured in the recorded performance report.
- The supplied row grain does not independently validate the sums as global market totals.

## 9 Conclusion

The project delivers a data preparation and SQLite workflow, an interactive local Flask dashboard, and a public Tableau dashboard and story connected through a GitHub Pages landing page. Its filters and narrative views help users inspect the available EV dataset, while the methodology and performance report state how the measures were created and what they can support.

The results should be interpreted within the scope of the supplied files. The training and test splits remain separate, the source CSV is not edited, and field sums are not represented as independently verified global market figures. The public site and Tableau views are available online; Flask and SQLite remain a local part of the project.

## 10 Future scope

- Capture and attach final desktop and mobile screenshots of the Flask dashboard and public views.
- Run the current fourteen-function test suite and record its exact result before final submission.
- Complete a manual desktop and mobile review and record browser-level page and chart timing.
- Refresh Tableau from the SQLite-prepared extract when a new dataset version is approved.
- Add a dated project schedule and primary-user research only if those activities are conducted and documented.
- Revisit the sales and CO₂ interpretations if a verified source definition for record grain becomes available.

## 11 Appendix

### Source code

[GitHub repository](https://github.com/manmohansingh9562579-spec/ev-market-performance-insights)

### Dataset

[Electric Vehicle Market Classification Dataset on Kaggle](https://www.kaggle.com/datasets/tharishreddy22/electric-vehicle-market-classification-dataset)

The inspected local files are ev_market_train.csv with 200,000 rows and ev_market_test.csv with 100,000 rows. Neither source CSV is included in the public repository. The project owner confirmed checking the dataset terms before publishing the Tableau extract; the license statement was not independently verified during this project review.

### Public project and Tableau links

- [GitHub Pages project website](https://manmohansingh9562579-spec.github.io/ev-market-performance-insights/)
- [Tableau Public profile](https://public.tableau.com/app/profile/man.mohan.singh3746/vizzes)
- [Tableau Public Dashboard 1](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1)
- [Tableau Public Story 2](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2)

### Supporting project documentation

- [Data profile](data_profile.md)
- [Methodology](methodology.md)
- [Database setup](database_setup.md)
- [SQL analysis queries](../sql/analysis_queries.sql)
- [Performance report](performance_report.md)
- [Tableau Public workflow](tableau_public_workflow.md)
- [Demonstration outline](demo_outline.md)
