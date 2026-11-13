"""Bounded research acquisition, not a feature/model pipeline. Python 3.10+."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[2]
CMR = 'https://cmr.earthdata.nasa.gov/search/'
REGISTRY = ROOT / 'data/manifests/source-registry.json'
NASA_HOSTS = {
    'appeears.earthdatacloud.nasa.gov',
    'harmony.earthdata.nasa.gov',
    'data.lpdaac.earthdatacloud.nasa.gov',
    'data.nsidc.earthdatacloud.nasa.gov',
    'data.gesdisc.earthdata.nasa.gov', 'urs.earthdata.nasa.gov',
}
NASA_DELIVERY_HOSTS = {
    'dqzb5lcolc8fj.cloudfront.net',  # Harmony regional result delivery
    'd1nklfio7vscoe.cloudfront.net',  # LP DAAC redirect observed 2026-11-13
    'd2b3c3wh8s6en5.cloudfront.net',  # GES DISC
    'd3h5e2j7riftk6.cloudfront.net',  # NSIDC
}


class RestrictedRedirect(HTTPRedirectHandler):
    """Never forward a NASA bearer token to an unrelated redirect destination."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urlsplit(newurl)
        if (target.scheme == 'https' and target.hostname in NASA_DELIVERY_HOSTS
                and urlsplit(req.full_url).hostname in NASA_HOSTS):
            redirected = super().redirect_request(req, fp, code, msg, headers, newurl)
            if redirected:
                redirected.remove_header('Authorization')
            return redirected
        if req.has_header('Authorization') and (
            target.scheme != 'https' or target.hostname not in NASA_HOSTS
        ):
            raise ValueError('Refusing credential redirect outside approved NASA hosts')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def read_http(url, limit=8_000_000, headers=None):
    """Bound memory/network reads; a limit failure never becomes a valid artifact."""
    request_headers = {'User-Agent': 'FieldShift-research/1.0', **(headers or {})}
    with build_opener(RestrictedRedirect()).open(
        Request(url, headers=request_headers), timeout=35
    ) as response:
        length = response.headers.get('Content-Length')
        if length and int(length) > limit:
            raise ValueError('Response exceeds configured byte limit; request a smaller subset')
        body = response.read(limit + 1)
        if len(body) > limit:
            raise ValueError('Response exceeds configured byte limit; no artifact saved')
        return body, response.headers.get('Content-Type', ''), response.url


def decode_json(body):
    return json.loads(body, parse_constant=lambda x: (_ for _ in ()).throw(
        ValueError('Non-finite JSON value: ' + x)))


def is_science_binary(body):
    return body.startswith((b'II*\x00', b'MM\x00*', b'II+\x00', b'MM\x00+',
                            b'\x89HDF\r\n\x1a\n', b'CDF\x01', b'CDF\x02', b'CDF\x05'))


def validate_config(config):
    lon, lat = config['point']['longitude'], config['point']['latitude']
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v)
           for v in [lon, lat]) or not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError('Invalid longitude/latitude')
    start, end = date.fromisoformat(config['startDate']), date.fromisoformat(config['endDateInclusive'])
    if not 0 <= (end-start).days < 31:
        raise ValueError('Research runs require an ordered date window of at most 31 days')
    if not 250 <= config['soilSubsetWidthM'] <= 2000:
        raise ValueError('Soil subset width must be 250..2000 m')
    return lon, lat, start, end


