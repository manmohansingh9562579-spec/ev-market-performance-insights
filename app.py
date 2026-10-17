"""Flask dashboard for the Electric Vehicle Market Classification Dataset."""

from __future__ import annotations

import logging
import os
import re
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote_plus, urlparse

import pandas as pd
from flask import Flask, jsonify, render_template, request
from sqlalchemy import create_engine, text

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # Environment variables can also be set by the shell/service.
    pass

LOG = logging.getLogger(__name__)

REQUIRED_FIELDS = {
    "vehicle_id",
    "model_name",
    "manufacturer",
    "manufacturing_country",
    "market_region",
    "category",
    "battery_type",
    "model_year",
    "annual_sales_units",
    "battery_capacity_kwh",
    "customer_rating",
    "range_km",
    "efficiency_wh_per_km",
    "co2_saved_tons_per_year",
}

ANALYTIC_FIELDS = [
    "vehicle_id",
    "model_name",
    "manufacturer",
    "manufacturing_country",
    "market_region",
    "category",
    "battery_type",
    "model_year",
    "annual_sales_units",
    "battery_capacity_kwh",
    "customer_rating",
    "range_km",
    "efficiency_wh_per_km",
    "co2_saved_tons_per_year",
]

FILTER_FIELDS = {
    "manufacturer": "manufacturer",
    "battery_type": "battery_type",
    "region": "market_region",
    "category": "category",
    "country": "manufacturing_country",
}

MEASURE_FIELDS = [
    "annual_sales_units",
    "battery_capacity_kwh",
    "customer_rating",
    "range_km",
    "efficiency_wh_per_km",
    "co2_saved_tons_per_year",
]


class DataUnavailable(RuntimeError):
    """Raised when a configured source cannot provide a usable dataset."""


def configured_database_url(environ: dict[str, str] | None = None) -> str | None:
    """Read a connection URL or construct one from environment-only credentials."""
    env = environ if environ is not None else os.environ
    direct_url = env.get("DATABASE_URL", "").strip()
    if direct_url:
        return direct_url

    host = env.get("DB_HOST", "").strip()
    user = env.get("DB_USER", "").strip()
    database = env.get("DB_NAME", "").strip()
    if not (host and user and database):
        return None

    port = env.get("DB_PORT", "3306").strip() or "3306"
    password = quote_plus(env.get("DB_PASSWORD", ""))
    username = quote_plus(user)
    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"


def allowed_table_name(value: str) -> str:
    """Validate the configured table identifier before interpolating it in SQL."""
    name = value.strip()
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", name):
        raise ValueError("Table name must contain only letters, digits, and underscores.")
    return name


def resolve_train_csv(path_value: str | None = None) -> Path | None:
    """Find the train CSV without copying it into the project."""
    if path_value:
        return Path(path_value).expanduser()

    project_root = Path(__file__).resolve().parent
    candidates = [
        Path.home() / "Downloads" / "archive" / "ev_market_train.csv",
        project_root / "data" / "ev_market_train.csv",
        project_root / "ev_market_train.csv",
    ]
    return next((candidate for candidate in candidates if candidate.is_file()), candidates[0])


