"""Acquire native regional SoilGrids profiles, preserving mean and prediction bounds."""
import sys,json,math,hashlib,time,argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from acquire_research import read_http,is_science_binary,soil_coverage_id
from urllib.parse import urlencode
from pyproj import CRS,Transformer
from rasterio.io import MemoryFile
from rasterio.warp import transform_bounds
import numpy as np
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',required=True,type=Path);parser.add_argument('--run',required=True)
args=parser.parse_args()
if '/' in args.run or '\\' in args.run or args.run in ('.','..'):parser.error('Expected run ID')
config=json.loads(args.config.read_text());run=args.run
prior_path=Path('data/manifests/regions')/run/'soilgrids-import.json'
prior=json.loads(prior_path.read_text())['records'] if prior_path.exists() else []
cache={(x['regionId'],x['property'],tuple(x['depthCm']),x['statistic']):x for x in prior if x['status']=='science_downloaded'}
root=Path('data/raw/regions')/run/'soilgrids';root.mkdir(parents=True,exist_ok=True)
native=CRS.from_proj4('+proj=igh +datum=WGS84 +units=m +no_defs')
properties={'phh2o':(10,'pH'),'clay':(10,'%'),'sand':(10,'%'),'silt':(10,'%'),'soc':(10,'g/kg'),'bdod':(100,'g/cm3')}
depths=['0-5','5-15','15-30','30-60','60-100','100-200']
jobs=[(r,p,d,stat) for r in config['regions'] for p in properties for d in depths for stat in ['mean','Q05','Q95']]
def f(job):
 r,p,d,stat=job
 cached=cache.get((r['regionId'],p,tuple(map(int,d.split('-'))),stat))
 if cached and hashlib.sha256(Path(cached['artifact']['path']).read_bytes()).hexdigest()==cached['artifact']['sha256']:return cached
 coverage=soil_coverage_id(p,d,stat)
 out={'regionId':r['regionId'],'property':p,'depthCm':list(map(int,d.split('-'))),'statistic':stat,'coverageId':coverage,'unit':properties[p][1],'status':'unavailable','valueType':'predicted_soil_property'}
 w,s,e,n=transform_bounds('EPSG:4326',native.to_wkt(),*r['bbox'],densify_pts=21)
 params=[('map',f'/map/{p}.map'),('SERVICE','WCS'),('VERSION','2.0.1'),('REQUEST','GetCoverage'),('COVERAGEID',coverage),('SUBSET',f'X({math.floor(w/250)*250},{math.ceil(e/250)*250})'),('SUBSET',f'Y({math.floor(s/250)*250},{math.ceil(n/250)*250})'),('FORMAT','image/tiff')]
 url='https://maps.isric.org/mapserv?'+urlencode(params)
 for attempt in range(2):
  try:
   b,_,_=read_http(url,limit=16_000_000)
   if not is_science_binary(b):raise ValueError('Not TIFF')
   sha=hashlib.sha256(b).hexdigest();dest=root/(sha[:12]+'-'+r['regionId']+'-'+coverage+'.tif');dest.write_bytes(b)
   with MemoryFile(b) as mem,mem.open() as raster:
    a=raster.read(1);mask=raster.read_masks(1)>0;valid=a[mask].astype(float)/properties[p][0]
    out.update(status='science_downloaded',shape=list(a.shape),validPixels=int(mask.sum()),totalPixels=int(mask.size),validPixelFraction=float(mask.mean()),nativeCrsWkt=raster.crs.to_wkt(),nativeBounds=list(raster.bounds),pixelSizeM=list(raster.res),nativeToCanonicalDivisor=properties[p][0],range=None if not len(valid) else [float(valid.min()),float(valid.max())],artifact={'path':str(dest),'sha256':sha,'byteCount':len(b),'sourceUrl':url})
   return out
  except Exception as exc:out['errorCode']=type(exc).__name__
 return out
with ThreadPoolExecutor(max_workers=2) as pool:
 results=[]
 for i,item in enumerate(pool.map(f,jobs)):
  results.append(item)
  if (i+1)%12==0:print('Soil layers processed',i+1,'/',len(jobs),flush=True)
  Path('data/manifests/regions/'+run+'/soilgrids-import.completed.json').write_text(json.dumps({'scope':'Study-envelope rasters; field/cropland mask pending','records':results},indent=2)+'\n')
print('Soil downloaded',sum(x['status']=='science_downloaded' for x in results),'/',len(results),flush=True)
