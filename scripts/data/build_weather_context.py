"""Proposed historical weather handoff; no field matching or agronomic scoring."""
import argparse,csv,hashlib,json,math
from datetime import date,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def summarize(rows,start,end):
    start,end=date.fromisoformat(start),date.fromisoformat(end)
    if end<start:raise ValueError('Reversed period')
    by_date={}
    for row in rows:
        day=date.fromisoformat(row['date'])
        if day in by_date:raise ValueError('Duplicate observation date')
        by_date[day]=row
    days=[start+timedelta(days=i) for i in range((end-start).days+1)]
    result={}
    for name,column,unit,method in [('meanAirTemperatureC','T2M','degC','arithmetic_mean_of_daily_T2M'),('periodRainfallMm','PRECTOTCORR','mm','sum_of_daily_PRECTOTCORR')]:
        values=[]
        for day in days:
            value=by_date.get(day,{}).get(column)
            if value in [None,'']:continue
            v=float(value)
            if not math.isfinite(v):raise ValueError('Non-finite weather input')
            if v==-999:raise ValueError('Unexpected unnormalized fill value')
            if column=='PRECTOTCORR' and v<0:raise ValueError('Negative valid rainfall')
            values.append(v)
        observed=(math.fsum(values)/len(values) if column=='T2M' else math.fsum(values)) if values else None
        complete=len(values)==len(days)
        result[name]={'value':observed if complete else None,'unit':unit,'status':'available' if complete else 'unavailable',
            'dataStatus':'historical_modeled','method':method,'sourceRefs':['power-input'],
            'coverage':{'validDays':len(values),'expectedDays':len(days),'validFraction':len(values)/len(days)},
            'missingReason':None if complete else 'incomplete_daily_coverage',
            'observedValue':observed}
    result['heatExposureDays']={'value':None,'unit':'days','status':'unavailable','dataStatus':'unknown',
        'method':'not_configured','sourceRefs':[],
        'coverage':{'validDays':0,'expectedDays':len(days),'validFraction':0},
        'missingReason':'crop_specific_threshold_and_method_unreviewed','observedValue':None}
    return result

def build(csv_path,start,end):
    csv_path=Path(csv_path).resolve();metadata_path=csv_path.with_suffix('.metadata.json')
    metadata=json.loads(metadata_path.read_text())
    if metadata['units']['T2M']!='degC' or metadata['units']['PRECTOTCORR']!='mm/day' or metadata['timeStandard']!='UTC':
        raise ValueError('Unexpected input units or time standard')
    with csv_path.open() as f:metrics=summarize(list(csv.DictReader(f)),start,end)
    return {'schemaVersion':'environmental-context-proposal-0.2','regionId':metadata['regionId'],
        'period':{'startDate':start,'endDate':end,'kind':'historical_observation_interval'},
        'spatialSupport':{'kind':'sampled_weather_query_point','point':metadata['point'],
            'description':'POWER gridded context queried at this coordinate; no farm polygon or field matching; native resolution is not the lattice spacing'},
        'metrics':metrics,'sources':[{'sourceId':'power-input','dataset':'NASA POWER daily meteorology',
            'csvPath':str(csv_path.relative_to(ROOT)),'csvSha256':hashlib.sha256(csv_path.read_bytes()).hexdigest(),
            'metadataPath':str(metadata_path.relative_to(ROOT)),
            'metadataSha256':hashlib.sha256(metadata_path.read_bytes()).hexdigest(),
            'nativeArtifactSha256':metadata['sourceArtifact']['sha256'],'sourceUrl':metadata['sourceArtifact']['sourceUrl']}],
        'decisionReady':False,
        'warnings':['Research context proposal; not an approved application contract or a field measurement.',
            'Observation intervals are not crop seasons or forecasts. No crop, water-demand or ranking rules applied.',
            'value requires complete daily coverage; observedValue is diagnostic and may summarize only available days.']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ['csv','start','end','output']:parser.add_argument('--'+name,required=True)
    args=parser.parse_args();data=build(args.csv,args.start,args.end)
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n');print(output)

if __name__=='__main__':main()