class DashboardData:
    """Loads, validates, deduplicates, filters, and aggregates EV records."""

    def __init__(
        self,
        train_csv: str | Path | None = None,
        database_url: str | None = None,
        table_name: str = "ev_market_train",
    ) -> None:
        self.train_csv = resolve_train_csv(str(train_csv) if train_csv else os.getenv("EV_TRAIN_CSV"))
        self.database_url = database_url if database_url is not None else configured_database_url()
        self.table_name = allowed_table_name(table_name)
        self.backend = "mysql/sqlalchemy" if self.database_url else "csv"
        self._frame: pd.DataFrame | None = None
        self._status: dict[str, Any] = {
            "state": "not_loaded",
            "message": "Dataset has not been loaded yet.",
            "backend": self.backend,
        }
        self._data_quality: dict[str, Any] = {}

    @property
    def frame(self) -> pd.DataFrame:
        self.load()
        if self._frame is None:
            raise DataUnavailable(self._status["message"])
        return self._frame

    def load(self, force: bool = False) -> dict[str, Any]:
        if self._frame is not None and not force:
            return self._status

        try:
            if self.database_url:
                source_frame = self._read_database()
                source_path = None
            else:
                path = self.train_csv
                if path is None or not path.is_file():
                    self._frame = None
                    self.backend = "csv"
                    self._status = {
                        "state": "missing",
                        "message": "Training CSV was not found. Set EV_TRAIN_CSV or follow the data-loading steps in README.md.",
                        "backend": "csv",
                        "expected_path": str(path) if path else None,
                    }
                    return self._status
                source_frame = pd.read_csv(path, low_memory=False)
                source_path = path

            missing_fields = sorted(REQUIRED_FIELDS.difference(source_frame.columns))
            if missing_fields:
                raise ValueError("Source is missing required columns: " + ", ".join(missing_fields))
            if source_frame.empty:
                self._frame = source_frame.copy()
                self._status = {
                    "state": "empty",
                    "message": "The configured source contains no data rows.",
                    "backend": self.backend,
                    "source": str(source_path) if source_path else self.table_name,
                }
                return self._status

            raw_rows = int(len(source_frame))
            missing_cells = int(source_frame.isna().sum().sum())
            missing_by_field = {
                str(name): int(count)
                for name, count in source_frame.isna().sum().items()
                if int(count) > 0
            }
            exact_duplicates = int(source_frame.duplicated().sum())
            cleaned = source_frame.drop_duplicates().copy()
            duplicate_id_mask = cleaned["vehicle_id"].notna() & cleaned["vehicle_id"].duplicated(keep=False)
            conflicting_id_values = 0
            conflicting_id_rows = 0
            if duplicate_id_mask.any():
                duplicate_ids = cleaned.loc[duplicate_id_mask, "vehicle_id"].unique()
                conflicting_ids: list[Any] = []
                for vehicle_id in duplicate_ids:
                    rows = cleaned.loc[cleaned["vehicle_id"].eq(vehicle_id)]
                    if len(rows.drop_duplicates()) > 1:
                        conflicting_ids.append(vehicle_id)
                if conflicting_ids:
                    conflict_mask = cleaned["vehicle_id"].isin(conflicting_ids)
                    conflicting_id_values = len(conflicting_ids)
                    conflicting_id_rows = int(conflict_mask.sum())
                    cleaned = cleaned.loc[~conflict_mask].copy()

            for field in MEASURE_FIELDS:
                if field in cleaned.columns:
                    cleaned[field] = pd.to_numeric(cleaned[field], errors="coerce")
            cleaned["model_year"] = pd.to_numeric(cleaned["model_year"], errors="coerce")

            invalid_rating_count = int(
                (
                    cleaned["customer_rating"].notna()
                    & ~cleaned["customer_rating"].between(1, 5)
                ).sum()
            )
            invalid_sales_count = int(
                (cleaned["annual_sales_units"].notna() & cleaned["annual_sales_units"].lt(0)).sum()
            )
            missing_ids = int(cleaned["vehicle_id"].isna().sum())
            field_count = int(source_frame.shape[1])
            source_size = source_path.stat().st_size if source_path else None

            self._frame = cleaned.reset_index(drop=True)
            self._data_quality = {
                "raw_rows": raw_rows,
                "rows_after_exact_deduplication": raw_rows - exact_duplicates,
                "rows_analyzed": int(len(cleaned)),
                "columns": field_count,
                "missing_cells": missing_cells,
                "missing_by_field": missing_by_field,
                "exact_duplicate_rows_removed": exact_duplicates,
                "conflicting_vehicle_ids_excluded": conflicting_id_values,
                "conflicting_vehicle_rows_excluded": conflicting_id_rows,
                "missing_vehicle_id_rows": missing_ids,
                "invalid_rating_rows": invalid_rating_count,
                "negative_sales_rows": invalid_sales_count,
                "source_size_bytes": source_size,
                "unique_manufacturers": int(cleaned["manufacturer"].nunique(dropna=True)),
                "country_count": int(cleaned["manufacturing_country"].nunique(dropna=True)),
                "train_split_only": self.backend == "csv",
            }
            self.backend = "database" if source_path is None else "csv"
            warnings: list[str] = []
            if exact_duplicates:
                warnings.append(f"Removed {exact_duplicates:,} exact duplicate row(s) before aggregation.")
            if conflicting_id_values:
                warnings.append(
                    f"Excluded {conflicting_id_rows:,} row(s) from {conflicting_id_values:,} conflicting vehicle ID(s)."
                )
            if missing_ids:
                warnings.append(f"{missing_ids:,} row(s) have no vehicle_id and cannot be deduplicated by ID.")
            self._status = {
                "state": "ready" if len(cleaned) else "empty",
                "message": "Dataset loaded successfully." if len(cleaned) else "No analyzable rows remain after data-quality checks.",
                "backend": self.backend,
                "source": str(source_path) if source_path else self.table_name,
                "warnings": warnings,
                "data_quality": self._data_quality,
            }
        except Exception as error:  # Keep the page usable and expose a clear error state.
            LOG.exception("EV dataset loading failed")
            self._frame = None
            self._status = {
                "state": "error",
                "message": str(error),
                "backend": self.backend,
            }
        return self._status

    def _read_database(self) -> pd.DataFrame:
        table_name = allowed_table_name(self.table_name)
        engine = create_engine(self.database_url or "", pool_pre_ping=True)
        try:
            with engine.connect() as connection:
                return pd.read_sql_query(text(f"SELECT * FROM {table_name}"), connection)
        finally:
            engine.dispose()

    def status(self) -> dict[str, Any]:
        self.load()
        return self._status

    def _filter_options(self) -> dict[str, Any]:
        data = self.frame
        options: dict[str, Any] = {}
        for key, field in FILTER_FIELDS.items():
            options[key] = sorted(str(value) for value in data[field].dropna().unique())
        years = data["model_year"].dropna()
        options["model_year"] = {
            "min": int(years.min()) if not years.empty else None,
            "max": int(years.max()) if not years.empty else None,
            "values": sorted(int(value) for value in years.unique()),
        }
        return options

    def _filter_frame(self, parameters: Any) -> pd.DataFrame:
        data = self.frame
        options = self._filter_options()
        filtered = data
        for query_key, field in FILTER_FIELDS.items():
            value = parameters.get(query_key, "").strip()
            if value:
                if value not in options[query_key]:
                    raise ValueError(f"Unknown {query_key} filter value: {value}")
                filtered = filtered.loc[filtered[field].astype("string").eq(value)]

        years = options["model_year"]
        minimum = parameters.get("model_year_min", "").strip()
        maximum = parameters.get("model_year_max", "").strip()
        try:
            min_year = int(minimum) if minimum else years["min"]
            max_year = int(maximum) if maximum else years["max"]
        except ValueError as error:
            raise ValueError("Model Year filters must be whole years.") from error
        if min_year is not None and min_year not in years["values"]:
            raise ValueError(f"Unknown Model Year lower bound: {min_year}")
        if max_year is not None and max_year not in years["values"]:
            raise ValueError(f"Unknown Model Year upper bound: {max_year}")
        if min_year is not None and max_year is not None and min_year > max_year:
            raise ValueError("Model Year lower bound cannot exceed its upper bound.")
        if min_year is not None:
            filtered = filtered.loc[filtered["model_year"].ge(min_year)]
        if max_year is not None:
            filtered = filtered.loc[filtered["model_year"].le(max_year)]
        return filtered

    @staticmethod
    def _groups(data: pd.DataFrame, dimension: str, measure: str, mode: str) -> list[dict[str, Any]]:
        if dimension not in data or measure not in data:
            return []
        series = data.groupby(dimension, dropna=True)[measure]
        if mode == "sum":
            values = series.sum(min_count=1)
        else:
            values = series.mean()
        valid_counts = series.count()
        rows = []
        for label, value in values.items():
            if pd.isna(value):
                continue
            rows.append({"label": str(label), "value": float(value), "records": int(valid_counts.loc[label])})
        return rows

    @staticmethod
    def _rank(items: list[dict[str, Any]], descending: bool = True) -> list[dict[str, Any]]:
        return sorted(items, key=lambda row: row["value"], reverse=descending)

    def dashboard(self, parameters: Any) -> dict[str, Any]:
        start = time.perf_counter()
        data = self._filter_frame(parameters)
        sort_order = parameters.get("sort", "desc").strip().lower()
        if sort_order not in {"asc", "desc"}:
            raise ValueError("Chart sorting must be 'asc' or 'desc'.")
        descending = sort_order == "desc"
        numeric = {
            key: data[key].dropna()
            for key in ("annual_sales_units", "customer_rating", "co2_saved_tons_per_year")
            if key in data
        }
        sales = numeric.get("annual_sales_units", pd.Series(dtype=float))
        ratings = numeric.get("customer_rating", pd.Series(dtype=float))
        co2 = numeric.get("co2_saved_tons_per_year", pd.Series(dtype=float))

        manufacturer_groups = self._groups(data, "manufacturer", "annual_sales_units", "sum")
        battery_groups = self._groups(data, "battery_type", "annual_sales_units", "sum")
        region_groups = self._groups(data, "market_region", "annual_sales_units", "sum")
        manufacturer_sales = self._rank(manufacturer_groups, descending)[:12]
        battery_sales = self._rank(battery_groups, descending)
        region_sales = self._rank(region_groups, descending)
        category_sales = self._rank(self._groups(data, "category", "annual_sales_units", "sum"), descending)
        country_sales = self._rank(self._groups(data, "manufacturing_country", "annual_sales_units", "sum"), descending)
        rating_by_category = self._rank(self._groups(data, "category", "customer_rating", "mean"), descending)
        range_by_category = self._rank(self._groups(data, "category", "range_km", "mean"), descending)
        efficiency_by_category = self._rank(self._groups(data, "category", "efficiency_wh_per_km", "mean"), descending)
        annual_sales_by_year = self._groups(data, "model_year", "annual_sales_units", "sum")
        annual_sales_by_year = sorted(annual_sales_by_year, key=lambda row: int(float(row["label"])))
        battery_mix = self._rank(self._groups(data, "battery_type", "annual_sales_units", "sum"), True)
        ranges = pd.to_numeric(data["range_km"], errors="coerce").dropna()
        battery_capacity = pd.to_numeric(data["battery_capacity_kwh"], errors="coerce").dropna()

        kpis = {
            "annual_sales": {
                "value": float(sales.sum()) if not sales.empty else None,
                "valid_records": int(sales.count()),
                "aggregation": "Sum annual_sales_units across unique vehicle_id records; null values ignored.",
            },
            "average_rating": {
                "value": float(ratings.mean()) if not ratings.empty else None,
                "valid_records": int(ratings.count()),
                "aggregation": "Unweighted mean of customer_rating; each unique vehicle_id record has equal weight.",
            },
            "manufacturer_count": {
                "value": int(data["manufacturer"].nunique(dropna=True)),
                "records_with_manufacturer": int(data["manufacturer"].notna().sum()),
                "aggregation": "Distinct manufacturer names among filtered records.",
            },
            "model_count": {
                "value": int(data["model_name"].nunique(dropna=True)),
                "records_with_model_name": int(data["model_name"].notna().sum()),
                "aggregation": "Distinct model_name values among filtered records.",
            },
            "average_range": {
                "value": float(ranges.mean()) if not ranges.empty else None,
                "valid_records": int(ranges.count()),
                "aggregation": "Unweighted mean of range_km; each unique vehicle_id record has equal weight.",
            },
            "average_battery_capacity": {
                "value": float(battery_capacity.mean()) if not battery_capacity.empty else None,
                "valid_records": int(battery_capacity.count()),
                "aggregation": "Unweighted mean of battery_capacity_kwh; each unique vehicle_id record has equal weight.",
            },
            "co2_savings": {
                "value": float(co2.sum()) if not co2.empty else None,
                "valid_records": int(co2.count()),
                "aggregation": "Sum co2_saved_tons_per_year across unique vehicle_id records; null values ignored.",
            },
        }

        best_rated = max(rating_by_category, key=lambda row: row["value"], default=None)
        best_efficiency = min(efficiency_by_category, key=lambda row: row["value"], default=None)
        insights = {
            "top_manufacturer": max(manufacturer_groups, key=lambda row: row["value"], default=None),
            "top_region": max(region_groups, key=lambda row: row["value"], default=None),
            "top_battery": max(battery_groups, key=lambda row: row["value"], default=None),
            "highest_rated_category": best_rated,
            "lowest_wh_per_km_category": best_efficiency,
            "filtered_records": int(len(data)),
        }

        elapsed_ms = round((time.perf_counter() - start) * 1000, 3)
        return {
            "available": True,
            "filters": self._filter_options(),
            "selected_filters": {
                "manufacturer": parameters.get("manufacturer", ""),
                "battery_type": parameters.get("battery_type", ""),
                "region": parameters.get("region", ""),
                "category": parameters.get("category", ""),
                "country": parameters.get("country", ""),
                "model_year_min": parameters.get("model_year_min", ""),
                "model_year_max": parameters.get("model_year_max", ""),
                "sort": sort_order,
            },
            "kpis": kpis,
            "charts": {
                "manufacturer_sales": manufacturer_sales,
                "battery_sales": battery_sales,
                "region_sales": region_sales,
                "category_sales": category_sales,
                "rating_by_category": rating_by_category,
                "range_by_category": range_by_category,
                "country_sales": country_sales,
                "efficiency_by_category": efficiency_by_category,
                "annual_sales_by_year": annual_sales_by_year,
                "battery_mix": battery_mix,
            },
            "insights": insights,
            "metadata": {
                "backend": self.backend,
                "source": self._status.get("source"),
                "rows_analyzed": int(len(self.frame)),
                "filtered_rows": int(len(data)),
                "data_quality": self._data_quality,
                "response_ms": elapsed_ms,
                "fields_used": ANALYTIC_FIELDS,
            },
        }


