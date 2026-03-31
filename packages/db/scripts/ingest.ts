import { existsSync, readFileSync } from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import * as XLSX from "xlsx";

import {
  expandImportRecordToCanonicalRows,
  parseLicenseImportJsonString,
  type CanonicalLicenseRow
} from "@rmlis/shared";
import dotenv from "dotenv";

import { importLicenses } from "./convexRefs";

/** Walk up from cwd until `pnpm-workspace.yaml` so ingest works when pnpm runs from `packages/db`. */
function monorepoRoot(start: string): string {
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

const repoRoot = monorepoRoot(process.cwd());
dotenv.config({ path: path.join(repoRoot, ".env.local") });
dotenv.config({ path: path.join(repoRoot, ".env") });

const parseArgs = (argv: string[]): { jsonPath?: string; filePath?: string } => {
  let jsonPath: string | undefined;
  let filePath: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("--json=")) {
      jsonPath = arg.slice("--json=".length).replace(/^["']|["']$/g, "");
    }
    if (arg.startsWith("--file=")) {
      filePath = arg.slice("--file=".length).replace(/^["']|["']$/g, "");
    }
  }
  return { jsonPath, filePath };
};

/** Short preview of row keys/values for ingest debugging (avoid huge console output). */
function summarizeRowForLog(row: Record<string, unknown>, maxKeys = 12): string {
  const entries = Object.entries(row)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .slice(0, maxKeys)
    .map(([k, v]) => {
      const s = String(v).replace(/\s+/g, " ").trim();
      const cut = s.length > 40 ? `${s.slice(0, 40)}…` : s;
      return `${k}=${JSON.stringify(cut)}`;
    });
  return entries.length > 0 ? entries.join(", ") : "(empty row)";
}

function logIngestWarnings(warnings: string[], label: string): void {
  if (warnings.length === 0) return;
  const limit = Math.max(1, Number(process.env.INGEST_WARN_PREVIEW ?? 50) || 50);
  console.warn(`[ingest] ${warnings.length} ${label} (showing up to ${limit})`);
  warnings.slice(0, limit).forEach((w) => console.warn(" ", w));
  if (warnings.length > limit) {
    console.warn(`[ingest] … and ${warnings.length - limit} more (set INGEST_WARN_PREVIEW to raise limit)`);
  }
}

const loadRowsFromExcel = (
  filePath: string
):
  | { ok: true; rows: CanonicalLicenseRow[]; warnings: string[] }
  | { ok: false; errors: string[] } => {
  const workbook = XLSX.readFile(filePath, { cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, errors: ["Workbook has no sheets"] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const rows: CanonicalLicenseRow[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, index) => {
    if (index === 0) {
      console.log("[ingest] Detected headers:", Object.keys(row));
    }
    const rowNum = index + 1;
    const { rows: expanded, warnings: w } = expandImportRecordToCanonicalRows(row, rowNum);
    if (expanded.length === 0 && w.length > 0) {
      console.warn(`[ingest] Row ${rowNum} produced 0 licenses`, summarizeRowForLog(row));
    }
    rows.push(...expanded);
    warnings.push(...w);
  });

  return { ok: true, rows, warnings };
};

const run = async (): Promise<void> => {
  const { jsonPath, filePath } = parseArgs(process.argv.slice(2));

  if ((!jsonPath && !filePath) || (jsonPath && filePath)) {
    console.error("Usage: pnpm ingest -- --json=path/to/data.json");
    console.error("   or: pnpm ingest -- --file=path/to/file.xlsx");
    process.exit(1);
  }

  const url = process.env.CONVEX_URL?.trim();
  const secret = process.env.INGEST_SECRET?.trim();
  if (!url) {
    console.error("Missing CONVEX_URL");
    process.exit(1);
  }
  if (!secret) {
    console.error("Missing INGEST_SECRET (must match Convex env INGEST_SECRET)");
    process.exit(1);
  }

  let rows: CanonicalLicenseRow[];

  if (jsonPath) {
    const jsonAbs = path.isAbsolute(jsonPath) ? jsonPath : path.join(repoRoot, jsonPath);
    if (!existsSync(jsonAbs)) {
      console.error(`File not found: ${jsonAbs}`);
      console.error("Use an absolute path or a path relative to the monorepo root (e.g. data/nmdpra_data.sample.json).");
      process.exit(1);
    }
    const text = readFileSync(jsonAbs, "utf8");
    const parsed = parseLicenseImportJsonString(text);
    if (!parsed.ok) {
      console.error(parsed.errors.join("\n"));
      process.exit(1);
    }
    rows = parsed.rows;
    if (parsed.warnings?.length) {
      logIngestWarnings(parsed.warnings, "JSON row notice(s)");
    }
  } else if (filePath) {
    const fileAbs = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
    if (!existsSync(fileAbs)) {
      console.error(`File not found: ${fileAbs}`);
      console.error(
        "On Windows, Downloads is under your user folder (e.g. C:\\Users\\Windows\\Downloads\\…), not C:\\Users\\Downloads\\…."
      );
      console.error("Tip: copy the workbook to the repo, e.g. data\\lab.xlsx, then: pnpm ingest -- --file=data/lab.xlsx");
      process.exit(1);
    }
    const parsed = loadRowsFromExcel(fileAbs);
    if (!parsed.ok) {
      console.error(parsed.errors.join("\n"));
      process.exit(1);
    }
    rows = parsed.rows;
    logIngestWarnings(parsed.warnings, "spreadsheet row notice(s)");
  } else {
    process.exit(1);
  }

  if (rows.length === 0) {
    console.error("[ingest] No license rows to import after parsing.");
    process.exit(1);
  }

  const client = new ConvexHttpClient(url);
  const result = await client.mutation(importLicenses, {
    secret,
    rows
  });

  console.log(`Imported ${result.imported} of ${result.total} license row(s).`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
