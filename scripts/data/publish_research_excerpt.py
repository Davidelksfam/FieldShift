"""Explicitly publish tiny public exploratory inspection samples, never raw files."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', required=True, help='Acquisition run ID')
    args = parser.parse_args()
    if '/' in args.run or '\\' in args.run or args.run in ('.', '..'):
        parser.error('Use a run ID, not a path')
    manifests = ROOT/'data/manifests/research-runs'/args.run
    if not manifests.is_dir():
        parser.error('Run does not exist')
    for manifest in sorted(manifests.glob('*.json')):
        record = json.loads(manifest.read_text())
        if not record['scienceDownloaded'] or record['status'] != 'science_downloaded':
            continue
        # Publication is intentionally limited to the checked public example point.
        if record['scope']['point'] != {'longitude': 31.15, 'latitude': 29.9}:
            raise ValueError('Only the public Giza exploratory example may be published by this helper')
        source = record['sourceId']
        derived = ROOT/'data/interim/research'/args.run/(source+'.json')
        if not derived.is_file():
            continue
        for artifact in record['artifacts']:
            path = (ROOT/artifact['path']).resolve()
            if not path.is_relative_to((ROOT/'data/raw').resolve()):
                raise ValueError('Artifact must be under ignored raw storage')
            body = path.read_bytes()
            if hashlib.sha256(body).hexdigest() != artifact['sha256'] or len(body) != artifact['byteCount']:
                raise ValueError('Raw artifact integrity failure')
        data = json.loads(derived.read_text())
        document = {'schemaVersion':'research-inspection-1.0',
                    'warning':'PUBLIC EXPLORATORY SAMPLE; not approved SeasonalFeatures or farmer advice',
                    'qualityStatus':'not_validated_for_decisions',
                    'manifestPath':str(manifest.relative_to(ROOT)),
                    'sourceArtifacts':[{'sha256':a['sha256'],'sourceUrl':a['sourceUrl']}
                                       for a in record['artifacts'] if a['kind']=='science'],
                    'inspection':data}
        content = json.dumps(document,indent=2,allow_nan=False)+'\n'
        if len(content.encode()) > 32_000:
            raise ValueError('Excerpt exceeds 32 kB; reduce it before publication')
        destination = ROOT/'web/public/data/research-samples'/args.run/(source+'.json')
        destination.parent.mkdir(parents=True,exist_ok=True)
        if destination.exists() and destination.read_text() != content:
            raise ValueError('Never overwrite an existing published run excerpt')
        destination.write_text(content)
        print(destination.relative_to(ROOT))


if __name__ == '__main__': main()
