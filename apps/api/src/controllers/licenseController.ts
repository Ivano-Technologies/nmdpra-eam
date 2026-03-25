import type { Request, Response } from "express";

import { getOverviewSnapshot } from "../services/licenseService";

export const getLicenseOverview = async (_req: Request, res: Response): Promise<void> => {
  const data = await getOverviewSnapshot();
  res.status(200).json(data);
};
