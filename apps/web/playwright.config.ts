import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for the Next.js app. Run from repo root:
 *   pnpm test:e2e
 * Or from apps/web:
 *   pnpm exec playwright test
 *
 * Starts the dev server automatically unless CI or PLAYWRIGHT_SKIP_WEB_SERVER=1.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
/** Set PLAYWRIGHT_SKIP_WEB_SERVER=1 when the dev server is already running locally. */
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: "pnpm exec next dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe"
      }
});
