"""Start the local EV Insights site on an available port and open it in a browser."""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HOST = "127.0.0.1"


def available_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind((HOST, 0))
        return int(probe.getsockname()[1])


def main() -> int:
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
