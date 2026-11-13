"""Validate raw-byte hashes, clean sources without interpolation, publish audited snapshots."""
from acquire_benchmarks import ROOT, MANIFEST, REGIONS
from datetime import date,timedelta
from collections import Counter
import hashlib,json,math
import rasterio

DIVISORS={'clay':10,'sand':10,'soc':10,'nitrogen':100,'phh2o':10}
FIELDS={'tmax':'T2M_MAX','tmin':'T2M_MIN','precipitation':'PRECTOTCORR','evapotranspiration':'EVPTRNS','rootWetness':'GWETROOT','topWetness':'GWETTOP'}
UNITS={'T2M_MAX':'C','T2M_MIN':'C','PRECTOTCORR':'mm/day','EVPTRNS':'MJ/m^2/day','GWETROOT':'1','GWETTOP':'1'}
RANGES={'tmax':(-90,65),'tmin':(-90,60),'precipitation':(0,500),'evapotranspiration':(-50,50),'rootWetness':(0,1),'topWetness':(0,1)}

def number(value):return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def write(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2,allow_nan=False)+'\n')

def clean_power(payload):
 for key,unit in UNITS.items():
  if payload['parameters'][key]['units']!=unit:raise ValueError(f'Unrecognized POWER units for {key}')
 params=payload['properties']['parameter'];daily=[];invalid=Counter()
 expected={(date(2025,1,1)+timedelta(days=i)).strftime('%Y%m%d') for i in range(365)}
 for series in params.values():
  if set(series)-expected:raise ValueError('Unexpected dates in POWER')
 for i in range(365):
  day=date(2025,1,1)+timedelta(days=i);stamp=day.strftime('%Y%m%d');point={'date':day.isoformat()}
  for field,key in FIELDS.items():
   value=params[key].get(stamp);low,high=RANGES[field]
   if not number(value) or value<=-900 or not low<=value<=high:invalid[field]+=1;value=None
   point[field]=value
  if point['tmax'] is not None and point['tmin'] is not None and point['tmax']<point['tmin']:raise ValueError('Daily Tmax below Tmin')
  daily.append(point)
 summer=[d['tmax'] for d in daily if '05'<=d['date'][5:7]<='09' and d['tmax'] is not None]
 wet=[d['rootWetness'] for d in daily if d['rootWetness'] is not None]
 if len(summer)!=153 or any(invalid.values()):raise ValueError(f'Incomplete climate coverage: {invalid}')
 return {'climateDaily':daily,'summerMaxTemps':summer,'avgRootWetness':sum(wet)/len(wet)}, {'expectedDays':365,'validByVariable':{k:365-invalid[k] for k in FIELDS},'summerValidDays':len(summer),'heatDaysAbove38C':sum(t>38 for t in summer),'missingOrRejected':dict(invalid),'interpolated':0,'powerGridCentroid':payload['geometry']['coordinates'],'nativeHeader':payload['header'],'units':UNITS}

def clean_ndvi(ndvi_chunks,qa_chunks):
 def index(chunks):
  result={}
  for chunk in chunks:
   if chunk['nrows']!=1 or chunk['ncols']!=1:raise ValueError('Expected one MODIS pixel')
   for row in chunk['subset']:
    day=row['calendar_date'];date.fromisoformat(day)
    if day in result:raise ValueError('Duplicate MODIS date')
    result[day]=row
  return result
 ndvi=index(ndvi_chunks);qa=index(qa_chunks)
 expected={(date(2025,1,1)+timedelta(days=i)).isoformat() for i in range(0,365,16)}
 if set(ndvi)!=expected or set(qa)!=expected:raise ValueError('Missing/unexpected MODIS dates')
 for chunk,q in zip(ndvi_chunks,qa_chunks):
  if float(chunk['scale'])!=.0001:raise ValueError('Wrong NDVI scale')
  for key in ['xllcorner','yllcorner','cellsize','nrows','ncols']:
   if chunk[key]!=q[key]:raise ValueError('Misaligned QA and NDVI grids')
 series=[];counts=Counter()
 for day in sorted(expected):
  raw=ndvi[day]['data'][0];quality=qa[day]['data'][0]
  valid=number(raw) and -2000<=raw<=10000 and quality==0
  if not valid:counts['qaRejected' if quality!=0 else 'rangeRejected']+=1
  series.append({'date':day,'ndvi':round(raw*.0001,4) if valid else None,'pixelReliability':quality})
 valid=sum(p['ndvi'] is not None for p in series)
 autumn=[p for p in series if p['date']<'2025-12-01' and (date.fromisoformat(p['date'])+timedelta(days=16)).isoformat()>'2025-09-01']
 return series, {'expectedComposites':23,'validComposites':valid,'rejected':dict(counts),'autumnValidComposites':sum(p['ndvi'] is not None for p in autumn),'autumnTotalComposites':len(autumn),'qaPolicy':'pixel reliability == 0 (good); marginal/cloud/snow/fill masked to null; no interpolation','nativePixel':{k:ndvi_chunks[0][k] for k in ['xllcorner','yllcorner','cellsize','nrows','ncols']},'tiles':sorted({r['tile'] for r in ndvi.values()})}

