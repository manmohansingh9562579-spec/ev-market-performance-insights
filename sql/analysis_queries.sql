-- Run against ev_market.sqlite and the ev_market_train table after import.
-- The vehicle_id primary key and importer's duplicate checks keep one row per ID.

-- 1. Total annual sales. Null annual_sales_units values are excluded by SUM.
SELECT SUM(annual_sales_units) AS total_annual_sales_units,
       COUNT(annual_sales_units) AS records_with_sales
FROM ev_market_train;

-- 2. Manufacturer ranking. Use LIMIT for a readable dashboard table.
SELECT manufacturer,
       SUM(annual_sales_units) AS annual_sales_units,
       COUNT(annual_sales_units) AS records_with_sales
FROM ev_market_train
WHERE manufacturer IS NOT NULL
GROUP BY manufacturer
ORDER BY annual_sales_units DESC
LIMIT 20;

-- 3. Sales by battery chemistry.
SELECT battery_type,
       SUM(annual_sales_units) AS annual_sales_units,
       COUNT(annual_sales_units) AS records_with_sales
FROM ev_market_train
WHERE battery_type IS NOT NULL
GROUP BY battery_type
ORDER BY annual_sales_units DESC;

-- 4. Sales by market region. Optional filter parameters can be bound by SQLAlchemy.
SELECT market_region,
       SUM(annual_sales_units) AS annual_sales_units,
       COUNT(annual_sales_units) AS records_with_sales
FROM ev_market_train
WHERE (:model_year_min IS NULL OR model_year >= :model_year_min)
  AND (:model_year_max IS NULL OR model_year <= :model_year_max)
GROUP BY market_region
ORDER BY annual_sales_units DESC;

-- 5. Sales by vehicle category.
SELECT category,
       SUM(annual_sales_units) AS annual_sales_units,
       COUNT(annual_sales_units) AS records_with_sales
FROM ev_market_train
WHERE category IS NOT NULL
GROUP BY category
ORDER BY annual_sales_units DESC;

-- 6. Customer rating analysis. AVG is unweighted across non-null record ratings.
SELECT category,
       AVG(customer_rating) AS average_customer_rating,
       COUNT(customer_rating) AS records_with_rating
FROM ev_market_train
WHERE category IS NOT NULL
GROUP BY category
ORDER BY average_customer_rating DESC;

-- 7. EV range analysis. Average the range field; do not sum kilometers.
SELECT category,
       AVG(range_km) AS average_range_km,
       MIN(range_km) AS minimum_range_km,
       MAX(range_km) AS maximum_range_km,
       COUNT(range_km) AS records_with_range
FROM ev_market_train
WHERE category IS NOT NULL
GROUP BY category
ORDER BY average_range_km DESC;

-- 8. Manufacturing-country comparison. This uses supplied country labels, not geocoding.
SELECT manufacturing_country,
       SUM(annual_sales_units) AS annual_sales_units,
       COUNT(DISTINCT vehicle_id) AS vehicle_records
FROM ev_market_train
WHERE manufacturing_country IS NOT NULL
GROUP BY manufacturing_country
ORDER BY annual_sales_units DESC;

-- 9. Energy efficiency. Lower average Wh/km indicates less energy use per kilometer.
SELECT category,
       AVG(efficiency_wh_per_km) AS average_wh_per_km,
       COUNT(efficiency_wh_per_km) AS records_with_efficiency
FROM ev_market_train
WHERE category IS NOT NULL
GROUP BY category
ORDER BY average_wh_per_km ASC;

-- 10. CO2 savings. This sums the dataset's per-record annual field.
SELECT SUM(co2_saved_tons_per_year) AS co2_saved_tons_per_year,
       COUNT(co2_saved_tons_per_year) AS records_with_co2_value
FROM ev_market_train;

-- 11. Filtered KPI example. Distinct manufacturer count is not a sales sum.
SELECT SUM(annual_sales_units) AS total_annual_sales_units,
       AVG(customer_rating) AS average_customer_rating,
       COUNT(DISTINCT manufacturer) AS manufacturer_count,
       SUM(co2_saved_tons_per_year) AS co2_saved_tons_per_year
FROM ev_market_train
WHERE (:manufacturer IS NULL OR manufacturer = :manufacturer)
  AND (:battery_type IS NULL OR battery_type = :battery_type)
  AND (:market_region IS NULL OR market_region = :market_region)
  AND (:category IS NULL OR category = :category)
  AND (:model_year_min IS NULL OR model_year >= :model_year_min)
  AND (:model_year_max IS NULL OR model_year <= :model_year_max);
