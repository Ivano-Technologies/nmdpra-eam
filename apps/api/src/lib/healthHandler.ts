import type { Request, Response } from "express";

import { readApiVersion } from "./readVersion";

export type RequestWithStartTime = Request & { startTime?: number };

export const sendHealth = (req: Request, res: Response): void => {
  const started = (req as RequestWithStartTime).startTime;
  const latencyMs = started !== undefined ? Date.now() - started : 0;
  res.status(200).json({
    ok: true,
    service: "nmdpra-rmlis-api",
    version: readApiVersion(),
    convexConfigured: Boolean(process.env.CONVEX_URL?.trim()),
    latencyMs
  });
};
