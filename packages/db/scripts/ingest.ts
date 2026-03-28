import { readFileSync } from "fs";
import { ConvexHttpClient } from "convex/browser";
import * as XLSX from "xlsx";

import {
  parseCanonicalRow,
  parseLicenseImportJsonString,
  type CanonicalLicenseRow
} from "@rmlis/shared";
import dotenv from "dotenv";

import { importLicenses } from "./convexRefs";

dotenv.config({ path: ".env.local" });
dotenv.config();

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

const loadRowsFromExcel = (path: string): { ok: true; rows: CanonicalLicenseRow[] } | { ok: false; errors: string[] } => {
  const workbook = XLSX.readFile(path, { cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { ok: false, errors: ["Workbook has no sheets"] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const rows: CanonicalLicenseRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const parsed = parseCanonicalRow(row, index + 1);
    if (!parsed.ok) {
      errors.push(parsed.error);
      return;
    }
    rows.push(parsed.row);
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, rows };
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
    const text = readFileSync(jsonPath, "utf8");
    const parsed = parseLicenseImportJsonString(text);
    if (!parsed.ok) {
      console.error(parsed.errors.join("\n"));
      process.exit(1);
    }
    rows = parsed.rows;
  } else if (filePath) {
    const parsed = loadRowsFromExcel(filePath);
    if (!parsed.ok) {
      console.error(parsed.errors.join("\n"));
      process.exit(1);
    }
    rows = parsed.rows;
  } else {
    process.exit(1);
  }

  const client = new ConvexHttpClient(url);
  const result = await client.mutation(importLicenses, {
    secret,
    rows
  });

  console.log(`Imported ${result.imported} of ${result.total} rows.`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