def power_rows(payload):
    """Normalize only units supported by the actual response; never infer units."""
    units = {'T2M': ('C', 'degC'), 'T2M_MIN': ('C', 'degC'),
             'T2M_MAX': ('C', 'degC'), 'RH2M': ('%', '%'),
             'WS2M': ('m/s', 'm/s'), 'ALLSKY_SFC_SW_DWN': ('MJ/m^2/day', 'MJ/m2/day'),
             'PRECTOTCORR': ('mm/day', 'mm/day'), 'PS': ('kPa', 'kPa')}
    if payload['header']['time_standard'] != 'UTC':
        raise ValueError('POWER response time standard is not UTC')
    series = payload['properties']['parameter']
    expected_dates = set(series['T2M'])
    fill = payload['header']['fill_value']
    for key, (native, _) in units.items():
        if payload['parameters'][key]['units'] != native or set(series[key]) != expected_dates:
            raise ValueError('Unexpected POWER units or inconsistent date keys for ' + key)
    result = []
    for day in sorted(expected_dates):
        values = {key: None if series[key][day] == fill else series[key][day] for key in units}
        if any(v is not None and not math.isfinite(v) for v in values.values()):
            raise ValueError('Non-finite POWER value')
        temps = [values[k] for k in ['T2M_MIN', 'T2M', 'T2M_MAX']]
        if all(v is not None for v in temps) and temps != sorted(temps):
            raise ValueError('Temperature ordering failed')
        if values['PRECTOTCORR'] is not None and values['PRECTOTCORR'] < 0:
            raise ValueError('Negative valid precipitation')
        if values['RH2M'] is not None and not 0 <= values['RH2M'] <= 100:
            raise ValueError('Relative humidity outside 0..100')
        if values['WS2M'] is not None and values['WS2M'] < 0:
            raise ValueError('Negative wind speed')
        result.append({'date': datetime.strptime(day, '%Y%m%d').date().isoformat(),
                       'values': values})
    return {'units': {k: v[1] for k, v in units.items()}, 'rows': result}


def modis_rows(payload, band_metadata):
    metadata = {b['band']: b for b in band_metadata['bands']}
    n = payload['nrows'] * payload['ncols']
    output = []
    for item in payload['subset']:
        if len(item['data']) != n:
            raise ValueError('MODIS grid length differs from nrows*ncols')
        band = metadata[item['band']]
        fill = float(band['fill_value'])
        scale, offset = float(band.get('scale_factor', 1)), float(band.get('add_offset', 0))
        raw = item['data']
        output.append({'compositeStartDate': item['calendar_date'], 'modisDate': item['modis_date'],
                       'band': item['band'], 'tile': item['tile'],
                       'processingDate': item.get('proc_date'),
                       'values': [None if value == fill else
                                  (value if scale == 1 and offset == 0 else value * scale + offset)
                                  for value in raw]})
    return {'grid': {k: payload[k] for k in ['xllcorner', 'yllcorner', 'cellsize', 'nrows', 'ncols']},
            'qaApplied': False, 'observations': output}


def science_links(entry, suffixes):
    return sorted({link['href'] for link in entry.get('links', [])
                   if link.get('rel', '').endswith('/data#') and not link.get('inherited')
                   and link.get('href', '').startswith('https://')
                   and any(urlsplit(link['href']).path.endswith(s) for s in suffixes)})


def soil_coverage_id(property_id, depth, statistic):
    """WCS quantile IDs differ from the downloadable-file naming convention."""
    if property_id not in {'phh2o','clay','sand','silt','soc','bdod'}:
        raise ValueError('Unsupported soil property')
    if depth not in {'0-5','5-15','15-30','30-60','60-100','100-200'}:
        raise ValueError('Unsupported soil depth')
    wire={'mean':'mean','Q05':'Q0.05','Q95':'Q0.95'}
    if statistic not in wire:raise ValueError('Unsupported soil statistic')
    return f'{property_id}_{depth}cm_{wire[statistic]}'


