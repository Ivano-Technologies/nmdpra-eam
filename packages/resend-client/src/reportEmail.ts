import { EmailSchema, type EmailPayload } from "./index";

export type ReportEmailInput = {
  reportId: string;
  recipient: string;
  downloadUrl: string;
};

export function buildReportEmail(input: ReportEmailInput): EmailPayload {
  const payload: EmailPayload = {
    to: [input.recipient],
    subject: `Institutional Report ${input.reportId}`,
    html: [
      "<h1>Institutional Report</h1>",
      `<p>Report ID: ${escapeHtml(input.reportId)}</p>`,
      `<p>Download URL: <a href="${escapeHtml(input.downloadUrl)}">${escapeHtml(input.downloadUrl)}</a></p>`
    ].join("")
  };
  return EmailSchema.parse(payload);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
