"""Start the local EV Insights site on an available port and open it in a browser."""

from __future__ import annotations

import os
import re
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"


def prepare_sqlite_database() -> int:
    """Populate the default local SQLite database from the train CSV when needed."""
    try:
        from dotenv import load_dotenv
        from sqlalchemy import create_engine, inspect, text

        load_dotenv(ROOT / ".env", override=False)
    except ImportError as error:
        print(f"Could not load the local database setup: {error}")
        return 1

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url.lower().startswith("sqlite:///"):
        return 0

    table_name = os.getenv("EV_TABLE_NAME", "ev_market_train").strip()
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
        print("EV_TABLE_NAME must contain only letters, digits, and underscores.")
        return 1

    try:
        engine = create_engine(database_url)
        try:
            if inspect(engine).has_table(table_name):
                with engine.connect() as connection:
                    row_count = int(connection.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar_one())
            else:
                row_count = 0
        finally:
            engine.dispose()
    except Exception as error:
        print(f"Could not open the local SQLite database: {error}")
        return 1

    if row_count:
        print(f"Local SQLite database is ready ({row_count:,} training rows).")
        return 0

    sys.path.insert(0, str(ROOT))
    from app import resolve_train_csv

    input_csv = resolve_train_csv(os.getenv("EV_TRAIN_CSV"))
    if input_csv is None or not input_csv.is_file():
        print("Training CSV not found. The dashboard will open in its clear missing-data state.")
        os.environ["DATABASE_URL"] = ""
        return 0

    print(f"Preparing local SQLite database from {input_csv}…", flush=True)
    command = [
        sys.executable,
        str(ROOT / "scripts" / "import_csv.py"),
        "--input",
        str(input_csv),
        "--table",
        table_name,
        "--database-url",
        database_url,
    ]
    result = subprocess.run(command, cwd=ROOT, check=False)
    return result.returncode


def available_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind((HOST, 0))
        return int(probe.getsockname()[1])


def main() -> int:
    if prepare_sqlite_database():
        return 1
    port = available_port()
    url = f"http://{HOST}:{port}"
    env = os.environ.copy()
    env["FLASK_HOST"] = HOST
    env["PORT"] = str(port)
    print("Starting the EV Insights website…", flush=True)
    process = subprocess.Popen([sys.executable, "app.py"], cwd=ROOT, env=env)
    try:
        time.sleep(1.5)
        if process.poll() is not None:
            print("The website did not start. Check the messages above for the cause.")
            return process.returncode or 1
        opened = webbrowser.open_new_tab(url)
        print(f"EV Insights is available at {url}")
        if not opened:
            print("If your browser did not open, copy the address above into it.")
        print("Keep this window open while using the website. Press Ctrl+C here to stop it.")
        process.wait()
        return process.returncode or 0
    except KeyboardInterrupt:
        print("Stopping the EV Insights website…")
        return 0
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