class Acquisition:
    def __init__(self, config, download_earthdata=False, max_file_mb=64):
        self.config = config
        self.lon, self.lat, self.start, self.end = validate_config(config)
        self.download_earthdata = download_earthdata
        self.max_bytes = int(max_file_mb * 1024 * 1024)
        self.run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        self.raw = ROOT / 'data/raw/research' / self.run_id
        self.derived = ROOT / 'data/interim/research' / self.run_id
        self.raw.mkdir(parents=True)
        self.derived.mkdir(parents=True)

    def artifact(self, source, name, body, kind, url):
        digest = hashlib.sha256(body).hexdigest()
        path = self.raw / source / (digest[:12] + '-' + name)
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.read_bytes() != body:
            raise ValueError('Immutable artifact collision')
        path.write_bytes(body)
        return {'path': str(path.relative_to(ROOT)), 'sha256': digest,
                'byteCount': len(body), 'kind': kind, 'sourceUrl': url}

    def json_artifact(self, source, name, url, kind):
        body, _, _ = read_http(url)
        data = decode_json(body)
        artifact = self.artifact(source, name, body, kind, url)
        return data, artifact

    def save_derived(self, source, value):
        path = self.derived / (source + '.json')
        value = {'scope': 'EXPLORATORY RESEARCH SAMPLE; not an accepted farm pilot',
                 'point': self.config['point'], 'sourceId': source, **value}
        path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')

    def run_source(self, source):
        sid = source['id']
        record = {'sourceId': sid, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
                  'status': 'not_attempted', 'scienceDownloaded': False, 'artifacts': [],
                  'scope': self.config, 'eligibilityStatus': 'pending_resources_tab_verification',
                  'acquisitionScriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  'processingNote': 'Bounded acquisition and inspection only; no approved feature/model outputs',
                  'sourceDocumentation': source['citation']}
        try:
            if sid == 'power':
                query = {'parameters': ','.join(source['parameters']), 'community': 'AG',
                         'latitude': self.lat, 'longitude': self.lon,
                         'start': self.start.strftime('%Y%m%d'), 'end': self.end.strftime('%Y%m%d'),
                         'format': 'JSON', 'time-standard': 'UTC'}
                data, artifact = self.json_artifact(sid, 'daily.json', source['endpoint']+'?'+urlencode(query), 'science')
                record['artifacts'].append(artifact)
                normalized = power_rows(data)
                if len(normalized['rows']) != (self.end-self.start).days + 1:
                    raise ValueError('POWER returned an incomplete date range')
                self.save_derived(sid, normalized)
                record.update(status='science_downloaded', scienceDownloaded=True,
                              apiVersion=data['header']['api']['version'],
                              providerSources=data['header']['sources'])
            elif sid == 'modis_mod13q1':
                # Select an available composite start within the requested window.
                dates_url = source['endpoint']+'/dates?'+urlencode({'latitude': self.lat, 'longitude': self.lon})
                dates, artifact = self.json_artifact(sid, 'dates.json', dates_url, 'catalog')
                record['artifacts'].append(artifact)
                choices = [d for d in dates['dates'] if self.start.isoformat() <= d['calendar_date'] <= self.end.isoformat()]
                if not choices:
                    raise ValueError('No composite starts in requested window; choose a wider research window')
                chosen = choices[0]['modis_date']
                bands, artifact = self.json_artifact(sid, 'bands.json', source['endpoint']+'/bands', 'catalog')
                record['artifacts'].append(artifact)
                query = {'latitude': self.lat, 'longitude': self.lon, 'startDate': chosen,
                         'endDate': chosen, 'kmAboveBelow': 0, 'kmLeftRight': 0}
                data, artifact = self.json_artifact(sid, 'subset.json', source['endpoint']+'/subset?'+urlencode(query), 'science')
                record['artifacts'].append(artifact)
                self.save_derived(sid, modis_rows(data, bands))
                record.update(status='science_downloaded', scienceDownloaded=True,
                              observationMeaning='One native 16-day composite; extends beyond a 7-day request',
                              collectionVersion='ORNL service version not asserted as pinned LPCLOUD 061')
            elif sid == 'soilgrids':
                self.soilgrids(source, record)
            else:
                self.earthdata(source, record)
        except HTTPError as error:
            status = 'requires_authentication' if sid in {'imerg', 'smap', 'hls', 'ecostress'} and error.code in (401, 403) else 'http_error'
            record.update(status=status, errorCode='HTTP_'+str(error.code))
        except Exception as error:
            # Avoid logging credentials, cookies or authenticated request URLs.
            record.update(status='acquisition_error', errorCode=type(error).__name__,
                          errorNote='Request or validation failed; see the source access guide. Exception text is omitted to protect credentials.')
        return record

    def earthdata(self, source, record):
        sid = source['id']
        coll_query = {'short_name': source['shortName'], 'version': source['version'], 'page_size': 2}
        collections, artifact = self.json_artifact(sid, 'collections.json', CMR+'collections.json?'+urlencode(coll_query), 'catalog')
        record['artifacts'].append(artifact)
        entries = collections['feed']['entry']
        if len(entries) != 1:
            raise ValueError('Expected one pinned CMR collection; refine provider/version')
        collection = entries[0]
        record['collection'] = {k: collection.get(k) for k in ['id', 'title', 'version_id', 'data_center']}
        query = {'collection_concept_id': collection['id'], 'point': f'{self.lon},{self.lat}',
                 'temporal': f'{self.start}T00:00:00Z,{self.end}T23:59:59Z',
                 'page_size': 1, 'sort_key': 'start_date'}
        granules, artifact = self.json_artifact(sid, 'granules.json', CMR+'granules.json?'+urlencode(query), 'catalog')
        record['artifacts'].append(artifact)
        entries = granules['feed']['entry']
        if not entries:
            record['status'] = 'no_matching_granules'
            return
        entry = entries[0]
        links = science_links(entry, source['scienceSuffixes'])
        record['granule'] = {k: entry.get(k) for k in ['id', 'title', 'time_start', 'time_end', 'granule_size']}
        record['scienceUrls'] = links
        if not links:
            raise ValueError('No expected science assets in granule; inspect provider metadata')
        token = os.environ.get('EARTHDATA_TOKEN', '') if self.download_earthdata else ''
        headers = {'Authorization': 'Bearer '+token} if token else {}
        if self.download_earthdata and not token:
            record.update(status='requires_authentication', errorCode='EARTHDATA_TOKEN_NOT_CONFIGURED')
            return
        if not self.download_earthdata:
            # Read only a tiny range; do not download a whole global SMAP file.
            try:
                probe = Request(links[0], headers={'User-Agent': 'FieldShift-research/1.0', 'Range': 'bytes=0-63'})
                with build_opener(RestrictedRedirect()).open(probe, timeout=25) as response:
                    valid = is_science_binary(response.read(64))
                    record['status'] = 'science_accessible_not_downloaded' if valid else 'requires_authentication'
            except HTTPError as error:
                record.update(status='requires_authentication' if error.code in (401, 403) else 'http_error',
                              errorCode='HTTP_'+str(error.code))
            return
        for url in links:
            if urlsplit(url).hostname not in NASA_HOSTS:
                raise ValueError('Unapproved NASA download host')
            body, _, _ = read_http(url, limit=self.max_bytes, headers=headers)
            if not is_science_binary(body):
                raise ValueError('Expected science binary; HTML/login/error payload rejected')
            record['artifacts'].append(self.artifact(sid, Path(urlsplit(url).path).name, body, 'science', url))
        record.update(status='science_downloaded', scienceDownloaded=True)

    def soilgrids(self, source, record):
        # WCS avoids the currently paused REST service. Optional local geospatial dependencies.
        from pyproj import CRS, Transformer
        import rasterio
        from rasterio.io import MemoryFile
        sid = source['id']
        query = [('map', '/map/phh2o.map'), ('SERVICE', 'WCS'), ('VERSION', '2.0.1'),
                 ('REQUEST', 'DescribeCoverage'), ('COVERAGEID', 'phh2o_0-5cm_mean')]
        body, _, _ = read_http(source['endpoint']+'?'+urlencode(query))
        if b'CoverageDescription' not in body or b'ExceptionReport' in body:
            raise ValueError('Invalid WCS coverage metadata')
        record['artifacts'].append(self.artifact(sid, 'coverage.xml', body, 'catalog', source['endpoint']+'?'+urlencode(query)))
        native = CRS.from_proj4('+proj=igh +datum=WGS84 +units=m +no_defs')
        x, y = Transformer.from_crs(4326, native, always_xy=True).transform(self.lon, self.lat)
        half = self.config['soilSubsetWidthM']/2
        west, east = math.floor((x-half)/250)*250, math.ceil((x+half)/250)*250
        south, north = math.floor((y-half)/250)*250, math.ceil((y+half)/250)*250
        query = [('map', '/map/phh2o.map'), ('SERVICE', 'WCS'), ('VERSION', '2.0.1'),
                 ('REQUEST', 'GetCoverage'), ('COVERAGEID', 'phh2o_0-5cm_mean'),
                 ('SUBSET', f'X({west},{east})'), ('SUBSET', f'Y({south},{north})'), ('FORMAT', 'image/tiff')]
        url = source['endpoint']+'?'+urlencode(query)
        body, _, _ = read_http(url, limit=self.max_bytes)
        if not is_science_binary(body):
            raise ValueError('WCS did not return science TIFF')
        with MemoryFile(body) as mem, mem.open() as raster:
            if not raster.crs or not CRS.from_wkt(raster.crs.to_wkt()).equals(native, ignore_axis_order=True):
                raise ValueError('Unexpected SoilGrids CRS; verify native support before using subset')
            values = raster.read(1)
            r, c = raster.index(x, y)
            value = None if raster.read_masks(1)[r, c] == 0 else float(values[r, c])/10
            self.save_derived(sid, {'property': 'phh2o', 'unit': 'pH', 'depthCm': [0, 5],
                                   'statistic': 'mean_prediction', 'value': value,
                                   'gridCrsWkt': raster.crs.to_wkt(), 'gridBounds': list(raster.bounds),
                                   'pixelSizeM': list(raster.res), 'quality': 'Predicted fallback, not field soil test'})
        record['artifacts'].append(self.artifact(sid, 'phh2o_0-5cm_mean.tif', body, 'science', url))
        record.update(status='science_downloaded', scienceDownloaded=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', type=Path, required=True)
    parser.add_argument('--sources', default='all', help='Comma-separated registry IDs, or all')
    parser.add_argument('--download-earthdata', action='store_true', help='Requires EARTHDATA_TOKEN; bounded full assets, NOT spatial clipping')
    parser.add_argument('--max-file-mb', type=int, default=64)
    parser.add_argument('--require-all-science', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.max_file_mb <= 1024:
        parser.error('--max-file-mb must be 1..1024')
    config = decode_json(args.config.read_bytes())
    sources = decode_json(REGISTRY.read_bytes())['sources']
    requested = [s['id'] for s in sources] if args.sources == 'all' else args.sources.split(',')
    if set(requested) - {s['id'] for s in sources}:
        parser.error('Unknown source ID')
    acquisition = Acquisition(config, args.download_earthdata, args.max_file_mb)
    records = []
    for source in sources:
        if source['id'] in requested:
            record = acquisition.run_source(source)
            records.append(record)
            print(source['id']+': '+record['status'], flush=True)
    destination = ROOT/'data/manifests/research-runs'/acquisition.run_id
    destination.mkdir(parents=True)
    for record in records:
        (destination/(record['sourceId']+'.json')).write_text(json.dumps(record, indent=2, allow_nan=False)+'\n')
    print('Manifest directory:', destination.relative_to(ROOT))
    print('Raw science/catalog and derived samples are ignored local files; nothing is automatically published.')
    return 2 if args.require_all_science and not all(r['scienceDownloaded'] for r in records) else 0


if __name__ == '__main__':
    raise SystemExit(main())
