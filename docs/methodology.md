# Methodology

## Source and split

The actual `ev_market_train.csv` and `ev_market_test.csv` found in the local download archive were inspected. The dashboard and the candidate KPI profile use only the training split. The test split is reported separately and is not concatenated into charts or totals.

## Data quality handling

1. Read the CSV without changing the source file.
2. Remove byte-equivalent duplicate rows in the application’s in-memory frame. The training CSV contains one exact duplicate row.
3. If a `vehicle_id` appears on multiple remaining, non-identical rows, exclude all rows for that conflicting ID from dashboard analysis and report the count. The inspected train data has no such conflict.
4. Coerce supported measures and `model_year` to numeric values; unparseable values become null.
5. Leave missing values null. Each aggregation uses its documented valid measure values; no zero imputation is applied.

The database importer is stricter because `vehicle_id` is a primary key: after removing exact duplicate rows, it stops before loading if IDs are missing or conflicting. This prevents ambiguous records from being silently inserted.

## Aggregation definitions

- Annual sales: `SUM(annual_sales_units)` across unique analyzed records; nulls skipped.
- Rating: unweighted `AVG(customer_rating)`; each record with a rating has equal weight.
- Manufacturer count: `COUNT(DISTINCT manufacturer)` in the filtered rows.
- Model count: `COUNT(DISTINCT model_name)` in the filtered rows.
- Average driving range: unweighted `AVG(range_km)`; range is not summed.
- Average battery capacity: unweighted `AVG(battery_capacity_kwh)`; capacity is not summed.
- CO₂ savings: `SUM(co2_saved_tons_per_year)` across unique analyzed records; nulls skipped.
- Sales charts: sum annual sales by manufacturer, battery type, market region, category, manufacturing country, or model year.
- Rating, range, and energy charts: unweighted average by vehicle category. Range is not summed. Lower Wh/km indicates lower energy use per distance.
- Battery mix: sales by battery type; the doughnut segments show each type's share of their displayed sales total.
- Country map: sales are grouped by the supplied manufacturing-country text, then common supported country labels are matched to ISO-3 boundary codes. A table fallback preserves the original labels for unmapped countries or if the map library/boundaries cannot load; the source coordinates are not inferred.
- The annual-sales trend groups the supplied `model_year` values. The source does not define this field as a sales-observation year, so the chart is labelled by model year.

Sales and CO₂ fields are described as dataset totals or candidate aggregates. The supplied document and data do not establish whether each row is a vehicle model, trim, or a market-period observation, or whether the CO₂ measure can be summed without overlap. Validate those definitions before presenting totals as externally validated market-wide metrics.

## Tableau calculations

The preserved workbook uses existing fields and aggregations; the enhanced copy does not introduce Tableau calculated-field formulas. Its available charts use the workbook’s existing extract. The dashboard filters were expanded in the copy to include category, market region, and model year. See [`tableau_public_workflow.md`](tableau_public_workflow.md) for the local/publishing workflow.
