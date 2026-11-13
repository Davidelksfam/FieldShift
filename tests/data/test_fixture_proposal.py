import copy,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('fixture_proposal',ROOT/'scripts/data/validate_fixture_proposal.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class FixtureSemanticsTests(unittest.TestCase):
    def setUp(self):
        folder=ROOT/'data/fixtures/proposed'
        self.request=json.loads((folder/'field-input.known-water.synthetic.json').read_text())
        self.config=json.loads((folder/'replay-config.synthetic.json').read_text())
        self.regions=json.loads((ROOT/'scripts/data/config/regions/delta-fayoum.json').read_text())
    def validate(self):m.validate_semantics(self.request,self.config,self.regions)
    def test_known_zero_is_allowed(self):
        for a in self.request['waterBudget']['allocations']:a['availableM3']=0
        self.validate()
    def test_duplicate_allocation_cannot_hide_missing_window(self):
        self.request['waterBudget']['allocations'][1]=copy.deepcopy(self.request['waterBudget']['allocations'][0])
        with self.assertRaises(ValueError):self.validate()
    def test_region_point_mismatch_rejected(self):
        self.request['location']['point']['latitude']=31.5
        with self.assertRaises(ValueError):self.validate()
    def test_history_cannot_leak_into_replay(self):
        self.request['cropHistory']['entries'][0]['endDate']='2024-01-01'
        with self.assertRaises(ValueError):self.validate()
    def test_window_gap_rejected(self):
        self.config['windows'][1]['startDate']='2024-07-02'
        with self.assertRaises(ValueError):self.validate()
    def test_unknown_crop_rejected(self):
        self.request['baselinePlan'][0]['cropId']='unreviewed-crop'
        with self.assertRaises(ValueError):self.validate()
