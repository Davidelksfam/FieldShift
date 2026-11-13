import {
  assertCalendarRecord,
  clone,
  isRecord,
  isoDay,
  nonempty,
  reason,
  sourceIsAvailable,
  summarizeFeasibility,
} from "./contracts.js";

const DAY_MS = 86400000;
const stageNames = ["initial", "development", "mid", "late"];
const dateMs = (value) => Date.parse(value + "T00:00:00Z");
export function addCalendarDays(day, count) {
  if (!isoDay(day) || !Number.isSafeInteger(count)) return null;
  const result = new Date(dateMs(day) + count * DAY_MS);
  if (!Number.isFinite(result.valueOf())) return null;
  const normalized = result.toISOString().slice(0, 10);
  return isoDay(normalized) ? normalized : null;
}
function monthDay(value) {
  return (
    typeof value === "string" &&
    /^\d{2}-\d{2}$/.test(value) &&
    isoDay("2000-" + value)
  );
}
function windowContains(day, window, unit) {
  if (!isRecord(window)) return null;
  if (unit === "MM-DD" && monthDay(window.start) && monthDay(window.end)) {
    const value = day.slice(5);
    return window.start <= window.end
      ? value >= window.start && value <= window.end
      : value >= window.start || value <= window.end;
  }
  if (
    unit === "ISO-8601 date" &&
    isoDay(window.start) &&
    isoDay(window.end) &&
    window.start <= window.end
  )
    return day >= window.start && day <= window.end;
  return null;
}
function stageBounds(value) {
  const stages = Array.isArray(value)
    ? value
    : isRecord(value)
      ? stageNames.map((key) => value[key])
      : null;
  if (!stages || stages.length !== 4) return null;
  const normalized = stages.map((stage) =>
    Number.isSafeInteger(stage) && stage > 0
      ? { min: stage, max: stage }
      : isRecord(stage) &&
          Number.isSafeInteger(stage.min) &&
          Number.isSafeInteger(stage.max) &&
          stage.min > 0 &&
          stage.max >= stage.min
        ? { min: stage.min, max: stage.max }
        : null,
  );
  if (normalized.some((stage) => !stage)) return null;
  return {
    stages: normalized,
    min: normalized.reduce((sum, s) => sum + s.min, 0),
    max: normalized.reduce((sum, s) => sum + s.max, 0),
  };
}
function sourcePeriod(source) {
  return source?.validity?.period ?? source?.period ?? null;
}
function periodCovers(period, dates) {
  return (
    period === null ||
    (isRecord(period) &&
      isoDay(period.start) &&
      isoDay(period.end) &&
      period.start <= period.end &&
      dates.every((date) => date >= period.start && date <= period.end))
  );
}
function isSourceFor(
  source,
  id,
  { regionId, cropId, intendedUse, dates = [] },
  nature = null,
) {
  return (
    sourceIsAvailable(source) &&
    source.id === id &&
    (!nature || source.nature === nature) &&
    Array.isArray(source.regionIds) &&
    source.regionIds.includes(regionId) &&
    (!nonempty(cropId) ||
      source.cropIds == null ||
      (Array.isArray(source.cropIds) && source.cropIds.includes(cropId))) &&
    (!nonempty(intendedUse) ||
      source.intendedUses == null ||
      (Array.isArray(source.intendedUses) &&
        source.intendedUses.includes(intendedUse))) &&
    periodCovers(sourcePeriod(source), dates)
  );
}
function sourcesFor(ids, sources, scope) {
  return (
    Array.isArray(ids) &&
    ids.length > 0 &&
    ids.every(
      (id) =>
        isSourceFor(sources[id], id, scope, "farmer_scenario") &&
        sources[id].reviewStatus === "recorded_input",
    )
  );
}
function registryRecords(registry) {
  return Array.isArray(registry)
    ? registry
    : Array.isArray(registry?.records)
      ? registry.records
      : [];
}

/**
 * Actual UTC-date temporal feasibility, never a crop-calendar inference engine.
 * Each input date is a declared scenario, not evidence of regional suitability.
 * Crops occupy their whole sowing..end day inclusively. Buffers count clear days.
 */
