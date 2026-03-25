import type { Request, Response } from "express";

import { getExpiringLicenses, getOverviewSnapshot } from "../services/licenseService";

export const getLicenseOverview = async (_req: Request, res: Response): Promise<void> => {
  const data = await getOverviewSnapshot();
  res.status(200).json(data);
};

export const getExpiringLicensesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const data = await getExpiringLicenses();
  res.status(200).json(data);
};
