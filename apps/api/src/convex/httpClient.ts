import { ConvexHttpClient } from "convex/browser";

let cached: ConvexHttpClient | null = null;

export const getConvexHttpClient = (): ConvexHttpClient => {
  const url = process.env.CONVEX_URL?.trim();
  if (!url) {
    throw new Error("CONVEX_URL is not set. Configure your Convex deployment URL.");
  }
  if (!cached) {
    cached = new ConvexHttpClient(url);
  }
  return cached;
};
