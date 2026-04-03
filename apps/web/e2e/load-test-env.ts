import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Playwright runs with `cwd` = `apps/web`. Env file precedence (later overrides earlier):
 * 1. Repo root `.env.local`
 * 2. `apps/web/.env.local`
 * 3. `apps/web/.env.e2e.local` (highest — E2E overrides)
 *
 * Shell / CI env vars always win: we only set `process.env[k]` when unset.
 */
function envFilePaths(): string[] {
  const cwd = process.cwd();
  const repoRoot = path.join(cwd, "..", "..");
  return [
    path.join(repoRoot, ".env.local"),
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env.e2e.local")
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

function applyLayeredEnvFiles(): void {
  const paths = envFilePaths();
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
    filesTried: envFilePaths().filter((p) => existsSync(p))
  });
}

/** Call from `playwright.config.ts` and `e2e/global-setup.ts`. */
export function applyPlaywrightTestEnv(): void {
  applyLayeredEnvFiles();
  logE2eEnvOnce();
}
