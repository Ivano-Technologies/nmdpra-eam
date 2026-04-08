import type { NextApiRequest, NextApiResponse } from "next";

import { getMockEmailsByTestRunId } from "@rmlis/resend-client";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const testRunId = req.headers["x-test-run-id"];
  const runId = Array.isArray(testRunId) ? testRunId[0] : testRunId;
  const emails = getMockEmailsByTestRunId(runId);
  res.status(200).json({ emails });
}
