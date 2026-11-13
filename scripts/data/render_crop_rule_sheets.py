"""Render review sheets from the crop evidence manifest; no rules are approved."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]

def main():
    data=json.loads((ROOT/'data/manifests/crop-rule-evidence.json').read_text())
    sources={s['sourceId']:s for s in data['sources']}
    folder=ROOT/'docs/data/crop-rules';folder.mkdir(parents=True,exist_ok=True)
    for crop in data['crops']:
        lines=['# '+crop['nameEn']+' — crop rule review sheet','',
            'Status: research evidence; **no approved local model rules**. Harvest use: '+crop['harvestUse']+'.',
            '', '## Candidate evidence', '']
        for claim in crop['evidenceClaims']:
            src=sources[claim['sourceId']]
            lines+=['- **'+claim['parameter']+'; '+claim['geographicScope']+':** '+claim['summary']+
                ' ['+claim['sourceId']+']('+src['url']+'), '+claim['locator']+'. Status: '+claim['status']+'.']
        if not crop['evidenceClaims']:lines+=['No locally applicable sowing/date evidence has been verified; this remains a research gap.']
        ref=crop['waterReference'];lines+=['','## Water-method reference','',
            '['+ref['sourceId']+']('+sources[ref['sourceId']]['url']+'): '+ref['locator']+'.',
            '',ref['notes'],'','## Regional readiness','',
            '| Region | Local rule approval | Model enabled |','| --- | --- | --- |']
        for region in crop['regions']:lines+=['| '+region['regionId']+' | '+region['reviewStatus']+' | '+str(region['modelEnabled']).lower()+' |']
        lines+=['','## Next review task','',crop['specificReviewTask'],'','Missing before model use:','']
        lines+=['- '+s for s in crop['missingRequirements']]
        lines+=['',crop['resultPolicy']+'.','',
            'Source dates, access limits and the downloaded textbook checksum are recorded in the [evidence manifest](../../../data/manifests/crop-rule-evidence.json). Candidate windows are not validated local recommendations.']
        (folder/(crop['cropId']+'.md')).write_text('\n'.join(lines)+'\n')
    print('Rendered eight crop review sheets')

if __name__=='__main__':main()
