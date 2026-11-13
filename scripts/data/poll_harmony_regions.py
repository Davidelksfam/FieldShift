"""Poll authorized regional Harmony jobs and collect completed region-only outputs.

No token or signed result URL is written to manifests. Run from repository root.
"""
import argparse,hashlib,json,os,time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.error import HTTPError,URLError
from acquire_research import ROOT,read_http,is_science_binary

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--download',action='store_true');parser.add_argument('--workers',type=int,default=3);args=parser.parse_args()
    if not 1<=args.workers<=8:parser.error('workers must be 1..8')
    token=os.environ.get('EARTHDATA_TOKEN')
    if not token:parser.error('Configure EARTHDATA_TOKEN in environment secrets')
    path=ROOT/'data/manifests/regions/harmony-requests.json';manifest=json.loads(path.read_text())
    for job in manifest['requests']:
        if not job.get('jobID'):continue
        body,_,_=read_http('https://harmony.earthdata.nasa.gov/jobs/'+job['jobID'],headers={'Authorization':'Bearer '+token})
        data=json.loads(body)
        job.update(status=data['status'],progress=data.get('progress'),numInputGranules=data.get('numInputGranules'))
        links=[x for x in data.get('links',[]) if x.get('rel')=='data']
        job['availableResultLinks']=len(links)
        print(job['sourceId'],job['regionId'],job['status'],job['progress'],len(links),flush=True)
        if args.download and data['status'] in ['successful','successful_with_errors']:
            directory=ROOT/'data/raw/regions/harmony'/job['jobID'];directory.mkdir(parents=True,exist_ok=True)
            old={x['assetName']:x for x in job.get('outputs',[])}
            def collect(link):
                name=Path(urlsplit(link['href']).path).name
                if name in old:
                    record=old[name];p=ROOT/record['path']
                    if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==record['sha256']:return record
                for cached in directory.glob('*-'+name):
                    cached_body=cached.read_bytes();digest=hashlib.sha256(cached_body).hexdigest()
                    if cached.name.startswith(digest[:12]+'-') and is_science_binary(cached_body):
                        return {'assetName':name,'path':str(cached.relative_to(ROOT)),'sha256':digest,
                                'byteCount':len(cached_body),'sourceJob':job['jobID']}
                # Authenticate to Harmony; its delivery redirect strips the bearer.
                if urlsplit(link['href']).scheme!='https':raise ValueError('Result requires HTTPS')
                if urlsplit(link['href']).hostname!='harmony.earthdata.nasa.gov':raise ValueError('Expected Harmony result URL')
                for attempt in range(4):
                    try:
                        data,_,_=read_http(link['href'],limit=16_000_000,headers={'Authorization':'Bearer '+token})
                        break
                    except HTTPError as error:
                        if error.code not in [429,500,502,503,504] or attempt==3:raise
                        time.sleep(2**attempt)
                    except (URLError,TimeoutError):
                        if attempt==3:raise
                        time.sleep(2**attempt)
                if not is_science_binary(data):raise ValueError('Expected science output')
                digest=hashlib.sha256(data).hexdigest();out=directory/(digest[:12]+'-'+name);out.write_bytes(data)
                return {'assetName':name,'path':str(out.relative_to(ROOT)),'sha256':digest,'byteCount':len(data),'sourceJob':job['jobID']}
            results=[]
            with ThreadPoolExecutor(max_workers=args.workers) as pool:
                for result in pool.map(collect,links):
                    results.append(result)
                    if len(results)%50==0:
                        job['outputs']=list(results);job['allListedOutputsDownloaded']=False
                        path.write_text(json.dumps(manifest,indent=2)+'\n')
                        print('Collected',len(results),flush=True)
            job['outputs']=results
            job['allListedOutputsDownloaded']=len(results)==len(links) and bool(results)
            job['qaStatus']='native_QA_retained_pending_feature_review'
        path.write_text(json.dumps(manifest,indent=2)+'\n')

if __name__=='__main__':main()
