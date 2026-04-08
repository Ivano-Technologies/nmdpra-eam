import { createClerkClient } from "@clerk/backend";
import { applyPlaywrightTestEnv } from "@rmlis/e2e-env";

const EMAIL = "e2e-test@internal.dev";
const PASSWORD = "E2eTestUser!2025";

async function main(): Promise<void> {
  applyPlaywrightTestEnv();

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required to seed e2e user");
  }

  const clerk = createClerkClient({ secretKey });
  const existing = await clerk.users.getUserList({
    emailAddress: [EMAIL],
    limit: 1
  });

  if (existing.data.length > 0) {
    const user = existing.data[0];
    await clerk.users.updateUser(user.id, {
      password: PASSWORD,
      publicMetadata: {
        ...(user.publicMetadata ?? {}),
        role: "owner",
        orgId: "org_e2e_audit"
      }
    });
    console.log("already exists");
    return;
  }

  await clerk.users.createUser({
    emailAddress: [EMAIL],
    password: PASSWORD,
    publicMetadata: {
      role: "owner",
      orgId: "org_e2e_audit"
    }
  });
  console.log("created");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
