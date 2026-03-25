import dotenv from "dotenv";

import { startScheduler } from "./scheduler";

dotenv.config();

startScheduler();

console.log("[worker] scheduler started");
