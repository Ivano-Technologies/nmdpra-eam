/**
 * Canonical license row shape for JSON-first ingestion (Convex / API).
 * Dates are ISO calendar dates YYYY-MM-DD.
 */
export type CanonicalLicenseRow = {
  vendorName: string;
  category: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
};

export type LicenseImportParseResult =
  | { ok: true; rows: CanonicalLicenseRow[]; warnings?: string[] }
  | { ok: false; errors: string[] };

/** One source row → zero or more Convex-ready licenses plus non-fatal notices. */
export type ExpandImportRecordResult = {
  rows: CanonicalLicenseRow[];
  warnings: string[];
};

export const UNKNOWN_VENDOR_LABEL = "Unknown Vendor";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_CATEGORY = "uncategorized";

/** Stored when issue date is missing or unusable (Convex requires a string). */
export const FALLBACK_ISSUE_DATE = "1970-01-01";

export const normalizeVendorName = (value: string): string => value.trim().replace(/\s+/g, " ");

/** True for Excel placeholders that should not become a license line. */
export const isNilServicePlaceholder = (raw: string): boolean => {
  const s = raw.trim().toLowerCase();
  if (s === "") return true;
  return s === "nil" || s === "n/a" || s === "na" || s === "-" || s === "--" || s === "none" || s === "null";
};

/** Calendar year from YYYY-MM-DD (UTC slice); used to drop Excel “empty” dates (1899–1900). */
const calendarYearFromIso = (iso: string): number => Number.parseInt(iso.slice(0, 4), 10);

/**
 * Excel often stores “no expiry” as serial 0 → "Dec 1899" / "Dec 1900" style strings.
 * Replace with issue date when that is real, otherwise open-ended placeholder.
 */
export const coalesceExcelSentinelExpiry = (expiryIso: string, issueIso: string): string => {
  const ey = calendarYearFromIso(expiryIso);
  if (!Number.isNaN(ey) && ey > 1900) {
    return expiryIso;
  }
  const iy = calendarYearFromIso(issueIso);
  if (!Number.isNaN(iy) && iy > 1900) {
    return issueIso;
  }
  return "2099-12-31";
};

export const parseIsoDateOnly = (value: unknown, field: string): { ok: true; value: string } | { ok: false; error: string } => {
  if (value === null || value === undefined || value === "") {
    return { ok: false, error: `${field} is required` };
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return { ok: false, error: `${field} is not a valid date` };
    }
    return { ok: true, value: value.toISOString().slice(0, 10) };
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (Number.isNaN(d.getTime())) {
      return { ok: false, error: `${field} is not a valid date` };
    }
    const iso = d.toISOString().slice(0, 10);
    return { ok: true, value: iso };
  }
  const str = String(value).trim();
  if (!ISO_DATE.test(str)) {
    // Excel / exports often yield strings like "Tue Sep 24 2024 23:59:25 GMT+0100"
    const parsed = typeof value === "string" ? new Date(value) : new Date(str);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: `${field} is not a valid date` };
    }
    return { ok: true, value: parsed.toISOString().slice(0, 10) };
  }
  const check = new Date(`${str}T00:00:00.000Z`);
  if (Number.isNaN(check.getTime())) {
    return { ok: false, error: `${field} is not a valid date` };
  }
  return { ok: true, value: str };
};

/**
 * Parse a cell into YYYY-MM-DD, or null if empty, invalid, or Excel 1899–1900 sentinel.
 */
export const cleanDateToIso = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = parseIsoDateOnly(value, "date");
  if (!parsed.ok) {
    return null;
  }
  const y = calendarYearFromIso(parsed.value);
  if (!Number.isNaN(y) && y <= 1900) {
    return null;
  }
  return parsed.value;
};

const requireString = (value: unknown, field: string): { ok: true; value: string } | { ok: false; error: string } => {
  if (value === null || value === undefined) {
    return { ok: false, error: `${field} is required` };
  }
  const s = String(value).trim();
  if (!s) {
    return { ok: false, error: `${field} is required` };
  }
  return { ok: true, value: s };
};

/**
 * Normalize spreadsheet column headers for alias lookup (case and spacing insensitive).
 * Example: "Vendor Name", "vendor name", "Vendor  Name" → "vendorname"
 */
