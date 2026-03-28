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
  | { ok: true; rows: CanonicalLicenseRow[] }
  | { ok: false; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_CATEGORY = "uncategorized";

export const normalizeVendorName = (value: string): string => value.trim().replace(/\s+/g, " ");

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
    const parsed = new Date(str);
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

export const parseCanonicalRow = (row: Record<string, unknown>, index: number): { ok: true; row: CanonicalLicenseRow } | { ok: false; error: string } => {
  const vendor = requireString(row.vendorName ?? row["Vendor Name"], "vendorName");
  if (!vendor.ok) return { ok: false, error: `Row ${index}: ${vendor.error}` };

  const categoryRaw = row.category ?? row["Category"];
  const category =
    categoryRaw === null || categoryRaw === undefined || String(categoryRaw).trim() === ""
      ? DEFAULT_CATEGORY
      : String(categoryRaw).trim();

  const licenseType = requireString(row.licenseType ?? row["License Type"], "licenseType");
  if (!licenseType.ok) return { ok: false, error: `Row ${index}: ${licenseType.error}` };

  const issue = parseIsoDateOnly(row.issueDate ?? row["Issue Date"], "issueDate");
  if (!issue.ok) return { ok: false, error: `Row ${index}: ${issue.error}` };

  const expiry = parseIsoDateOnly(row.expiryDate ?? row["Expiry Date"], "expiryDate");
  if (!expiry.ok) return { ok: false, error: `Row ${index}: ${expiry.error}` };

  const statusRaw = row.status ?? row["Status"];
  const status =
    statusRaw === null || statusRaw === undefined || String(statusRaw).trim() === ""
      ? "active"
      : String(statusRaw).trim().toLowerCase();

  return {
    ok: true,
    row: {
      vendorName: normalizeVendorName(vendor.value),
      category,
      licenseType: licenseType.value,
      issueDate: issue.value,
      expiryDate: expiry.value,
      status
    }
  };
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
  const errors: string[] = [];

  rowsUnknown.forEach((item, i) => {
    const index = i + 1;
    if (!item || typeof item !== "object") {
      errors.push(`Row ${index}: must be an object`);
      return;
    }
    const parsed = parseCanonicalRow(item as Record<string, unknown>, index);
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

export const parseLicenseImportJsonString = (text: string): LicenseImportParseResult => {
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, errors: ["Invalid JSON"] };
  }
  return parseLicenseImportJson(data);
};
