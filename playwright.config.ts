import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against the dev server. Locally they reuse a server if one is
// already running; in CI they start their own. Kept to Chromium + a short list
// of critical-path checks — this is a smoke suite, not exhaustive coverage.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI also emit an HTML report so a failed run uploads something viewable.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Locally, run the dev server (and reuse one if it's already up). In CI,
    // build once and serve the production build — it starts fast and avoids
    // slow first-request compilation, which was timing the dev server out.
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
