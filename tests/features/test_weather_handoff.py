import importlib.util
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'scripts/features'))
import build_weather_handoff as handoff

class HandoffTests(unittest.TestCase):
    def test_checked_example_and_contract(self):
        from jsonschema import Draft202012Validator, FormatChecker
        record, evidence = handoff.build()
        schema = json.loads((ROOT/'contracts/seasonal-features.v1.schema.json').read_text())
        Draft202012Validator(schema, format_checker=FormatChecker()).validate(record)
        self.assertEqual(record['metrics']['seasonalRainfallMm'],80.39)
        self.assertAlmostEqual(evidence['metrics']['meanAirTemperatureC']['value'],22.366109589041095)
        self.assertEqual(evidence['metrics']['periodRainfallMm']['coverage']['validDays'],365)
        self.assertIsNone(record['metrics']['heatExposureDays'])
        for name, value in [('seasonal-features.v1.json',record), ('period-context.proposal-0.2.json',evidence)]:
            self.assertEqual(json.loads((handoff.OUT/name).read_text()),value)

    def test_archive_boundary_missing_is_not_zero(self):
        evidence=handoff.context.build(handoff.CSV,'2023-12-31','2024-01-01')
        metric=evidence['metrics']['periodRainfallMm']
        self.assertIsNone(metric['value'])
        self.assertEqual(metric['coverage']['validDays'],1)
        self.assertEqual(metric['missingReason'],'incomplete_daily_coverage')
