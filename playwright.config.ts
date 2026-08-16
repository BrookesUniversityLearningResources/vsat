import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321";

export default defineConfig({
  testDir: "./tests/e2e",
  // one shared dev server + one shared DB: self-provisioning specs discover
  // and republish the same stories, so parallel workers race each other
  // (green-standalone specs failed only in full-suite runs). Serial is the
  // honest mode for this suite.
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
});
