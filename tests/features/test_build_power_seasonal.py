import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts/features/build_power_seasonal.py"
spec = importlib.util.spec_from_file_location("power_features", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class PowerFeatureTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.csv = Path(self.tmp.name) / "power.csv"

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rows):
        with self.csv.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["date", "T2M", "T2M_MAX", "PRECTOTCORR"])
            writer.writeheader()
            writer.writerows(rows)

    def build(self, threshold=None):
        return module.build(self.csv, "2024-01-01", "2024-01-03", "fayoum-point", "jan-2024", threshold)

    def test_complete_period(self):
        self.write([
            {"date": "2024-01-01", "T2M": 10, "T2M_MAX": 32, "PRECTOTCORR": 0},
            {"date": "2024-01-02", "T2M": 20, "T2M_MAX": 35, "PRECTOTCORR": 1.5},
            {"date": "2024-01-03", "T2M": 30, "T2M_MAX": 36, "PRECTOTCORR": 2},
        ])
        m = self.build(35)["metrics"]
        self.assertEqual(m, {"seasonalRainfallMm": 3.5, "avgAirTempC": 20, "heatExposureDays": 2})

    def test_missing_date_is_not_zero(self):
        self.write([
            {"date": "2024-01-01", "T2M": 10, "T2M_MAX": 32, "PRECTOTCORR": 0},
            {"date": "2024-01-03", "T2M": 30, "T2M_MAX": 36, "PRECTOTCORR": 2},
        ])
        self.assertEqual(self.build(35)["metrics"], {"seasonalRainfallMm": None, "avgAirTempC": None, "heatExposureDays": None})

    def test_heat_threshold_not_invented(self):
        self.write([
            {"date": f"2024-01-0{i}", "T2M": 20, "T2M_MAX": 36, "PRECTOTCORR": 0}
            for i in range(1, 4)
        ])
        self.assertIsNone(self.build()["metrics"]["heatExposureDays"])

    def test_duplicate_day_invalidates_aggregation(self):
        self.write([
            {"date": "2024-01-01", "T2M": 10, "T2M_MAX": 32, "PRECTOTCORR": 0},
            {"date": "2024-01-02", "T2M": 20, "T2M_MAX": 35, "PRECTOTCORR": 1},
            {"date": "2024-01-02", "T2M": 20, "T2M_MAX": 35, "PRECTOTCORR": 1},
            {"date": "2024-01-03", "T2M": 30, "T2M_MAX": 36, "PRECTOTCORR": 2},
        ])
        self.assertIsNone(self.build(35)["metrics"]["seasonalRainfallMm"])

if __name__ == "__main__":
    unittest.main()
