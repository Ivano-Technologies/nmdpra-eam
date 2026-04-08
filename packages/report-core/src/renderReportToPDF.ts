import puppeteerCore from "puppeteer-core";

import { renderChartToSVG } from "./renderChartToSVG";
import { renderHtml } from "./renderHtml";
import type { Report } from "./types";
import { validateReport } from "./types";

const extraLaunchArgs = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage"
];

function isServerlessRuntime(): boolean {
  return (
    Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
  );
}

async function launchPdfBrowser() {
  if (isServerlessRuntime()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteerCore.launch({
      args: [...chromium.args, ...extraLaunchArgs],
      executablePath: await chromium.executablePath(),
      headless: true
    });
  }

  const custom =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
    process.env.CHROME_PATH?.trim();
  if (custom) {
    return puppeteerCore.launch({
      executablePath: custom,
      headless: true,
      args: extraLaunchArgs
    });
  }

  const { default: puppeteer } = await import("puppeteer");
  return puppeteerCore.launch({
    executablePath: puppeteer.executablePath(),
    headless: true,
    args: extraLaunchArgs
  });
}

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
  const browser = await launchPdfBrowser();
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
