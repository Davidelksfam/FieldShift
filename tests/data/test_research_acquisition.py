"""Scientific-input and credential-boundary checks; no live network required."""
import copy
import importlib.util
import unittest
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch
from urllib.request import Request

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('acquire', ROOT/'scripts/data/acquire_research.py')
acquire = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acquire)


class ResearchAcquisitionTests(unittest.TestCase):
    def setUp(self):
        self.config = {'scope': 'Exploratory', 'point': {'longitude': 31.15, 'latitude': 29.9},
                       'startDate': '2025-01-01', 'endDateInclusive': '2025-01-07', 'soilSubsetWidthM': 1000}

    def power(self):
        units = {'T2M': 'C', 'T2M_MIN': 'C', 'T2M_MAX': 'C', 'RH2M': '%',
                 'WS2M': 'm/s', 'ALLSKY_SFC_SW_DWN': 'MJ/m^2/day', 'PRECTOTCORR': 'mm/day', 'PS': 'kPa'}
        values = {'T2M': 20, 'T2M_MIN': 10, 'T2M_MAX': 30, 'RH2M': 50,
                  'WS2M': 2, 'ALLSKY_SFC_SW_DWN': 12, 'PRECTOTCORR': 0, 'PS': 101}
        return {'header': {'time_standard': 'UTC', 'fill_value': -999},
                'properties': {'parameter': {k: {'20250101': v} for k,v in values.items()}},
                'parameters': {k: {'units': v} for k,v in units.items()}}

    def test_reversed_and_oversized_windows_rejected(self):
        for end in ['2024-12-31', '2025-02-01']:
            config = copy.deepcopy(self.config); config['endDateInclusive'] = end
            with self.assertRaises(ValueError): acquire.validate_config(config)

    def test_invalid_coordinates_rejected(self):
        for value in [181, float('nan'), True]:
            config = copy.deepcopy(self.config); config['point']['longitude'] = value
            with self.assertRaises(ValueError): acquire.validate_config(config)

    def test_fill_is_null_and_zero_rain_remains_zero(self):
        data = self.power(); data['properties']['parameter']['T2M']['20250101'] = -999
        values = acquire.power_rows(data)['rows'][0]['values']
        self.assertIsNone(values['T2M']); self.assertEqual(values['PRECTOTCORR'], 0)

    def test_unknown_units_fail_instead_of_silent_conversion(self):
        data = self.power(); data['parameters']['ALLSKY_SFC_SW_DWN']['units'] = 'kWh/m^2/day'
        with self.assertRaises(ValueError): acquire.power_rows(data)

    def test_inconsistent_daily_keys_rejected(self):
        data = self.power(); data['properties']['parameter']['PS']['20250102'] = 101
        with self.assertRaises(ValueError): acquire.power_rows(data)

    def test_temperature_order_rejected(self):
        data = self.power(); data['properties']['parameter']['T2M_MIN']['20250101'] = 40
        with self.assertRaises(ValueError): acquire.power_rows(data)

    def test_modis_fill_masked_before_scale_and_qa_preserved(self):
        data = {'nrows':1, 'ncols':2, 'xllcorner':'0', 'yllcorner':'0', 'cellsize':231.65,
                'subset':[{'modis_date':'A2025001','calendar_date':'2025-01-01','band':'NDVI',
                           'tile':'synthetic','data':[-3000,1000]},
                          {'modis_date':'A2025001','calendar_date':'2025-01-01','band':'QA',
                           'tile':'synthetic','data':[0,2120]}]}
        metadata = {'bands':[{'band':'NDVI','fill_value':'-3000','scale_factor':'0.0001'},
                             {'band':'QA','fill_value':'-1'}]}
        out = acquire.modis_rows(data,metadata)
        self.assertEqual(out['observations'][0]['values'],[None,0.1])
        self.assertIsInstance(out['observations'][1]['values'][1],int)
        self.assertFalse(out['qaApplied'])
        data['subset'][0]['data'] = [1000]
        with self.assertRaises(ValueError): acquire.modis_rows(data,metadata)

    def test_browse_portal_and_inherited_links_excluded(self):
        links = [{'href':'https://example.com/red.B04.tif','rel':'http://esipfed.org/ns/fedsearch/1.1/data#'},
                 {'href':'https://example.com/browse.B04.tif','rel':'http://esipfed.org/ns/fedsearch/1.1/browse#'},
                 {'href':'https://example.com/parent.B04.tif','rel':'http://esipfed.org/ns/fedsearch/1.1/data#','inherited':True}]
        self.assertEqual(acquire.science_links({'links':links},['.B04.tif']),['https://example.com/red.B04.tif'])

    def test_html_login_is_not_science(self):
        self.assertFalse(acquire.is_science_binary(b'<!doctype html><html>Login</html>'))
        self.assertTrue(acquire.is_science_binary(b'II*\x00binary'))
        self.assertTrue(acquire.is_science_binary(b'\x89HDF\r\n\x1a\nrest'))

    def test_token_redirect_to_unrelated_host_rejected(self):
        request = Request('https://data.lpdaac.earthdatacloud.nasa.gov/file',headers={'Authorization':'Bearer SYNTHETIC_TEST_ONLY'})
        for destination in ['https://example.com/file','http://urs.earthdata.nasa.gov/login']:
            with self.assertRaises(ValueError):
                acquire.RestrictedRedirect().redirect_request(request,None,302,'Found',{},destination)

    def test_oversized_stream_rejected(self):
        response = MagicMock(); response.headers = {}; response.read.return_value = b'12345'
        response.__enter__.return_value = response
        opener = MagicMock(); opener.open.return_value = response
        with patch.object(acquire,'build_opener',return_value=opener):
            with self.assertRaises(ValueError): acquire.read_http('https://example.com/file',limit=4)

    def test_nonfinite_json_rejected(self):
        with self.assertRaises(ValueError): acquire.decode_json(b'{"value":NaN}')

    def test_exception_text_does_not_leak_into_manifest(self):
        (ROOT/'work').mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as tmp, patch.object(acquire,'ROOT',Path(tmp)):
            runner = acquire.Acquisition(self.config)
            with patch.object(runner,'json_artifact',side_effect=ValueError('SYNTHETIC_PRIVATE_TEST_VALUE')):
                result = runner.run_source({'id':'power','parameters':['T2M'],
                                            'endpoint':'https://example.com', 'citation':'https://example.com/docs'})
            self.assertNotIn('SYNTHETIC_PRIVATE_TEST_VALUE',str(result))
            self.assertEqual(result['status'],'acquisition_error')


if __name__ == '__main__': unittest.main()
