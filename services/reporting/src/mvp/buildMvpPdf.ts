import { generatePdfFromHtml } from "../pdf/generatePdf";
import type { MvpReportInput } from "./renderMvpReport";
import { renderMvpReportHtml } from "./renderMvpReport";

export const buildMvpPdf = async (data: MvpReportInput): Promise<Buffer> => {
  const html = renderMvpReportHtml(data);
  return generatePdfFromHtml(html);
};
