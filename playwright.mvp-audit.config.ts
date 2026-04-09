import path from "node:path";

import { defineConfig, devices, type Project } from "@playwright/test";

import { applyPlaywrightTestEnv } from "@rmlis/e2e-env";

applyPlaywrightTestEnv();

const repoRoot = path.resolve(__dirname);
const rawBase = process.env.PLAYWRIGHT_BASE_URL;
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

const skipWebServer =
  process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1" || targetingRemoteDeploy;

/** `next dev` + Turbopack can OOM on large graphs; default is production `next start` (requires prebuild). */
const useNextDev = process.env.MVP_AUDIT_NEXT_DEV === "1";

/** Propagate to `next dev` child — globalSetup runs in a separate process and cannot set this. */
const mockMailEnv =
  process.env.MVP_AUDIT_MOCK_EMAIL === "0"
    ? {}
    : { EMAIL_MODE: "mock", MOCK_RESEND: "1", E2E_MAIL_MOCK: "1" };

const hasE2eCreds =
  Boolean(process.env.E2E_CLERK_EMAIL?.trim()) &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim());

const headed = process.env.MVP_AUDIT_HEADED !== "0";

const publicProject: Project = {
  name: "mvp-public",
  testMatch: /public\.spec\.ts$/,
  use: {
    ...devices["Desktop Chrome"],
    ...(headed ? { headless: false } : {})
  }
};

const setupProject: Project = {
  name: "mvp-setup",
  testMatch: /auth\.setup\.ts$/,
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    ...(headed ? { headless: false } : {})
  }
};

const authenticatedProject: Project = {
  name: "mvp-authenticated",
  testMatch: /.*\.spec\.ts$/,
  testIgnore: [/public\.spec\.ts$/, /auth\.setup\.ts$/],
  dependencies: ["mvp-setup"],
  timeout: 180_000,
  use: {
    ...devices["Desktop Chrome"],
    ...(headed ? { headless: false } : {}),
    storageState: path.join(repoRoot, "tests/mvp-audit/.auth/user.json")
  }
};

const projects: Project[] = hasE2eCreds
  ? [publicProject, setupProject, authenticatedProject]
  : [publicProject];

export default defineConfig({
  globalSetup: path.join(repoRoot, "tests/mvp-audit/global-setup.ts"),
  testDir: path.join(repoRoot, "tests/mvp-audit"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: targetingRemoteDeploy ? 90_000 : 60_000,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report-mvp" }]
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
        command: useNextDev
          ? "pnpm --filter @rmlis/web dev"
          : "pnpm --filter @rmlis/web exec next start -p 3000",
        url: `${baseURL.replace(/\/$/, "")}/api/health`,
        cwd: repoRoot,
        env: { ...process.env, ...mockMailEnv, PORT: "3000" },
        reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
        timeout: useNextDev ? 120_000 : 60_000,
        stdout: "pipe",
        stderr: "pipe"
      }
});
