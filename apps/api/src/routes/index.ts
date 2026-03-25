import { Router } from "express";

import { getLicenseOverview } from "../controllers/licenseController";

const router = Router();

router.get("/licenses/overview", getLicenseOverview);

export { router as apiRouter };
