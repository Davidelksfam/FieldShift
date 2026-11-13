"""Submit reviewed compact regional requests using an AppEEARS application token."""
import argparse,json,os
from pathlib import Path
from urllib.request import Request,build_opener
from acquire_research import ROOT,RestrictedRedirect

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--submit',action='store_true');a=p.parse_args()
    paths=sorted((ROOT/'scripts/data/config/regions/appeears').glob('*.json'))
    if not a.submit:
        print('Prepared requests:',len(paths));return
    token=os.environ.get('APPEEARS_TOKEN')
    if not token:p.error('AppEEARS application token required; Earthdata profile bearer is not compatible')
    dest=ROOT/'data/manifests/regions/appeears-tasks.json'
    records=json.loads(dest.read_text())['tasks'] if dest.exists() else []
    existing={r['requestPath'] for r in records if r.get('taskID')}
    for path in paths:
        if str(path.relative_to(ROOT)) in existing:continue
        payload=json.loads(path.read_text())
        request=Request('https://appeears.earthdatacloud.nasa.gov/api/task',data=json.dumps(payload).encode(),
            headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method='POST')
        row={'requestPath':str(path.relative_to(ROOT)),'status':'not_submitted'}
        try:
            with build_opener(RestrictedRedirect()).open(request,timeout=35) as response:body=json.load(response)
            row.update(taskID=body.get('task_id'),status=body.get('status','submitted'))
        except Exception as exc:row.update(status='submission_failed',errorCode=type(exc).__name__,httpStatus=getattr(exc,'code',None))
        records.append(row);dest.write_text(json.dumps({'tasks':records},indent=2)+'\n');print(payload['task_name'],row['status'])

if __name__=='__main__':main()
