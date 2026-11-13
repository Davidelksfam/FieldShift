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

class SatelliteCalendarTests(unittest.TestCase):
 def row(self):return {'date':'2024-01-01','pass':'daily','value':'','unit':'mm/day','valid_count':'0','total_count':'0','valid_fraction':'','status':'provider_inventory_gap','source_sha256':''}
 def test_gap_retained(self):m.check_daily([self.row()],'imerg',['2024-01-01'])
 def test_gap_cannot_be_zero(self):
  r=self.row();r['value']='0'
  with self.assertRaises(ValueError):m.check_daily([r],'imerg',['2024-01-01'])
 def test_missing_calendar_date_rejected(self):
  with self.assertRaises(ValueError):m.check_daily([],'imerg',['2024-01-01'])
 def test_invalid_fraction_rejected(self):
  r=self.row();r.update(status='valid_regional_context',value='1',valid_count='1',total_count='2',valid_fraction='1',source_sha256='a'*64)
  with self.assertRaises(ValueError):m.check_daily([r],'imerg',['2024-01-01'])
