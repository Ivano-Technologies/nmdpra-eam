import {
  expandImportRecordToCanonicalRows,
  type CanonicalLicenseRow
} from "@rmlis/shared";
import * as XLSX from "xlsx";

/**
 * Parses the first worksheet of an Excel workbook into canonical licence rows (same as CLI ingest).
 */
export function parseExcelBufferToRows(buffer: ArrayBuffer): {
  rows: CanonicalLicenseRow[];
  warnings: string[];
} {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: false
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], warnings: ["Workbook has no sheets"] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const rows: CanonicalLicenseRow[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    const { rows: expanded, warnings: w } = expandImportRecordToCanonicalRows(
      row,
      rowNum
    );
    rows.push(...expanded);
    warnings.push(...w);
  });

  return { rows, warnings };
}
