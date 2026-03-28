"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMvpReportHtml = exports.formatDateEnGB = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const shared_1 = require("@rmlis/shared");
const chartService_1 = require("../chart/chartService");
const EXPIRING_TABLE_LIMIT = 20;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
/** Date-only ISO YYYY-MM-DD as en-GB in UTC (safe for HTML body). */
const formatDateEnGB = (isoDate) => escapeHtml((0, shared_1.formatIsoDateEnGb)(isoDate));
exports.formatDateEnGB = formatDateEnGB;
const renderMvpReportHtml = (data) => {
    const template = loadTemplate();
    const chartImage = (0, chartService_1.generateExpiryPieChartUrl)({
        expired: data.summary.expired,
        critical: data.summary.critical,
        warning: data.summary.warning,
        safe: data.summary.safe
    });
    const dateLabel = (0, exports.formatDateEnGB)(data.generatedAt.slice(0, 10));
    const inCriticalOrWarning = data.rows.filter((r) => r.expiryStatus === "CRITICAL" || r.expiryStatus === "WARNING");
    const expiringSource = [...inCriticalOrWarning]
        .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
        .slice(0, EXPIRING_TABLE_LIMIT);
    const totalInBands = inCriticalOrWarning.length;
    const expiringCaption = totalInBands === 0
        ? ""
        : `Showing top ${expiringSource.length} of ${totalInBands} by days to expiry (soonest first). Maximum ${EXPIRING_TABLE_LIMIT} rows.`;
    const expiringRows = expiringSource.length === 0
        ? `<tr><td colspan="5" class="empty-expiring">No expiring licences in the selected windows.</td></tr>`
        : expiringSource
            .map((r) => {
            const rowClass = r.expiryStatus === "CRITICAL"
                ? "row-critical"
                : r.expiryStatus === "WARNING"
                    ? "row-warning"
                    : "";
            return `<tr class="${rowClass}"><td>${escapeHtml(r.vendor)}</td><td>${escapeHtml(r.licenseType)}</td><td>${(0, exports.formatDateEnGB)(r.expiryDate)}</td><td>${escapeHtml(r.status)}</td><td class="band-cell">${escapeHtml(r.expiryStatus)}</td></tr>`;
        })
            .join("");
    const riskRows = data.topRiskVendors.length === 0
        ? `<tr><td colspan="2" style="padding:12px;color:#64748b">No vendor risk data.</td></tr>`
        : data.topRiskVendors
            .map((v) => `<tr><td>${escapeHtml(v.vendorName)}</td><td>${String(Math.round(v.riskScore))}</td></tr>`)
            .join("");
    return template
        .replace("{{DATE}}", dateLabel)
        .replace("{{TOTAL}}", String(data.summary.total))
        .replace("{{EXPIRED}}", String(data.summary.expired))
        .replace("{{CRITICAL}}", String(data.summary.critical))
        .replace("{{WARNING}}", String(data.summary.warning))
        .replace("{{CHART_IMAGE}}", chartImage)
        .replace("{{EXPIRING_CAPTION}}", escapeHtml(expiringCaption))
        .replace("{{EXPIRING_ROWS}}", expiringRows)
        .replace("{{RISK_ROWS}}", riskRows);
};
exports.renderMvpReportHtml = renderMvpReportHtml;
const loadTemplate = () => {
    const candidates = [
        (0, path_1.join)(__dirname, "..", "templates", "mvp-report.html"),
        (0, path_1.join)(process.cwd(), "services/reporting/src/templates/mvp-report.html"),
        (0, path_1.join)(process.cwd(), "src/templates/mvp-report.html")
    ];
    for (const p of candidates) {
        try {
            return (0, fs_1.readFileSync)(p, "utf8");
        }
        catch {
            /* try next */
        }
    }
    return "<!doctype html><html><body><p>Report template missing.</p></body></html>";
};
