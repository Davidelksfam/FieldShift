import { evaluateRotationCalendar } from "./calendarEngine.js";
import {
  NILI_MODES,
  isRecord,
  nonempty,
  requireCondition,
  clone,
  reason,
} from "./contracts.js";
const compareIds = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
/** Generate possibilities, never suitability scores or permission from NDVI. */
export function generateCandidatesV2({
  cropCatalog = [],
  farmerInputs = {},
  regionId = null,
  scenario = {},
  calendarRegistry = { records: [], sources: {} },
  sourceRegistry = {},
  calendarEvaluator = evaluateRotationCalendar,
} = {}) {
  const mode = farmerInputs.niliMode ?? "off";
  requireCondition(
    NILI_MODES.includes(mode),
    "niliMode must be off, explore or require.",
  );
  requireCondition(
    Array.isArray(cropCatalog),
    "Crop catalog must be an array.",
  );
  requireCondition(
    cropCatalog.every((c) => isRecord(c) && nonempty(c.id)),
    "Catalog crop IDs are required.",
  );
  requireCondition(
    new Set(cropCatalog.map((c) => c.id)).size === cropCatalog.length,
    "Catalog IDs must be unique.",
  );
  const winter = cropCatalog
      .filter((c) => c.season === "Shitwi")
      .sort(compareIds),
    summer = cropCatalog.filter((c) => c.season === "Seifi").sort(compareIds),
    nili = cropCatalog.filter((c) => c.season === "Nili").sort(compareIds);
  const covers =
    mode === "off" ? [null] : mode === "require" ? nili : [null, ...nili];
  const excludedIds = farmerInputs.excludedCropIds ?? [];
  requireCondition(
    Array.isArray(excludedIds) && excludedIds.every(nonempty),
    "Explicit exclusions must be crop IDs.",
  );
  const byId = new Map(cropCatalog.map((c) => [c.id, c]));
  const buildEntry = (crop, plan = {}, role = "primary") => {
    requireCondition(isRecord(plan), "Dated crop plans must be objects.");
    return {
      cropId: crop.id,
      season: crop.season,
      role,
      intendedUse:
        plan.intendedUse ??
        farmerInputs.intendedUses?.[crop.id] ??
        scenario.intendedUses?.[crop.id] ??
        null,
      variety: plan.variety ?? null,
      sowingDate: plan.sowingDate ?? null,
      harvestDate: plan.harvestDate ?? null,
      terminationDate: plan.terminationDate ?? null,
      growthStagesDays: clone(plan.growthStagesDays ?? null),
      prepBufferDays: plan.prepBufferDays ?? null,
      inputSourceIds: clone(plan.inputSourceIds ?? []),
    };
  };
  const evaluated = [],
    excluded = [];
  for (const w of winter)
    for (const s of summer)
      for (const cover of covers) {
        const crops = [w, s, cover].filter(Boolean),
          cropIds = crops.map((c) => c.id),
          id = cropIds.join("/");
        const sequence = crops.map((c) =>
          buildEntry(c, scenario.cropPlans?.[c.id] ?? {}),
        );
        // Following winter is a constraint boundary, not another water crop silently
        // appended to the planned rotation/horizon.
        if (scenario.nextWinter) {
          const next = byId.get(scenario.nextWinter.cropId) ?? {
            id: scenario.nextWinter.cropId ?? null,
            season: null,
          };
          sequence.push(buildEntry(next, scenario.nextWinter, "next_winter"));
        }
        const hardReasons = [];
        if (cropIds.some((id) => excludedIds.includes(id)))
          hardReasons.push(
            reason(
              "farmer_excluded_crop",
              "A crop was explicitly excluded by the farmer.",
              "المزارع استبعد محصولاً من الدورة صراحةً.",
            ),
          );
        if (new Set(cropIds).size !== cropIds.length)
          hardReasons.push(
            reason(
              "repeated_crop_identifier",
              "A crop identifier repeats within the proposed primary rotation.",
              "محصول مكرر داخل الدورة الأساسية المقترحة.",
            ),
          );
        const calendar = hardReasons.length
          ? {
              status: "infeasible",
              reasonCodes: hardReasons.map((r) => r.code),
              reasons: hardReasons,
              missingFields: [],
              sourceIds: [],
              timeline: [],
              assumptions: [],
            }
          : calendarEvaluator({
              sequence: clone(sequence),
              regionId,
              scenarioYear: scenario.year,
              calendarRegistry,
              sourceRegistry,
              excludedCropIds: excludedIds,
              managementChecks: scenario.managementChecks ?? {},
              cultivationContext: {
                landType: farmerInputs.landType ?? scenario.landType ?? null,
              },
            });
        const candidate = {
          id,
          cropIds,
          sequence,
          feasibility: calendar,
          nili: {
            mode,
            status: cover ? calendar.status : "not_applicable",
            required: mode === "require",
          },
          decisionStatus:
            calendar.status === "infeasible"
              ? "excluded"
              : calendar.status === "unknown"
                ? "conditional"
                : "not_comparable",
          whyIncluded: [
            reason(
              "catalog_season_combination",
              "A catalog season combination, subject to sourced timing and evidence checks.",
              "توليفة مواسم من الدليل، بشرط فحص المواعيد والأدلة الموثقة.",
            ),
          ],
          whyExcluded:
            calendar.status === "infeasible" ? clone(calendar.reasons) : [],
          missingEvidence: clone(calendar.missingFields ?? []),
        };
        evaluated.push(candidate);
        if (calendar.status === "infeasible") excluded.push(candidate);
      }
  const feasible = evaluated.filter((c) => c.feasibility.status === "feasible");
  const exploratory = evaluated.filter(
    (c) => c.feasibility.status === "unknown",
  );
  // Require is not weakened into explore when timing or management is unknown.
  const candidates =
    mode === "require"
      ? feasible
      : evaluated.filter((c) => c.feasibility.status !== "infeasible");
  const reasons = [];
  if (mode === "require" && !feasible.length)
    reasons.push(
      reason(
        "no_feasible_required_nili",
        "No required-cover sequence has a verified feasible full timeline and management checks. The requirement was not relaxed.",
        "لا توجد دورة غطاء نيلي مطلوبة بتتابع مواعيد ومراجعات إدارة مثبتة. لم يُخفف الشرط.",
      ),
    );
  if (!winter.length || !summer.length)
    reasons.push(
      reason(
        "missing_season_catalog",
        "A winter or summer catalog group is missing.",
        "مجموعة محاصيل شتوية أو صيفية غير متاحة في الدليل.",
      ),
    );
  if (mode !== "off" && !nili.length)
    reasons.push(
      reason(
        "missing_nili_catalog",
        "No Nili crop is available in the supplied catalog.",
        "لا يوجد محصول نيلي في الدليل المُدخل.",
      ),
    );
  return {
    mode,
    generated: evaluated.length,
    retained: candidates.length,
    feasibleCount: feasible.length,
    unknownCount: exploratory.length,
    excludedCount: excluded.length,
    candidates,
    evaluatedCandidates: evaluated,
    excluded,
    exploratoryCandidates: mode === "require" ? [] : exploratory,
    reasons,
    sourceIds: [
      ...new Set(evaluated.flatMap((c) => c.feasibility.sourceIds ?? [])),
    ].sort(),
    policy: {
      ndviRole: "advisory_only",
      calendarRequiredForProposed: true,
      calendarStatus:
        "not_a_validated_planting_calendar_without_supported_inputs",
    },
  };
}
