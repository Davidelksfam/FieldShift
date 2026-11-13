import copy,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('crop_rules',ROOT/'scripts/data/validate_crop_rules.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class CropEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.data=json.loads((ROOT/'data/manifests/crop-rule-evidence.json').read_text())
        self.catalog=json.loads((ROOT/'data/manifests/crop-shortlist.proposed.json').read_text())
    def test_real_evidence(self):m.validate(self.data,self.catalog)
    def test_unknown_source_rejected(self):
        self.data['crops'][0]['evidenceClaims'][0]['sourceId']='missing'
        with self.assertRaises(ValueError):m.validate(self.data,self.catalog)
    def test_unreviewed_enablement_rejected(self):
        self.data['crops'][0]['regions'][0]['modelEnabled']=True
        with self.assertRaises(ValueError):m.validate(self.data,self.catalog)
    def test_search_snippet_cannot_be_promoted(self):
        c=next(c for crop in self.data['crops'] for c in crop['evidenceClaims'] if c['status']=='discovery_only')
        c['status']='source_supported_candidate'
        with self.assertRaises(ValueError):m.validate(self.data,self.catalog)
    def test_descriptive_date_cannot_gain_guessed_day(self):
        c=next(c for crop in self.data['crops'] for c in crop['evidenceClaims'] if c['precision']=='descriptive')
        c['value']={'startMonthDay':'10-24'}
        with self.assertRaises(ValueError):m.validate(self.data,self.catalog)
    def test_fayoum_cannot_be_duplicated_as_delta(self):
        self.data['crops'][0]['regions'][1]=copy.deepcopy(self.data['crops'][0]['regions'][0])
        with self.assertRaises(ValueError):m.validate(self.data,self.catalog)
