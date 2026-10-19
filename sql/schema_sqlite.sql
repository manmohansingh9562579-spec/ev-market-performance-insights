-- SQLite schema for the active local project workflow.
-- The importer validates the CSV and creates this table/index set automatically.
-- vehicle_id is the stable primary key; test data stays in a separate table/file.

CREATE TABLE IF NOT EXISTS ev_market_train (
    vehicle_id TEXT NOT NULL PRIMARY KEY,
    model_name TEXT,
    manufacturer TEXT,
    model_year INTEGER,
    manufacturing_country TEXT,
    market_region TEXT,
    category TEXT,
    battery_capacity_kwh NUMERIC,
    battery_type TEXT,
    battery_cycle_life NUMERIC,
    battery_degradation_pct_5yr NUMERIC,
    range_km NUMERIC,
    efficiency_wh_per_km NUMERIC,
    motor_power_kw NUMERIC,
    torque_nm NUMERIC,
    num_motors INTEGER,
    drivetrain TEXT,
    top_speed_kmph NUMERIC,
    acceleration_0_100_sec NUMERIC,
    max_dc_charging_kw NUMERIC,
    charging_dc_fast_time_min NUMERIC,
    charging_ac_time_hr NUMERIC,
    num_charging_ports INTEGER,
    num_seats INTEGER,
    weight_kg NUMERIC,
    cargo_capacity_liters NUMERIC,
    price_usd NUMERIC,
    insurance_cost_usd_yearly NUMERIC,
    warranty_years INTEGER,
    resale_value_pct_3yr NUMERIC,
    safety_rating_stars INTEGER,
    autonomous_level INTEGER,
    infotainment_screen_inch NUMERIC,
    co2_saved_tons_per_year NUMERIC,
    annual_sales_units NUMERIC,
    customer_rating NUMERIC,
    recommended_use_case TEXT
);

CREATE INDEX IF NOT EXISTS idx_train_manufacturer ON ev_market_train (manufacturer);
CREATE INDEX IF NOT EXISTS idx_train_battery_type ON ev_market_train (battery_type);
CREATE INDEX IF NOT EXISTS idx_train_market_region ON ev_market_train (market_region);
CREATE INDEX IF NOT EXISTS idx_train_category ON ev_market_train (category);
CREATE INDEX IF NOT EXISTS idx_train_model_year ON ev_market_train (model_year);
CREATE INDEX IF NOT EXISTS idx_train_manufacturing_country ON ev_market_train (manufacturing_country);
CREATE INDEX IF NOT EXISTS idx_train_region_year ON ev_market_train (market_region, model_year);
