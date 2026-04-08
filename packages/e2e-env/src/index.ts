import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Walk up from `start` until `pnpm-workspace.yaml` is found.
 */
export function findRepoRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return path.resolve(start);
    }
    dir = parent;
  }
}

/**
 * Env files for Playwright, highest precedence last (still overridden by shell).
 * Works when cwd is repo root or `apps/web`.
 */
export function envFilePathsForPlaywright(): string[] {
  const root = findRepoRoot();
  return [
    path.join(root, ".env.test"),
    path.join(root, ".env.local"),
    path.join(root, "apps/web/.env.local"),
    path.join(root, "apps/web/.env.e2e.local")
  ];
}

function parseDotenvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }
  const out: Record<string, string> = {};
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (!key) {
      continue;
    }
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function logE2eEnvOnce(): void {
  if (process.env.DEBUG_E2E !== "1") {
    return;
  }
  const dbg = globalThis.console;
  dbg.log("[playwright] E2E ENV LOADED:", {
    hasClerkSecret: Boolean(process.env.CLERK_SECRET_KEY?.trim()),
    hasPublishableKey: Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
    ),
    hasResend: Boolean(process.env.RESEND_API_KEY?.trim()),
    hasE2eEmail: Boolean(process.env.E2E_CLERK_EMAIL?.trim()),
    filesTried: envFilePathsForPlaywright().filter((p) => existsSync(p))
  });
}

/**
 * Merge layered `.env` files into `process.env` (only keys unset in shell).
 * Call from `playwright.config.ts` and Playwright global setup.
 */
export function applyPlaywrightTestEnv(): void {
  const paths = envFilePathsForPlaywright();
  const merged: Record<string, string> = {};
  for (const p of paths) {
    Object.assign(merged, parseDotenvFile(p));
  }
  for (const [key, val] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }

  const pub =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ||
    process.env.CLERK_PUBLISHABLE_KEY?.trim();
  if (pub && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pub;
  }
  if (!process.env.EMAIL_MODE) {
    process.env.EMAIL_MODE = "mock";
  }

  logE2eEnvOnce();
}
