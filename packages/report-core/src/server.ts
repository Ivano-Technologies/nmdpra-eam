/**
 * PDF/chart entry — safe for Next.js App Router (no react-dom/server).
 * Use `@rmlis/report-core` root export for HTML helpers (Node/CLI only).
 */
export { renderChartToSVG } from "./renderChartToSVG";
export { renderReportToPDF } from "./renderReportToPDF";
export { ReportSchema, validateReport } from "./types";
export type { Report, ReportSection, VegaLiteSpec } from "./types";
