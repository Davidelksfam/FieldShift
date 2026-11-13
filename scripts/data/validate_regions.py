"""Validate regional handoff structure and real imported data, without raw files in CI."""
import csv,hashlib,json,math,re
from datetime import date,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCES={'power','imerg','smap','hls','modis_mod13q1','ecostress','soilgrids'}
DEPTHS={(0,5),(5,15),(15,30),(30,60),(60,100),(100,200)}
PROPERTIES={'phh2o','clay','sand','silt','soc','bdod'}

def check_daily(rows,source,expected):
    passes=['daily'] if source=='imerg' else ['AM','PM']
    if [(r['date'],r['pass']) for r in rows]!=[(d,p) for d in expected for p in passes]:
        raise ValueError('Incomplete/duplicate satellite calendar')
    for r in rows:
        if r['unit']!=('mm/day' if source=='imerg' else 'm3/m3'):raise ValueError('Unexpected satellite unit')
        valid,total=int(r['valid_count']),int(r['total_count'])
        if not 0<=valid<=total:raise ValueError('Invalid native support counts')
        if r['status']=='provider_inventory_gap':
            if r['value']!='' or valid or total or r['source_sha256']:raise ValueError('Fabricated inventory-gap value')
        elif r['status'] in ['valid_regional_context','no_QA_valid_pixels']:
            if not re.fullmatch('[a-f0-9]{64}',r['source_sha256']):raise ValueError('Missing parent hash')
            if total and not math.isclose(float(r['valid_fraction']),valid/total):raise ValueError('Invalid valid fraction')
            if r['status']=='valid_regional_context':
                v=float(r['value'])
                if not valid or not math.isfinite(v) or v<0 or (source=='smap' and v>1):raise ValueError('Invalid satellite value')
            elif valid or r['value']!='':raise ValueError('Fabricated QA-missing value')
        else:raise ValueError('Unrecognized satellite status')

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
                if path.suffix=='.csv' and s['sourceId']=='power':
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
    satellite=0
    for path in (ROOT/'web/public/data/regions/harmony-daily').glob('*.csv'):
        source=path.stem.split('-')[-1]
        if source not in ['imerg','smap']:raise ValueError('Unknown daily source')
        with path.open() as f:check_daily(list(csv.DictReader(f)),source,expected)
        metadata=json.loads(path.with_suffix('.metadata.json').read_text())
        if metadata['csvSha256']!=hashlib.sha256(path.read_bytes()).hexdigest():raise ValueError('Daily CSV hash mismatch')
        satellite+=1
    print(f'PASS: 2 regions × 7 source structures; {weather} complete 731-day weather CSVs; {soil} soil layers; {satellite} satellite calendars with explicit gaps')
if __name__=='__main__':main()