export function evaluateRotationCalendar({
  sequence = [],
  regionId = null,
  scenarioYear = null,
  calendarRegistry = { records: [], sources: {} },
  sourceRegistry = {},
  excludedCropIds = [],
  managementChecks = {},
  cultivationContext = {},
} = {}) {
  const sources = {
    ...(isRecord(calendarRegistry?.sources) ? calendarRegistry.sources : {}),
    ...sourceRegistry,
  };
  const records = registryRecords(calendarRegistry);
  const findings = [],
    missingFields = new Set(),
    usedSources = new Set(),
    assumptions = [];
  const add = (
    status,
    code,
    en,
    ar,
    { field = null, index = null, sourceIds = [], ...details } = {},
  ) => {
    if (field && status === "unknown") missingFields.add(field);
    sourceIds.forEach((id) => usedSources.add(id));
    findings.push({
      status,
      ...reason(code, en, ar, {
        index,
        field,
        sourceIds: [...sourceIds],
        ...details,
      }),
    });
  };
  if (!Array.isArray(sequence)) sequence = [];
  if (!sequence.length)
    add(
      "unknown",
      "sequence_missing",
      "An ordered crop sequence is required.",
      "يلزم ترتيب محاصيل صريح.",
      { field: "sequence" },
    );
  if (!nonempty(regionId))
    add(
      "unknown",
      "region_missing",
      "The calendar region must be explicit.",
      "يجب تحديد منطقة التقويم صراحةً.",
      { field: "regionId" },
    );
  if (
    !Number.isInteger(scenarioYear) ||
    scenarioYear < 1 ||
    scenarioYear > 9999
  )
    add(
      "unknown",
      "scenario_year_missing",
      "An explicit scenario year is required; no current-year default is inferred.",
      "يلزم عام سيناريو صريح؛ لا يُفترض العام الحالي.",
      { field: "scenarioYear" },
    );

  const timeline = sequence.map((raw, index) => {
    const entry = isRecord(raw) ? raw : {};
    const suppliedDates = ["sowingDate", "harvestDate", "terminationDate"]
      .map((key) => entry[key])
      .filter(isoDay);
    const scope = {
      regionId,
      cropId: entry.cropId,
      intendedUse: entry.intendedUse,
      dates: suppliedDates,
    };
    const startFinding = findings.length;
    const boundaryOnly = entry.role === "next_winter";
    const path = (key) => `sequence[${index}].${key}`;
    if (!nonempty(entry.cropId))
      add(
        "unknown",
        "crop_id_missing",
        "Crop identity is missing.",
        "هوية المحصول مفقودة.",
        { field: path("cropId"), index },
      );
    if (!nonempty(entry.intendedUse))
      add(
        "unknown",
        "intended_use_missing",
        "The intended crop use is not established.",
        "لم يتحدد غرض المحصول.",
        { field: path("intendedUse"), index },
      );
    if (excludedCropIds.includes(entry.cropId))
      add(
        "infeasible",
        "farmer_excluded_crop",
        "This crop is explicitly excluded by the farmer.",
        "المزارع استبعد هذا المحصول صراحةً.",
        { index },
      );
    const matching = records.filter(
      (r) =>
        r.cropId === entry.cropId &&
        r.regionId === regionId &&
        r.intendedUse === entry.intendedUse &&
        (r.variety ?? null) === (entry.variety ?? null),
    );
    let record = matching.length === 1 ? matching[0] : null,
      supportedRecord = false;
    if (matching.length > 1)
      add(
        "unknown",
        "ambiguous_calendar",
        "Multiple calendar records match; choose a specific profile.",
        "أكثر من تقويم مطابق؛ يلزم اختيار ملف محدد.",
        { field: path("calendarProfile"), index },
      );
    if (!record)
      add(
        "unknown",
        "calendar_missing",
        "No exact crop/region/use/cultivar calendar is established.",
        "لا يوجد تقويم مطابق للمحصول والمنطقة والغرض والصنف.",
        { field: path("calendar"), index },
      );
    else {
      try {
        assertCalendarRecord(record, { sourceRegistry: sources });
        supportedRecord =
          ["verified", "partially_verified"].includes(record.reviewStatus) &&
          isSourceFor(
            sources[record.sourceId],
            record.sourceId,
            scope,
            "published_reference",
          ) &&
          sources[record.sourceId].reviewStatus === "verified_reference" &&
          Array.isArray(sources[record.sourceId].cropIds) &&
          sources[record.sourceId].cropIds.includes(entry.cropId) &&
          Array.isArray(sources[record.sourceId].intendedUses) &&
          sources[record.sourceId].intendedUses.includes(entry.intendedUse);
      } catch {
        supportedRecord = false;
      }
      if (supportedRecord && isRecord(record.requiredContext)) {
        for (const [key, expected] of Object.entries(record.requiredContext)) {
          if (cultivationContext?.[key] !== expected) {
            supportedRecord = false;
            add(
              "unknown",
              "calendar_context_mismatch",
              "The declared cultivation scenario does not establish the reference land-management scope.",
              "سيناريو الزراعة المعلن لا يثبت مطابقة نطاق إدارة الأرض في المرجع.",
              {
                field: `cultivationContext.${key}`,
                index,
                expected,
                actual: cultivationContext?.[key] ?? null,
              },
            );
          }
        }
      }
      if (!supportedRecord)
        add(
          "unknown",
          "calendar_unverified",
          "Calendar provenance or scope is unverified or unavailable.",
          "مصدر التقويم أو نطاقه غير موثق أو غير متاح.",
          { field: path("calendarProvenance"), index },
        );
      else usedSources.add(record.sourceId);
      if (!nonempty(record.variety))
        add(
          "unknown",
          "cultivar_scope_unknown",
          "The reference does not establish cultivar-specific suitability.",
          "المرجع لا يثبت الملاءمة لصنف محدد.",
          { field: path("variety"), index },
        );
    }
    const ids = Array.isArray(entry.inputSourceIds) ? entry.inputSourceIds : [];
    const inputSupported = sourcesFor(ids, sources, scope);
    const dateInputSupported =
      ids.length > 0 &&
      ids.every(
        (id) =>
          isSourceFor(
            sources[id],
            id,
            {
              regionId,
              cropId:
                !boundaryOnly || records.some((r) => r.cropId === entry.cropId)
                  ? entry.cropId
                  : null,
              intendedUse: entry.intendedUse ?? null,
              dates: suppliedDates,
            },
            "farmer_scenario",
          ) && sources[id].reviewStatus === "recorded_input",
      );
    if (
      ids.some(
        (id) =>
          sourceIsAvailable(sources[id]) &&
          !periodCovers(sourcePeriod(sources[id]), suppliedDates),
      )
    )
      add(
        "unknown",
        "input_source_period_mismatch",
        "Source temporal scope does not cover the declared dates.",
        "النطاق الزمني للمصدر لا يغطي المواعيد المُعلنة.",
        { field: path("inputSourceIds"), index },
      );
    const dateFields = ["sowingDate", "harvestDate", "terminationDate"];
    const dates = {};
    for (const key of dateFields) {
      const value = entry[key];
      if (value === null || value === undefined || value === "")
        dates[key] = null;
      else if (!isoDay(value)) {
        dates[key] = null;
        add(
          "unknown",
          "invalid_calendar_date",
          "A supplied date is not a valid ISO calendar day.",
          "تاريخ مُدخل ليس يوماً تقويمياً ISO صالحاً.",
          { field: path(key), index },
        );
      } else dates[key] = value;
    }
    if (!dates.sowingDate)
      add(
        "unknown",
        "sowing_date_missing",
        "An actual sowing date is required; a season label is insufficient.",
        "يلزم تاريخ زراعة فعلي؛ اسم الموسم لا يكفي.",
        { field: path("sowingDate"), index },
      );
    const endDates = [dates.harvestDate, dates.terminationDate]
      .filter(Boolean)
      .sort();
    const endDate = endDates.at(-1) ?? null;
    if (!endDate && !boundaryOnly)
      add(
        "unknown",
        "crop_end_date_missing",
        "An actual harvest or termination date is required.",
        "يلزم تاريخ حصاد أو إنهاء فعلي.",
        { field: path("harvestDateOrTerminationDate"), index },
      );
    if (
      (dateFields.some((key) => dates[key]) ||
        entry.growthStagesDays != null ||
        entry.prepBufferDays != null) &&
      !inputSupported
    )
      add(
        "unknown",
        "input_provenance_missing",
        "Entered dates and management durations need available matching recorded-input provenance.",
        "المواعيد ومدد الإدارة المدخلة تحتاج توثيق مدخلات متاحاً ومطابقاً.",
        { field: path("inputSourceIds"), index },
      );
    if (dateInputSupported) {
      ids.forEach((id) => usedSources.add(id));
      assumptions.push(
        `sequence[${index}]: explicit dated scenario input; not independent regional or field validation.`,
      );
    }
    if (
      dates.sowingDate &&
      endDate &&
      dateInputSupported &&
      endDate < dates.sowingDate
    )
      add(
        "infeasible",
        "end_before_sowing",
        "The declared crop end precedes sowing.",
        "نهاية المحصول المُدخلة تسبق الزراعة.",
        { index, sourceIds: ids },
      );
    if (supportedRecord && dates.sowingDate && inputSupported) {
      const inside = windowContains(
        dates.sowingDate,
        record.sowingWindow,
        record.units?.sowingWindow,
      );
      if (inside === false)
        add(
          "infeasible",
          "outside_supported_sowing_window",
          "The date is outside the cited calendar sowing window.",
          "التاريخ خارج نافذة الزراعة في التقويم المشار إليه.",
          { index, sourceIds: [record.sourceId, ...ids] },
        );
      if (inside === null)
        add(
          "unknown",
          "sowing_window_missing",
          "A sourced, compatible sowing window is unavailable.",
          "نافذة زراعة موثقة ومطابقة غير متاحة.",
          { field: path("sowingWindow"), index },
        );
    }
    if (supportedRecord && endDate && inputSupported) {
      const inside = windowContains(
        endDate,
        record.harvestWindow,
        record.units?.harvestWindow,
      );
      if (inside === false)
        add(
          "infeasible",
          "outside_supported_end_window",
          "The end date is outside the cited use-matched harvest/termination window.",
          "تاريخ النهاية خارج نافذة الحصاد أو الإنهاء المطابقة للغرض.",
          { index, sourceIds: [record.sourceId, ...ids] },
        );
      if (inside === null)
        add(
          "unknown",
          "harvest_window_missing",
          "A sourced, compatible harvest/termination window is unavailable.",
          "نافذة حصاد أو إنهاء موثقة ومطابقة غير متاحة.",
          { field: path("harvestWindow"), index },
        );
    }
    const referenceStages =
      supportedRecord && record.units?.growthStagesDays === "days"
        ? stageBounds(record.growthStagesDays)
        : null;
    if (!referenceStages && !boundaryOnly)
      add(
        "unknown",
        "regional_stage_durations_missing",
        "Four sourced crop-stage duration profiles are not established.",
        "لم تثبت مدد المراحل الأربع بمصدر مطابق.",
        { field: path("growthStagesDays"), index },
      );
    const explicitStages =
      entry.growthStagesDays == null
        ? null
        : stageBounds(entry.growthStagesDays);
    if (
      entry.growthStagesDays != null &&
      (!explicitStages || explicitStages.min !== explicitStages.max)
    )
      add(
        "unknown",
        "actual_stage_durations_invalid",
        "Actual stage lengths must be four positive whole-day values.",
        "مدد المراحل الفعلية يجب أن تكون أربع قيم صحيحة موجبة بالأيام.",
        { field: path("growthStagesDays"), index },
      );
    if (
      referenceStages &&
      explicitStages &&
      inputSupported &&
      explicitStages.stages.some(
        (stage, i) =>
          stage.min < referenceStages.stages[i].min ||
          stage.max > referenceStages.stages[i].max,
      )
    )
      add(
        "infeasible",
        "stage_duration_outside_reference",
        "A declared stage duration is outside the matching sourced range.",
        "مدة مرحلة مُدخلة خارج المجال المرجعي المطابق.",
        { index, sourceIds: [record.sourceId, ...ids] },
      );
    const duration =
      dates.sowingDate && endDate && endDate >= dates.sowingDate
        ? Math.round((dateMs(endDate) - dateMs(dates.sowingDate)) / DAY_MS) + 1
        : null;
    if (
      supportedRecord &&
      record.growingPeriodDays != null &&
      duration !== null &&
      inputSupported
    ) {
      const range = record.growingPeriodDays;
      const valid =
        record.units?.growingPeriodDays === "days" &&
        Number.isInteger(range.min) &&
        Number.isInteger(range.max) &&
        range.min > 0 &&
        range.max >= range.min;
      if (!valid)
        add(
          "unknown",
          "growing_period_invalid",
          "The total growing-period range or its units are unsupported.",
          "مجال فترة النمو الكلية أو وحداته غير مدعوم.",
          { field: path("growingPeriodDays"), index },
        );
      else if (duration < range.min || duration > range.max)
        add(
          "infeasible",
          "growing_period_outside_reference",
          "The declared crop duration is outside the published total growing-period range.",
          "مدة المحصول المُدخلة خارج مجال فترة النمو الكلية المنشور.",
          { index, sourceIds: [record.sourceId, ...ids] },
        );
    }
    if (
      referenceStages &&
      duration !== null &&
      inputSupported &&
      (duration < referenceStages.min || duration > referenceStages.max)
    )
      add(
        "infeasible",
        "crop_duration_outside_reference",
        "The declared inclusive crop cycle is outside the sourced total stage range.",
        "مدة الدورة المُدخلة، شاملة يومي البداية والنهاية، خارج مجموع مدد المراحل الموثقة.",
        { index, sourceIds: [record.sourceId, ...ids] },
      );
    if (
      explicitStages &&
      explicitStages.min === explicitStages.max &&
      duration !== null &&
      inputSupported &&
      explicitStages.min !== duration
    )
      add(
        "infeasible",
        "stage_dates_inconsistent",
        "Four entered stage lengths do not cover the declared sowing-through-end dates exactly.",
        "مدد المراحل الأربع لا تغطي تواريخ الزراعة حتى النهاية المُدخلة تماماً.",
        { index, sourceIds: ids },
      );
    const referenceBuffer =
      supportedRecord &&
      record.units?.prepBufferDays === "days" &&
      Number.isSafeInteger(record.prepBufferDays) &&
      record.prepBufferDays >= 0
        ? record.prepBufferDays
        : null;
    const explicitBuffer =
      Number.isSafeInteger(entry.prepBufferDays) &&
      entry.prepBufferDays >= 0 &&
      inputSupported
        ? entry.prepBufferDays
        : null;
    if (referenceBuffer === null && !boundaryOnly)
      add(
        "unknown",
        "regional_preparation_buffer_missing",
        "No sourced local preparation/termination buffer is established.",
        "لم تثبت مهلة تجهيز أو إنهاء محلية بمصدر.",
        { field: path("prepBufferDays"), index },
      );
    const buffer = explicitBuffer ?? referenceBuffer;
    if (entry.prepBufferDays != null && explicitBuffer === null)
      add(
        "unknown",
        "preparation_buffer_invalid",
        "A preparation buffer needs a non-negative whole-day value and input provenance.",
        "مهلة التجهيز تحتاج عدداً صحيحاً غير سالب من الأيام وتوثيقاً للمدخلات.",
        { field: path("prepBufferDays"), index },
      );
    if (
      referenceBuffer !== null &&
      explicitBuffer !== null &&
      explicitBuffer < referenceBuffer
    )
      add(
        "infeasible",
        "preparation_buffer_below_reference",
        "The entered clear-day buffer is shorter than the sourced requirement.",
        "مهلة الأيام الخالية المدخلة أقصر من المتطلب الموثق.",
        { index, sourceIds: [record.sourceId, ...ids] },
      );
    if (supportedRecord && record.reviewStatus !== "verified" && !boundaryOnly)
      add(
        "unknown",
        "calendar_incomplete",
        "Only part of this calendar has been verified.",
        "لم يوثق إلا جزء من هذا التقويم.",
        { field: path("completeCalendar"), index },
      );
    const readyDate =
      endDate !== null && buffer !== null
        ? addCalendarDays(endDate, buffer + 1)
        : null;
    if (endDate !== null && buffer !== null && readyDate === null)
      add(
        "unknown",
        "date_arithmetic_out_of_range",
        "The preparation interval exceeds the supported ISO-day range.",
        "فترة التجهيز تتجاوز نطاق أيام ISO المدعوم.",
        { field: path("prepBufferDays"), index },
      );
    const bufferSources =
      explicitBuffer !== null
        ? ids
        : referenceBuffer !== null
          ? [record.sourceId]
          : [];
    if (
      readyDate &&
      bufferSources.some(
        (id) => !periodCovers(sourcePeriod(sources[id]), [endDate, readyDate]),
      )
    )
      add(
        "unknown",
        "preparation_source_period_mismatch",
        "Buffer provenance does not cover the resulting preparation interval.",
        "توثيق مهلة التجهيز لا يغطي الفترة الناتجة.",
        { field: path("prepBufferDays"), index },
      );
    const exactStages =
      explicitStages &&
      explicitStages.min === explicitStages.max &&
      inputSupported
        ? explicitStages.stages.map((s) => s.min)
        : referenceStages && referenceStages.min === referenceStages.max
          ? referenceStages.stages.map((s) => s.min)
          : null;
    if (findings.length === startFinding)
      add(
        "feasible",
        "calendar_checks_pass",
        "Declared dated scenario passes the supplied calendar checks.",
        "السيناريو المؤرخ يجتاز فحوص التقويم المقدمة.",
        { index, sourceIds: [record.sourceId, ...ids] },
      );
    return {
      index,
      cropId: entry.cropId ?? null,
      intendedUse: entry.intendedUse ?? null,
      variety: entry.variety ?? null,
      season: entry.season ?? null,
      role: entry.role ?? "primary",
      sowingDate: dates.sowingDate,
      harvestDate: dates.harvestDate,
      terminationDate: dates.terminationDate,
      endDate,
      growthStagesDays: exactStages,
      growthDurationBounds: referenceStages
        ? { min: referenceStages.min, max: referenceStages.max, unit: "days" }
        : null,
      growingPeriodDays:
        supportedRecord && record.growingPeriodDays
          ? clone(record.growingPeriodDays)
          : null,
      prepBufferDays: buffer,
      preparationCompleteDate:
        endDate !== null && buffer !== null
          ? addCalendarDays(endDate, buffer)
          : null,
      earliestNextSowingDate:
        endDate !== null && buffer !== null
          ? addCalendarDays(endDate, buffer + 1)
          : null,
      dateOrigin: dateInputSupported ? "recorded_scenario" : "unverified_input",
      calendarReviewStatus: record?.reviewStatus ?? "unavailable",
      sourceIds: [
        ...new Set([
          ...(supportedRecord ? [record.sourceId] : []),
          ...(dateInputSupported ? ids : []),
        ]),
      ],
      fieldProvenance: {
        sowingDate: {
          sourceIds: dateInputSupported ? [...ids] : [],
          inputRef: path("sowingDate"),
          nature: dateInputSupported ? "farmer_scenario" : "unknown",
        },
        harvestDate: {
          sourceIds: dateInputSupported ? [...ids] : [],
          inputRef: path("harvestDate"),
          nature: dateInputSupported ? "farmer_scenario" : "unknown",
        },
        terminationDate: {
          sourceIds: dateInputSupported ? [...ids] : [],
          inputRef: path("terminationDate"),
          nature: dateInputSupported ? "farmer_scenario" : "unknown",
        },
        endDate: {
          sourceIds: dateInputSupported ? [...ids] : [],
          method: "latest_declared_harvest_or_termination",
          inputRefs: [path("harvestDate"), path("terminationDate")],
        },
        growthStagesDays: {
          sourceIds:
            explicitStages && inputSupported
              ? [...ids]
              : referenceStages
                ? [record.sourceId]
                : [],
          origin:
            explicitStages && inputSupported
              ? "recorded_scenario"
              : referenceStages
                ? "published_reference"
                : "unavailable",
        },
        growthDurationBounds: {
          sourceIds: referenceStages ? [record.sourceId] : [],
        },
        growingPeriodDays: {
          sourceIds:
            supportedRecord && record.growingPeriodDays
              ? [record.sourceId]
              : [],
        },
        prepBufferDays: {
          sourceIds:
            explicitBuffer !== null
              ? [...ids]
              : referenceBuffer !== null
                ? [record.sourceId]
                : [],
          origin:
            explicitBuffer !== null
              ? "recorded_scenario"
              : referenceBuffer !== null
                ? "published_reference"
                : "unavailable",
        },
        preparationCompleteDate: {
          method: "end_plus_full_clear_buffer_days",
          inputRefs: [
            path("harvestDateOrTerminationDate"),
            path("prepBufferDays"),
          ],
        },
        earliestNextSowingDate: {
          method: "end_plus_full_clear_buffer_days_plus_one",
          inputRefs: [
            path("harvestDateOrTerminationDate"),
            path("prepBufferDays"),
          ],
        },
      },
      units: {
        sowingDate: "ISO-8601 date",
        harvestDate: "ISO-8601 date",
        terminationDate: "ISO-8601 date",
        growthStagesDays: "days",
        growingPeriodDays: "days",
        growthDurationBounds: "days",
        endDate: "ISO-8601 date",
        preparationCompleteDate: "ISO-8601 date",
        earliestNextSowingDate: "ISO-8601 date",
        prepBufferDays: "days",
      },
      validity: {
        regionId,
        intendedUse: entry.intendedUse ?? null,
        scope:
          "Declared temporal scenario only; not an agronomic planting approval",
      },
      inputSupported,
      dateInputSupported,
      status: summarizeFeasibility(findings.slice(startFinding)),
      missingFields: [
        ...new Set(
          findings
            .slice(startFinding)
            .filter((x) => x.status === "unknown" && x.field)
            .map((x) => x.field),
        ),
      ],
    };
  });

  for (let i = 1; i < timeline.length; i++) {
    const previous = timeline[i - 1],
      next = timeline[i];
    if (
      previous.endDate &&
      next.sowingDate &&
      previous.dateInputSupported &&
      next.dateInputSupported &&
      previous.endDate >= next.sowingDate
    )
      add(
        "infeasible",
        "crop_intervals_overlap",
        "Consecutive crops overlap at daily resolution.",
        "المحاصيل المتتابعة متداخلة على دقة اليوم.",
        {
          index: i,
          previousIndex: i - 1,
          sourceIds: [...previous.sourceIds, ...next.sourceIds],
        },
      );
    else if (
      previous.earliestNextSowingDate &&
      next.sowingDate &&
      previous.dateInputSupported &&
      next.dateInputSupported &&
      next.sowingDate < previous.earliestNextSowingDate
    )
      add(
        "infeasible",
        "preparation_interval_conflict",
        "The next crop starts before all declared clear preparation days finish.",
        "المحصول التالي يبدأ قبل اكتمال كل أيام التجهيز الخالية المُعلنة.",
        {
          index: i,
          previousIndex: i - 1,
          sourceIds: [...previous.sourceIds, ...next.sourceIds],
        },
      );
  }
  const niliIndices = timeline.flatMap((entry, index) =>
    entry.season === "Nili" || entry.role === "nili" ? [index] : [],
  );
  for (const index of niliIndices) {
    const previous = timeline[index - 1],
      following = timeline[index + 1];
    if (!previous || previous.season !== "Seifi")
      add(
        "unknown",
        "nili_summer_predecessor_missing",
        "A Nili scenario requires its actual preceding summer crop timeline.",
        "سيناريو النيلي يحتاج تسلسل المحصول الصيفي السابق فعلياً.",
        { field: `sequence[${index}].precedingSummer`, index },
      );
    if (
      !following ||
      following.role !== "next_winter" ||
      following.season !== "Shitwi"
    )
      add(
        "unknown",
        "nili_next_winter_missing",
        "The complete Nili-to-next-winter timeline must be supplied.",
        "يلزم إدخال تسلسل النيلي حتى الشتوي التالي كاملاً.",
        { field: `sequence[${index}].nextWinter`, index },
      );
  }
  if (niliIndices.length)
    for (const key of ["waterAvailability", "pestReview"]) {
      const check = managementChecks?.[key];
      const ids = Array.isArray(check?.sourceIds) ? check.sourceIds : [];
      const niliDates = niliIndices
        .flatMap((index) => [
          timeline[index].sowingDate,
          timeline[index].endDate,
        ])
        .filter(Boolean);
      const available =
        niliDates.length === niliIndices.length * 2 &&
        ids.length > 0 &&
        ids.every((id) => {
          const source = sources[id],
            period = check.period ?? sourcePeriod(source);
          return (
            ((source?.nature === "farmer_scenario" &&
              source.reviewStatus === "recorded_input") ||
              (source?.nature === "published_reference" &&
                source.reviewStatus === "verified_reference")) &&
            Array.isArray(source.managementChecks) &&
            source.managementChecks.includes(key) &&
            period !== null &&
            periodCovers(period, niliDates) &&
            periodCovers(sourcePeriod(source), niliDates) &&
            niliIndices.every((index) =>
              isSourceFor(source, id, {
                regionId,
                cropId: timeline[index].cropId,
                intendedUse: timeline[index].intendedUse,
                dates: niliDates,
              }),
            )
          );
        });
      if (!available || !["feasible", "infeasible"].includes(check?.status))
        add(
          "unknown",
          `nili_${key}_unknown`,
          "Nili water availability and local pest/management review require explicit supported checks.",
          "توفر مياه النيلي ومراجعة الآفات والإدارة المحلية يحتاجان فحوصاً صريحة موثقة.",
          { field: `managementChecks.${key}` },
        );
      else
        add(
          check.status,
          `nili_${key}_${check.status}`,
          "The declared Nili management check is retained with its provenance.",
          "يُحتفظ بفحص إدارة النيلي المُعلن وتوثيقه.",
          { sourceIds: ids },
        );
    }
  const primaryDates = timeline
    .filter((entry) => entry.role !== "next_winter")
    .flatMap((entry) => [entry.sowingDate, entry.endDate])
    .filter(Boolean);
  if (
    Number.isInteger(scenarioYear) &&
    scenarioYear > 0 &&
    primaryDates.length
  ) {
    const yearStart = String(scenarioYear).padStart(4, "0") + "-01-01",
      yearEnd = String(scenarioYear).padStart(4, "0") + "-12-31";
    const intersects = timeline
      .filter((entry) => entry.role !== "next_winter")
      .some((entry) => {
        const start = entry.sowingDate ?? entry.endDate,
          end = entry.endDate ?? entry.sowingDate;
        return start && end && start <= yearEnd && end >= yearStart;
      });
    if (!intersects)
      add(
        "unknown",
        "scenario_year_mismatch",
        "The primary timeline is wholly outside the declared scenario year.",
        "التسلسل الأساسي يقع بالكامل خارج عام السيناريو المُعلن.",
        { field: "scenarioYear" },
      );
  }
  return {
    status: summarizeFeasibility(findings),
    reasonCodes: [...new Set(findings.map((f) => f.code))],
    reasons: findings,
    missingFields: [...missingFields],
    sourceIds: [...usedSources],
    timeline,
    assumptions: [...new Set(assumptions)],
    scope: {
      regionId: regionId ?? null,
      cultivationContext: isRecord(cultivationContext)
        ? clone(cultivationContext)
        : {},
      scenarioYear:
        Number.isInteger(scenarioYear) &&
        scenarioYear >= 1 &&
        scenarioYear <= 9999
          ? scenarioYear
          : null,
      dateUnit: "ISO-8601 date",
      durationUnit: "days",
      intervalConvention:
        "Inclusive crop days; buffer is full clear days after crop end; next sowing is no earlier than end+buffer+1.",
      meaning:
        "Feasibility relative to declared supported temporal constraints; not field validation or future climate prediction.",
    },
  };
}
