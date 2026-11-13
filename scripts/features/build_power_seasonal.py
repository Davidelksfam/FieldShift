#!/usr/bin/env python3
"""Build one contract-compatible seasonal climate feature from a NASA POWER CSV.

Uses Python standard library only. Dates are inclusive. Incomplete periods are
never silently treated as complete, and rainfall is never equated with irrigation.
"""
import argparse
import csv
import json
import math
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

DEFAULT_CSV = "web/public/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv"

def finite(value):
    try:
        number = float(value)
        return number if math.isfinite(number) and number not in (-999, -9999) else None
    except (ValueError, TypeError):
        return None

def build(csv_path, start, end, location_id, season_id, threshold=None, source_url=None):
    first, last = date.fromisoformat(start), date.fromisoformat(end)
    if last < first:
        raise ValueError("end date must not precede start date")
    if threshold is not None and not math.isfinite(threshold):
        raise ValueError("heat threshold must be finite")
    rows = {}
    duplicates = set()
    with open(csv_path, encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"date", "T2M", "T2M_MAX", "PRECTOTCORR"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError(f"Missing columns: {sorted(required - set(reader.fieldnames or []))}")
        for row in reader:
            day = date.fromisoformat(row["date"])
            if first <= day <= last:
                if day in rows:
                    duplicates.add(day)
                rows[day] = row
    days = [first + timedelta(days=i) for i in range((last-first).days + 1)]
    missing = [d for d in days if d not in rows]
    temps = [finite(rows[d]["T2M"]) for d in days if d in rows]
    rain = [finite(rows[d]["PRECTOTCORR"]) for d in days if d in rows]
    highs = [finite(rows[d]["T2M_MAX"]) for d in days if d in rows]
    temp_ok = not missing and not duplicates and len(temps) == len(days) and all(v is not None for v in temps)
    rain_ok = not missing and not duplicates and len(rain) == len(days) and all(v is not None and v >= 0 for v in rain)
    heat_ok = threshold is not None and not missing and not duplicates and len(highs) == len(days) and all(v is not None for v in highs)
    warnings = []
    if missing:
        warnings.append(f"Missing {len(missing)} calendar days; incomplete metrics returned as null.")
    if duplicates:
        warnings.append(f"Duplicate dates detected ({len(duplicates)}); affected metrics returned as null.")
    if not temp_ok:
        warnings.append("Air temperature unavailable or incomplete for requested period.")
    if not rain_ok:
        warnings.append("Rainfall unavailable or incomplete; missing days are not zero rainfall.")
    if threshold is None:
        warnings.append("heatExposureDays is null until a crop-specific Tmax threshold is supplied.")
    elif not heat_ok:
        warnings.append("Heat exposure unavailable because daily Tmax coverage is incomplete.")
    warnings.append("POWER grid-point climate context is not a field measurement or irrigation estimate.")
    return {
        "schemaVersion": "1.0-draft",
        "featureId": f"{location_id}:{season_id}:power",
        "locationId": location_id,
        "seasonId": season_id,
        "period": {"startDate": start, "endDate": end},
        "metrics": {
            "seasonalRainfallMm": round(sum(rain), 3) if rain_ok else None,
            "avgAirTempC": round(sum(temps) / len(temps), 3) if temp_ok else None,
            "heatExposureDays": sum(v >= threshold for v in highs) if heat_ok else None,
        },
        "dataStatus": "historical_modeled",
        "provenance": {
            "provider": "NASA POWER",
            "dataset": "POWER daily point climate CSV",
            "observationStart": start,
            "observationEnd": end,
            "spatialSupport": "POWER point/grid context for selected location; not field-level",
            "processingNote": "Inclusive daily aggregation; strict full-period coverage; heat days count T2M_MAX >= supplied crop threshold in C.",
            "retrievedAt": None,
            "sourceUrl": source_url,
        },
        "warnings": warnings,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", default=DEFAULT_CSV)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--location-id", default="egypt-fayoum-power-30.75-29.55")
    parser.add_argument("--season-id", required=True)
    parser.add_argument("--heat-threshold-c", type=float, default=None)
    parser.add_argument("--source-url", default=None)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    record = build(args.csv, args.start, args.end, args.location_id, args.season_id, args.heat_threshold_c, args.source_url)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output}")

if __name__ == "__main__":
    main()