def tableau_public_url() -> str | None:
    return validated_tableau_url(os.getenv("TABLEAU_PUBLIC_URL", ""))


def tableau_story_url() -> str | None:
    return validated_tableau_url(os.getenv("TABLEAU_STORY_URL", ""))


def validated_tableau_url(raw_value: str) -> str | None:
    value = raw_value.strip()
    if not value:
        return None
    parsed = urlparse(value)
    if parsed.scheme != "https" or parsed.netloc.lower() not in {
        "public.tableau.com",
        "www.public.tableau.com",
    }:
        LOG.warning("Ignoring TABLEAU_PUBLIC_URL outside the official Tableau Public host.")
        return None

    # Tableau Public's profile/share page is not the view endpoint that the
    # Embedding API expects. Convert its standard share URL to the canonical
    # /views/<workbook>/<view> form used by Tableau's embed component.
    parts = parsed.path.strip("/").split("/")
    if len(parts) == 6 and parts[0:2] == ["app", "profile"] and parts[3] == "viz":
        parsed = parsed._replace(path=f"/views/{parts[4]}/{parts[5]}")
        return parsed.geturl()
    if parsed.path.startswith("/views/"):
        return value

    LOG.warning("Ignoring Tableau Public URL that is not a supported view or profile share URL.")
    return None


