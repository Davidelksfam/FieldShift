"""Validate regional handoff structure and real imported data, without raw files in CI."""
import csv,json,math
from datetime import date,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCES={'power','imerg','smap','hls','modis_mod13q1','ecostress','soilgrids'}
DEPTHS={(0,5),(5,15),(15,30),(30,60),(60,100),(100,200)}
PROPERTIES={'phh2o','clay','sand','silt','soc','bdod'}

def check_structure(data):
    if data['schemaVersion']!='regional-readiness-1.0':raise ValueError('Wrong version')
    ids=[r['regionId'] for r in data['regions']]
    if len(ids)!=2 or set(ids)!={'egypt-nile-delta','egypt-fayoum'}:raise ValueError('Both distinct regions required')
    for r in data['regions']:
        keys=[s['sourceId'] for s in r['sources']]
        if len(keys)!=7 or set(keys)!=SOURCES:raise ValueError('Exactly seven distinct source entries required')
        for s in r['sources']:
            for k in ['schemaStatus','spatialStatus','temporalStatus','qualityStatus','fullProductionReady','evidencePaths','missingRequirements']:
                if k not in s:raise ValueError('Incomplete source shape: '+k)
            if not s['evidencePaths']:raise ValueError('Missing source evidence')
            if s['fullProductionReady'] and s['missingRequirements']:raise ValueError('Cannot claim completeness with unmet requirements')
    if data['allProductionComplete'] and not all(s['fullProductionReady'] for r in data['regions'] for s in r['sources']):raise ValueError('False aggregate completeness')

def main():
    data=json.loads((ROOT/'data/manifests/regions/readiness.json').read_text());check_structure(data)
    start=date.fromisoformat(data['period']['startDate']);end=date.fromisoformat(data['period']['endDateInclusive'])
    expected=[str(start+timedelta(days=i)) for i in range((end-start).days+1)]
    weather=0;soil=0
    for r in data['regions']:
        for s in r['sources']:
            for name in s['evidencePaths']:
                path=ROOT/name
                if not path.is_file():raise ValueError('Missing evidence: '+name)
                if path.suffix=='.csv':
                    with path.open() as f:rows=list(csv.DictReader(f))
                    required={'date','T2M','T2M_MIN','T2M_MAX','RH2M','WS2M','ALLSKY_SFC_SW_DWN','PRECTOTCORR','PS'}
                    if not rows or set(rows[0])!=required:raise ValueError('Weather columns incomplete')
                    if [x['date'] for x in rows]!=expected:raise ValueError('Incomplete/duplicate daily weather')
                    if any(v=='' for row in rows for v in row.values()):raise ValueError('Unlabeled missing weather')
                    if any(not math.isfinite(float(v)) for row in rows for k,v in row.items() if k!='date'):raise ValueError('Non-finite weather')
                    weather+=1
                elif name.endswith('-soilgrids.json'):
                    records=json.loads(path.read_text())['records']
                    keys={(x['property'],tuple(x['depthCm']),x['statistic']) for x in records}
                    required={(p,d,t) for p in PROPERTIES for d in DEPTHS for t in ['mean','Q05','Q95']}
                    if keys!=required or len(records)!=108 or any(x['status']!='science_downloaded' for x in records):raise ValueError('Soil profile incomplete')
                    soil+=len(records)
    print(f'PASS: 2 regions × 7 source structures; {weather} complete 731-day weather CSVs; {soil} soil layers; explicit satellite coverage limits retained')
if __name__=='__main__':main()
