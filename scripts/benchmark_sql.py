"""Measure a repeatable aggregate query against the configured database."""

from __future__ import annotations

import json
import platform
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app import configured_database_url, allowed_table_name  # noqa: E402


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, round((len(ordered) - 1) * p)))
    return ordered[index]


def main() -> int:
    url = configured_database_url()
    if not url:
        print(json.dumps({
            "status": "pending",
            "reason": "DATABASE_URL is not set to a local SQLite database.",
            "message": "Set DATABASE_URL=sqlite:///ev_market.sqlite, import the CSV, then rerun this script. No SQL timings are claimed.",
        }, indent=2))
        return 0

    table = allowed_table_name(__import__("os").getenv("EV_TABLE_NAME", "ev_market_train"))
    engine = create_engine(url, pool_pre_ping=True)
    timings: list[float] = []
    row_count = None
    try:
        query = text(f"SELECT COUNT(*) AS row_count, SUM(annual_sales_units) AS sales, AVG(customer_rating) AS rating FROM {table}")
        with engine.connect() as connection:
            for index in range(11):
                started = time.perf_counter()
                result = connection.execute(query).mappings().one()
                elapsed = (time.perf_counter() - started) * 1000
                if index:
                    timings.append(elapsed)
                row_count = int(result["row_count"])
    except Exception as error:
        print(json.dumps({"status": "failed", "backend": engine.dialect.name, "error": str(error)}, indent=2))
        return 1
    finally:
        engine.dispose()

    report = {
        "status": "measured",
        "measured_at_utc": datetime.now(timezone.utc).isoformat(),
        "environment": {"platform": platform.platform(), "python": platform.python_version()},
        "backend": engine.dialect.name,
        "table": table,
        "rows": row_count,
        "query": "COUNT(*), SUM(annual_sales_units), AVG(customer_rating)",
        "method": "One warm-up followed by 10 sequential executions on one connection; single-user, local environment.",
        "query_response_ms": {
            "min": round(min(timings), 3),
            "median": round(statistics.median(timings), 3),
            "p95": round(percentile(timings, 0.95), 3),
            "max": round(max(timings), 3),
        },
        "limitations": ["Does not measure concurrent load or remote-network latency."],
    }
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
