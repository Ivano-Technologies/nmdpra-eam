import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for the Next.js app. Run from repo root:
 *   pnpm test:e2e
 * Or from apps/web:
 *   pnpm exec playwright test
 *
 * Starts the dev server automatically unless:
 * - PLAYWRIGHT_SKIP_WEB_SERVER=1 (server already running), or
 * - PLAYWRIGHT_BASE_URL points at a non-localhost origin (deploy / preview verification).
 *
 * Post-deploy (production or preview URL):
 *   DEPLOY_URL=https://your-app.example.com pnpm test:e2e:deploy
 */
const rawBase = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = rawBase ?? "http://127.0.0.1:3000";

function isLocalhostOrigin(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "localhost" || u.hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

const targetingRemoteDeploy =
  rawBase != null && !isLocalhostOrigin(rawBase);

/** Skip starting `next dev` when testing an already-running local server or a deployed URL. */
const skipWebServer =
  process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1" || targetingRemoteDeploy;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: targetingRemoteDeploy ? 90_000 : 30_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...(targetingRemoteDeploy
      ? {
          navigationTimeout: 60_000,
          actionTimeout: 30_000
        }
      : {})
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
