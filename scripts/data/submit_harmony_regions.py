"""Submit region-only Harmony jobs; requires explicit --submit and EARTHDATA_TOKEN."""
import argparse
p=argparse.ArgumentParser(description=__doc__);p.add_argument("--submit",action="store_true");a=p.parse_args()
if not a.submit:
 print("Ready: two regions, IMERG/SMAP with quality variables, 2024–2025; pass --submit to execute")
 raise SystemExit(0)
import sys,os,json
from pathlib import Path
from urllib.parse import urlencode

from acquire_research import read_http
cfg=json.loads(Path('scripts/data/config/regions/delta-fayoum.json').read_text())
prior=Path('data/manifests/regions/harmony-requests.json')
requests=json.loads(prior.read_text())['requests'] if prior.exists() else []
existing={(x['sourceId'],x['regionId']) for x in requests if x.get('jobID')}
for sid in ['imerg','smap']:
 cap=json.loads(Path('data/manifests/regions/harmony-capabilities/'+sid+'.json').read_text())
 names=['precipitation','precipitation_cnt','randomError'] if sid=='imerg' else ['Soil_Moisture_Retrieval_Data_AM/soil_moisture','Soil_Moisture_Retrieval_Data_AM/retrieval_qual_flag','Soil_Moisture_Retrieval_Data_AM/surface_flag','Soil_Moisture_Retrieval_Data_PM/soil_moisture_pm','Soil_Moisture_Retrieval_Data_PM/retrieval_qual_flag_pm','Soil_Moisture_Retrieval_Data_PM/surface_flag_pm']
 variables=[v['href'].rsplit('/',1)[-1] for v in cap['variables'] if v['name'] in names]
 assert len(variables)==len(names)
 for region in cfg['regions']:

  if (sid,region['regionId']) in existing:continue
  w,s,e,n=region['bbox'];query=[('subset',f'lon({w}:{e})'),('subset',f'lat({s}:{n})'),('subset','time("2024-01-01T00:00:00Z":"2025-12-31T23:59:59Z")'),('format','application/netcdf'),('forceAsync','true'),('skipPreview','true'),('ignoreErrors','false'),('label','fieldshift-'+region['regionId']+'-'+sid+'-2024-2025')]
  url='https://harmony.earthdata.nasa.gov/'+cap['conceptId']+'/ogc-api-coverages/1.0.0/collections/'+','.join(variables)+'/coverage/rangeset?'+urlencode(query)
  record={'sourceId':sid,'regionId':region['regionId'],'requestUrl':url,'variables':names,'sourceCollectionId':cap['conceptId'],'status':'not_submitted'}
  try:
   b,_,_=read_http(url,headers={'Authorization':'Bearer '+os.environ['EARTHDATA_TOKEN']});d=json.loads(b);Path('work/'+region['regionId']+'-'+sid+'-harmony-response.json').write_bytes(b)
   record.update(jobID=d.get('jobID'),status=d.get('status','response_received'),progress=d.get('progress'))
  except Exception as exc:record.update(status='submission_failed',errorCode=type(exc).__name__,httpStatus=getattr(exc,'code',None))
  requests.append(record);print(sid,region['regionId'],record['status'],record.get('httpStatus'),flush=True)
  Path('data/manifests/regions/harmony-requests.json').write_text(json.dumps({'requests':requests},indent=2)+'\n')
