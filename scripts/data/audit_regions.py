"""Inventory both study envelopes and acquire complete-period sampled POWER.

CMR inventory is metadata, never proof of downloaded or QA-valid regional pixels.
Uses bounded reads, immutable raw files and explicit partial status.
"""
import argparse
import calendar
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, date
from pathlib import Path
from urllib.parse import urlencode

from acquire_research import ROOT, REGISTRY, CMR, read_http, decode_json, power_rows


def validate_regions(config):
    ids=set()
    for region in config['regions']:
        if region['regionId'] in ids:raise ValueError('Duplicate region')
        ids.add(region['regionId'])
        w,s,e,n=region['bbox']
        if not (-180<=w<e<=180 and -90<=s<n<=90):raise ValueError('Invalid bounding box')
        p=region['samplePoint']
        if not (w<=p['longitude']<=e and s<=p['latitude']<=n):raise ValueError('Point outside region')
    if date.fromisoformat(config['startDate'])>date.fromisoformat(config['endDateInclusive']):raise ValueError('Reversed dates')


def months(start,end):
    d=date.fromisoformat(start).replace(day=1);last=date.fromisoformat(end)
    while d<=last:
        upper=date(d.year,d.month,calendar.monthrange(d.year,d.month)[1])
        yield max(d,date.fromisoformat(start)),min(upper,last)
        d=date(d.year+1,1,1) if d.month==12 else date(d.year,d.month+1,1)


def grid_points(bbox,step=0.5):
    w,s,e,n=bbox
    # Region-wide sampling lattice, not a claim of source-native grid alignment.
    y=s+min(step/2,(n-s)/2)
    while y<n:
        x=w+min(step/2,(e-w)/2)
        while x<e:
            yield round(x,6),round(y,6)
            x+=step
        y+=step


def run(config,with_weather=True):
    validate_regions(config)
    run_id=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    raw=ROOT/'data/raw/regions'/run_id;raw.mkdir(parents=True)
    output=ROOT/'web/public/data/regions'/run_id;output.mkdir(parents=True)
    sources=decode_json(REGISTRY.read_bytes())['sources']
    result={'schemaVersion':'regional-import-index-1.0','runId':run_id,'configuration':config,
            'regions':[],'warning':'Metadata availability and sampled weather are not full QA-valid satellite imports.'}
    def save(name,url):
        body,_,_=read_http(url,limit=8_000_000)
        data=decode_json(body);sha=hashlib.sha256(body).hexdigest()
        path=raw/(sha[:12]+'-'+name);path.write_bytes(body)
        return data,{'path':str(path.relative_to(ROOT)),'sha256':sha,'byteCount':len(body),'sourceUrl':url}
    for region in config['regions']:
        row={'regionId':region['regionId'],'bbox':region['bbox'],'sources':[]}
        for source in sources:
            sid=source['id'];item={'sourceId':sid,'guidePath':source['guide'],
                'importStatus':'not_regionally_imported','fullPeriodDownloaded':False,
                'qaStatus':'not_evaluated','inventory':[],'artifacts':[]}
            if sid=='soilgrids':
                item.update(nativeMeaning='Static predicted property/depth/statistic rasters',
                            requiredProperties=['phh2o','clay','sand','silt','soc'],
                            requiredDepthsCm=[[0,5],[5,15],[15,30],[30,60],[60,100],[100,200]],
                            requiredStatistics=['mean','Q05','Q95'],
                            missingRequirement='Region-wide soil properties/depths/uncertainty; existing pH point sample is insufficient')
            elif sid=='power' and with_weather:
                points=list(grid_points(region['bbox']))
                def weather(point):
                    lon,lat=point
                    q={'parameters':','.join(source['parameters']),'community':'AG','longitude':lon,'latitude':lat,
                       'start':config['startDate'].replace('-',''),'end':config['endDateInclusive'].replace('-',''),
                       'format':'JSON','time-standard':'UTC'}
                    try:
                        d,a=save('power.json',source['endpoint']+'?'+urlencode(q));normalized=power_rows(d)
                        expected=(date.fromisoformat(config['endDateInclusive'])-date.fromisoformat(config['startDate'])).days+1
                        if len(normalized['rows'])!=expected:raise ValueError('Missing dates')
                        nulls=sum(v is None for r in normalized['rows'] for v in r['values'].values())
                        path=output/(region['regionId']+f'-power-{lon}-{lat}.json')
                        path.write_text(json.dumps({'regionId':region['regionId'],'point':{'longitude':lon,'latitude':lat},
                            'timeStandard':'UTC','qualityStatus':'research_weather_not_field_station',
                            'sourceArtifact':a,**normalized},separators=(',',':'),allow_nan=False)+'\n')
                        return {'point':[lon,lat],'days':len(normalized['rows']),'nullValues':nulls,'artifact':a,
                                'normalizedPath':str(path.relative_to(ROOT))}
                    except Exception as exc:return {'point':[lon,lat],'errorCode':type(exc).__name__}
                with ThreadPoolExecutor(max_workers=3) as pool:observations=list(pool.map(weather,points))
                good=[x for x in observations if 'errorCode' not in x]
                item.update(importStatus='sampled_weather_imported' if len(good)==len(points) else 'partial_weather_import',
                            fullPeriodDownloaded=len(good)==len(points) and all(x['nullValues']==0 for x in good),
                            spatialMeaning='0.5 degree study sampling lattice; NOT field data or native-grid independent samples',
                            points=observations,qaStatus='units_dates_fill_checked')
            else:
                product=source.get('pinnedFullGranuleAlternative',source)
                def inventory(interval):
                    start,end=interval
                    q={'short_name':product['shortName'],'version':product['version'],
                       'bounding_box':','.join(map(str,region['bbox'])),
                       'temporal':f'{start}T00:00:00Z,{end}T23:59:59Z','page_size':1,'sort_key':'start_date'}
                    try:
                        d,a=save(sid+'-inventory.json',CMR+'granules.json?'+urlencode(q))
                        entries=d['feed']['entry']
                        return {'startDate':str(start),'endDateInclusive':str(end),'hasMatchingGranule':bool(entries),
                                'exampleGranuleId':entries[0]['id'] if entries else None,'artifact':a,
                                'note':'One inventory example only; not all granules or pixel coverage'}
                    except Exception as exc:return {'startDate':str(start),'endDateInclusive':str(end),'errorCode':type(exc).__name__}
                with ThreadPoolExecutor(max_workers=3) as pool:item['inventory']=list(pool.map(inventory,months(config['startDate'],config['endDateInclusive'])))
                item['importStatus']='catalog_inventory_only'
                item['nativeMeaning']='MODIS native composite' if sid=='modis_mod13q1' else 'Native product support and QA retained by source guide'
            row['sources'].append(item)
            print(region['regionId'],sid,item['importStatus'],flush=True)
        result['regions'].append(row)
    dest=ROOT/'data/manifests/regions'/run_id;dest.mkdir(parents=True)
    (dest/'import-index.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print('Regional index:',dest.relative_to(ROOT),flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=Path,required=True)
    p.add_argument('--inventory-only',action='store_true');a=p.parse_args()
    run(decode_json(a.config.read_bytes()),not a.inventory_only)
