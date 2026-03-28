"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfFromHtml = void 0;
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const extraArgs = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
const getLaunchOptions = async () => {
    const custom = process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || process.env.CHROME_PATH?.trim();
    if (custom) {
        return {
            executablePath: custom,
            headless: true,
            args: extraArgs
        };
    }
    return {
        args: [...chromium_1.default.args, ...extraArgs],
        executablePath: await chromium_1.default.executablePath(),
        headless: true
    };
};
const generatePdfFromHtml = async (html) => {
    const launchOpts = await getLaunchOptions();
    const browser = await puppeteer_core_1.default.launch(launchOpts);
    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60_000);
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 60_000 });
        return Buffer.from(await page.pdf({ format: "A4", printBackground: true }));
    }
    finally {
        await browser.close();
    }
};
exports.generatePdfFromHtml = generatePdfFromHtml;
