"""Measure real HTTP response times for a running local Flask dashboard."""

from __future__ import annotations

import argparse
import json
import platform
import statistics
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone


def get(url: str) -> tuple[int, float, bytes]:
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            payload = response.read()
            status = response.status
    except urllib.error.HTTPError as error:
        payload = error.read()
        status = error.code
    except urllib.error.URLError as error:
        payload = str(error).encode("utf-8", errors="replace")
        status = 0
    elapsed_ms = (time.perf_counter() - started) * 1000
    return status, elapsed_ms, payload


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = max(0, min(len(ordered) - 1, round((len(ordered) - 1) * p)))
    return ordered[index]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:5000")
    parser.add_argument("--runs", type=int, default=20)
    args = parser.parse_args()
    if args.runs < 3:
        parser.error("Use at least three measured runs.")

    base = args.url.rstrip("/")
    health_status, health_ms, health_body = get(base + "/api/health")
    try:
        health = json.loads(health_body)
    except json.JSONDecodeError:
        health = {"state": "unreadable", "message": health_body.decode("utf-8", errors="replace")[:300]}
    if health_status >= 500 or health.get("state") not in {"ready"}:
        print(json.dumps({
            "status": "pending",
            "reason": "The running app does not have a ready data source.",
            "health_status": health_status,
            "health": health,
        }, indent=2))
        return 0

    # First dashboard request is a warm-up and not included in the measured sample.
    warm_status, _, warm_body = get(base + "/api/dashboard")
    if warm_status != 200:
        print(json.dumps({"status": "failed", "http_status": warm_status, "body": warm_body.decode("utf-8", errors="replace")[:300]}, indent=2))
        return 1

    page_status, page_ms, _ = get(base + "/")
    timings = []
    status_codes = []
    for _ in range(args.runs):
        status, elapsed_ms, _ = get(base + "/api/dashboard")
        timings.append(elapsed_ms)
        status_codes.append(status)

    report = {
        "status": "measured",
        "measured_at_utc": datetime.now(timezone.utc).isoformat(),
        "environment": {"platform": platform.platform(), "python": platform.python_version()},
        "method": f"One local HTTP client; warm-up excluded; {args.runs} sequential GETs to /api/dashboard; no browser rendering or concurrent load.",
        "base_url": base,
        "page_http_status": page_status,
        "page_first_response_ms": round(page_ms, 3),
        "health_http_status": health_status,
        "health_response_ms": round(health_ms, 3),
        "dataset": {
            "backend": health.get("backend"),
            "raw_rows": health.get("data_quality", {}).get("raw_rows"),
            "rows_analyzed": health.get("data_quality", {}).get("rows_analyzed"),
            "columns": health.get("data_quality", {}).get("columns"),
            "source_size_bytes": health.get("data_quality", {}).get("source_size_bytes"),
        },
        "dashboard_http_status_codes": status_codes,
        "dashboard_response_ms": {
            "min": round(min(timings), 3),
            "median": round(statistics.median(timings), 3),
            "p95": round(percentile(timings, 0.95), 3),
            "max": round(max(timings), 3),
        },
        "limitations": [
            "HTTP response measurements exclude browser chart rendering, Chart.js download time, network latency outside loopback, and user-perceived interaction delay.",
            "Sequential single-user measurements are not a concurrency or capacity test.",
        ],
    }
    print(json.dumps(report, indent=2))
    return 0 if all(status == 200 for status in status_codes) else 1


if __name__ == "__main__":
    raise SystemExit(main())
