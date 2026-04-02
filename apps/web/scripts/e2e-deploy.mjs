#!/usr/bin/env node
/**
 * Run the full Playwright suite against a deployed app (no local `next dev`).
 *
 * Usage:
 *   DEPLOY_URL=https://your-deployment.example.com pnpm test:e2e:deploy
 *
 * Or set PLAYWRIGHT_BASE_URL yourself and PLAYWRIGHT_SKIP_WEB_SERVER=1.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

const deployUrl = process.env.DEPLOY_URL?.trim();
if (!deployUrl) {
  console.error(`
[e2e-deploy] Missing DEPLOY_URL.

Example:
  DEPLOY_URL=https://your-app.vercel.app pnpm test:e2e:deploy

This runs all tests in apps/web/e2e against that origin (production or preview).
`);
  process.exit(1);
}

try {
  void new URL(deployUrl);
} catch {
  console.error("[e2e-deploy] DEPLOY_URL must be a valid http(s) URL.");
  process.exit(1);
}

const env = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: deployUrl,
  PLAYWRIGHT_SKIP_WEB_SERVER: "1"
};

const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", ...process.argv.slice(2)],
  {
    cwd: webRoot,
    env,
    stdio: "inherit",
    shell: true
  }
);

process.exit(result.status ?? 1);