export const normalizeHeaderKey = (key: string): string =>
  String(key).trim().toLowerCase().replace(/\s+/g, "");

function buildNormalizedRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeHeaderKey(k)] = v;
  }
  return out;
}

/** Wide-sheet columns: "SERVICE 1" … normalize to service1, service2, … */
export const SERVICE_COLUMN_KEYS = ["service1", "service2", "service3", "service4"] as const;

/** Normalized header keys for vendor / organisation columns (order: specific → generic). */
export const VENDOR_NAME_ALIASES = [
  "vendorname",
  "vendor",
  "company",
  "organisation",
  "organization",
  "orgname",
  "labname",
  "laboratoryname",
  "facilityname",
  "facility",
  "accreditedbody",
  "accreditedorganization",
  "nameofcompany",
  "name"
] as const;

/** First non-empty value from explicit row keys, then normalized alias keys (in order). */
function pickCell(
  row: Record<string, unknown>,
  norm: Record<string, unknown>,
  explicitKeys: string[],
  normalizedAliases: string[]
): unknown {
  for (const k of explicitKeys) {
    if (Object.prototype.hasOwnProperty.call(row, k)) {
      const v = row[k];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        return v;
      }
    }
  }
  for (const a of normalizedAliases) {
    const v = norm[a];
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      return v;
    }
  }
  return undefined;
}

function collectServiceTypesFromWideRow(norm: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const key of SERVICE_COLUMN_KEYS) {
    const v = norm[key];
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (isNilServicePlaceholder(s)) continue;
    out.push(s.replace(/\s+/g, " "));
  }
  return out;
}

/**
 * One spreadsheet / JSON object → one or more canonical license rows.
 * Tolerant: missing vendor → {@link UNKNOWN_VENDOR_LABEL}; bad/missing issue → {@link FALLBACK_ISSUE_DATE};
 * bad/missing expiry → open-ended / issue fallback via {@link coalesceExcelSentinelExpiry}.
 * Wide format: SERVICE 1…SERVICE 4 → one license per non-NIL service.
 */
export const expandImportRecordToCanonicalRows = (row: Record<string, unknown>, index: number): ExpandImportRecordResult => {
  const warnings: string[] = [];
  const norm = buildNormalizedRow(row);

  const vendorRaw = pickCell(row, norm, ["vendorName", "Vendor Name", "vendor", "Vendor"], [...VENDOR_NAME_ALIASES]);
  const vendorStr =
    vendorRaw !== null && vendorRaw !== undefined && String(vendorRaw).trim() !== ""
      ? String(vendorRaw).trim()
      : "";
  let vendorName: string;
  if (vendorStr === "") {
    warnings.push(`Row ${index}: missing vendorName, using "${UNKNOWN_VENDOR_LABEL}"`);
    vendorName = UNKNOWN_VENDOR_LABEL;
  } else {
    vendorName = normalizeVendorName(vendorStr);
  }

  const categoryRaw = pickCell(row, norm, ["category", "Category"], ["category", "sector", "industry"]);
  const category =
    categoryRaw === null || categoryRaw === undefined || String(categoryRaw).trim() === ""
      ? DEFAULT_CATEGORY
      : String(categoryRaw).trim();

  const issueRaw = pickCell(
    row,
    norm,
    ["issueDate", "Issue Date"],
    [
      "issuedate",
      "dateissued",
      "issued",
      "startdate",
      "dateofissue",
      "grantdate",
      "dateaccredited",
      "accreditationdate",
      "dateofaccreditation"
    ]
  );
  let issueIso = cleanDateToIso(issueRaw);
  if (issueIso === null) {
    if (issueRaw !== null && issueRaw !== undefined && String(issueRaw).trim() !== "") {
      warnings.push(`Row ${index}: issueDate invalid or Excel sentinel, using ${FALLBACK_ISSUE_DATE}`);
    } else {
      warnings.push(`Row ${index}: issueDate missing, using ${FALLBACK_ISSUE_DATE}`);
    }
    issueIso = FALLBACK_ISSUE_DATE;
  }

  const expiryRaw = pickCell(
    row,
    norm,
    ["expiryDate", "Expiry Date"],
    [
      "expirydate",
      "expirationdate",
      "dateofexpiry",
      "enddate",
      "validuntil",
      "validto",
      "renewaldate",
      "expdate"
    ]
  );
  const expiryClean = cleanDateToIso(expiryRaw);
  if (expiryClean === null && expiryRaw !== null && expiryRaw !== undefined && String(expiryRaw).trim() !== "") {
    warnings.push(`Row ${index}: expiryDate invalid or Excel sentinel, using issue/open-ended fallback`);
  } else if (expiryClean === null) {
    warnings.push(`Row ${index}: expiryDate missing, using issue/open-ended fallback`);
  }

  const expiryNormalized =
    expiryClean !== null
      ? coalesceExcelSentinelExpiry(expiryClean, issueIso)
      : coalesceExcelSentinelExpiry("1900-01-01", issueIso);

  const statusRaw = pickCell(row, norm, ["status", "Status"], ["status", "licensestatus", "state"]);
  const status =
    statusRaw === null || statusRaw === undefined || String(statusRaw).trim() === ""
      ? "active"
      : String(statusRaw).trim().toLowerCase();

  const wideServices = collectServiceTypesFromWideRow(norm);

  const licenseTypeRaw = pickCell(
    row,
    norm,
    ["licenseType", "License Type"],
    ["licensetype", "typeoflicense", "permittype", "accreditationtype", "licensecategory", "certificatetype"]
  );
  const classicLt = licenseTypeRaw !== null && licenseTypeRaw !== undefined ? String(licenseTypeRaw).trim() : "";

  let licenseTypes: string[];
  if (wideServices.length > 0) {
    licenseTypes = wideServices;
  } else if (classicLt !== "" && !isNilServicePlaceholder(classicLt)) {
    licenseTypes = [classicLt.replace(/\s+/g, " ")];
  } else {
    warnings.push(
      `Row ${index}: no licenseType (no SERVICE 1–4 values and no License Type); skipping source row`
    );
    return { rows: [], warnings };
  }

  const rows: CanonicalLicenseRow[] = licenseTypes.map((licenseType) => ({
    vendorName,
    category,
    licenseType,
    issueDate: issueIso,
    expiryDate: expiryNormalized,
    status
  }));

  return { rows, warnings };
};

