import { auth, clerkClient } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import {
  listSubscriptionsQuery,
  removeSubscriptionMutation,
  upsertSubscriptionMutation
} from "@/lib/internal-convex-refs";
import { parseUserRole } from "@/lib/roles";

async function assertOwner(): Promise<
  NextResponse | { convexUrl: string; jobSecret: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (parseUserRole(user.publicMetadata) !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return NextResponse.json(
      { error: "Subscriptions unavailable" },
      { status: 503 }
    );
  }
  return { convexUrl, jobSecret };
}

export async function GET() {
  const gate = await assertOwner();
  if (gate instanceof NextResponse) {
    return gate;
  }
  const client = new ConvexHttpClient(gate.convexUrl);
  const items = await client.query(listSubscriptionsQuery, {
    secret: gate.jobSecret
  });
  return NextResponse.json({ subscriptions: items });
}

export async function POST(req: Request) {
  const gate = await assertOwner();
  if (gate instanceof NextResponse) {
    return gate;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const orgId = String((body as { orgId?: unknown }).orgId ?? "").trim();
  const email = String((body as { email?: unknown }).email ?? "").trim();
  const frequency = (body as { frequency?: unknown }).frequency;

  if (!orgId || !email) {
    return NextResponse.json(
      { error: "orgId and email are required" },
      { status: 400 }
    );
  }
  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly"
  ) {
    return NextResponse.json(
      { error: "frequency must be daily, weekly, or monthly" },
      { status: 400 }
    );
  }

  const client = new ConvexHttpClient(gate.convexUrl);
  const id = await client.mutation(upsertSubscriptionMutation, {
    secret: gate.jobSecret,
    orgId,
    email,
    frequency
  });

  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: Request) {
  const gate = await assertOwner();
  if (gate instanceof NextResponse) {
    return gate;
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query required" }, { status: 400 });
  }

  const client = new ConvexHttpClient(gate.convexUrl);
  await client.mutation(removeSubscriptionMutation, {
    secret: gate.jobSecret,
    subscriptionId: id
  });

  return NextResponse.json({ success: true });
}
