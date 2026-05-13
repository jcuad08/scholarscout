import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for ScholarScout end-to-end tests.
 * - Tests live in ./tests
 * - Default viewport is desktop; mobile is opt-in per test via test.use().
 * - Screenshots from each test land in ./tests/screenshots so we can eyeball
 *   polish issues that pass/fail assertions miss.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // sequential — these tests share the dev server + a single browser
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
