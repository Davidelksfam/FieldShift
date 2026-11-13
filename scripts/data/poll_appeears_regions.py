"""Record AppEEARS processing states and result inventories without signed URLs."""
import json,os
from acquire_research import ROOT,read_http

def main():
 token=os.environ.get('APPEEARS_TOKEN')
 if not token:raise SystemExit('Configure APPEEARS_TOKEN in environment secrets')
 path=ROOT/'data/manifests/regions/appeears-tasks.json';data=json.loads(path.read_text())
 for task in data['tasks']:
  if not task.get('taskID'):continue
  body,_,_=read_http('https://appeears.earthdatacloud.nasa.gov/api/task/'+task['taskID'],headers={'Authorization':'Bearer '+token})
  result=json.loads(body);task['status']=result.get('status');task['progress']=result.get('pct_complete')
  if task['status']=='done':
   body,_,_=read_http('https://appeears.earthdatacloud.nasa.gov/api/bundle/'+task['taskID'],headers={'Authorization':'Bearer '+token})
   bundle=json.loads(body)
   task['outputs']=[{'fileID':f.get('file_id'),'name':f.get('file_name'),'byteCount':f.get('file_size')} for f in bundle.get('files',[])]
   task['outputCount']=len(task['outputs']);task['downloadStatus']='not_collected'
  print(task['taskID'],task['status'],task.get('progress'),flush=True)
  path.write_text(json.dumps(data,indent=2)+'\n')
if __name__=='__main__':main()
