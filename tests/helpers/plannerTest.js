import { test as base, expect } from "@playwright/test";
// Existing planner scenarios begin after entry. immersive-entry.spec.js covers
// the real welcome screen, entry action and transition with fresh tab storage.
export const test = base.extend({
  enteredPlanner: [
    async ({ context }, use) => {
      await context.addInitScript(() => {
        try {
          sessionStorage.setItem("fieldshift-entered", "1");
          sessionStorage.setItem("fieldshift-vegetation-mode", "live");
        } catch {
          /* Optional storage. */
        }
      });
      await use();
    },
    { auto: true },
  ],
});
export { expect };