def create_app(config: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config.update(config or {})
    service = app.config.get("DASHBOARD_DATA") or DashboardData(
        train_csv=app.config.get("EV_TRAIN_CSV"),
        database_url=app.config.get("DATABASE_URL"),
        table_name=app.config.get("EV_TABLE_NAME", os.getenv("EV_TABLE_NAME", "ev_market_train")),
    )
    app.extensions["dashboard_data"] = service

    @app.get("/")
    def index():
        return render_template(
            "index.html",
            tableau_url=tableau_public_url(),
            tableau_story_url=tableau_story_url(),
        )

    @app.get("/api/health")
    def health():
        status = service.status()
        code = 200 if status.get("state") in {"ready", "empty", "missing"} else 503
        return jsonify(status), code

    @app.get("/api/dashboard")
    def dashboard():
        status = service.status()
        if status.get("state") == "missing":
            return jsonify({"available": False, "state": "missing", **status}), 200
        if status.get("state") != "ready":
            return jsonify({"available": False, **status}), 503
        try:
            return jsonify(service.dashboard(request.args))
        except ValueError as error:
            return jsonify({"available": True, "error": str(error)}), 400
        except DataUnavailable as error:
            return jsonify({"available": False, "state": "error", "message": str(error)}), 503

    return app


app = create_app()


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0").lower() in {"1", "true", "yes"},
    )
