import path from "node:path";

import { defineConfig, devices, type Project } from "@playwright/test";

import { applyPlaywrightTestEnv } from "./e2e/load-test-env";

applyPlaywrightTestEnv();

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
 *
 * Integrated tests (Clerk + upload + reports): set E2E_CLERK_EMAIL, E2E_CLERK_PASSWORD
 * and ensure repo-root `.env.local` has Clerk keys (see `e2e/load-test-env.ts`).
 */
const rawBase = process.env.PLAYWRIGHT_BASE_URL;
/** Use `localhost` (not 127.0.0.1) so Clerk dev handshake matches common Dashboard allowed origins. */
const baseURL = rawBase ?? "http://localhost:3000";

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

/**
 * Clerk sign-in + integrated flows only when E2E user + Clerk secret are available
 * (secret loaded from repo or `apps/web` `.env.local` — see `load-test-env.ts`).
 */
/** Ticket sign-in uses email + secret only; password kept for optional UI flows. */
const hasE2eCreds =
  Boolean(process.env.E2E_CLERK_EMAIL?.trim()) &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim());

const projects: Project[] = [
  ...(hasE2eCreds
    ? ([
        {
          name: "setup",
          testMatch: /auth\.setup\.ts$/,
          timeout: 120_000
        }
      ] satisfies Project[])
    : []),
  {
    name: "chromium",
    testIgnore: [/auth\.setup\.ts$/, /integrated-flows\.spec\.ts$/],
    use: { ...devices["Desktop Chrome"] }
  },
  ...(hasE2eCreds
    ? ([
        {
          name: "integrated",
          testMatch: /integrated-flows\.spec\.ts$/,
          dependencies: ["setup"],
          timeout: 180_000,
          use: {
            ...devices["Desktop Chrome"],
            storageState: "playwright/.auth/user.json"
          }
        }
      ] satisfies Project[])
    : [])
];

export default defineConfig({
  globalSetup: path.join(__dirname, "e2e/global-setup.ts"),
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
  projects,
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
