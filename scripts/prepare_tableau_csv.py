"""Write an optional deduplicated Tableau-ready CSV without changing the source."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import MetaData, Table, create_engine, select

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app import (  # noqa: E402
    configured_database_url,
    database_connect_args,
    normalize_database_url,
    resolve_train_csv,
)


def validate_table_name(name: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
        raise ValueError("Table name must contain only letters, digits, and underscores.")
    return name


def read_database_table(database_url: str, table_name: str) -> pd.DataFrame:
    """Read the configured SQL table using a validated table identifier."""
    table_name = validate_table_name(table_name)
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        connect_args=database_connect_args(database_url),
    )
    try:
        metadata = MetaData()
        table = Table(table_name, metadata, autoload_with=engine)
        with engine.connect() as connection:
            return pd.read_sql(select(table), connection)
    finally:
        engine.dispose()


def prepare_frame(
    frame: pd.DataFrame,
    output_path: Path,
    overwrite: bool = False,
    source_path: Path | None = None,
) -> tuple[int, int, int]:
    if frame.empty:
        raise ValueError("Source contains no data rows; refusing to create an empty Tableau file.")
    exact_duplicates = int(frame.duplicated().sum())
    prepared = frame.drop_duplicates().copy()
    if "vehicle_id" in prepared:
        repeated = prepared["vehicle_id"].notna() & prepared["vehicle_id"].duplicated(keep=False)
        if repeated.any():
            repeated_ids = int(prepared.loc[repeated, "vehicle_id"].nunique())
            raise ValueError(
                f"Found {repeated_ids} repeated vehicle_id value(s) with conflicting rows. "
                "Resolve the ambiguity before preparing a Tableau file."
            )
    output_path = output_path.expanduser().resolve()
    if source_path is not None and source_path.resolve() == output_path:
        raise ValueError("Output path must differ from the original source path.")
    if output_path.exists() and not overwrite:
        raise FileExistsError(f"Output already exists: {output_path}. Choose a new path or pass --overwrite explicitly.")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prepared.to_csv(output_path, index=False)
    return len(frame), len(prepared), exact_duplicates


def prepare(input_path: Path, output_path: Path, overwrite: bool = False) -> tuple[int, int, int]:
    if not input_path.is_file():
        raise FileNotFoundError(f"CSV file not found: {input_path}")
    frame = pd.read_csv(input_path, low_memory=False, dtype={"vehicle_id": "string"})
    return prepare_frame(frame, output_path, overwrite=overwrite, source_path=input_path)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--input", type=Path, help="Training CSV; defaults to EV_TRAIN_CSV or the local training CSV.")
    source.add_argument("--from-database", action="store_true", help="Read the configured SQL table instead of a CSV.")
    parser.add_argument("--database-url", help="SQLite URL; defaults to DATABASE_URL (sqlite:///ev_market.sqlite).")
    parser.add_argument("--table", default=None, help="SQL source table; defaults to EV_TABLE_NAME or ev_market_train.")
    parser.add_argument("--output", type=Path, required=True, help="New CSV path; the source file is never overwritten.")
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing the chosen output file if it already exists.")
    args = parser.parse_args()
    try:
        if args.from_database:
            database_url = normalize_database_url(args.database_url) or configured_database_url()
            if not database_url:
                raise ValueError("Set DATABASE_URL=sqlite:///ev_market.sqlite in .env or pass a SQLite --database-url.")
            table_name = args.table or os.getenv("EV_TABLE_NAME", "ev_market_train")
            frame = read_database_table(database_url, table_name)
            raw_rows, prepared_rows, duplicates = prepare_frame(frame, args.output, overwrite=args.overwrite)
            source_label = f"table {validate_table_name(table_name)}"
        else:
            if args.database_url or args.table:
                raise ValueError("Use --database-url and --table only with --from-database.")
            input_path = args.input.expanduser() if args.input else resolve_train_csv()
            if input_path is None:
                raise ValueError("Could not resolve the training CSV; pass --input or set EV_TRAIN_CSV.")
            raw_rows, prepared_rows, duplicates = prepare(input_path, args.output, overwrite=args.overwrite)
            source_label = input_path.name
    except Exception as error:
        print(f"Preparation failed: {error}", file=sys.stderr)
        return 1
    print(f"Wrote {prepared_rows:,} rows from {raw_rows:,} source rows in {source_label} to {args.output.resolve()}.")
    print(f"Removed {duplicates:,} exact duplicate row(s). The source was not modified.")
    print("To publish with Tableau Public, open this CSV in Tableau Desktop, create an extract, then save to Tableau Public.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
