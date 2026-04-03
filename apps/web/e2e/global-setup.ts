import { clerkSetup } from "@clerk/testing/playwright";

import { applyPlaywrightTestEnv } from "./load-test-env";

/**
 * Fetches Clerk testing token (bot protection bypass) before `clerk.signIn` runs.
 * No-op when E2E credentials or publishable key are missing.
 */
export default async function globalSetup(): Promise<void> {
  applyPlaywrightTestEnv();
  const email = process.env.E2E_CLERK_EMAIL?.trim();
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!email || !pk) {
    return;
  }
  await clerkSetup({ publishableKey: pk });
}
