import type { NextApiRequest, NextApiResponse } from "next";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../../convex/_generated/api";

type OkBody = { success: true; data: unknown };
type ErrBody = { success: false; error: string };

/**
 * Pages Router API (path must stay under pages/api/reports/mvp.ts).
 * Convex public query: {@link convex/licenses.ts} `mvpReportData`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkBody | ErrBody>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    console.error("MVP API error: NEXT_PUBLIC_CONVEX_URL is not set");
    return res.status(500).json({
      success: false,
      error: "Failed to load report"
    });
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const data = await convex.query(api.licenses.mvpReportData, {});
    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("MVP API error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to load report"
    });
  }
}
