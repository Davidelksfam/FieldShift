import { readFileSync } from "node:fs";
import {
  cropCoefficientAtDay,
  cropEtFromReference,
} from "../../src/engine/v2/waterModel.js";
const reference = JSON.parse(
  readFileSync(
    new URL(
      "../../tests/fixtures/v2-water/fao-published-checks.json",
      import.meta.url,
    ),
  ),
);
const checks = [];
for (const row of reference.coefficientInterpolation.published) {
  const actual = cropCoefficientAtDay(
      row.day,
      reference.coefficientInterpolation.stageLengthsDays,
      reference.coefficientInterpolation.coefficients,
    ).kc,
    tolerance =
      reference.coefficientInterpolation.toleranceDeclaredBeforeComparison
        .absoluteKc;
  checks.push({
    sourceId: reference.coefficientInterpolation.sourceId,
    day: row.day,
    published: row.kc,
    actual,
    tolerance,
    passed: Math.abs(row.kc - actual) <= tolerance,
  });
}
for (const row of reference.etcMultiplication.published) {
  const actual = cropEtFromReference(row.et0MmPerDay, row.kc),
    tolerance =
      reference.etcMultiplication.toleranceDeclaredBeforeComparison
        .absoluteMmPerDay;
  checks.push({
    sourceId: reference.etcMultiplication.sourceId,
    month: row.month,
    published: row.etcMmPerDay,
    actual,
    tolerance,
    passed: Math.abs(row.etcMmPerDay - actual) <= tolerance,
  });
}
console.log(
  JSON.stringify(
    {
      checks,
      fullSeasonEtc: "not_independently_compared",
      irrigationSchedule: "not_implemented_or_validated",
      claim:
        "Numerical component reference checks only; not field accuracy or validated savings.",
    },
    null,
    2,
  ),
);
if (checks.some((check) => !check.passed)) process.exitCode = 1;
