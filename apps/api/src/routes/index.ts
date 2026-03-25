import { Router } from "express";

import {
  getExpiringLicensesController,
  getLicenseOverview
} from "../controllers/licenseController";

const router = Router();

router.get("/licenses/overview", getLicenseOverview);
router.get("/licenses/expiring", getExpiringLicensesController);

export { router as apiRouter };
