"""Repeatably import a CSV split into MySQL or local SQLite."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import Column, Index, Integer, MetaData, Numeric, String, Table, create_engine, delete, func, select

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app import configured_database_url, resolve_train_csv  # noqa: E402

TEXT_FIELDS = {
    "vehicle_id": 32,
    "model_name": 128,
    "manufacturer": 128,
    "manufacturing_country": 64,
    "market_region": 64,
    "category": 64,
    "battery_type": 64,
    "drivetrain": 32,
    "recommended_use_case": 128,
}
INTEGER_FIELDS = {
    "model_year",
    "num_motors",
    "num_charging_ports",
    "num_seats",
    "warranty_years",
    "safety_rating_stars",
    "autonomous_level",
}
DECIMAL_FIELDS = {
    "battery_capacity_kwh",
    "battery_cycle_life",
    "battery_degradation_pct_5yr",
    "range_km",
    "efficiency_wh_per_km",
    "motor_power_kw",
    "torque_nm",
    "top_speed_kmph",
    "acceleration_0_100_sec",
    "max_dc_charging_kw",
    "charging_dc_fast_time_min",
    "charging_ac_time_hr",
    "weight_kg",
    "cargo_capacity_liters",
    "price_usd",
    "insurance_cost_usd_yearly",
    "resale_value_pct_3yr",
    "infotainment_screen_inch",
    "co2_saved_tons_per_year",
    "annual_sales_units",
    "customer_rating",
}
EXPECTED_FIELDS = set(TEXT_FIELDS) | INTEGER_FIELDS | DECIMAL_FIELDS
INDEX_FIELDS = [
    "manufacturer",
    "battery_type",
    "market_region",
    "category",
    "model_year",
    "manufacturing_country",
]


def validate_table_name(name: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
        raise ValueError("Table name must contain only letters, digits, and underscores.")
    return name


def table_for(metadata: MetaData, name: str) -> Table:
    name = validate_table_name(name)
    columns = []
    for field in sorted(EXPECTED_FIELDS):
        if field in TEXT_FIELDS:
            type_ = String(TEXT_FIELDS[field])
        elif field in INTEGER_FIELDS:
            type_ = Integer()
        elif field == "customer_rating":
            type_ = Numeric(5, 2)
        elif field == "annual_sales_units":
            type_ = Numeric(16, 0)
        else:
            type_ = Numeric(14, 4)
        columns.append(Column(field, type_, primary_key=(field == "vehicle_id"), nullable=(field != "vehicle_id")))

    table = Table(name, metadata, *columns)
    for field in INDEX_FIELDS:
        Index(f"idx_{name}_{field}", table.c[field])
    Index(f"idx_{name}_region_year", table.c.market_region, table.c.model_year)
    return table


def clean_csv(path: Path) -> tuple[pd.DataFrame, int]:
    if not path.is_file():
        raise FileNotFoundError(f"CSV file not found: {path}")
    frame = pd.read_csv(path, low_memory=False, dtype={"vehicle_id": "string"})
    missing = sorted(EXPECTED_FIELDS.difference(frame.columns))
    extra = sorted(set(frame.columns).difference(EXPECTED_FIELDS))
    if missing or extra:
        details = []
        if missing:
            details.append("missing columns: " + ", ".join(missing))
        if extra:
            details.append("unexpected columns: " + ", ".join(extra))
        raise ValueError("CSV schema does not match the inspected dataset (" + "; ".join(details) + ").")
    if frame.empty:
        raise ValueError("CSV contains no data rows; refusing to clear or create an empty destination table.")
    exact_duplicates = int(frame.duplicated().sum())
    frame = frame.drop_duplicates().copy()
    missing_ids = int(frame["vehicle_id"].isna().sum())
    if missing_ids:
        raise ValueError(f"Cannot import {missing_ids:,} rows with a missing vehicle_id primary key.")
    repeated = frame["vehicle_id"].duplicated(keep=False)
    if repeated.any():
        ids = int(frame.loc[repeated, "vehicle_id"].nunique())
        raise ValueError(
            f"Found {ids:,} vehicle_id value(s) with conflicting rows after exact-duplicate removal. "
            "Resolve them before import; no rows were loaded."
        )
    return frame, exact_duplicates


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="CSV split to import; defaults to EV_TRAIN_CSV or the local training CSV.")
    parser.add_argument("--split", choices=("train", "test"), default="train")
    parser.add_argument("--table", help="Destination table; defaults to ev_market_<split>.")
    parser.add_argument("--database-url", help="SQLAlchemy URL; defaults to DATABASE_URL or DB_* environment variables.")
    parser.add_argument("--replace", action="store_true", help="Replace all rows in the destination table. Without this flag, a non-empty destination is protected.")
    args = parser.parse_args()

    if args.input:
        input_path = args.input.expanduser()
    elif args.split == "train":
        input_path = resolve_train_csv()
    else:
        train_path = resolve_train_csv()
        input_path = train_path.parent / "ev_market_test.csv" if train_path else None
    if input_path is None:
        parser.error("Could not resolve an input CSV; pass --input or set EV_TRAIN_CSV.")

    database_url = args.database_url or configured_database_url()
    if not database_url:
        parser.error("Configure DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME first.")
    table_name = validate_table_name(args.table or f"ev_market_{args.split}")

    try:
        frame, duplicates_removed = clean_csv(input_path)
        metadata = MetaData()
        table = table_for(metadata, table_name)
        engine = create_engine(database_url, pool_pre_ping=True)
        try:
            metadata.create_all(engine)
            with engine.connect() as connection:
                existing_rows = int(connection.execute(select(func.count()).select_from(table)).scalar_one())
            if existing_rows and not args.replace:
                raise ValueError(
                    f"Destination {table_name} already contains {existing_rows:,} rows. "
                    "Pass --replace to replace them deliberately."
                )
            with engine.begin() as connection:
                if args.replace:
                    connection.execute(delete(table))
                batch_size = 100 if engine.dialect.name == "sqlite" else 500
                frame.to_sql(table_name, connection, if_exists="append", index=False, chunksize=batch_size, method="multi")
        finally:
            engine.dispose()
    except Exception as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1

    print(f"Imported {len(frame):,} rows from {input_path.name} into {table_name}.")
    print(f"Removed {duplicates_removed:,} exact duplicate row(s); source CSV was not modified.")
    print("To repeat the import into a non-empty table, pass --replace explicitly.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
