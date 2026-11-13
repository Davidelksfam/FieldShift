"""Inspect downloaded science at the public example point, preserving raw QA.

Requires requirements-geospatial.txt plus requirements-science.txt.
These are research extracts, not approved model features.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import h5py
import netCDF4
import numpy as np
import rasterio
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[2]


def scalar(value):
    if np.ma.is_masked(value): return None
    if isinstance(value, bytes): return value.decode('utf8', errors='replace')
    if isinstance(value, np.ndarray): return [scalar(x) for x in value.flat]
    if isinstance(value, np.generic): value = value.item()
    if isinstance(value, float) and not math.isfinite(value): return None
    return value


def extract(record):
    lon, lat = record['scope']['point']['longitude'], record['scope']['point']['latitude']
    files = [ROOT/a['path'] for a in record['artifacts'] if a['kind']=='science']
    result = {'scope':'EXPLORATORY RESEARCH SAMPLE; not an accepted farm pilot',
              'sourceId':record['sourceId'], 'point':record['scope']['point'],
              'qaApplied':False, 'granule':record['granule']}
    if record['sourceId']=='imerg':
        with netCDF4.Dataset(files[0]) as d:
            ix=int(np.argmin(abs(d['lon'][:]-lon))); iy=int(np.argmin(abs(d['lat'][:]-lat)))
            assert d['precipitation'].dimensions==('time','lon','lat')
            result.update(nativePoint={'longitude':float(d['lon'][ix]),'latitude':float(d['lat'][iy])},
                          variables={k:{'value':scalar(d[k][0,ix,iy]),'unit':d[k].units}
                                     for k in ['precipitation','randomError','precipitation_cnt']},
                          nativeDimensions=['time','lon','lat'])
    elif record['sourceId']=='smap':
        result['passes']={}
        with h5py.File(files[0]) as d:
            for suffix in ['AM','PM']:
                g=d['Soil_Moisture_Retrieval_Data_'+suffix]
                # V006 PM datasets use the _pm suffix; inspect keys explicitly.
                def key(name): return name if name in g else name+'_pm'
                a=g[key('latitude_centroid')][:]; b=g[key('longitude_centroid')][:]
                dist=(a-lat)**2+((b-lon)*math.cos(math.radians(lat)))**2
                dist[(abs(a)>90)|(abs(b)>180)]=np.inf
                iy,ix=np.unravel_index(np.argmin(dist),dist.shape)
                separation=float(math.sqrt(dist[iy,ix])*111.2)
                if separation > 15:
                    result['passes'][suffix]={'status':'no_local_retrieval',
                        'value':None,'nearestAvailableDistanceKmApprox':separation,
                        'note':'No retrieval centroid within the conservative 15 km research matching radius; distant cells are never substituted.'}
                    continue
                entry={'nativePoint':{'latitude':float(a[iy,ix]),'longitude':float(b[iy,ix])},'variables':{}}
                for name in ['soil_moisture','soil_moisture_error','retrieval_qual_flag','surface_flag']:
                    ds=g[key(name)]; value=scalar(ds[iy,ix]); fill=scalar(ds.attrs.get('_FillValue'))
                    if isinstance(fill,list): fill=fill[0] if fill else None
                    entry['variables'][name]={'value':None if value==fill else value,
                        'nativeFill':fill,'unit':scalar(ds.attrs.get('units'))}
                result['passes'][suffix]=entry
    else:
        result['layers']={}
        for path in files:
            with rasterio.open(path) as d:
                x,y=transform('EPSG:4326',d.crs,[lon],[lat]); row,col=d.index(x[0],y[0])
                window=rasterio.windows.Window(col,row,1,1)
                valid=d.read_masks(1,window=window)[0,0]!=0
                value=scalar(d.read(1,window=window)[0,0]) if valid else None
                result['layers'][path.name.split('-',1)[1]]={'rawValue':value,'scale':d.scales[0],
                    'offset':d.offsets[0],'unitAttribute':d.units[0], 'crs':d.crs.to_string(),
                    'pixelSize':list(d.res),'row':row,'column':col,'nodata':scalar(d.nodata)}
        result['note']='Raw point values plus masks; product guide supplies variable meaning when TIFF unit attributes are absent. No QA-filtered NDVI, ET or model feature is asserted.'
    return result


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--run',required=True);args=p.parse_args()
    if '/' in args.run or '\\' in args.run or args.run in ('.','..'):p.error('Expected run ID')
    for path in (ROOT/'data/manifests/research-runs'/args.run).glob('*.json'):
        record=json.loads(path.read_text())
        if record['status']!='science_downloaded':continue
        if record['sourceId'] not in ['imerg','smap','hls','ecostress']:continue
        for a in record['artifacts']:
            f=(ROOT/a['path']).resolve()
            assert f.is_relative_to((ROOT/'data/raw').resolve())
            assert hashlib.sha256(f.read_bytes()).hexdigest()==a['sha256']
        out=ROOT/'data/interim/research'/args.run/(record['sourceId']+'.json');out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(extract(record),indent=2,allow_nan=False)+'\n');print(record['sourceId']+': inspected')


if __name__=='__main__':main()
