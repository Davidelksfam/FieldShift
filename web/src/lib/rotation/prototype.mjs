/** Hypothetical interface checks, not agronomic feasibility or ranking. */
export function assessPlan(plan, field, reduction = 0) {
  const area = field.areaHa === '' ? null : Number(field.areaHa);
  const budget = field.waterM3 === '' ? null : Number(field.waterM3);
  const validArea = area !== null && Number.isFinite(area) && area > 0;
  const validBudget = budget !== null && Number.isFinite(budget) && budget >= 0;
  const validReduction = Number.isFinite(reduction) && reduction >= 0 && reduction <= 100;
  const available = validBudget && validReduction ? budget * (1 - reduction / 100) : null;
  const rawDemand = field.demoDemand && validArea && Number.isFinite(plan.assumedM3Ha) && plan.assumedM3Ha >= 0 ? plan.assumedM3Ha * area : null;
  const demand = rawDemand !== null && Number.isFinite(rawDemand) ? rawDemand : null;
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
  const validDates = [plan.winterStart,plan.winterEnd,plan.summerStart,plan.summerEnd].every(validDate) && plan.winterStart <= plan.winterEnd && plan.summerStart <= plan.summerEnd && plan.winterStart >= '2024-10-01' && plan.summerStart >= '2024-10-01' && plan.winterEnd <= '2025-09-30' && plan.summerEnd <= '2025-09-30';
  const excluded = [plan.winter, plan.summer].filter(c => field.excluded.includes(c));
  return {available, demand, balance: available !== null && demand !== null ? available - demand : null,
    water: available === null || demand === null ? 'unknown' : demand <= available ? 'within_demo_budget' : 'over_demo_budget',
    exclusions: excluded, calendar: !validDates ? 'invalid_fixture_dates' : plan.winterEnd < plan.summerStart ? 'no_overlap_in_fixture' : 'overlap_in_fixture',
    agronomy: 'unreviewed', overall: excluded.length ? 'excluded_by_user' : 'needs_local_review'};
}
export const plans = [
  {id:'baseline',winter:'wheat',summer:'maize',winterStart:'2024-11-15',winterEnd:'2025-04-30',summerStart:'2025-05-15',summerEnd:'2025-09-15',assumedM3Ha:6000},
  {id:'legume',winter:'faba_bean',summer:'sunflower',winterStart:'2024-11-03',winterEnd:'2025-04-10',summerStart:'2025-05-10',summerEnd:'2025-08-20',assumedM3Ha:5200},
  {id:'forage',winter:'berseem',summer:'sorghum',winterStart:'2024-10-15',winterEnd:'2025-04-20',summerStart:'2025-05-15',summerEnd:'2025-09-10',assumedM3Ha:5600},
];
