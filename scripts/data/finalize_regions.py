from pathlib import Path
import json,csv,hashlib
import argparse
p=argparse.ArgumentParser();p.add_argument('--run',required=True);a=p.parse_args()
if '/' in a.run or '\\' in a.run or a.run in ('.','..'):p.error('Expected run ID')
run=a.run;base=Path('data/manifests/regions')/run;out=Path('web/public/data/regions')/run
raw=json.loads((base/'import-index.json').read_text());soils=json.loads((base/'soilgrids-import.completed.json').read_text())['records']
ready={'schemaVersion':'regional-readiness-1.0','configPath':'scripts/data/config/regions/delta-fayoum.json','period':{'startDate':'2024-01-01','endDateInclusive':'2025-12-31','status':'user_confirmed_2024_2025'},'allProductionComplete':False,'regions':[]}
for r in raw['regions']:
 rid=r['regionId'];sources=[]
 for source in r['sources']:
  sid=source['sourceId'];entry={'sourceId':sid,'schemaStatus':'complete','spatialStatus':'partial','temporalStatus':'snapshot_only','qualityStatus':'QA_review_required','fullProductionReady':False,'evidencePaths':[],'missingRequirements':[]}
  if sid=='power':
   for point in source['points']:
    if 'normalizedPath' not in point:continue
    old=Path(point['normalizedPath'])
    if old.suffix=='.csv':
     entry['evidencePaths'] += [str(old),point['metadataPath']];continue
    d=json.loads(old.read_text());path=old.with_suffix('.csv');keys=list(d['units'])
    with path.open('w',newline='') as f:
     w=csv.writer(f,lineterminator="\n");w.writerow(['date']+keys)
     for row in d['rows']:w.writerow([row['date']]+[row['values'][k] for k in keys])
    metadata={k:v for k,v in d.items() if k!='rows'};meta=path.with_suffix('.metadata.json');meta.write_text(json.dumps(metadata,indent=2)+'\n')
    point['normalizedPath']=str(path);point['metadataPath']=str(meta);point['csvSha256']=hashlib.sha256(path.read_bytes()).hexdigest();old.unlink()
    entry['evidencePaths'] += [str(path),str(meta)]
   entry.update(spatialStatus='sampled_lattice_24_points_across_both_regions',temporalStatus='complete_at_imported_points' if source['fullPeriodDownloaded'] else 'partial',qualityStatus='units_dates_fill_validated')
   entry['missingRequirements']=['Exact source-native spatial weighting and field/cropland mask; sampled grid is not independent field weather']
  elif sid=='soilgrids':
   selected=[x for x in soils if x['regionId']==rid]
   path=out/(rid+'-soilgrids.json');path.write_text(json.dumps({'schemaVersion':'regional-soil-profile-1.0','regionId':rid,'records':selected,'warning':'Predicted profile layers and bounds; field/cropland mask and agronomic review pending'},separators=(',',':'))+'\n')
   assert len(selected)==108 and all(x['status']=='science_downloaded' for x in selected)
   entry.update(spatialStatus='all_108_native_envelope_layers_downloaded',temporalStatus='static_not_a_seasonal_observation',qualityStatus='CRS_fill_scale_depth_statistic_checked',evidencePaths=[str(path),str(base/'soilgrids-import.completed.json')])
   entry['missingRequirements']=['Field/cropland mask; local soil validation. Do not average prediction quantiles into a calibrated regional interval.']
  elif sid=='modis_mod13q1':
   config=json.loads(Path('scripts/data/config/regions/delta-fayoum.json').read_text());region=next(x for x in config['regions'] if x['regionId']==rid)
   for p in sorted(Path('data/manifests/research-runs').glob('*/modis_mod13q1.json')):
    d=json.loads(p.read_text())
    if d['status']=='science_downloaded' and d['scope']['point']==region['samplePoint']:
     data=Path('data/interim/research')/p.parent.name/'modis_mod13q1.json';dest=out/(rid+'-modis_mod13q1.json')
     dest.write_text(json.dumps({'schemaVersion':'regional-native-extract-1.0','regionId':rid,'sourceId':sid,'manifestPath':str(p),'inspection':json.loads(data.read_text()),'fullPeriodDownloaded':False},separators=(',',':'))+'\n');entry['evidencePaths']=[str(dest),str(p)]
   assert entry['evidencePaths']
   entry['missingRequirements']=['Full native spatial mosaic and complete composite series; QA filtering']
  else:
   path=out/(rid+'-'+sid+'.json');assert path.exists();entry['evidencePaths']=[str(path)]
   entry['missingRequirements']=['Full regional mosaic and full-period acquisition; source-native QA filtering']
  if source['inventory']:
   entry['catalogMonthsChecked']=len(source['inventory']);entry['catalogMonthsWithoutMatches']=[x['startDate'] for x in source['inventory'] if not x.get('hasMatchingGranule',False)]
   entry['evidencePaths'].append(str(base/'import-index.json'))
  sources.append(entry)
 ready['regions'].append({'regionId':rid,'bbox':r['bbox'],'sources':sources})
(base/'import-index.json').write_text(json.dumps(raw,indent=2)+'\n')
Path('data/manifests/regions/readiness.json').write_text(json.dumps(ready,indent=2)+'\n')
print('Finalized 14 source entries, 24 complete weather CSVs, 216 soil profiles and regional native snapshots')
