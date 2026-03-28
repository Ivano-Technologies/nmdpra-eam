import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export type ReportKind = "daily" | "weekly" | "monthly";

const extraArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];

const getLaunchOptions = async (): Promise<Parameters<typeof puppeteer.launch>[0]> => {
  const custom =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || process.env.CHROME_PATH?.trim();
  if (custom) {
    return {
      executablePath: custom,
      headless: true,
      args: extraArgs
    };
  }

  return {
    args: [...chromium.args, ...extraArgs],
    executablePath: await chromium.executablePath(),
    headless: true
  };
};

export const generatePdfFromHtml = async (html: string): Promise<Buffer> => {
  const launchOpts = await getLaunchOptions();
  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60_000);
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60_000 });
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true }));
  } finally {
    await browser.close();
  }
};
