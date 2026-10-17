# Project report

## Overview

This project provides two deliverables for EV market exploration: a responsive Flask analytics application and a preserved/enhanced Tableau packaged workbook. The Flask app is independently usable and can optionally show a published Tableau view when a valid Tableau Public URL is supplied.

## Dataset findings

The actual local files contain 200,000 training rows and 100,000 test rows, with 37 columns in each split. Training size is 46,478,548 bytes; test size is 23,238,435 bytes. The splits have matching schemas and no overlapping vehicle IDs. Train has one exact duplicate row; test has none. Missingness is concentrated in five fields and about 0.257% of all cells in each split. See [`data_profile.md`](data_profile.md) for every field, inferred type, and missing count.

The training data contains 200 manufacturers, 10 manufacturing-country labels, 7 market regions, 15 categories, and 5 battery types. Candidate train aggregates after exact deduplication include 1,550,694,926 annual sales units, a 4.088754 mean rating, and 737,925.127 annual CO₂-savings field units. These are calculations over the dataset fields, not independent proof of global-market totals; see the row-grain caveat in the methodology.

## Product behavior

The Flask UI has four KPI cards, eight charts, five filter dimensions (including a model-year range), a story/insights sequence, methodology notes, and responsive CSS layouts. Data is loaded from the CSV by default or from SQLAlchemy when a database URL is configured. The app never falls back silently from a failed configured database to a different source.

The Tableau packaged workbook is a separate deliverable. The refreshed handoff copy preserves seven chart sheets, its dashboard, and both Stories, and uses one embedded Hyper extract created from the deduplicated 199,999-row CSV. The two original `.twb` workbooks and older package versions were not overwritten. The workbook is published at [Tableau Public](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/ManufacturerSales). The dataset owner confirmed checking the dataset terms and authorizing publication; the assistant could not independently read Kaggle's dataset-specific license statement.

## Limitations and next operational steps

- MySQL server connectivity, schema execution, CSV import, and SQL timing remain pending.
- The Flask embed reads `TABLEAU_PUBLIC_URL` from the local `.env`; set it to the published Tableau Public link and restart Flask to show the view. The app keeps its local charts when the URL is unset.
- Local HTTP/browser access was unavailable for this measurement environment; web-rendering and viewport verification remain pending.
- The test suite uses synthetic rows to verify calculation logic and SQLite import, while actual-data checks separately compare filtered results against a pandas aggregate.
- The dataset owner confirmed checking licensing before publication. Metric grain and field definitions still need to be interpreted with care before presenting totals as externally validated market totals.

## Suggested presentation sequence

1. State the data scope and train/test split.
2. Explain deduplication, null handling, and aggregation semantics.
3. Show the KPI summary and sales distribution by manufacturer, battery, region, category, and country.
4. Compare rating, range, and Wh/km averages.
5. Apply filters to demonstrate how KPIs and charts recompute.
6. Explain limitations, measured performance scope, and show the published Tableau Public view.
