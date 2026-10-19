# Performance test report

## Scope and counting rules

This report distinguishes the Flask dashboard from the preserved Tableau workbook. Chart counts are per deliverable and are not added together. A chart means one distinct analytical view on the page; KPI cards, filter controls, Story steps, and optional embedded Tableau views do not count as Flask charts.

The Flask dashboard has 9 distinct analytical views (7 Chart.js canvases and 2 Plotly views):
1. Sales by manufacturer (top 12, sum of annual sales units).
2. Battery technology mix (sum of annual sales units by battery type).
3. Sales by market region (sum).
4. Sales by vehicle category (sum).
5. Customer-rating treemap by category (tile area = non-missing rating records; color = mean rating).
6. Annual sales grouped by model year (sum).
7. Average range by category.
8. Manufacturing-country choropleth map (sum of annual sales units; ISO-3 boundaries) with a country table fallback for unmapped names or map-load failures.
9. Average energy use by category.

The refreshed Tableau workbook is a separate artifact with 7 existing chart worksheets, in addition to its dashboard and Stories. KPI cards, story scenes, and filters are not counted as charts. The Flask and Tableau counts are not summed.

## Amount of data

The source profile in docs/data_profile.md records both actual CSV splits:

| Source | Rows | Columns | File size |
|---|---:|---:|---:|
| ev_market_train.csv | 200,000 | 37 | 46,478,548 bytes (44.33 MiB) |
| ev_market_test.csv | 100,000 | 37 | 23,238,435 bytes (22.16 MiB) |
| Both files | 300,000 | 37 per file | 69,716,983 bytes (66.49 MiB) |

The Flask dashboard and its benchmark use only the training split. It removes one exact duplicate in memory, leaving 199,999 analyzed rows; the source CSV is not edited. It reports 18,996 missing cells across the raw training file. The exact field-level missing counts are listed in docs/data_profile.md.

## Field utilization

The Flask dashboard requires and uses 14 of the dataset's 37 columns:

vehicle_id, model_name, manufacturer, manufacturing_country, market_region, category, battery_type, model_year, annual_sales_units, battery_capacity_kwh, customer_rating, range_km, efficiency_wh_per_km, co2_saved_tons_per_year.

Calculation: 14 used fields / 37 source fields × 100 = 37.84%.

The 23 columns not used in Flask aggregations or filters are:

battery_cycle_life, battery_degradation_pct_5yr, motor_power_kw, torque_nm, num_motors, drivetrain, top_speed_kmph, acceleration_0_100_sec, max_dc_charging_kw, charging_dc_fast_time_min, charging_ac_time_hr, num_charging_ports, num_seats, weight_kg, cargo_capacity_liters, price_usd, insurance_cost_usd_yearly, warranty_years, resale_value_pct_3yr, safety_rating_stars, autonomous_level, infotainment_screen_inch, recommended_use_case.

The utilization percentage describes the Flask dashboard only. It is not a claim that every Tableau worksheet uses the same set of fields.

## Calculation and transformation counts

These categories are counted separately to avoid mixing formulas and source columns:

- 7 KPI calculations: sum of annual sales; unweighted mean customer rating; distinct manufacturer count; sum of the CO2-savings field; distinct model-name count; unweighted mean range; and unweighted mean battery capacity.
- 9 chart aggregation expressions: 6 sales sums by manufacturer, battery type, region, category, model year, and manufacturing country; and 3 unweighted means by category for rating, range, and Wh/km efficiency. Battery mix shows grouped sales as shares of the grouped sales total.
- 6 numeric source measures used by these aggregations: annual_sales_units, battery_capacity_kwh, customer_rating, range_km, efficiency_wh_per_km, co2_saved_tons_per_year.
- 3 data-preparation operations: remove exact duplicate rows in memory; coerce the six numeric measures and model_year to numeric values; exclude all rows for any vehicle_id with conflicting non-identical records. Missing values remain null and are skipped by the relevant aggregation.
- 0 new named Tableau calculated fields in the refreshed copy; the existing workbook's aggregation behavior is preserved.

KPI definitions and data-grain caveats are documented in docs/methodology.md.

## Measured Flask performance

Environment: Windows 11 build 10.0.26200, Python 3.14.2, pandas 3.0.2. Measurement timestamp: 2026-10-17 09:44:15 UTC.

Method: an in-process Flask test client loaded the real training CSV through the health endpoint, timed one first dashboard call, then timed 20 sequential warmed dashboard API calls. No TCP socket, browser, CDN, concurrent users, or production WSGI server was involved.

| Measurement | Result |
|---|---:|
| Training data load / health response | 1,465.877 ms |
| First dashboard API response | 260.409 ms |
| 20 warmed dashboard calls — minimum | 247.257 ms |
| Median | 253.895 ms |
| 95th percentile | 268.841 ms |
| Maximum | 276.799 ms |

The 20 dashboard calls returned HTTP 200. These are application test-client response times, not end-to-end page load or chart rendering times. Raw machine-readable results are in docs/performance_measurements.json.

## Correctness and behavior

A real-data filter check selected manufacturer AmpereAuto. Expected values were independently calculated from the deduplicated training frame and matched the API: 964 rows, annual sales sum 7,178,632, and average rating 4.09881981032666. The benchmark marked the comparison passed.

The current `tests/test_dashboard.py` contains 14 test functions covering KPI aggregations and deduplication, combined filters, sorting, invalid filters, country filtering, empty results, conflicting vehicle IDs, missing data, Tableau embed URL handling, Story embedding, presence of the map/treemap/eight-step Story/vehicle artwork in the page template, and repeatable SQLite import plus dashboard reads. Earlier project notes record successful runs of 13 tests; the current 14-test suite needs a fresh run before final submission. Test fixtures are synthetic and are not reported as dataset findings.

## Pending checks and limitations

- Browser visual rendering and responsive behavior could not be confirmed because local browser/TCP access was restricted in this environment. The CSS includes responsive breakpoints, but manual desktop/mobile inspection remains pending.
- Error, missing-data, and empty-data states have automated API/template coverage; manual browser interaction remains pending.
- The active workflow uses local SQLite. Separate remote-database query timings and query-plan checks are outside the required scope and are not claimed.
- Local HTTP benchmark and page-load timings are pending. The in-process numbers above cannot establish a user's browser load time.
- Concurrency, production deployment, network latency, CDN availability, and Tableau Public render time were not measured.
- Sales and CO2 sums are sums of supplied fields over unique records. The dataset documentation available here does not independently establish market-period grain or that those values represent non-overlapping global totals.
