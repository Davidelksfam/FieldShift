"""Retrieve missing FAO-56 meteorological drivers; do not convert EVPTRNS into ET0."""
from acquire_benchmarks import ROOT,REGIONS
from urllib.request import urlopen
from datetime import datetime,timezone
from concurrent.futures import ThreadPoolExecutor,as_completed
import json,hashlib,argparse

def acquire(item):
 region,(lat,lon)=item
 url=f'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PS&community=AG&longitude={lon}&latitude={lat}&start=20250101&end=20251231&format=JSON'
 path=ROOT/f'data/raw/reference-et/{region}.json'
 previous_path=ROOT/'data/manifests/reference-et.json'
 previous=json.loads(previous_path.read_text()).get(region) if previous_path.exists() else None
 if path.exists() and previous and hashlib.sha256(path.read_bytes()).hexdigest()==previous['sha256']:
  return region,json.loads(path.read_text()),previous
 if '--offline' in __import__('sys').argv:raise ValueError(f'Missing verified raw drivers: {region}')
 with urlopen(url,timeout=45) as r:raw=r.read();payload=json.loads(raw)
 path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
 record={'url':url,'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(raw).hexdigest(),'localPath':str(path.relative_to(ROOT)),'units':payload['parameters']}
 return region,payload,record

def main():
 out={};manifest={}
 with ThreadPoolExecutor(max_workers=3) as e:
  for f in as_completed([e.submit(acquire,i) for i in REGIONS.items()]):
   try:
    region,p,r=f.result();fields={'tmax':'T2M_MAX','tmin':'T2M_MIN','rh':'RH2M','wind':'WS2M','solar':'ALLSKY_SFC_SW_DWN','pressure':'PS'}
    expected={'T2M_MAX':'C','T2M_MIN':'C','RH2M':'%','WS2M':'m/s','ALLSKY_SFC_SW_DWN':'MJ/m^2/day','PS':'kPa'}
    for k,u in expected.items():
     if p['parameters'][k]['units']!=u:raise ValueError(f'Unit mismatch {k}: {p["parameters"][k]}')
    rows=[]
    for d in sorted(p['properties']['parameter']['T2M_MAX']):
     row={'date':f'{d[:4]}-{d[4:6]}-{d[6:]}'};row.update({k:p['properties']['parameter'][v].get(d) for k,v in fields.items()});rows.append(row)
    out[region]={'lat':REGIONS[region][0],'lon':REGIONS[region][1],'elevationM':p['geometry']['coordinates'][2],'daily':rows,'source':r};manifest[region]=r;print(region,'retrieved',len(rows),flush=True)
   except Exception as e:print('FAILED',str(e),flush=True)
 if len(out)!=3:raise ValueError('Incomplete driver retrieval; retaining existing release artifacts')
 (ROOT/'src/data/referenceEtDrivers.json').write_text(json.dumps(out,indent=2)+'\n');(ROOT/'data/manifests/reference-et.json').write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__':main()
