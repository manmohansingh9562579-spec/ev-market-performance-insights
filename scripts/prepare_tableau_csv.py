"""Write an optional deduplicated Tableau-ready CSV without changing the source."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app import resolve_train_csv  # noqa: E402


def prepare(input_path: Path, output_path: Path, overwrite: bool = False) -> tuple[int, int, int]:
    if not input_path.is_file():
        raise FileNotFoundError(f"CSV file not found: {input_path}")
    frame = pd.read_csv(input_path, low_memory=False, dtype={"vehicle_id": "string"})
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
    if input_path.resolve() == output_path:
        raise ValueError("Output path must differ from the original source path.")
    if output_path.exists() and not overwrite:
        raise FileExistsError(f"Output already exists: {output_path}. Choose a new path or pass --overwrite explicitly.")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prepared.to_csv(output_path, index=False)
    return len(frame), len(prepared), exact_duplicates


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="Training CSV; defaults to EV_TRAIN_CSV or the local training CSV.")
    parser.add_argument("--output", type=Path, required=True, help="New CSV path; the source file is never overwritten.")
    parser.add_argument("--overwrite", action="store_true", help="Allow replacing the chosen output file if it already exists.")
    args = parser.parse_args()
    input_path = args.input.expanduser() if args.input else resolve_train_csv()
    if input_path is None:
        parser.error("Could not resolve the training CSV; pass --input or set EV_TRAIN_CSV.")
    try:
        raw_rows, prepared_rows, duplicates = prepare(input_path, args.output, overwrite=args.overwrite)
    except Exception as error:
        print(f"Preparation failed: {error}", file=sys.stderr)
        return 1
    print(f"Wrote {prepared_rows:,} rows from {raw_rows:,} source rows to {args.output.resolve()}.")
    print(f"Removed {duplicates:,} exact duplicate row(s). The original file was not modified.")
    print("To publish with Tableau Public, open this CSV in Tableau Desktop, create an extract, then save to Tableau Public.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
