-- MySQL 8+ schema for the inspected 37-column dataset.
-- The importer removes exact duplicate rows before inserting. vehicle_id is the primary key.
CREATE DATABASE IF NOT EXISTS ev_market CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ev_market;

CREATE TABLE IF NOT EXISTS ev_market_train (
    vehicle_id VARCHAR(32) NOT NULL,
    model_name VARCHAR(128) NULL,
    manufacturer VARCHAR(128) NULL,
    model_year SMALLINT NULL,
    manufacturing_country VARCHAR(64) NULL,
    market_region VARCHAR(64) NULL,
    category VARCHAR(64) NULL,
    battery_capacity_kwh DECIMAL(12, 4) NULL,
    battery_type VARCHAR(64) NULL,
    battery_cycle_life DECIMAL(14, 4) NULL,
    battery_degradation_pct_5yr DECIMAL(10, 4) NULL,
    range_km DECIMAL(12, 4) NULL,
    efficiency_wh_per_km DECIMAL(12, 4) NULL,
    motor_power_kw DECIMAL(12, 4) NULL,
    torque_nm DECIMAL(14, 4) NULL,
    num_motors TINYINT UNSIGNED NULL,
    drivetrain VARCHAR(32) NULL,
    top_speed_kmph DECIMAL(10, 4) NULL,
    acceleration_0_100_sec DECIMAL(10, 4) NULL,
    max_dc_charging_kw DECIMAL(12, 4) NULL,
    charging_dc_fast_time_min DECIMAL(12, 4) NULL,
    charging_ac_time_hr DECIMAL(12, 4) NULL,
    num_charging_ports TINYINT UNSIGNED NULL,
    num_seats TINYINT UNSIGNED NULL,
    weight_kg DECIMAL(14, 4) NULL,
    cargo_capacity_liters DECIMAL(14, 4) NULL,
    price_usd DECIMAL(14, 2) NULL,
    insurance_cost_usd_yearly DECIMAL(14, 2) NULL,
    warranty_years TINYINT UNSIGNED NULL,
    resale_value_pct_3yr DECIMAL(10, 4) NULL,
    safety_rating_stars TINYINT UNSIGNED NULL,
    autonomous_level TINYINT UNSIGNED NULL,
    infotainment_screen_inch DECIMAL(8, 4) NULL,
    co2_saved_tons_per_year DECIMAL(14, 4) NULL,
    annual_sales_units DECIMAL(16, 0) NULL,
    customer_rating DECIMAL(5, 2) NULL,
    recommended_use_case VARCHAR(128) NULL,
    PRIMARY KEY (vehicle_id),
    INDEX idx_train_manufacturer (manufacturer),
    INDEX idx_train_battery_type (battery_type),
    INDEX idx_train_market_region (market_region),
    INDEX idx_train_category (category),
    INDEX idx_train_model_year (model_year),
    INDEX idx_train_manufacturing_country (manufacturing_country),
    INDEX idx_train_region_year (market_region, model_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ev_market_test LIKE ev_market_train;

-- Indexes support the dashboard's equality/range filters and country comparison.
-- Reassess them against production query plans and write workload before adding more.
