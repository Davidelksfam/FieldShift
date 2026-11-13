"""Create native regional extracts from previously verified science files.

A single cached day/scene never becomes a complete regional time series.
"""
import hashlib,json
from pathlib import Path
import numpy as np
import h5py,netCDF4,rasterio
from rasterio.warp import transform_bounds
from rasterio.windows import Window,from_bounds
from acquire_research import ROOT

def finite(v):
 if np.ma.is_masked(v):return None
 if isinstance(v,np.ndarray):v=v.item()
 if isinstance(v,np.generic):v=v.item()
 if isinstance(v,float) and not np.isfinite(v):return None
 return v

def run():
 config=json.loads((ROOT/'scripts/data/config/regions/delta-fayoum.json').read_text())
 index=json.loads((ROOT/'data/manifests/dataset-readiness.json').read_text())
 outdir=ROOT/'web/public/data/regions/20261113T123805653050Z';outdir.mkdir(parents=True,exist_ok=True)
 for region in config['regions']:
  w,s,e,n=region['bbox']
  for src in index['sources']:
   sid=src['sourceId']
   if sid not in ['imerg','smap','hls','ecostress']:continue
   record=json.loads((ROOT/src['manifestPath']).read_text())
   manifest_path=src['manifestPath']
   if sid in ['hls','ecostress']:
    for p in sorted((ROOT/'data/manifests/research-runs').glob('*/'+sid+'.json')):
     candidate=json.loads(p.read_text())
     if candidate['status']=='science_downloaded' and candidate['scope']['point']==region['samplePoint']:
      record=candidate;manifest_path=str(p.relative_to(ROOT))
   files=[a for a in record['artifacts'] if a['kind']=='science']
   result={'schemaVersion':'regional-native-extract-1.0','regionId':region['regionId'],'sourceId':sid,
    'requestedBbox':region['bbox'],'observationPeriod':{'start':record['granule']['time_start'],'end':record['granule']['time_end']},
    'fullPeriodDownloaded':False,'qualityStatus':'native_QA_retained_not_approved_model_input',
    'sourceManifest':manifest_path,'records':[]}
   if sid=='imerg':
    with netCDF4.Dataset(ROOT/files[0]['path']) as d:
     lon=d['lon'][:];lat=d['lat'][:];xs=np.where((lon>=w)&(lon<=e))[0];ys=np.where((lat>=s)&(lat<=n))[0]
     a=d['precipitation'][0,xs,ys]
     for ix,x in enumerate(xs):
      for iy,y in enumerate(ys):result['records'].append({'longitude':float(lon[x]),'latitude':float(lat[y]),'precipitation':finite(a[ix,iy]),'unit':d['precipitation'].units,'count':finite(d['precipitation_cnt'][0,x,y])})
   elif sid=='smap':
    with h5py.File(ROOT/files[0]['path']) as d:
     for suffix in ['AM','PM']:
      g=d['Soil_Moisture_Retrieval_Data_'+suffix]
      def key(k):return k if k in g else k+'_pm'
      a=g[key('latitude_centroid')][:];b=g[key('longitude_centroid')][:]
      rows,cols=np.where((a>=s)&(a<=n)&(b>=w)&(b<=e))
      for y,x in zip(rows,cols):
       value=finite(g[key('soil_moisture')][y,x])
       result['records'].append({'pass':suffix,'latitude':float(a[y,x]),'longitude':float(b[y,x]),
        'soilMoisture':None if value==-9999 else value,'unit':'m3/m3','retrievalQualFlag':int(g[key('retrieval_qual_flag')][y,x]),'surfaceFlag':int(g[key('surface_flag')][y,x])})
     result['coverageNote']='Only actual geolocated retrievals within envelope; unobserved cells and recommended-QA coverage are unknown. No distant cells substituted.'
   else:
    for artifact in files:
     with rasterio.open(ROOT/artifact['path']) as d:
      box=transform_bounds('EPSG:4326',d.crs,*region['bbox'],densify_pts=21)
      try:window=from_bounds(*box,transform=d.transform).round_offsets().round_lengths().intersection(Window(0,0,d.width,d.height))
      except rasterio.errors.WindowError:
       result['records'].append({'layer':Path(artifact['path']).name,'status':'outside_raster'});continue
      a=d.read(1,window=window);valid=d.read_masks(1,window=window)>0
      values=a[valid]; values=values[np.isfinite(values)]
      result['records'].append({'layer':Path(artifact['path']).name,'status':'partial_region_raster',
       'pixelCount':int(a.size),'validPixels':int(values.size),'nativeCrs':d.crs.to_string(),
       'pixelSize':list(d.res),'scale':d.scales[0],'offset':d.offsets[0],'nativeUnitAttribute':d.units[0],
       'rawRange':None if not values.size else [float(values.min()),float(values.max())]})
    result['coverageNote']='Statistics of overlap with cached scene only; remaining envelope and dates not imported. Pixel validity is nodata validity, not product-QA approval.'
   result['recordCount']=len(result['records'])
   dest=outdir/(region['regionId']+'-'+sid+'.json');dest.write_text(json.dumps(result,separators=(',',':'),allow_nan=False)+'\n')
   print(region['regionId'],sid,'records',len(result['records']),flush=True)

if __name__=='__main__':run()
