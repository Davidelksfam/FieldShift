"""Publish an attributed, bounded sample bundle; no agricultural rule inference."""
import csv,json,hashlib
from collections import defaultdict,Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
folder=ROOT/'web/public/data/regions/20261113T123805653050Z'
csvpath=folder/'egypt-fayoum-power-30.75-29.55.csv';meta=json.loads(csvpath.with_suffix('.metadata.json').read_text())
months=defaultdict(list)
with csvpath.open() as f:
 for r in csv.DictReader(f):
  if r['date'].startswith('2025'):months[r['date'][:7]].append(r)
monthly=[{'month':m,'temperatureC':round(sum(float(r['T2M']) for r in rows)/len(rows),2),'rainfallMm':round(sum(float(r['PRECTOTCORR']) for r in rows),2),'days':len(rows)} for m,rows in sorted(months.items())]
context=json.loads((ROOT/'web/public/data/context-proposal/egypt-fayoum-2025.json').read_text())
catalog=json.loads((ROOT/'data/manifests/crop-shortlist.proposed.json').read_text())
sourceStatus=[]
readiness=json.loads((ROOT/'data/manifests/regions/readiness.json').read_text())
for source in next(r for r in readiness['regions'] if r['regionId']=='egypt-fayoum')['sources']:
 sourceStatus.append({'id':source['sourceId'],'temporalStatus':source['temporalStatus'],'qualityStatus':source['qualityStatus'],'ready':source['fullProductionReady']})
payload={'version':'prototype-sample-1.0','sampleId':'fayoum-power-30.75-29.55','name':'Fayoum study sample','coordinate':meta['point'],'period':{'start':'2025-01-01','end':'2025-12-31'},'annual':{'temperatureC':round(context['metrics']['meanAirTemperatureC']['value'],2),'rainfallMm':round(context['metrics']['periodRainfallMm']['value'],2),'weatherDays':365},'monthly':monthly,'sources':sourceStatus,'weatherProvenance':{'csvPath':str(csvpath.relative_to(ROOT)),'csvSha256':hashlib.sha256(csvpath.read_bytes()).hexdigest(),'sourceUrl':meta['sourceArtifact']['sourceUrl'],'dataStatus':'historical_modeled','support':'POWER query point, not a weather station or field sensor'},'crops':[{'id':c['cropId'],'name':c['nameEn'],'ar':c['nameAr'],'season':c['broadSeason'],'use':c['harvestUse']} for c in catalog['crops']], 'smap':json.loads((ROOT/'web/public/data/regions/harmony-daily/egypt-fayoum-smap.metadata.json').read_text())['rowStatusCounts'],'soilLayerCount':108,'limitations':['No cultivated-field boundary or spatial matching','No locally approved crop rules or irrigation demand estimates','Schedules and farmer budgets in the prototype are editable hypothetical test inputs']}
payload['weatherHandoff']=json.loads((ROOT/'web/public/data/weather-handoff/period-context.proposal-0.2.json').read_text())
payload['weatherFeature']=json.loads((ROOT/'web/public/data/weather-handoff/seasonal-features.v1.json').read_text())
payload['version']='prototype-sample-1.1'
output=ROOT/'web/src/lib/sample-data.json';output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n');print(output.relative_to(ROOT))
