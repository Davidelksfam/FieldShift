"""Reproduce the prototype interval using the existing proposal and PR #6 adapter."""
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
from build_power_seasonal import build as seasonal
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('context', ROOT/'scripts/data/build_weather_context.py')
context = importlib.util.module_from_spec(spec)
spec.loader.exec_module(context)
CSV = ROOT/'web/public/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv'
START, END = '2024-10-01', '2025-09-30'
OUT = ROOT/'web/public/data/weather-handoff'

def build():
    evidence = context.build(CSV, START, END)
    record = seasonal(CSV, START, END, 'egypt-fayoum-power-30.75-29.55',
                      'prototype-comparison-interval', source_url=evidence['sources'][0]['sourceUrl'])
    record['warnings'].append('Comparison interval, not an approved crop season. Heat thresholds remain unreviewed.')
    for key, metric in [('avgAirTempC','meanAirTemperatureC'), ('seasonalRainfallMm','periodRainfallMm')]:
        value = evidence['metrics'][metric]['value']
        if record['metrics'][key] != (round(value, 3) if value is not None else None):
            raise ValueError('PR #6 and context aggregation disagree')
    return record, evidence

def main():
    record, evidence = build()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, value in [('seasonal-features.v1.json',record), ('period-context.proposal-0.2.json',evidence)]:
        (OUT/name).write_text(json.dumps(value,indent=2,allow_nan=False)+'\n')
    print(json.dumps(record['metrics']))

if __name__ == '__main__':
    main()
