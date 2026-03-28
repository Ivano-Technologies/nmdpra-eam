"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLicenseImportJsonString = exports.parseLicenseImportJson = exports.parseCanonicalRow = exports.parseIsoDateOnly = exports.normalizeVendorName = exports.DEFAULT_CATEGORY = void 0;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
exports.DEFAULT_CATEGORY = "uncategorized";
const normalizeVendorName = (value) => value.trim().replace(/\s+/g, " ");
exports.normalizeVendorName = normalizeVendorName;
const parseIsoDateOnly = (value, field) => {
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
exports.parseIsoDateOnly = parseIsoDateOnly;
const requireString = (value, field) => {
    if (value === null || value === undefined) {
        return { ok: false, error: `${field} is required` };
    }
    const s = String(value).trim();
    if (!s) {
        return { ok: false, error: `${field} is required` };
    }
    return { ok: true, value: s };
};
const parseCanonicalRow = (row, index) => {
    const vendor = requireString(row.vendorName ?? row["Vendor Name"], "vendorName");
    if (!vendor.ok)
        return { ok: false, error: `Row ${index}: ${vendor.error}` };
    const categoryRaw = row.category ?? row["Category"];
    const category = categoryRaw === null || categoryRaw === undefined || String(categoryRaw).trim() === ""
        ? exports.DEFAULT_CATEGORY
        : String(categoryRaw).trim();
    const licenseType = requireString(row.licenseType ?? row["License Type"], "licenseType");
    if (!licenseType.ok)
        return { ok: false, error: `Row ${index}: ${licenseType.error}` };
    const issue = (0, exports.parseIsoDateOnly)(row.issueDate ?? row["Issue Date"], "issueDate");
    if (!issue.ok)
        return { ok: false, error: `Row ${index}: ${issue.error}` };
    const expiry = (0, exports.parseIsoDateOnly)(row.expiryDate ?? row["Expiry Date"], "expiryDate");
    if (!expiry.ok)
        return { ok: false, error: `Row ${index}: ${expiry.error}` };
    const statusRaw = row.status ?? row["Status"];
    const status = statusRaw === null || statusRaw === undefined || String(statusRaw).trim() === ""
        ? "active"
        : String(statusRaw).trim().toLowerCase();
    return {
        ok: true,
        row: {
            vendorName: (0, exports.normalizeVendorName)(vendor.value),
            category,
            licenseType: licenseType.value,
            issueDate: issue.value,
            expiryDate: expiry.value,
            status
        }
    };
};
exports.parseCanonicalRow = parseCanonicalRow;
/**
 * Parse top-level JSON: either an array of rows or `{ "licenses": [...] }`.
 */
const parseLicenseImportJson = (raw) => {
    let rowsUnknown;
    if (Array.isArray(raw)) {
        rowsUnknown = raw;
    }
    else if (raw && typeof raw === "object" && Array.isArray(raw.licenses)) {
        rowsUnknown = raw.licenses;
    }
    else {
        return { ok: false, errors: ["JSON must be an array of rows or an object with a `licenses` array"] };
    }
    const rows = [];
    const errors = [];
    rowsUnknown.forEach((item, i) => {
        const index = i + 1;
        if (!item || typeof item !== "object") {
            errors.push(`Row ${index}: must be an object`);
            return;
        }
        const parsed = (0, exports.parseCanonicalRow)(item, index);
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
exports.parseLicenseImportJson = parseLicenseImportJson;
const parseLicenseImportJsonString = (text) => {
    let data;
    try {
        data = JSON.parse(text);
    }
    catch {
        return { ok: false, errors: ["Invalid JSON"] };
    }
    return (0, exports.parseLicenseImportJson)(data);
};
exports.parseLicenseImportJsonString = parseLicenseImportJsonString;
