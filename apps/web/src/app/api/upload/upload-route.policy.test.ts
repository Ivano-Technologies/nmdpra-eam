import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards against regressions to public blob URLs (private store requires private access).
 */
describe("upload route blob policy", () => {
  it("uses private Vercel Blob access", () => {
    const file = path.join(__dirname, "route.ts");
    const src = readFileSync(file, "utf8");
    expect(src).toMatch(/access:\s*["']private["']/);
  });
});
