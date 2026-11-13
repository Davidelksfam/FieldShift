"""Refresh provider and compact-input evidence without claiming production readiness."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def main():
    path=ROOT/'data/manifests/regions/readiness.json'
    data=json.loads(path.read_text())
    harmony=json.loads((ROOT/'data/manifests/regions/harmony-requests.json').read_text())['requests']
    appeears=json.loads((ROOT/'data/manifests/regions/appeears-tasks.json').read_text())['tasks']
    for region in data['regions']:
        for source in region['sources']:
            rid,sid=region['regionId'],source['sourceId']
            jobs=[j for j in harmony+appeears if j.get('regionId')==rid and j.get('sourceId')==sid]
            if jobs:
                job=jobs[0]
                source['providerProcessing']={'service':'NASA Harmony' if sid in ['imerg','smap'] else 'NASA AppEEARS',
                    'status':job.get('status'),'progress':job.get('progress'),
                    'requestManifest':'data/manifests/regions/'+('harmony-requests.json' if sid in ['imerg','smap'] else 'appeears-tasks.json')}
            meta=ROOT/f'web/public/data/regions/harmony-daily/{rid}-{sid}.metadata.json'
            if not meta.is_file():continue
            m=json.loads(meta.read_text())
            for p in [meta.with_suffix('').with_suffix('.csv'),meta]:
                relative=str(p.relative_to(ROOT))
                if relative not in source['evidencePaths']:source['evidencePaths'].append(relative)
            source['spatialStatus']='study_envelope_native_centers_without_cropland_mask'
            source['temporalStatus']='calendar_complete_with_explicit_unavailable_rows'
            source['qualityStatus']='documented_research_QA_applied_pending_independent_review'
            source['compactRowStatusCounts']=m['rowStatusCounts']
            source['missingRequirements']=[
                'Reviewed field/cropland mask and spatial interpretation',
                'Independent review of source-specific QA recipe and seasonal coverage thresholds',
                'Resolve or explicitly accept inventory gaps and QA-empty day/pass rows; see monthly counts']
            source['fullProductionReady']=False
    data['allProductionComplete']=False
    path.write_text(json.dumps(data,indent=2)+'\n')
    print('Updated provider states and compact regional evidence; production gate remains explicit')

if __name__=='__main__':main()
