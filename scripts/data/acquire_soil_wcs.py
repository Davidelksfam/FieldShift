"""Retrieve only the native 250 m SoilGrids cells containing three benchmark centroids."""
from acquire_benchmarks import ROOT, RAW, MANIFEST, REGIONS
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pyproj import Transformer, CRS
import hashlib, json, math, argparse, time
import rasterio

CRS_NATIVE = '+proj=igh +datum=WGS84 +units=m +no_defs'
TRANSFORM = Transformer.from_crs('EPSG:4326', CRS_NATIVE, always_xy=True)

def tasks():
 for region,(lat,lon) in REGIONS.items():
  x,y=TRANSFORM.transform(lon,lat);x0=math.floor(x/250)*250;y0=math.floor(y/250)*250
  for prop in ['clay','sand','soc','nitrogen','phh2o']:
   for depth in ['0-5cm','5-15cm']:
    for stat in ['mean','Q0.05','Q0.95']:
     coverage=f'{prop}_{depth}_{stat}'
     yield f'{region}/wcs/{coverage}',f'https://maps.isric.org/mapserv?map=/map/{prop}.map&SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID={coverage}&FORMAT=image/tiff&SUBSET=x({x0},{x0+250})&SUBSET=y({y0},{y0+250})',(x,y)

def acquire(key,url,point,old,offline):
 path=RAW/f'{key}.tif';record={'key':key,'url':url,'localPath':str(path.relative_to(ROOT)),'status':'unavailable'}
 previous=old.get(key,{})
 if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==previous.get('sha256'):return previous
 if offline:return {**record,'error':'No verified local file'}
 for attempt in range(2):
  try:
   with urlopen(Request(url,headers={'User-Agent':'FieldShift-research/0.1 (single cell)'}),timeout=40) as r:
    content=r.read();path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content)
   with rasterio.open(path) as ds:
    if ds.shape!=(1,1) or not CRS.from_user_input(ds.crs).equals(CRS.from_user_input(CRS_NATIVE),ignore_axis_order=True):raise ValueError('Wrong shape/CRS')
    x,y=point
    if not (ds.bounds.left<=x<ds.bounds.right and ds.bounds.bottom<=y<ds.bounds.top):raise ValueError('Raster does not contain centroid')
    cell=ds.read(1,masked=True)
    if cell.mask.any():raise ValueError('NoData cell')
    value=int(cell[0,0])
    if value<0 or value==65535:raise ValueError('Fill cell')
    return {**record,'status':'downloaded','httpStatus':200,'retrievedAt':datetime.now(timezone.utc).isoformat(),'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content),'rawValue':value,'nativeBounds':list(ds.bounds),'nativeCrs':CRS_NATIVE,'pixelSizeM':list(ds.res),'shape':list(ds.shape)}
  except Exception as e:
   record['error']=str(e)
   if attempt==0:time.sleep(1)
 return record

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');args=parser.parse_args()
 old=json.loads(MANIFEST.read_text());indexed={r['key']:r for r in old['requests']}
 with ThreadPoolExecutor(max_workers=3) as e:
  futures=[e.submit(acquire,k,u,p,indexed,args.offline) for k,u,p in tasks()]
  for future in as_completed(futures):
   record=future.result();indexed[record['key']]=record;print(record['key'],record['status'],record.get('rawValue',record.get('error')),flush=True)
   MANIFEST.write_text(json.dumps({**old,'requests':sorted(indexed.values(),key=lambda r:r['key'])},indent=2)+'\n')
if __name__=='__main__':main()
