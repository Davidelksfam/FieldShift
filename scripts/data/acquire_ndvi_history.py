"""Acquire 2020–24 same-pixel summer NDVI/QA and publish reproducible peak climatology."""
from acquire_benchmarks import ROOT,REGIONS
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone,date
import hashlib,json,time
RAW=ROOT/'data/raw/ndvi-history';MANIFEST=ROOT/'data/manifests/ndvi-history.json'

def jobs():
 for region,(lat,lon) in REGIONS.items():
  for year in range(2020,2025):
   for band in ['250m_16_days_NDVI','250m_16_days_pixel_reliability']:
    key=f'{region}/{year}/{band}'
    yield key,f'https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude={lat}&longitude={lon}&band={band}&startDate=A{year}129&endDate=A{year}273&kmAboveBelow=0&kmLeftRight=0'

def fetch(key,url,old):
 path=RAW/f'{key}.json';previous=old.get(key,{})
 if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==previous.get('sha256'):return previous
 r={'key':key,'url':url,'status':'unavailable','localPath':str(path.relative_to(ROOT))}
 for attempt in range(2):
  try:
   with urlopen(url,timeout=45) as response:data=response.read();json.loads(data)
   path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
   return {**r,'status':'downloaded','retrievedAt':datetime.now(timezone.utc).isoformat(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
  except Exception as e:r['error']=str(e)
 return r

def main():
 old=json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'requests':[]};indexed={r['key']:r for r in old['requests']}
 with ThreadPoolExecutor(max_workers=3) as pool:
  for future in as_completed([pool.submit(fetch,k,u,indexed) for k,u in jobs()]):
   r=future.result();indexed[r['key']]=r;print(r['key'],r['status'],flush=True)
   MANIFEST.write_text(json.dumps({'requests':sorted(indexed.values(),key=lambda x:x['key'])},indent=2)+'\n')
 snapshots=json.loads((ROOT/'src/data/observedBenchmarks.json').read_text());output={}
 def load(key):
  r=indexed[key];path=ROOT/r['localPath']
  if r['status']!='downloaded' or hashlib.sha256(path.read_bytes()).hexdigest()!=r['sha256']:raise ValueError('Missing/hash-mismatched history')
  return json.loads(path.read_text())
 for region,(lat,lon) in REGIONS.items():
  years=[]
  for year in range(2020,2025):
   try:
    ndvi=load(f'{region}/{year}/250m_16_days_NDVI');qa=load(f'{region}/{year}/250m_16_days_pixel_reliability')
    expected_grid=snapshots[region]['sources']['ndvi']['quality']['nativePixel']
    for key in ['xllcorner','yllcorner','cellsize','nrows','ncols']:
     if ndvi[key]!=qa[key] or ndvi[key]!=expected_grid[key]:raise ValueError('Historical pixel mismatch')
    if float(ndvi['scale'])!=.0001:raise ValueError('Wrong scale')
    qualities={p['calendar_date']:p for p in qa['subset']};valid=[];seen=set()
    for p in ndvi['subset']:
     stamp=p['calendar_date'];day=date.fromisoformat(stamp)
     if stamp in seen or day.year!=year or not 5<=day.month<=9:raise ValueError('Invalid date')
     seen.add(stamp);q=qualities.get(stamp)
     if q and q['tile']==p['tile'] and q['data']==[0] and len(p['data'])==1 and -2000<=p['data'][0]<=10000:valid.append(p['data'][0]*.0001)
    accepted=len(seen)==10 and len(valid)>=8
    years.append({'year':year,'validComposites':len(valid),'expectedComposites':10,'peak':round(max(valid),4) if accepted else None,'accepted':accepted})
   except Exception as e:years.append({'year':year,'peak':None,'accepted':False,'reason':str(e)})
  output[region]={'lat':lat,'lon':lon,'years':years,'policy':'2020–2024 annual May–Sep peak; >=8/10 good QA=0 composites/year; same native pixel; >=3 accepted years for sample z-score. Baseline excludes 2025.','retrievedAt':max(r.get('retrievedAt','') for r in indexed.values() if r['key'].startswith(region))}
 (ROOT/'src/data/ndviHistory.json').write_text(json.dumps(output,indent=2)+'\n')
 print(json.dumps(output,indent=2),flush=True)
if __name__=='__main__':main()
