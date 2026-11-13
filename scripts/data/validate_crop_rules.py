"""Check evidence integrity and prevent unreviewed local rules being enabled."""
import json
from datetime import datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
REGIONS={'egypt-nile-delta','egypt-fayoum'}
FIELDS={'sowingWindow','durationDays','stageLengthsDays','rotationRestrictions','soilAndWaterRestrictions','waterDemandMethod'}

def validate(data,catalog):
    crops=data['crops'];ids=[c['cropId'] for c in crops]
    if len(ids)!=8 or len(set(ids))!=8 or set(ids)!={c['cropId'] for c in catalog['crops']}:raise ValueError('Eight matching distinct crops required')
    sources={s['sourceId']:s for s in data['sources']}
    if len(sources)!=len(data['sources']):raise ValueError('Duplicate source ID')
    claim_ids=set()
    for crop in crops:
        if crop['harvestUse']!=next(c['harvestUse'] for c in catalog['crops'] if c['cropId']==crop['cropId']):raise ValueError('Harvest-use mismatch')
        if crop['waterReference']['sourceId'] not in sources:raise ValueError('Unknown water-method source')
        for c in crop['evidenceClaims']:
            if c['claimId'] in claim_ids:raise ValueError('Duplicate claim ID')
            claim_ids.add(c['claimId'])
            if c['sourceId'] not in sources or not c['locator']:raise ValueError('Missing source/locator')
            if c['status']=='source_supported_candidate' and sources[c['sourceId']]['accessStatus'] not in ['full_web_page_read','full_pdf_read']:raise ValueError('Uninspected source promoted to supported rule')
            if c['precision']=='day_range':
                v=c['value'];a=datetime.strptime(v['startMonthDay'],'%m-%d');b=datetime.strptime(v['endMonthDay'],'%m-%d')
                if a>b:raise ValueError('Reversed within-year candidate range')
            if c['precision'] in ['descriptive','unverified'] and c['value'] is not None:raise ValueError('Invented precise value')
        region_ids=[r['regionId'] for r in crop['regions']]
        if len(region_ids)!=2 or set(region_ids)!=REGIONS:raise ValueError('Both distinct regional rule sheets required')
        for r in crop['regions']:
            if set(r['approvedRules'])!=FIELDS:raise ValueError('Incomplete rule shape')
            if r['modelEnabled']:
                if r['reviewStatus']!='approved' or not r['reviewer'] or not r['approvedEvidenceRefs'] or any(v is None for v in r['approvedRules'].values()):raise ValueError('Unreviewed or incomplete crop rules enabled')
                local_claims={c['claimId']:c for c in crop['evidenceClaims']}
                if any(ref not in local_claims or local_claims[ref]['status']!='approved_local_rule' or not local_claims[ref]['reviewer'] for ref in r['approvedEvidenceRefs']):raise ValueError('Unapproved evidence cannot enable local model rules')

def main():
    data=json.loads((ROOT/'data/manifests/crop-rule-evidence.json').read_text())
    catalog=json.loads((ROOT/'data/manifests/crop-shortlist.proposed.json').read_text());validate(data,catalog)
    print('PASS: eight crop sheets, sixteen regional records; evidence references and model-enablement gates')

if __name__=='__main__':main()
