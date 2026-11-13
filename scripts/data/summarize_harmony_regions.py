"""Create compact regional-context daily inputs from collected native subsets.

These are envelope means, not field measurements; missing dates remain explicit.
"""
import csv,hashlib,json,re
from collections import Counter,defaultdict
from datetime import date,datetime,timedelta
from pathlib import Path
import h5py,netCDF4,numpy as np
from acquire_research import ROOT

def array(v):return np.ma.asarray(v,dtype=float).filled(np.nan)
def scalar_stats(values,mask,support,weights=None):
 total=int(np.broadcast_to(support,mask.shape).sum());valid=int(mask.sum())
 if not valid:return None,0,total
 value=float(np.average(values[mask],weights=weights[mask] if weights is not None else None))
 return value,valid,total

def main():
 config=json.loads((ROOT/'scripts/data/config/regions/delta-fayoum.json').read_text())
 jobs=json.loads((ROOT/'data/manifests/regions/harmony-requests.json').read_text())['requests']
 output=ROOT/'web/public/data/regions/harmony-daily';output.mkdir(parents=True,exist_ok=True)
 for job in jobs:
  if not job.get('allListedOutputsDownloaded'):continue
  region=next(r for r in config['regions'] if r['regionId']==job['regionId']);w,s,e,n=region['bbox'];rows={}
  for record in job['outputs']:
   match=re.search(r'(?:_|\.)(20[0-9]{6})(?:_|-)',record['assetName'])
   if not match:raise ValueError('Cannot identify observation date')
   day=datetime.strptime(match[1],'%Y%m%d').date().isoformat()
   if job['sourceId']=='imerg':
    with netCDF4.Dataset(ROOT/record['path']) as d:
     if d['precipitation'].dimensions!=('time','lon','lat') or d['precipitation'].units!='mm/day':raise ValueError('Unexpected IMERG schema')
     value=array(d['precipitation'][0]);count=array(d['precipitation_cnt'][0]);lon=array(d['lon'][:])[:,None];lat=array(d['lat'][:])[None,:]
     support=(lon>=w)&(lon<=e)&(lat>=s)&(lat<=n)
     mask=np.isfinite(value)&(value>=0)&(count==48)&support
     weights=np.broadcast_to(np.cos(np.deg2rad(lat)),value.shape)
     mean,num,total=scalar_stats(value,mask,support,weights)
     if (day,'daily') in rows:raise ValueError('Duplicate IMERG day')
     rows[(day,'daily')]=(mean,num,total,record['sha256'])
   else:
    with h5py.File(ROOT/record['path']) as d:
     for overpass in ['AM','PM']:
      g=d['Soil_Moisture_Retrieval_Data_'+overpass]
      def key(name):return name if name in g else name+'_pm'
      dataset=g[key('soil_moisture')]
      if dataset.attrs['units']!='cm**3/cm**3':raise ValueError('Unexpected SMAP units')
      value=np.asarray(dataset,dtype=float);flag_dataset=g[key('retrieval_qual_flag')];flag=np.asarray(flag_dataset,dtype=np.uint16)
      lat=np.asarray(g[key('latitude')]);lon=np.asarray(g[key('longitude')])
      support=(lat>=s)&(lat<=n)&(lon>=w)&(lon<=e)
      mask=np.isfinite(value)&(value>=float(dataset.attrs['valid_min']))&(value<=float(dataset.attrs['valid_max']))&(flag!=flag_dataset.attrs['_FillValue'])&((flag&1)==0)&support
      mean,num,total=scalar_stats(value,mask,support)
      if (day,overpass) in rows:raise ValueError('Duplicate SMAP pass/day')
      rows[(day,overpass)]=(mean,num,total,record['sha256'])
  path=output/(job['regionId']+'-'+job['sourceId']+'.csv');start=date.fromisoformat(config['startDate']);end=date.fromisoformat(config['endDateInclusive'])
  with path.open('w',newline='') as f:
   writer=csv.writer(f,lineterminator='\n');writer.writerow(['date','pass','value','unit','valid_count','total_count','valid_fraction','status','source_sha256'])
   for i in range((end-start).days+1):
    day=str(start+timedelta(days=i))
    for overpass in ['daily'] if job['sourceId']=='imerg' else ['AM','PM']:
     item=rows.get((day,overpass));unit='mm/day' if job['sourceId']=='imerg' else 'm3/m3'
     if item is None:writer.writerow([day,overpass,'',unit,0,0,'','provider_inventory_gap','']);continue
     value,num,total,sha=item
     writer.writerow([day,overpass,'' if value is None else value,unit,num,total,num/total if total else '', 'valid_regional_context' if value is not None else 'no_QA_valid_pixels',sha])
  with path.open() as f:published=list(csv.DictReader(f))
  monthly=defaultdict(Counter)
  for row in published:monthly[row['date'][:7]][row['status']]+=1
  metadata={'regionId':job['regionId'],'sourceId':job['sourceId'],'period':[config['startDate'],config['endDateInclusive']],
   'interpretation':'Study-envelope context; no cultivated-field mask; not field measurements or an irrigation recommendation',
   'qaRecipe':'IMERG finite nonnegative daily rain and 48 valid half-hour samples, spherical area weights cos(latitude)' if job['sourceId']=='imerg' else 'SMAP finite volumetric fraction within native valid_min/max, non-fill retrieval flag and recommended retrieval bit 0 unset, separate AM/PM; native equal-area cell mean',
   'jobID':job['jobID'],'parentManifest':'data/manifests/regions/harmony-requests.json','nativeOutputs':len(job['outputs']),
   'gapPolicy':'Missing granules and dates with zero QA-valid pixels are unavailable, never zero or interpolated',
   'spatialDenominator':'Native cell centers inside the study envelope, including non-cropland',
   'csvSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
   'rowStatusCounts':dict(Counter(r['status'] for r in published)),
   'monthlyRowStatusCounts':dict(sorted(monthly.items())),
   'countInterpretation':'Counts are day/pass rows, not independent farm samples or cultivated area'}
  path.with_suffix('.metadata.json').write_text(json.dumps(metadata,indent=2)+'\n');print('Compact regional series:',path.relative_to(ROOT),flush=True)
if __name__=='__main__':main()
