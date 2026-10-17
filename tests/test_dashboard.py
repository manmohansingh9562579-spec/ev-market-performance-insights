"""Unit and integration checks using small synthetic fixtures, not Kaggle results."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TEST_TMP_ROOT = PROJECT_ROOT / ".test-tmp"
TEST_TMP_ROOT.mkdir(exist_ok=True)
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

import import_csv  # noqa: E402
from app import DashboardData, create_app  # noqa: E402


def required_rows() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {"vehicle_id": "EV001", "model_name": "Model One", "manufacturer": "Maker A", "manufacturing_country": "China", "market_region": "Asia", "category": "SUV", "battery_type": "LFP", "model_year": 2024, "annual_sales_units": 1000, "customer_rating": 4.5, "range_km": 350, "battery_capacity_kwh": 70, "efficiency_wh_per_km": 160, "co2_saved_tons_per_year": 1.2},
            {"vehicle_id": "EV002", "model_name": "Model Two", "manufacturer": "Maker A", "manufacturing_country": "China", "market_region": "Asia", "category": "SUV", "battery_type": "NMC", "model_year": 2024, "annual_sales_units": 500, "customer_rating": 4.0, "range_km": 320, "battery_capacity_kwh": 65, "efficiency_wh_per_km": 170, "co2_saved_tons_per_year": 1.1},
            {"vehicle_id": "EV003", "model_name": "Model Three", "manufacturer": "Maker B", "manufacturing_country": "Germany", "market_region": "Europe", "category": "Sedan", "battery_type": "LFP", "model_year": 2025, "annual_sales_units": 2000, "customer_rating": 5.0, "range_km": 400, "battery_capacity_kwh": 80, "efficiency_wh_per_km": 150, "co2_saved_tons_per_year": 2.0},
            {"vehicle_id": "EV004", "model_name": "Model Three", "manufacturer": "Maker B", "manufacturing_country": "Germany", "market_region": "Europe", "category": "Sedan", "battery_type": "LFP", "model_year": 2025, "annual_sales_units": None, "customer_rating": None, "range_km": 430, "battery_capacity_kwh": 90, "efficiency_wh_per_km": 140, "co2_saved_tons_per_year": 2.2},
        ]
    )


def full_schema_rows() -> pd.DataFrame:
    frame = pd.DataFrame([{field: None for field in import_csv.EXPECTED_FIELDS}])
    frame.loc[0, "vehicle_id"] = "EV900001"
    frame.loc[0, "manufacturer"] = "Test Maker"
    frame.loc[0, "manufacturing_country"] = "India"
    frame.loc[0, "market_region"] = "South Asia"
    frame.loc[0, "category"] = "Hatchback"
    frame.loc[0, "battery_type"] = "LFP"
    frame.loc[0, "model_year"] = 2024
    frame.loc[0, "annual_sales_units"] = 10
    frame.loc[0, "customer_rating"] = 4.2
    frame.loc[0, "range_km"] = 300
    frame.loc[0, "efficiency_wh_per_km"] = 150
    frame.loc[0, "co2_saved_tons_per_year"] = 1.5
    return frame


class DashboardApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT)
        self.root = Path(self.temp.name)
        self.csv_path = self.root / "ev_market_train.csv"
        rows = required_rows()
        rows = pd.concat([rows, rows.iloc[[0]]], ignore_index=True)  # intentional exact duplicate fixture
        rows.to_csv(self.csv_path, index=False)
        self.app = create_app({"TESTING": True, "EV_TRAIN_CSV": str(self.csv_path), "DATABASE_URL": ""})
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_kpis_deduplicate_and_use_correct_aggregations(self) -> None:
        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["metadata"]["rows_analyzed"], 4)
        self.assertEqual(payload["metadata"]["data_quality"]["exact_duplicate_rows_removed"], 1)
        self.assertEqual(payload["kpis"]["annual_sales"]["value"], 3500)
        self.assertAlmostEqual(payload["kpis"]["average_rating"]["value"], 4.5)
        self.assertEqual(payload["kpis"]["manufacturer_count"]["value"], 2)
        self.assertAlmostEqual(payload["kpis"]["co2_savings"]["value"], 6.5)
        self.assertEqual(payload["kpis"]["model_count"]["value"], 3)
        self.assertAlmostEqual(payload["kpis"]["average_range"]["value"], 375)
        self.assertAlmostEqual(payload["kpis"]["average_battery_capacity"]["value"], 76.25)
        self.assertEqual(payload["charts"]["annual_sales_by_year"], [
            {"label": "2024", "value": 1500.0, "records": 2},
            {"label": "2025", "value": 2000.0, "records": 1},
        ])
        self.assertEqual(len(payload["charts"]["battery_mix"]), 2)

    def test_filters_change_aggregates(self) -> None:
        response = self.client.get("/api/dashboard?manufacturer=Maker%20A&model_year_min=2024&model_year_max=2024")
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["metadata"]["filtered_rows"], 2)
        self.assertEqual(payload["kpis"]["annual_sales"]["value"], 1500)
        self.assertAlmostEqual(payload["kpis"]["average_rating"]["value"], 4.25)
        self.assertEqual(payload["kpis"]["manufacturer_count"]["value"], 1)

    def test_sorting_does_not_change_story_leaders(self) -> None:
        response = self.client.get("/api/dashboard?sort=asc")
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["charts"]["manufacturer_sales"][0]["label"], "Maker A")
        self.assertEqual(payload["insights"]["top_manufacturer"]["label"], "Maker B")

    def test_invalid_filter_values_are_rejected(self) -> None:
        response = self.client.get("/api/dashboard?category=NotARealCategory")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unknown category", response.get_json()["error"])

    def test_country_filter_changes_aggregations(self) -> None:
        response = self.client.get("/api/dashboard?country=Germany")
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["metadata"]["filtered_rows"], 2)
        self.assertEqual(payload["kpis"]["manufacturer_count"]["value"], 1)
        self.assertEqual(payload["kpis"]["annual_sales"]["value"], 2000)

    def test_valid_filter_combination_can_return_empty_state(self) -> None:
        response = self.client.get("/api/dashboard?manufacturer=Maker%20A&region=Europe")
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["metadata"]["filtered_rows"], 0)
        self.assertEqual(payload["charts"]["manufacturer_sales"], [])

    def test_conflicting_vehicle_ids_are_excluded(self) -> None:
        rows = required_rows()
        conflicting = rows.iloc[[0]].copy()
        conflicting.loc[:, "market_region"] = "Europe"
        rows = pd.concat([rows, conflicting], ignore_index=True)
        rows.to_csv(self.csv_path, index=False)
        service = DashboardData(train_csv=self.csv_path, database_url="")
        status = service.status()
        self.assertEqual(status["data_quality"]["conflicting_vehicle_ids_excluded"], 1)
        self.assertEqual(status["data_quality"]["conflicting_vehicle_rows_excluded"], 2)
        self.assertEqual(status["data_quality"]["rows_analyzed"], 3)

    def test_missing_source_has_clear_loading_response(self) -> None:
        app = create_app({"TESTING": True, "EV_TRAIN_CSV": str(self.root / "missing.csv"), "DATABASE_URL": ""})
        response = app.test_client().get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertFalse(payload["available"])
        self.assertEqual(payload["state"], "missing")

    def test_valid_tableau_public_url_enables_embedding(self) -> None:
        with patch.dict(os.environ, {"TABLEAU_PUBLIC_URL": "https://public.tableau.com/views/ev-market/Dashboard"}):
            response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"<tableau-viz", response.data)
        self.assertIn(b"tableau.embedding.3.latest.min.js", response.data)

    def test_tableau_profile_share_urls_are_normalized_for_embedding(self) -> None:
        with patch.dict(os.environ, {
            "TABLEAU_PUBLIC_URL": "https://public.tableau.com/app/profile/example/viz/EV_Market/Dashboard1",
            "TABLEAU_STORY_URL": "https://public.tableau.com/app/profile/example/viz/EV_Market/Story2",
        }):
            response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'src="https://public.tableau.com/views/EV_Market/Dashboard1?:showVizHome=no&amp;:embed=true"', response.data)
        self.assertIn(b'src="https://public.tableau.com/views/EV_Market/Story2?:showVizHome=no&amp;:embed=true"', response.data)
        self.assertNotIn(b'src="https://public.tableau.com/app/profile/', response.data)

    def test_missing_or_non_public_tableau_url_keeps_local_dashboard(self) -> None:
        with patch.dict(os.environ, {
            "TABLEAU_PUBLIC_URL": "https://example.com/views/ev-market",
            "TABLEAU_STORY_URL": "",
        }):
            response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(b"<tableau-viz", response.data)
        self.assertIn(b"Tableau Public link is not configured", response.data)
        self.assertIn(b"chartManufacturer", response.data)

    def test_tableau_story_url_uses_official_embed_component(self) -> None:
        with patch.dict(os.environ, {
            "TABLEAU_PUBLIC_URL": "https://public.tableau.com/views/ev-market/Dashboard",
            "TABLEAU_STORY_URL": "https://public.tableau.com/views/ev-market/Story2",
        }):
            response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"tableauDashboardViz", response.data)
        self.assertIn(b"tableauStoryViz", response.data)
        self.assertIn(b"data-tableau-view=\"story\"", response.data)

    def test_dashboard_includes_country_map_story_and_vehicle_artwork(self) -> None:
        with patch.dict(os.environ, {"TABLEAU_PUBLIC_URL": "", "TABLEAU_STORY_URL": ""}):
            response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        page = response.data
        self.assertIn(b"plotly.js-dist-min@3.1.0/plotly.min.js", page)
        self.assertIn(b'id="chartCountry" class="plotly-chart"', page)
        self.assertIn(b'id="countryMapFallback"', page)
        self.assertIn(b'id="chartRating" class="plotly-chart"', page)
        self.assertEqual(page.count(b'class="story-step"'), 8)
        self.assertIn(b'id="heroBatteryValue"', page)
        self.assertIn(b'id="heroRangeValue"', page)
        self.assertIn(b"Electric crossover concept illustration", page)

    def test_dashboard_refreshes_script_and_guards_optional_text_targets(self) -> None:
        page = self.client.get("/")
        self.assertIn(b"dashboard.js?v=20261017-5", page.data)

        with self.client.get("/static/js/dashboard.js?v=20261017-5") as script:
            self.assertEqual(script.status_code, 200)
            source = script.get_data(as_text=True)
        self.assertIn("if (node) node.textContent = value;", source)
        self.assertNotRegex(source, r"el\(['\"][^'\"]+['\"]\)\.textContent\s*=")


class SqliteImportTests(unittest.TestCase):
    def test_repeatable_sqlite_import_and_dashboard_read(self) -> None:
        with tempfile.TemporaryDirectory(dir=TEST_TMP_ROOT) as temp_dir:
            root = Path(temp_dir)
            source = root / "fixture.csv"
            database = root / "ev_market.sqlite"
            first = full_schema_rows()
            fixture = pd.concat([first, first.copy()], ignore_index=True)
            fixture.to_csv(source, index=False)
            env = {"DATABASE_URL": f"sqlite:///{database}", "EV_TABLE_NAME": "ev_market_train"}
            with patch.dict(os.environ, env, clear=False):
                with patch.object(sys, "argv", ["import_csv.py", "--input", str(source)]):
                    self.assertEqual(import_csv.main(), 0)
                with patch.object(sys, "argv", ["import_csv.py", "--input", str(source), "--replace"]):
                    self.assertEqual(import_csv.main(), 0)

            service = DashboardData(database_url=f"sqlite:///{database}", table_name="ev_market_train")
            status = service.status()
            self.assertEqual(status["state"], "ready")
            self.assertEqual(status["data_quality"]["rows_analyzed"], 1)
            self.assertEqual(service.dashboard({})["kpis"]["annual_sales"]["value"], 10)


if __name__ == "__main__":
    unittest.main()
