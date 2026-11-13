"""List every matching protected satellite asset for both regions and full period.

This generates a resumable inventory, not a claim of downloaded science bytes.
"""
import argparse,hashlib,json,gzip
from pathlib import Path
from urllib.parse import urlencode
from acquire_research import ROOT,REGISTRY,CMR,read_http,decode_json,science_links

def run(config_path):
 config=decode_json(config_path.read_bytes());sources=decode_json(REGISTRY.read_bytes())['sources']
 dest=ROOT/'data/manifests/regions/full-period-plans';dest.mkdir(parents=True,exist_ok=True)
 raw=ROOT/'data/raw/regions/full-period-catalog';raw.mkdir(parents=True,exist_ok=True)
 for region in config['regions']:
  for source in sources:
   sid=source['id']
   if sid in ['power','soilgrids']:continue
   product=source.get('pinnedFullGranuleAlternative',source)
   suffixes=source.get('scienceSuffixes',['.hdf'])
   output=dest/(region['regionId']+'-'+sid+'.json.gz')
   if output.exists():
    prior=decode_json(gzip.decompress(output.read_bytes()))
    if prior.get('inventoryComplete') and prior['startDate']==config['startDate'] and prior['endDateInclusive']==config['endDateInclusive']:
     print('Cached',region['regionId'],sid,len(prior['granules']),flush=True);continue
   plan={'regionId':region['regionId'],'sourceId':sid,'bbox':region['bbox'],
    'startDate':config['startDate'],'endDateInclusive':config['endDateInclusive'],
    'product':product['shortName'],'version':product['version'],'inventoryComplete':False,'scienceDownloadComplete':False,
    'granules':[],'catalogArtifacts':[],'note':'CMR overlap filters do not crop files or validate pixels. Deduplicate shared regional/global files by URL before downloading.'}
   for page in range(1,501):
    q={'short_name':product['shortName'],'version':product['version'],
     'bounding_box':','.join(map(str,region['bbox'])),
     'temporal':config['startDate']+'T00:00:00Z,'+config['endDateInclusive']+'T23:59:59Z',
     'page_size':100,'page_num':page,'sort_key':'start_date'}
    url=CMR+'granules.json?'+urlencode(q)
    try:
     body,_,_=read_http(url);data=decode_json(body);entries=data['feed']['entry'];sha=hashlib.sha256(body).hexdigest()
     path=raw/(sha[:16]+'.json');path.write_bytes(body)
     plan['catalogArtifacts'].append({'path':str(path.relative_to(ROOT)),'sha256':sha,'byteCount':len(body),'sourceUrl':url})
     for e in entries:
      plan['granules'].append({'id':e['id'],'start':e.get('time_start'),'end':e.get('time_end'),
        'estimatedGranuleMB':e.get('granule_size'),'scienceUrls':science_links(e,suffixes)})
     if len(entries)<100:plan['inventoryComplete']=True;break
    except Exception as exc:
     plan['errorCode']=type(exc).__name__;break
   output.write_bytes(gzip.compress((json.dumps(plan,separators=(',',':'))+'\n').encode(),mtime=0))
   print(region['regionId'],sid,len(plan['granules']),'complete_inventory',plan['inventoryComplete'],flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=Path,required=True);a=p.parse_args();run(a.config)
