import dotenv from "dotenv";

import { getWorkerEnvConfig } from "./config/env";
import { startScheduler } from "./scheduler";

dotenv.config();

const envConfig = getWorkerEnvConfig();

startScheduler();

console.log(
  `[worker] scheduler started (convexTokenConfigured=${envConfig.convexToken !== null})`
);
