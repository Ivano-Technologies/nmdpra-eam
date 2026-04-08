import type { Page } from "@playwright/test";

import { shotFile } from "./paths";

export async function screenshotStep(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({ path: shotFile(name), fullPage: true });
}
