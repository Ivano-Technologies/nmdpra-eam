import type { ConvexHttpClient } from "convex/browser";

import { notificationsCreateMutation } from "@/lib/internal-convex-refs";

export async function createInAppNotification(
  client: ConvexHttpClient,
  args: {
    secret: string;
    userId: string;
    title: string;
    body: string;
    kind?: string;
  }
): Promise<void> {
  await client.mutation(notificationsCreateMutation, {
    secret: args.secret,
    userId: args.userId,
    title: args.title,
    body: args.body,
    kind: args.kind
  });
}
