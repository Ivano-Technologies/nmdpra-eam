"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIsoDateEnGb = exports.computeRiskScore = exports.computeExpiryStatus = exports.computeDaysToExpiry = exports.utcDayStart = void 0;
const DAY_MS = 86_400_000;
const utcDayStart = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
exports.utcDayStart = utcDayStart;
const computeDaysToExpiry = (expiryDateIso, now = new Date()) => {
    const expiry = (0, exports.utcDayStart)(new Date(`${expiryDateIso}T00:00:00.000Z`));
    const today = (0, exports.utcDayStart)(now);
    return Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
};
exports.computeDaysToExpiry = computeDaysToExpiry;
const computeExpiryStatus = (daysToExpiry) => {
    if (daysToExpiry < 0)
        return "EXPIRED";
    if (daysToExpiry <= 30)
        return "CRITICAL";
    if (daysToExpiry <= 60)
        return "WARNING";
    return "SAFE";
};
exports.computeExpiryStatus = computeExpiryStatus;
/** Higher = more risk (0–100). */
const computeRiskScore = (daysToExpiry) => {
    if (daysToExpiry < 0)
        return 100;
    return Math.max(0, Math.min(100, 100 - daysToExpiry));
};
exports.computeRiskScore = computeRiskScore;
/**
 * Formats a date-only ISO string (YYYY-MM-DD) as en-GB in UTC (avoids timezone drift).
 * Returns the original string if it cannot be parsed as three numeric Y-M-D parts.
 */
const formatIsoDateEnGb = (isoDate) => {
    const parts = isoDate.trim().split("-");
    if (parts.length !== 3) {
        return isoDate;
    }
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) {
        return isoDate;
    }
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-GB", { timeZone: "UTC" });
};
exports.formatIsoDateEnGb = formatIsoDateEnGb;