/**
 * Back-compat: one input record → exactly one output row, or an error if the record expands to multiple licenses
 * (wide SERVICE columns). Prefer {@link expandImportRecordToCanonicalRows} for ingestion.
 */
export const parseCanonicalRow = (
  row: Record<string, unknown>,
  index: number
): { ok: true; row: CanonicalLicenseRow } | { ok: false; error: string } => {
  const { rows, warnings } = expandImportRecordToCanonicalRows(row, index);
  if (rows.length === 0) {
    return { ok: false, error: warnings[0] ?? `Row ${index}: no license rows produced` };
  }
  if (rows.length > 1) {
    return {
      ok: false,
      error: `Row ${index}: ${rows.length} licenses from SERVICE 1–4 columns; use expandImportRecordToCanonicalRows (ingest flattens automatically)`
    };
  }
  return { ok: true, row: rows[0] };
};

/**
 * Parse top-level JSON: either an array of rows or `{ "licenses": [...] }`.
 */
export const parseLicenseImportJson = (raw: unknown): LicenseImportParseResult => {
  let rowsUnknown: unknown[];
  if (Array.isArray(raw)) {
    rowsUnknown = raw;
  } else if (raw && typeof raw === "object" && Array.isArray((raw as { licenses?: unknown }).licenses)) {
    rowsUnknown = (raw as { licenses: unknown[] }).licenses;
  } else {
    return { ok: false, errors: ["JSON must be an array of rows or an object with a `licenses` array"] };
  }

  const rows: CanonicalLicenseRow[] = [];
  const warnings: string[] = [];

  rowsUnknown.forEach((item, i) => {
    const index = i + 1;
    if (!item || typeof item !== "object") {
      warnings.push(`Row ${index}: must be an object (skipped)`);
      return;
    }
    const { rows: expanded, warnings: w } = expandImportRecordToCanonicalRows(item as Record<string, unknown>, index);
    rows.push(...expanded);
    warnings.push(...w);
  });

  return { ok: true, rows, warnings: warnings.length > 0 ? warnings : undefined };
};

export const parseLicenseImportJsonString = (text: string): LicenseImportParseResult => {
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, errors: ["Invalid JSON"] };
  }
  return parseLicenseImportJson(data);
};
