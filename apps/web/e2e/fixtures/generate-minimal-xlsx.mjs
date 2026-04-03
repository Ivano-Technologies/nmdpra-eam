/**
 * Writes a tiny .xlsx that parses to ≥1 licence row (SERVICE 1 + vendor).
 * Run: node e2e/fixtures/generate-minimal-xlsx.mjs
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "minimal-licenses.xlsx");

const rows = [
  [
    "Vendor Name",
    "SERVICE 1",
    "Issue Date",
    "Expiry Date",
    "Status",
    "Category"
  ],
  [
    "E2E Fixture Lab Ltd",
    "Environmental Monitoring",
    "2024-01-15",
    "2028-12-31",
    "active",
    "Laboratory"
  ]
];
const sheet = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, sheet, "Licences");
const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
await writeFile(out, buf);
console.log("Wrote", out);
