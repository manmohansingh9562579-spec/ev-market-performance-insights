# Performance and acceptance report

## Environment and method

- Measured: 2026-10-17 (UTC timestamp in benchmark output).
- OS: Windows 11 build 10.0.26200; Python 3.14.2; pandas 3.0.2.
- Data backend: actual training CSV from the local download archive.
- Repeatable command: `python scripts/benchmark_inprocess.py`.
- Machine-readable measurements: [`performance_measurements.json`](performance_measurements.json).
- The benchmark used Flask's in-process test client. It measured data loading through `/api/health`, recorded the first dashboard request separately, then timed 20 sequential warmed `/api/dashboard` calls. It also checked one filtered result against direct pandas calculations.
- It does not measure TCP/HTTP, browser rendering, CDN fetch, concurrent users, or production server throughput. The separate socket benchmark and browser preview could not reach the local server in this environment; those results are pending, not inferred from in-process timings.

## Amount of data

| Split | CSV rows | Fields | CSV size | Missing cells | Exact duplicate rows |
|---|---:|---:|---:|---:|---:|
| Train | 200,000 | 37 | 46,478,548 bytes | 18,996 (0.2567%) | 1 |
| Test | 100,000 | 37 | 23,238,435 bytes | 9,511 (0.2571%) | 0 |

The train dashboard removes the one exact duplicate, yielding 199,999 analyzed rows. No conflicting vehicle IDs were found in the train split; there were no missing IDs or negative sales rows. The test split has no vehicle IDs overlapping the train split. The full per-field profile is in [`data_profile.md`](data_profile.md).

Across both split files, that is 300,000 source rows and 69,716,983 bytes (about 66.49 MiB) across matching 37-column schemas. The dashboard does not combine the splits.

## Data utilization

The Flask dashboard uses **12 of 37 fields = 32.43%**. Calculation: `12 / 37 × 100`, rounded to two decimals. `vehicle_id` is counted because it is required to deduplicate and prevent double counting; the other 11 fields are displayed or aggregated.

**Fields used:** `vehicle_id`, `manufacturer`, `manufacturing_country`, `market_region`, `category`, `battery_type`, `model_year`, `annual_sales_units`, `customer_rating`, `range_km`, `efficiency_wh_per_km`, `co2_saved_tons_per_year`.

**Fields unused by the Flask dashboard (25):** `model_name`, `battery_capacity_kwh`, `battery_cycle_life`, `battery_degradation_pct_5yr`, `motor_power_kw`, `torque_nm`, `num_motors`, `drivetrain`, `top_speed_kmph`, `acceleration_0_100_sec`, `max_dc_charging_kw`, `charging_dc_fast_time_min`, `charging_ac_time_hr`, `num_charging_ports`, `num_seats`, `weight_kg`, `cargo_capacity_liters`, `price_usd`, `insurance_cost_usd_yearly`, `warranty_years`, `resale_value_pct_3yr`, `safety_rating_stars`, `autonomous_level`, `infotainment_screen_inch`, `recommended_use_case`.

Tableau workbook count is separate: **9 of 37 = 24.32%**, counting the distinct fields used by its existing sheets/dashboard. The clean local Tableau package uses a Hyper extract created from the 199,999-row deduplicated training CSV. Tableau calculation inventory: zero calculated-field formulas, three distinct field/aggregation pairs (`SUM(annual_sales_units)`, `AVG(customer_rating)`, `AVG(range_km)`), and seven measure placements across chart sheets. This is not added to Flask's field-use percentage.

## Calculations, measures, and transformations

Counting rule for the Flask implementation:

- **Calculated fields:** 0 named/persisted calculated fields are created.
- **KPI calculations:** 4 definitions: annual-sales sum, unweighted average rating, distinct manufacturer count, and CO₂ field sum.
- **Chart aggregation definitions:** 8 chart outputs: five sales sums (manufacturer, battery, region, category, country) and three category means (rating, range, Wh/km).
- **Source measures:** 5 distinct numeric measures used: `annual_sales_units`, `customer_rating`, `range_km`, `efficiency_wh_per_km`, and `co2_saved_tons_per_year`.
- **Data-preparation transformations:** 3 conceptual operations: remove exact duplicate rows; detect and exclude conflicting vehicle IDs in dashboard analysis (none occurred in actual train); coerce numeric measures/model year and leave invalid values null. The importer rejects ambiguous/missing IDs instead of excluding them.

KPI definitions are not summed into chart-aggregation counts: the count is split by purpose to avoid inflating a single opaque “calculation” number. Nulls are ignored by sum/mean; manufacturer count is distinct, not a sum.

## Visualization count

The Flask UI contains **8 chart visualizations**, counted as eight unique chart `<canvas>` elements: manufacturer sales, battery sales, region sales, category sales, country sales, rating by category, range by category, and efficiency by category. KPI cards, filter controls, insights text, and the conditional Tableau embed are not counted as charts.

The Tableau packaged workbook has **7 chart worksheet visualizations**, counted as distinct existing chart sheets; filter controls, dashboard containers, and Story points are not extra charts. The workbook also preserves the dashboard and two Stories.

## Timings and correctness

| Measurement | Result | Method / limitation |
|---|---:|---|
| Data load response | 1,402.079 ms | First in-process GET `/api/health`, which loads and profiles the actual 200,000-row CSV |
| First dashboard response | 199.395 ms | First in-process GET `/api/dashboard`, reported separately |
| 20 warmed dashboard responses | min 200.305 ms; median 204.499 ms; p95 207.561 ms; max 208.811 ms | Sequential Flask test-client requests in one process; no socket/browser/CDN |
| Actual manufacturer-filter correctness | Passed | `AmpereAuto`: expected and returned 964 rows; expected and returned sales 7,178,632; rating matched at 4.09881981032666 |
| Automated tests | 10/10 passed | Synthetic test fixtures, SQLite import/read integration, and Tableau embed URL behavior; not Kaggle result data |
| SQL query performance | Pending | No MySQL installation/configuration or database URL was available. `scripts/benchmark_sql.py` emits a pending status instead of claiming timings. |
| Local HTTP response timing | Pending | Local socket access was denied/timed out; `scripts/benchmark_dashboard.py --runs 20` cannot connect from this environment. |
| Browser load / mobile and desktop visual behavior | Pending | CUA browser could not open the local server URL. CSS breakpoints are implemented, but no browser viewport timing or visual pass is claimed. |

The filtered actual-data check uses the loaded, deduplicated frame and compares the dashboard endpoint result with independently computed pandas subset sales and rating. Unit tests also cover filter changes, invalid filters, valid filters with empty results, sorting/insight consistency, missing source, conflicting IDs, and SQLite read/import behavior.

## Response-time limitations and interpretation

The in-process timing excludes HTTP server/socket overhead, template rendering after route delivery, client-side chart rendering, CDN/Google Fonts downloads, and external network latency. One sequential local client is not a load or concurrency test. The timings describe this specific Windows/Python/pandas environment and should not be presented as production guarantees or measured improvements.
