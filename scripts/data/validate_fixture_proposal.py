"""Validate proposed synthetic inputs. CLI requires jsonschema; no model runs."""
import json
from datetime import date,timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def validate_semantics(request,config,regions):
    if request['replayConfigId']!=config['configId']:raise ValueError('Config version mismatch')
    start=date.fromisoformat(config['period']['startDate']);end=date.fromisoformat(config['period']['endDate'])
    if end<start:raise ValueError('Reversed replay dates')
    windows=config['windows'];ids=[w['windowId'] for w in windows]
    if len(set(ids))!=len(ids):raise ValueError('Duplicate configured windows')
    cursor=start
    for w in windows:
        a,b=date.fromisoformat(w['startDate']),date.fromisoformat(w['endDate'])
        if a!=cursor or b<a:raise ValueError('Gapped, overlapping or reversed replay windows')
        cursor=b+timedelta(days=1)
    if cursor!=end+timedelta(days=1):raise ValueError('Replay coverage mismatch')
    region=next(r for r in regions['regions'] if r['regionId']==request['location']['regionId'])
    west,south,east,north=region['bbox'];point=request['location']['point']
    if not west<=point['longitude']<=east or not south<=point['latitude']<=north:raise ValueError('Point outside selected study envelope')
    budget=request['waterBudget'];allocation_ids=[a['windowId'] for a in budget['allocations']]
    if budget['status']=='known' and (len(allocation_ids)!=len(ids) or set(allocation_ids)!=set(ids)):
        raise ValueError('Known budget requires one allocation per replay window')
    if budget['status']=='unknown' and allocation_ids:raise ValueError('Unknown budget cannot contain claimed volumes')
    crop_ids=set(config['cropIds']);excluded=set(request['excludedCropIds'])
    if not excluded<=crop_ids:raise ValueError('Unknown excluded crop ID')
    history=request['cropHistory']['entries'];previous_end=None
    for h in history:
        a,b=date.fromisoformat(h['startDate']),date.fromisoformat(h['endDate'])
        if h['cropId'] not in crop_ids or b<a or b>=start or (previous_end is not None and a<=previous_end):
            raise ValueError('History must be ordered, non-overlapping and precede replay, with known crop IDs')
        previous_end=b
    if request['baselinePlan'] is not None:
        plan=request['baselinePlan'];plan_ids=[p['windowId'] for p in plan]
        if len(plan_ids)!=len(ids) or set(plan_ids)!=set(ids):raise ValueError('Baseline must account for every configured window exactly once')
        if any(p['cropId'] not in crop_ids for p in plan):raise ValueError('Unknown baseline crop ID')
        # An excluded crop in the farmer's baseline is valid input: the later
        # engine must explain the conflict, rather than losing their baseline.

def main():
    from jsonschema import Draft202012Validator,FormatChecker
    folder=ROOT/'data/fixtures/proposed'
    config=json.loads((folder/'replay-config.synthetic.json').read_text())
    regions=json.loads((ROOT/'scripts/data/config/regions/delta-fayoum.json').read_text())
    schema=json.loads((ROOT/'docs/data/fixture-proposal/field-input.schema.json').read_text())
    Draft202012Validator.check_schema(schema)
    validator=Draft202012Validator(schema,format_checker=FormatChecker())
    paths=sorted(folder.glob('field-input.*.synthetic.json'))
    if len(paths)!=3:raise ValueError('Expected known, unknown and zero water examples')
    for path in paths:
        request=json.loads(path.read_text());validator.validate(request)
        validate_semantics(request,config,regions);print('PASS:',path.name)
    print('Proposal only; no crop feasibility or scientific validity is asserted')

if __name__=='__main__':main()
