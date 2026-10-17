"""Measure data load and Flask response time without opening a network socket.

Use this in restricted environments where local HTTP access is blocked. These
figures are in-process timings; they are not browser or network timings.
"""

from __future__ import annotations

import json
import platform
import statistics
import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app import DashboardData, create_app


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, round((len(ordered) - 1) * p)))
    return ordered[index]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional path to save the JSON measurement record.")
    args = parser.parse_args()
    service = DashboardData()
    app = create_app({"TESTING": True, "DASHBOARD_DATA": service})
    client = app.test_client()

    load_started = time.perf_counter()
    health = client.get("/api/health")
    load_ms = (time.perf_counter() - load_started) * 1000
    health_payload = health.get_json() or {}
    if health.status_code != 200 or health_payload.get("state") != "ready":
        output = json.dumps({"status": "pending", "reason": health_payload}, indent=2)
        if args.output:
            Path(args.output).write_text(output + "\n", encoding="utf-8")
        print(output)
        return 0

    first_started = time.perf_counter()
    first_response = client.get("/api/dashboard")
    first_dashboard_ms = (time.perf_counter() - first_started) * 1000
    if first_response.status_code != 200:
        output = json.dumps({"status": "failed", "http_status": first_response.status_code}, indent=2)
        if args.output:
            Path(args.output).write_text(output + "\n", encoding="utf-8")
        print(output)
        return 1

    # Verify one real manufacturer filter against an independent pandas slice.
    frame = service.frame
    manufacturer = sorted(frame["manufacturer"].dropna().astype(str).unique())[0]
    subset = frame.loc[frame["manufacturer"].astype(str).eq(manufacturer)]
    filtered_response = client.get("/api/dashboard", query_string={"manufacturer": manufacturer})
    filtered = filtered_response.get_json() or {}
    sales = pd.to_numeric(subset["annual_sales_units"], errors="coerce").dropna()
    ratings = pd.to_numeric(subset["customer_rating"], errors="coerce").dropna()
    expected_sales = float(sales.sum())
    actual_sales = filtered.get("kpis", {}).get("annual_sales", {}).get("value")
    expected_rating = float(ratings.mean()) if not ratings.empty else None
    actual_rating = filtered.get("kpis", {}).get("average_rating", {}).get("value")
    correctness = {
        "filter": {"manufacturer": manufacturer},
        "filtered_rows_expected": int(len(subset)),
        "filtered_rows_actual": filtered.get("metadata", {}).get("filtered_rows"),
        "annual_sales_expected": expected_sales,
        "annual_sales_actual": actual_sales,
        "average_rating_expected": expected_rating,
        "average_rating_actual": actual_rating,
        "passed": (
            filtered_response.status_code == 200
            and filtered.get("metadata", {}).get("filtered_rows") == len(subset)
            and actual_sales == expected_sales
            and (
                (expected_rating is None and actual_rating is None)
                or (expected_rating is not None and actual_rating is not None and abs(expected_rating - actual_rating) < 1e-10)
            )
        ),
    }

    # Exclude warm-up and correctness request from the response timing sample.
    timings = []
    statuses = []
    for _ in range(20):
        started = time.perf_counter()
        response = client.get("/api/dashboard")
        timings.append((time.perf_counter() - started) * 1000)
        statuses.append(response.status_code)

    report = {
        "status": "measured" if correctness["passed"] and all(code == 200 for code in statuses) else "failed",
        "measured_at_utc": datetime.now(timezone.utc).isoformat(),
        "environment": {"platform": platform.platform(), "python": platform.python_version(), "pandas": pd.__version__},
        "method": "Flask test client in one process; dataset load timed through /api/health; first dashboard call recorded separately; 20 warmed sequential dashboard calls; no network socket, browser, CDN, or concurrency load.",
        "dataset": {
            "backend": health_payload.get("backend"),
            **health_payload.get("data_quality", {}),
        },
        "data_load_response_ms": round(load_ms, 3),
        "first_dashboard_response_ms": round(first_dashboard_ms, 3),
        "dashboard_response_ms": {
            "min": round(min(timings), 3),
            "median": round(statistics.median(timings), 3),
            "p95": round(percentile(timings, 0.95), 3),
            "max": round(max(timings), 3),
        },
        "dashboard_status_codes": statuses,
        "filter_correctness": correctness,
        "limitations": [
            "These are Flask in-process test-client response times, not local HTTP or browser load times.",
            "Local TCP/browser access is restricted in this environment; the separate HTTP benchmark could not connect.",
            "Single-user sequential measurements do not represent concurrency, production server performance, external network latency, or chart rendering/CDN load.",
        ],
    }
    output = json.dumps(report, indent=2)
    if args.output:
        output_path = Path(args.output).expanduser()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(output + "\n", encoding="utf-8")
    print(output)
    return 0 if report["status"] == "measured" else 1


if __name__ == "__main__":
    raise SystemExit(main())
