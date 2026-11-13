import copy,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('regions',ROOT/'scripts/data/validate_regions.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RegionStructureTests(unittest.TestCase):
 def data(self):return json.loads((ROOT/'data/manifests/regions/readiness.json').read_text())
 def test_real_index(self):m.check_structure(self.data())
 def test_duplicate_source_rejected(self):
  d=self.data();d['regions'][0]['sources'][0]=copy.deepcopy(d['regions'][0]['sources'][1])
  with self.assertRaises(ValueError):m.check_structure(d)
 def test_missing_region_rejected(self):
  d=self.data();d['regions'].pop()
  with self.assertRaises(ValueError):m.check_structure(d)
 def test_false_ready_rejected(self):
  d=self.data();d['allProductionComplete']=True
  with self.assertRaises(ValueError):m.check_structure(d)
 def test_evidence_required(self):
  d=self.data();d['regions'][0]['sources'][0]['evidencePaths']=[]
  with self.assertRaises(ValueError):m.check_structure(d)
