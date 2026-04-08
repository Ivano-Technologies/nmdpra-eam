import { mkdirSync } from "node:fs";
import path from "node:path";

import { clerk } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "user.json");

setup("Clerk sign-in", async ({ page, context }) => {
  const email = process.env.E2E_CLERK_EMAIL?.trim();
  if (!email) {
    setup.skip(true, "Set E2E_CLERK_EMAIL (e.g. apps/web/.env.e2e.local)");
    return;
  }
  if (!process.env.CLERK_SECRET_KEY?.trim()) {
    setup.skip(
      true,
      "CLERK_SECRET_KEY must be available (repo root `.env.local`)"
    );
    return;
  }

  mkdirSync(authDir, { recursive: true });

  await page.goto("/", { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForFunction(
    () => typeof window !== "undefined" && window.Clerk !== undefined,
    { timeout: 120_000 }
  );
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 120_000 });
  await context.storageState({ path: authFile });
});
