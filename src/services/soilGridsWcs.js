import { fromArrayBuffer } from "geotiff";

const properties = { clay: 10, sand: 10, soc: 10, nitrogen: 100, phh2o: 10 };
const depths = ["0-5cm", "5-15cm"];

// Egypt lies entirely in the northern sinusoidal lobe of Interrupted Goode
// Homolosine (+proj=igh +datum=WGS84), with central longitude 30°E.
// This restricted transform must not be used outside the app's Egypt bounds.
export function soilGridsCell(lat, lon) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < 22 ||
    lat > 32.5 ||
    lon < 24 ||
    lon > 37
  )
    throw new Error("SoilGrids cell requires Egypt coordinates");
  const rad = Math.PI / 180,
    radius = 6378137;
  const x = radius * ((lon - 30) * rad * Math.cos(lat * rad) + 30 * rad);
  const y = radius * lat * rad;
  const left = Math.floor(x / 250) * 250;
  const bottom = Math.floor(y / 250) * 250;
  return { x, y, bounds: [left, bottom, left + 250, bottom + 250] };
}

function noCoverage() {
  const error = new Error(
    "No usable SoilGrids prediction at the selected coordinates",
  );
  error.code = "SOIL_NO_COVERAGE";
  return error;
}

export async function parseSoilGridsCell(buffer, cell) {
  const tiff = await fromArrayBuffer(buffer);
  if ((await tiff.getImageCount()) !== 1)
    throw new Error("Unexpected SoilGrids images");
  const image = await tiff.getImage();
  const keys = image.getGeoKeys();
  // ISRIC's GeoTIFF uses a user-defined CRS with its ESRI WKT citation.
  const citation = keys.PCSCitationGeoKey ?? "";
  if (
    !citation.includes('PROJECTION["Goode_Homolosine"]') ||
    !citation.includes('PARAMETER["Central_Meridian",0.0]') ||
    !citation.includes('PARAMETER["False_Easting",0.0]') ||
    !citation.includes('PARAMETER["False_Northing",0.0]') ||
    !citation.includes('PARAMETER["Option",1.0]') ||
    keys.GeogSemiMajorAxisGeoKey !== 6378137 ||
    keys.GeogGeodeticDatumGeoKey !== 6326 ||
    keys.ProjLinearUnitsGeoKey !== 9001 ||
    keys.GTRasterTypeGeoKey !== 1
  )
    throw new Error("Unexpected SoilGrids CRS");
  if (
    image.getWidth() !== 1 ||
    image.getHeight() !== 1 ||
    image.getSamplesPerPixel() !== 1 ||
    image
      .getBoundingBox()
      .some(
        (value, i) =>
          !Number.isFinite(value) || Math.abs(value - cell.bounds[i]) > 0.01,
      )
  )
    throw new Error(
      "SoilGrids cell is not aligned with the selected coordinates",
    );
  const [value] = await image.readRasters({ interleave: true });
  if (
    !Number.isFinite(value) ||
    value === image.getGDALNoData() ||
    value < 0 ||
    value === 65535
  )
    throw noCoverage();
  return value;
}

export async function fetchSoilGridsWcs(lat, lon, request) {
  const cell = soilGridsCell(lat, lon),
    urls = [];
  const [left, bottom, right, top] = cell.bounds;
  const entries = await Promise.all(
    Object.entries(properties).map(async ([name, divisor]) => {
      const values = await Promise.all(
        depths.map(async (depth) => {
          const url = `https://maps.isric.org/mapserv?map=/map/${name}.map&SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID=${name}_${depth}_mean&FORMAT=image/tiff&SUBSET=x(${left},${right})&SUBSET=y(${bottom},${top})`;
          urls.push(url);
          const value = await parseSoilGridsCell(await request(url), cell);
          // Zero pH is fill, even if another depth has a valid prediction.
          if (name === "phh2o" && value === 0) throw noCoverage();
          if (
            (name === "phh2o" && value > 140) ||
            (["clay", "sand"].includes(name) && value > 1000)
          )
            throw new Error("Invalid native SoilGrids property");
          return value;
        }),
      );
      return [name, (values[0] + 2 * values[1]) / 3 / divisor];
    }),
  );
  if (entries.every(([, value]) => value === 0)) throw noCoverage();
  return {
    value: Object.fromEntries(entries),
    provider: "ISRIC SoilGrids 2.0 / WCS",
    url: "https://maps.isric.org/",
    urls,
    nativeBounds: cell.bounds,
    dataNature: "model prediction (not in-field measurement)",
  };
}
