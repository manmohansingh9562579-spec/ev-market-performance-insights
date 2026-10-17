# EV Insights: Electric Vehicle Market Performance & Insights

A small Flask web app that embeds a Tableau Public dashboard and story about the electric vehicle market.

## Pages (single page, navbar links)
Home, About, Features, Services, Dashboard (Tableau embed), Story (Tableau embed).

## Tableau Public
- Dashboard: https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Dashboard1
- Story: https://public.tableau.com/app/profile/man.mohan.singh3746/viz/EV_Market_Performance_Public_Ready_Clean/Story2

## Run locally
```
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000. Internet is needed because the Tableau embedding script loads from Tableau Public.

## Tech
HTML, CSS, Flask (Python), Tableau Public, Visual Studio Code.

## Dataset
Electric Vehicle Market Classification dataset (not included in this repository).