def main():
 manifest=json.loads(MANIFEST.read_text());requests={r['key']:r for r in manifest['requests']}
 def raw(key):
  r=requests[key];p=ROOT/r['localPath']
  if r['status']!='downloaded' or sha(p)!=r['sha256']:raise ValueError(f'Raw hash mismatch/unavailable: {key}')
  return r,p
 snapshots={};report={};profiles={}
 for region,(lat,lon) in REGIONS.items():
  snapshot={'lat':lat,'lon':lon,'sources':{}};quality={};used=[]
  def load(key):
   r,p=raw(f'{region}/{key}');used.append(r);return json.loads(p.read_text())
  climate,q=clean_power(load('power'));snapshot.update(climate);quality['climate']=q
  snapshot['sources']['climate']={'provider':'NASA POWER / MERRA-2','kind':'observed','dataNature':'gridded reanalysis','status':'snapshot','url':requests[f'{region}/power']['url'],'retrievedAt':requests[f'{region}/power']['retrievedAt'],'period':'2025','quality':q}
  ndvi=[];qa=[]
  for start,end in [('001','145'),('161','305'),('321','353')]:
   ndvi.append(load(f'250m_16_days_NDVI-{start}-{end}'));qa.append(load(f'250m_16_days_pixel_reliability-{start}-{end}'))
  snapshot['ndviSeries'],q=clean_ndvi(ndvi,qa);quality['ndvi']=q
  snapshot['sources']['ndvi']={'provider':'ORNL MOD13Q1 (Terra)','kind':'observed','dataNature':'QA-screened satellite reflectance index','status':'snapshot','url':'https://modis.ornl.gov/data/modis_webservice.html','retrievedAt':max(r['retrievedAt'] for r in used if '250m_' in r['key']),'period':'2025','quality':q}
  soil={};depths={};soil_used=[]
  for prop,divisor in DIVISORS.items():
   depths[prop]={}
   for depth in ['0-5cm','5-15cm']:
    values={}
    for stat in ['mean','Q0.05','Q0.95']:
     r,p=raw(f'{region}/wcs/{prop}_{depth}_{stat}');soil_used.append(r)
     with rasterio.open(p) as ds:
      if ds.shape!=(1,1) or ds.res!=(250,250):raise ValueError('Wrong soil raster dimensions')
      cell=ds.read(1,masked=True)
      if cell.mask.any():raise ValueError('Masked soil cell')
      value=float(cell[0,0])
      if value<0 or value==65535:raise ValueError('Invalid soil fill')
      values[stat]=value/divisor
    if values['Q0.05']>values['Q0.95']:raise ValueError('Reversed quantiles')
    depths[prop][depth]=values
   soil[prop]=round((depths[prop]['0-5cm']['mean']+2*depths[prop]['5-15cm']['mean'])/3,6)
  valid_soil = 0<soil['phh2o']<14 and 0<=soil['clay']<=100 and 0<=soil['sand']<=100 and 0<soil['sand']+soil['clay']<=100
  if valid_soil:snapshot['soil']=soil
  profiles[region]={'depths':depths,'normalizedTop15cm':soil if valid_soil else None,'unitDivisors':DIVISORS,'note':'Depth-specific Q0.05/Q0.95 are prediction quantiles, not field measurements. Their depth-weighted combination is not a joint confidence interval.'}
  q={'status':'accepted' if valid_soil else 'rejected','reason':None if valid_soil else 'Zero-filled / physically invalid soil profile at the exact centroid; pH zero and texture sum zero. Do not use as soil data.','downloadedCells':len(soil_used),'validCells':len(soil_used) if valid_soil else 0,'expectedCells':30,'nativeBounds':soil_used[0]['nativeBounds'],'nativeCrs':soil_used[0]['nativeCrs'],'depthCm':[0,15],'method':'Native 250m cell containing centroid; 0–5 and 5–15 cm means thickness-weighted 1:2. No spatial resampling.','uncertaintyFile':'data/processed/soil-profiles.json'};quality['soil']=q
  if valid_soil:snapshot['sources']['soil']={'provider':'ISRIC SoilGrids 2.0 / WCS','kind':'observed','dataNature':'model prediction (not in-field measurement)','status':'snapshot','url':'https://maps.isric.org/','retrievedAt':max(r['retrievedAt'] for r in soil_used),'period':'SoilGrids 2.0 static prediction','quality':q}
  # Cross-check WCS against the point API when it actually returned a profile.
  api_record=requests.get(f'{region}/soil')
  if api_record and api_record['status']=='downloaded':
   _,api_path=raw(f'{region}/soil');api=json.loads(api_path.read_text());matched=0
   for layer in api['properties']['layers']:
    prop=layer['name']
    if layer['unit_measure']['d_factor']!=DIVISORS[prop]:raise ValueError('ISRIC conversion metadata mismatch')
    for depth in layer['depths']:
     for stat in ['mean','Q0.05','Q0.95']:
      if depth['values'][stat]/DIVISORS[prop] != depths[prop][depth['label']][stat]:raise ValueError('WCS / point API mismatch')
      matched+=1
   quality['soil']['pointApiCrossCheck']={'matchedValues':matched,'status':'all matched','note':'Two interfaces to the same model; not independent field validation.'}
  snapshots[region]=snapshot;report[region]=quality
 out=ROOT/'src/data/observedBenchmarks.json';write(out,snapshots)
 write(ROOT/'data/processed/soil-profiles.json',profiles)
 write(ROOT/'data/processed/quality-report.json',{'schemaVersion':1,'period':'2025','noInterpolation':True,'regions':report,'cleanedSha256':sha(out),'limitations':['Point subset is not field representativeness validation.','Reanalysis and soil predictions are model estimates, not farm measurements.','QA screening reduces cloud contamination; it does not prove every retained pixel is correct.','Crop thresholds and scores are not validated by this dataset audit.']})
 print(json.dumps({k:{'heatDays':q['climate']['heatDaysAbove38C'],'ndviValid':q['ndvi']['validComposites'],'soilCells':q['soil']['validCells']} for k,q in report.items()},indent=2))
if __name__=='__main__':main()
