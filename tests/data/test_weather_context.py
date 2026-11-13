import hashlib,importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('weather_context',ROOT/'scripts/data/build_weather_context.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class WeatherContextTests(unittest.TestCase):
    def rows(self):return [{'date':'2024-02-28','T2M':'20','PRECTOTCORR':'1'},{'date':'2024-02-29','T2M':'30','PRECTOTCORR':'3'}]
    def test_independent_known_calculation(self):
        r=m.summarize(self.rows(),'2024-02-28','2024-02-29')
        self.assertEqual(r['meanAirTemperatureC']['value'],25)
        self.assertEqual(r['periodRainfallMm']['value'],4)
        self.assertIsNone(r['heatExposureDays']['value'])
    def test_missing_day_never_becomes_zero_or_full_total(self):
        r=m.summarize(self.rows()[:1],'2024-02-28','2024-02-29')['periodRainfallMm']
        self.assertIsNone(r['value']);self.assertEqual(r['observedValue'],1);self.assertEqual(r['coverage']['validFraction'],.5)
    def test_coverage_is_per_metric(self):
        rows=self.rows();rows[0]['T2M']=''
        r=m.summarize(rows,'2024-02-28','2024-02-29')
        self.assertIsNone(r['meanAirTemperatureC']['value']);self.assertEqual(r['periodRainfallMm']['value'],4)
    def test_real_zero_rain_is_available(self):
        rows=self.rows()
        for row in rows:row['PRECTOTCORR']='0'
        r=m.summarize(rows,'2024-02-28','2024-02-29')['periodRainfallMm']
        self.assertEqual(r['value'],0);self.assertEqual(r['status'],'available')
    def test_duplicate_dates_rejected(self):
        with self.assertRaises(ValueError):m.summarize(self.rows()*2,'2024-02-28','2024-02-29')
    def test_bad_weather_rejected(self):
        for v in ['NaN','Infinity','-1']:
            rows=self.rows();rows[0]['PRECTOTCORR']=v
            with self.assertRaises(ValueError):m.summarize(rows,'2024-02-28','2024-02-29')
    def test_reversed_dates_rejected(self):
        with self.assertRaises(ValueError):m.summarize(self.rows(),'2024-02-29','2024-02-28')

    def test_published_real_examples_have_valid_lineage_and_period_counts(self):
        paths=list((ROOT/'web/public/data/context-proposal').glob('*.json'))
        self.assertEqual(len(paths),4)
        for path in paths:
            data=json.loads(path.read_text());self.assertFalse(data['decisionReady'])
            expected=366 if data['period']['startDate'].startswith('2024') else 365
            refs={s['sourceId'] for s in data['sources']}
            for source in data['sources']:
                for name in ['csv','metadata']:
                    self.assertEqual(hashlib.sha256((ROOT/source[name+'Path']).read_bytes()).hexdigest(),source[name+'Sha256'])
            for key,metric in data['metrics'].items():
                self.assertEqual(metric['coverage']['expectedDays'],expected)
                self.assertTrue(set(metric['sourceRefs'])<=refs)
                if key!='heatExposureDays':
                    self.assertEqual(metric['dataStatus'],'historical_modeled')
                    self.assertEqual(metric['coverage']['validDays'],expected)
