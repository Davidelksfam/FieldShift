import test from "node:test";
import assert from "node:assert/strict";
import { assertScientificQuantity } from "../../src/engine/v2/contracts.js";
const src = (id, outcomes) => ({
  id,
  outcomes,
  nature: "published_reference",
  availability: "available",
  reviewStatus: "verified_reference",
  title: "Software lineage fixture",
  url: "https://example.test/reference",
  validityScope: "Software tests only",
  regionIds: ["test-region"],
});
const registry = {
  method: src("method", ["gross_irrigation"]),
  operand: src("operand", ["net_irrigation"]),
};
const field = () => ({
  status: "available",
  value: 10,
  unit: "mm",
  provenance: {
    nature: "derived_model",
    sourceIds: ["method", "operand"],
    inputSourceIds: ["operand"],
    methodId: "test-only-method",
    inputRefs: ["net.value"],
  },
  validity: {
    regionId: "test-region",
    cropId: null,
    intendedUse: null,
    outcome: "gross_irrigation",
    period: null,
    scope: "Software-only fixture",
  },
  assumptions: ["Test only"],
  missingInputs: [],
  reasonCodes: [],
});
test("derived outcome retains separately validated operand lineage", () =>
  assert.equal(
    assertScientificQuantity(field(), { sourceRegistry: registry }).value,
    10,
  ));
test("direct sources must still match the derived endpoint", () => {
  const f = field();
  f.provenance.inputSourceIds = [];
  assert.throws(
    () => assertScientificQuantity(f, { sourceRegistry: registry }),
    /outcome/,
  );
});
test("operand lineage requires subset, derived nature and distinct direct source", () => {
  for (const patch of [
    { inputSourceIds: ["absent"] },
    { inputSourceIds: ["method", "operand"] },
    { nature: "farmer_scenario" },
  ]) {
    const f = field();
    Object.assign(f.provenance, patch);
    assert.throws(() =>
      assertScientificQuantity(f, { sourceRegistry: registry }),
    );
  }
});
test("operand lineage cannot bypass source identity, availability or regional scope", () => {
  for (const patch of [
    { id: "other" },
    { availability: "unavailable" },
    { regionIds: ["elsewhere"] },
  ]) {
    const r = { ...registry, operand: { ...registry.operand, ...patch } };
    assert.throws(() =>
      assertScientificQuantity(field(), { sourceRegistry: r }),
    );
  }
});
