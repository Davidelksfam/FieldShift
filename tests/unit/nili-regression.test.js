import test from "node:test";
import assert from "node:assert/strict";
import baselines from "../fixtures/pre-farmer-ux-baselines.json" with { type: "json" };
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import {
  evaluateFieldAndRotations as evaluate,
  generateCandidateRotations,
} from "../../src/engine/rotationEngine.js";
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
const project = (r) =>
  r.strategies.map(
    ({
      id,
      sequenceKey,
      finalSuitability,
      grossWaterM3Feddan,
      penalty,
      rank,
    }) => ({
      id,
      sequenceKey,
      finalSuitability,
      grossWaterM3Feddan,
      penalty,
      rank,
    }),
  );
const base = baselines[0].inputs;
test("recorded pre-refactor outputs: unchanged low-cover benchmark and explicit legacy high-cover scenarios", () => {
  for (const b of baselines) {
    const p = presets[b.id],
      data = getInitialFarmData(p.lat, p.lon, p.id);
    const r = evaluate(
      data,
      { ...b.inputs, forceNiliCover: b.coverRequired },
      crops,
    );
    assert.deepEqual(project(r), b.strategies);
    assert.deepEqual(r.rankedStrategyIds, b.rankedStrategyIds);
    assert.equal(r.candidateAudit.generated, b.generated);
  }
});
test("documented Nili change retains two-crop candidates for high-cover-proxy benchmarks", () => {
  const expected = {
    delta_kafr_el_sheikh: [
      ["baseline", "wheat/maize", 10, 8746, 48, 3],
      ["water", "faba_bean/sesame", 73, 4043, 0, 1],
      ["soil", "faba_bean/sesame/cowpea_nili", 62, 5228, 0, 2],
    ],
    west_delta_nubariya: [
      ["baseline", "wheat/maize", 10, 6758, 48, 3],
      ["water", "faba_bean/sesame", 85, 3124, 0, 1],
      ["soil", "faba_bean/soybean", 79, 4023, 0, 2],
    ],
  };
  for (const b of baselines.slice(1)) {
    const p = presets[b.id],
      r = evaluate(getInitialFarmData(p.lat, p.lon, p.id), b.inputs, crops);
    assert.equal(r.candidateAudit.generated, 32);
    assert.equal(b.generated, 16);
    assert.equal(r.candidateAudit.coverRequired, false);
    assert.equal(r.candidateAudit.lowCoverExplorationSuggested, true);
    assert.deepEqual(
      r.strategies.map((s) => [
        s.id,
        s.sequenceKey,
        s.finalSuitability,
        s.grossWaterM3Feddan,
        s.penalty,
        s.rank,
      ]),
      expected[b.id],
    );
    assert.notEqual(
      r.strategies.find((s) => s.id === "water").sequenceKey,
      b.strategies[1].sequenceKey,
    );
  }
  const forced = generateCandidateRotations(
    crops,
    { bareSoilDays: 0 },
    { ...base, forceNiliCover: true },
  );
  assert.equal(forced.retained, 16);
  assert.ok(forced.candidates.every((ids) => ids.length === 3));
});
