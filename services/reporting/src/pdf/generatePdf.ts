import puppeteer from "puppeteer";

export type ReportKind = "daily" | "weekly" | "monthly";

export const generatePdfFromHtml = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return Buffer.from(await page.pdf({ format: "A4", printBackground: true }));
  } finally {
    await browser.close();
  }
};
