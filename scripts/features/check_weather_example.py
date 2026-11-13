"""Independent decimal check. Optionally verify a reacquired native POWER JSON."""
import argparse
import csv
from decimal import Decimal
import hashlib
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
CSV=ROOT/'web/public/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv'

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--native',type=Path)
    args=parser.parse_args()
    rows=list(csv.DictReader(CSV.open()))
    period=[r for r in rows if '2024-10-01'<=r['date']<='2025-09-30']
    mean=sum(Decimal(r['T2M']) for r in period)/len(period)
    rain=sum(Decimal(r['PRECTOTCORR']) for r in period)
    assert len(period)==365 and len({r['date'] for r in period})==365
    assert abs(mean-Decimal('22.36610958904109589041095890'))<Decimal('1e-20')
    assert rain==Decimal('80.39')
    print(f'PASS: {len(period)} days, mean {mean} degC, rainfall {rain} mm')
    if args.native:
        data=json.loads(args.native.read_text())
        assert data['header']['time_standard']=='UTC' and data['header']['fill_value']==-999
        assert data['geometry']['coordinates'][:2]==[30.75,29.55]
        assert data['parameters']['T2M']['units']=='C'
        assert data['parameters']['PRECTOTCORR']['units']=='mm/day'
        for row in rows:
            for key, observations in data['properties']['parameter'].items():
                assert Decimal(row[key])==Decimal(str(observations[row['date'].replace('-','')]))
        print('PASS: all 5848 native daily values match; retrieval SHA256',hashlib.sha256(args.native.read_bytes()).hexdigest())
if __name__=='__main__':main()
