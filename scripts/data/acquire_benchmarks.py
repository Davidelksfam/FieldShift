"""Acquire small official source subsets. Raw bytes stay ignored; hash manifests are tracked.
Python 3 stdlib only. Run at repo root; --offline rebuilds from verified local raw files.
"""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import argparse, hashlib, json, time

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'data/raw/benchmark-2025'
MANIFEST = ROOT / 'data/manifests/benchmark-acquisition.json'
REGIONS = {
 'fayoum_etsa': (29.2315, 30.7952),
 'delta_kafr_el_sheikh': (31.1107, 30.9388),
 'west_delta_nubariya': (30.6650, 30.0680),
}

def jobs():
 for region, (lat, lon) in REGIONS.items():
  yield f'{region}/power', f'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN,PRECTOTCORR,EVPTRNS,GWETROOT,GWETTOP&community=AG&longitude={lon}&latitude={lat}&start=20250101&end=20251231&format=JSON'
  yield f'{region}/soil', f'https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=clay&property=sand&property=soc&property=nitrogen&property=phh2o&depth=0-5cm&depth=5-15cm&value=mean&value=Q0.05&value=Q0.95'
  for band in ['250m_16_days_NDVI', '250m_16_days_pixel_reliability']:
   for start,end in [('001','145'),('161','305'),('321','353')]:
    yield f'{region}/{band}-{start}-{end}', f'https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude={lat}&longitude={lon}&band={band}&startDate=A2025{start}&endDate=A2025{end}&kmAboveBelow=0&kmLeftRight=0'

def acquire(key, url, old, offline=False):
 path = RAW / f'{key}.json'; previous = old.get(key, {})
 record = {'key': key, 'url': url, 'localPath': str(path.relative_to(ROOT)), 'status': 'unavailable'}
 if path.exists() and previous.get('sha256') == hashlib.sha256(path.read_bytes()).hexdigest():
  return previous
 if offline: return {**record, 'error': 'No locally verified raw response'}
 for attempt in range(2):
  try:
   with urlopen(Request(url, headers={'User-Agent':'FieldShift-research/0.1 (point subset audit)'}), timeout=50) as response:
    data=response.read(); json.loads(data)
    path.parent.mkdir(parents=True, exist_ok=True);path.write_bytes(data)
    return {**record, 'status':'downloaded', 'httpStatus':response.status, 'retrievedAt':datetime.now(timezone.utc).isoformat(), 'sha256':hashlib.sha256(data).hexdigest(), 'bytes':len(data), 'contentType':response.headers.get('Content-Type')}
  except Exception as error:
   record['error'] = str(error)
   if isinstance(error, HTTPError):record['httpStatus']=error.code
   if isinstance(error, HTTPError) and error.code in [400,401,403,404]:break
   if attempt==0:time.sleep(1)
 return record

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');parser.add_argument('--source',choices=['power','soil','modis']);args=parser.parse_args()
 old=json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'requests':[]}
 indexed={r['key']:r for r in old['requests']}
 selected=[(k,u) for k,u in jobs() if not args.source or (args.source=='power' and k.endswith('/power')) or (args.source=='soil' and k.endswith('/soil')) or (args.source=='modis' and '250m_' in k)]
 with ThreadPoolExecutor(max_workers=3) as executor:
  futures=[executor.submit(acquire,k,u,indexed,args.offline) for k,u in selected]
  for future in as_completed(futures):
   record=future.result();indexed[record['key']]=record;print(record['key'],record['status'],record.get('bytes',record.get('error')),flush=True)
   MANIFEST.parent.mkdir(parents=True,exist_ok=True)
   MANIFEST.write_text(json.dumps({**old,'schemaVersion':1,'period':'2025-01-01/2025-12-31','requests':sorted(indexed.values(),key=lambda r:r['key'])},indent=2)+'\n')
if __name__=='__main__':main()
