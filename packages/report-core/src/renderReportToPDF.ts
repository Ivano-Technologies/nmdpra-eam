import puppeteer from "puppeteer";

import { renderChartToSVG } from "./renderChartToSVG";
import { renderHtml } from "./renderHtml";
import type { Report } from "./types";
import { validateReport } from "./types";

export async function renderReportToPDF(report: Report): Promise<Buffer> {
  const validated = validateReport(report);
  const resolvedSections = await Promise.all(
    validated.sections.map(async (section) => {
      if (section.type !== "chart") {
        return section;
      }
      const svg = await renderChartToSVG(section.spec);
      return {
        type: "chart" as const,
        title: section.title,
        svg
      };
    })
  );

  const html = renderHtml(validated, resolvedSections);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
