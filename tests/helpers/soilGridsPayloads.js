import { fromArrayBuffer, writeArrayBuffer } from "geotiff";
import fixture from "../fixtures/soilgrids-cell.json" with { type: "json" };

export const auditedCell = Uint8Array.from(
  Buffer.from(fixture.base64, "base64"),
).buffer;
const image = await (await fromArrayBuffer(auditedCell)).getImage();
const template = Object.fromEntries(
  ["GeoKeyDirectory", "GeoAsciiParams", "GeoDoubleParams"].map((key) => [
    key,
    image.fileDirectory.getValue(key),
  ]),
);

// Generated HTTP fixtures use the real cell's CRS metadata; values are synthetic.
export function soilGridsPayload(
  url,
  { zero = false, rawValue, metadata = {} } = {},
) {
  const params = new URL(url).searchParams;
  const coverage = params.get("COVERAGEID");
  const subsets = params.getAll("SUBSET");
  const left = Number(subsets[0].match(/x\(([^,]+)/)[1]);
  const top = Number(subsets[1].match(/,([^\)]+)/)[1]);
  const name = coverage.split("_")[0];
  const raw = { clay: 300, sand: 500, soc: 90, nitrogen: 100, phh2o: 80 }[name];
  return writeArrayBuffer(new Uint16Array([zero ? 0 : (rawValue ?? raw)]), {
    width: 1,
    height: 1,
    GeographicTypeGeoKey: 32767,
    ...structuredClone(template),
    ModelPixelScale: [250, 250, 0],
    ModelTiepoint: [0, 0, 0, left, top, 0],
    ...metadata,
  });
}
