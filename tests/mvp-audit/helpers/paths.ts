import path from "node:path";

/** Repo root (tests/mvp-audit/helpers → ../../..) */
export const repoRoot = path.resolve(__dirname, "..", "..", "..");

export const screenshotsDir = path.join(repoRoot, "tests/mvp-audit/screenshots");

export function shotFile(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]+/g, "-");
  return path.join(screenshotsDir, `${safe}.png`);
}
