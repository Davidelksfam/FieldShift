import { test, expect } from "@playwright/test";
test("historical inspector preserves missingness across Nili/goals and rejects malformed scenario", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Expert mode", exact: true }).click();
  await page
    .getByLabel("Inspection engine", { exact: true })
    .selectOption("scientific-v2");
  const output = page.getByLabel("Scientific V2 JSON output", { exact: true });
  const read = async () => JSON.parse(await output.innerText());
  expect((await read()).candidateAudit.generated).toBe(16);
  await page
    .getByLabel("V2 Nili mode", { exact: true })
    .selectOption("explore");
  expect((await read()).candidateAudit.generated).toBe(32);
  await page
    .getByLabel("V2 Nili mode", { exact: true })
    .selectOption("require");
  expect((await read()).alternatives).toHaveLength(0);
  await page.getByLabel("V2 Nili mode", { exact: true }).selectOption("off");
  await page.getByLabel("V2 goal", { exact: true }).selectOption("soil");
  expect((await read()).recommendation.selectedId).toBeNull();
  await page.getByLabel("V2 goal", { exact: true }).selectOption("market");
  expect((await read()).recommendation.reasons[0].code).toBe(
    "economic_comparison_unavailable",
  );
  await page
    .getByText("Historical scenario and sources (advanced JSON)", {
      exact: true,
    })
    .click();
  await page.getByLabel("Historical scenario JSON", { exact: true }).fill("{");
  await expect(page.getByRole("alert")).toContainText("Scenario rejected");
  await expect(output).toHaveCount(0);
  await page
    .getByLabel("Historical scenario JSON", { exact: true })
    .fill('{"scenario":{},"sourceRegistry":{}}');
  expect(
    (await read()).alternatives.every((a) => a.water.etcMm.value === null),
  ).toBe(true);
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
});

test("artificial calendar JSON yields a conditional numerical comparison and visible baseline", async ({
  page,
}) => {
  // Software-only dates/stages, not a supported Egyptian crop recommendation.
  const ids = ["wheat", "maize", "sorghum"];
  const point = { lat: 29.2315, lon: 30.7952, regionId: "fayoum_etsa" };
  const common = {
    availability: "available",
    title: "Artificial software fixture only",
    validityScope: "Not agronomic evidence",
    regionIds: [point.regionId],
    cropIds: ids,
    intendedUses: ["grain"],
    period: { start: "2025-01-01", end: "2025-12-31" },
  };
  const ref = {
    ...common,
    id: "test-reference",
    nature: "published_reference",
    reviewStatus: "verified_reference",
    url: "test://reference",
  };
  const farmer = {
    ...common,
    id: "test-farmer",
    nature: "farmer_scenario",
    reviewStatus: "recorded_input",
    url: "test://farmer",
    dataRoles: ["planning_horizon"],
    coordinates: point,
  };
  const config = {
    sourceRegistry: { [farmer.id]: farmer },
    cropCalendars: {
      sources: { [ref.id]: ref },
      records: ids.map((cropId) => ({
        cropId,
        regionId: point.regionId,
        variety: "test-only",
        intendedUse: "grain",
        sowingWindow: { start: "01-01", end: "12-31" },
        harvestWindow: { start: "01-01", end: "12-31" },
        growthStagesDays: [2, 2, 2, 2],
        prepBufferDays: 2,
        sourceId: ref.id,
        sourceUrl: ref.url,
        sourceYear: null,
        reviewStatus: "verified",
        units: {
          sowingWindow: "MM-DD",
          harvestWindow: "MM-DD",
          growthStagesDays: "days",
          prepBufferDays: "days",
        },
      })),
    },
    scenario: {
      type: "historical",
      year: 2025,
      horizon: { start: "2025-01-01", end: "2025-10-31" },
      plannedHorizonComplete: true,
      horizonSourceId: farmer.id,
      cropPlans: Object.fromEntries(
        ids.map((id, i) => [
          id,
          {
            intendedUse: "grain",
            variety: "test-only",
            growthStagesDays: [2, 2, 2, 2],
            prepBufferDays: 2,
            inputSourceIds: [farmer.id],
            sowingDate: ["2025-01-01", "2025-05-01", "2025-06-01"][i],
            harvestDate: ["2025-01-08", "2025-05-08", "2025-06-08"][i],
          },
        ]),
      ),
    },
  };
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Expert mode", exact: true }).click();
  await page
    .getByLabel("Inspection engine", { exact: true })
    .selectOption("scientific-v2");
  await page
    .getByText("Historical scenario and sources (advanced JSON)", {
      exact: true,
    })
    .click();
  await page
    .getByLabel("Historical scenario JSON", { exact: true })
    .fill(JSON.stringify(config));
  const output = JSON.parse(
    await page
      .getByLabel("Scientific V2 JSON output", { exact: true })
      .innerText(),
  );
  expect(output.recommendation.status).toBe("conditional");
  expect(output.recommendation.selectedId).toBe("wheat/maize");
  expect(output.alternatives).toHaveLength(2);
  expect(output.alternatives[0].water.etcMm.value).toBeCloseTo(
    55.84230537509318,
    8,
  );
  expect(output.alternatives[1].modeledDifference.value).toBeCloseTo(
    -13.21377299812503,
    8,
  );
  await expect(
    page.getByLabel("V2 baseline reference", { exact: true }),
  ).toContainText("55.8 mm");
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
});
