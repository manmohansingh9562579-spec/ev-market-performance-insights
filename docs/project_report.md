# Project report

## Overview

The project has two separate deliverables: a responsive Flask dashboard and a Tableau packaged workbook with a published Dashboard and Story. Flask is usable on its own and can optionally embed the Tableau Public Dashboard and Story. Flask is not a replacement for the required Tableau workbook or its public submission.

## Dataset and evidence

The available Kaggle source files contain 200,000 training rows and 100,000 test rows, each with 37 columns. Their sizes are 46,478,548 and 23,238,435 bytes. The web dashboard uses the training split only. It removes one exact duplicate in memory, leaving 199,999 rows. The test split is reported separately and is not combined into dashboard totals.

The training data contains 200 manufacturer labels, 10 manufacturing-country labels, 7 market-region labels, 15 categories, and 5 battery-type labels. In the deduplicated training frame, annual_sales_units sums to 1,550,694,926, customer_rating averages 4.088754, and co2_saved_tons_per_year sums to 737,925.127. These are arithmetic summaries of the dataset fields, not independently validated global market totals. See docs/data_profile.md and docs/methodology.md for the row-grain caveat.

## Dashboard and analysis

The Flask dashboard provides 7 KPIs: annual sales sum, average rating, distinct manufacturers, CO2 savings sum, distinct model names, average range, and average battery capacity. It renders 9 charts for manufacturer and battery mix, region, category, customer-rating treemap, model-year sales, range, manufacturing-country choropleth map and energy efficiency. Six filters include manufacturer, battery type, region, category, manufacturing country and model-year range; sales charts can be sorted. The Story section has eight live, filter-responsive steps and the hero includes unbranded, dimensional EV and battery concept artwork.

All metrics are recomputed for the active filters. Counts use distinct names, sales and CO2 are sums of non-null supplied values, and ratings/range/capacity/efficiency are unweighted means. The training data includes missing values; no zero imputation is used. Exact duplicate records are excluded. Conflicting non-identical vehicle IDs would be excluded as a group.

## Tableau deliverable

The current Tableau Public workbook, `EV_Market_Performance_Rating_Corrected`, contains the seven chart worksheets, dashboard and two Stories, with the prepared 199,999-row extract. Its overlap pass clarifies long labels and uses filled green country shapes on the manufacturing map; the rating card is corrected to 4.09/5. The published [Dashboard 1](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Dashboard1) and [Story 2](https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Rating_Corrected/Story2) are public. The older duplicate views were removed from the profile. The owner confirmed checking the dataset terms and authorizing publication. The assistant could not independently read the Kaggle-specific license statement.

## Implementation and test evidence

Source files are in app.py, templates/, public/static/, sql/, scripts/, tests/ and docs/. The required database workflow uses SQLite, with SQL schema/analysis queries and a repeatable importer. No cloud database provider is part of the submission plan. The current `tests/test_dashboard.py` contains 14 test functions; earlier project notes record successful runs of 12 or 13 tests, so run the current suite before final submission. A measured in-process Flask benchmark records source load and response times; it does not measure browser render time.

## Limits and remaining submission actions

- Separate remote-database connectivity and query performance are not required by the project guidance; no remote database results are claimed.
- Local HTTP/browser access was restricted during the performance run, so manual desktop/mobile rendering and end-to-end load time remain pending.
- Sales and CO2 sums use the dataset's supplied row values. The source context does not establish whether those rows represent non-overlapping market-period observations, so don't present them as externally validated market totals.
- The owner still needs to record the requested 5–7 minute end-to-end explanation video using docs/demo_outline.md.
