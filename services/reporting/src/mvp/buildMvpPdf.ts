import { renderReportToPDF } from "@rmlis/report-core";

import type { MvpReportInput } from "./renderMvpReport";
import { mvpInputToReport } from "./mvpInputToReport";

export const buildMvpPdf = async (data: MvpReportInput): Promise<Buffer> => {
  const report = mvpInputToReport(data);
  return renderReportToPDF(report);
};
