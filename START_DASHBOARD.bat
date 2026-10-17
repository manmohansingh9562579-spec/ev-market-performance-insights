@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Setting up the EV Insights website for the first time...
  where py >nul 2>&1
  if errorlevel 1 (
    echo Python 3 was not found. Install Python 3.11 or later, then open this file again.
    pause
    exit /b 1
  )
  py -3 -m venv .venv
  if errorlevel 1 (
    echo Python could not create the local environment.
    pause
    exit /b 1
  )
)

".venv\Scripts\python.exe" -c "import flask, pandas, sqlalchemy, dotenv" >nul 2>&1
if errorlevel 1 (
  echo Installing the website's Python packages...
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Package installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

".venv\Scripts\python.exe" scripts\launch_local.py
if errorlevel 1 pause
