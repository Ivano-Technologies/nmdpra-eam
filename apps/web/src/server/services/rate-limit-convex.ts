import { ConvexHttpClient } from "convex/browser";

import { rateLimitCheckMutation } from "@/lib/internal-convex-refs";

export class RateLimitError extends Error {
  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Fixed-window rate limit via Convex (no Redis required).
 */
export async function checkConvexRateLimit(params: {
  key: string;
  max: number;
  windowMs: number;
}): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const jobSecret = process.env.INTERNAL_JOB_SECRET?.trim();
  if (!convexUrl || !jobSecret) {
    return;
  }
  const client = new ConvexHttpClient(convexUrl);
  const r = (await client.mutation(rateLimitCheckMutation, {
    secret: jobSecret,
    key: params.key,
    max: params.max,
    windowMs: params.windowMs
  })) as { allowed: boolean };
  if (!r.allowed) {
    throw new RateLimitError();
  }
}
