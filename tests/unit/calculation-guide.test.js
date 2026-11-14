import test from "node:test";
import assert from "node:assert/strict";
import crops from "../../src/data/egyptCrops.json" with { type: "json" };
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import { getInitialFarmData } from "../../src/services/nasaDataService.js";
import { evaluateFieldAndRotations } from "../../src/engine/rotationEngine.js";
import {
  evaluationInputs,
  prepareComparisonData,
} from "../../src/presentation/farmerModel.js";
import {
  GUIDE_QUESTIONS,
  calculationGuideAnswer,
} from "../../src/presentation/calculationGuide.js";
const data = getInitialFarmData(29.2315, 30.7952, "fayoum_etsa");
const base = {
  ...presets.fayoum_etsa.defaults,
  feddans: "",
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { water: 70, soil: 20, market: 10 },
};
function context(inputs = base, raw = data) {
  const prepared = prepareComparisonData(raw);
  return {
    lang: "en",
    inputs,
    data: prepared,
    evaluation: evaluateFieldAndRotations(
      prepared,
      evaluationInputs(inputs),
      crops,
    ),
    visible: true,
    catalog: crops,
  };
}
const ask = (topic, ctx = context()) =>
  calculationGuideAnswer({ ...ctx, topic });
const fact = (answer, id) => answer.facts.find((f) => f.id === id)?.value;

test("guide reads the actual winner, relative weights and displayed scores after priorities change", () => {
  const water = context(),
    soil = context({ ...base, weights: { water: 20, soil: 70, market: 10 } });
  assert.equal(GUIDE_QUESTIONS.length, 8);
  assert.match(ask("why", water).paragraphs[0], /Sesame/);
  assert.match(ask("why", soil).paragraphs[0], /Soybean/);
  assert.equal(fact(ask("why", water), "weights"), "70 : 20 : 10");
  assert.equal(
    fact(ask("why", soil), "score-water"),
    `${soil.evaluation.strategies.find((s) => s.id === "water").finalSuitability} / 100`,
  );
  const zero = context({ ...base, weights: { water: 0, soil: 0, market: 0 } });
  assert.equal(fact(ask("why", zero), "weights"), "50 : 30 : 20");
});
test("water and whole-field answers use engine totals and preserve absent or invalid area", () => {
  const current = context();
  assert.match(fact(ask("water", current), "water-difference"), /^5,815 /);
  assert.equal(ask("field", current).facts.length, 0);
  const entered = context({ ...base, feddans: 2, qirats: 12 });
  assert.equal(fact(ask("field", entered), "field-current"), "27,033");
  const oneQirat = context({ ...base, feddans: "", qirats: 1 });
  assert.equal(fact(ask("field", oneQirat), "area"), "0.0417");
  assert.equal(fact(ask("field", oneQirat), "field-current"), "451");
  assert.equal(
    ask("field", context({ ...base, feddans: 0, qirats: 24 })).facts.length,
    0,
  );
});
test("drip what-if isolates irrigation on identical baseline crops without changing inputs or results", () => {
  const ctx = context();
  const before = JSON.stringify(ctx);
  const answer = ask("drip", ctx);
  assert.match(fact(answer, "drip-current"), /^10,813 /);
  assert.match(fact(answer, "drip-scenario"), /^6,758 /);
  assert.match(fact(answer, "drip-difference"), /^4,055 /);
  assert.equal(JSON.stringify(ctx), before);
  const already = context({ ...base, irrigationType: "drip" });
  assert.match(fact(ask("drip", already), "drip-difference"), /^0 /);
  assert.match(ask("drip", already).paragraphs[1], /already selected drip/);
});
test("guide cannot reveal hidden results or run a what-if when climate support or ECe validation blocks the cards", () => {
  for (const topic of GUIDE_QUESTIONS.filter((q) => q.id !== "sources").map(
    (q) => q.id,
  )) {
    assert.equal(
      ask(topic, { ...context(), visible: false, catalog: null }).facts.length,
      0,
    );
    assert.equal(
      ask(topic, { ...context(), evaluation: null, catalog: null }).facts
        .length,
      0,
    );
  }
  const omitted = {
    ...data,
    sources: {
      ...data.sources,
      soil: { kind: "synthetic", status: "demo", usedInComparison: false },
    },
  };
  const answer = ask("sources", {
    ...context(),
    data: omitted,
    visible: false,
  });
  assert.equal(fact(answer, "soil"), "Unavailable · omitted from comparison");
  assert.match(
    answer.paragraphs.join(" "),
    /soil predictions, not field laboratory measurements/,
  );
});
test("salinity never substitutes screening for ECe and unsupported references remain explicit", () => {
  assert.equal(fact(ask("salinity"), "ece"), "Not supplied");
  const measured = ask("salinity", context({ ...base, soilEceDsm: 12 }));
  assert.equal(fact(measured, "ece"), "12");
  assert.match(
    measured.paragraphs.join(" "),
    /above|no matching quantitative reference/,
  );
  assert.match(measured.paragraphs[0], /not numerical crop penalties/);
});
test("nitrogen and Nili answers retain ordinal and conditional meanings in both languages", () => {
  assert.equal(fact(ask("nitrogen"), "n-current"), "-5");
  assert.match(ask("nitrogen").paragraphs[0], /not kilograms/);
  assert.match(
    ask("nili").paragraphs.join(" "),
    /Low NDVI alone cannot establish/,
  );
  const required = context({ ...base, forceNiliCover: true });
  assert.match(ask("nili", required).paragraphs[0], /require Nili/);
  for (const topic of GUIDE_QUESTIONS.map((q) => q.id)) {
    const answer = ask(topic, { ...required, lang: "ar" });
    assert.ok(
      answer.paragraphs.every((p) => typeof p === "string" && p.length > 0),
    );
    assert.doesNotMatch(JSON.stringify(answer), /undefined|NaN/);
  }
});
