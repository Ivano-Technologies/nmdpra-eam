import { clerkSetup } from "@clerk/testing/playwright";

import { applyPlaywrightTestEnv } from "@rmlis/e2e-env";

/**
 * Fetches Clerk testing token before `clerk.signIn` runs.
 */
export default async function globalSetup(): Promise<void> {
  applyPlaywrightTestEnv();
  /** Next.js dev server inherits this — no outbound Resend in MVP audit unless opted out. */
  if (process.env.MVP_AUDIT_MOCK_EMAIL !== "0") {
    process.env.EMAIL_MODE = "mock";
  }
  const email = process.env.E2E_CLERK_EMAIL?.trim();
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!email || !pk) {
    return;
  }
  await clerkSetup({ publishableKey: pk });
}
