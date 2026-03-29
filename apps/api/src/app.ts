import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import type { RequestWithStartTime } from "./lib/healthHandler";
import { sendHealth } from "./lib/healthHandler";
import { resolvePublicDir } from "./lib/publicDir";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

dotenv.config();

const app = express();

app.use((req, res, next) => {
  (req as RequestWithStartTime).startTime = Date.now();
  next();
});

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const corsOrigins = process.env.CORS_ORIGIN?.trim()
  ? process.env.CORS_ORIGIN.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": ["'self'", "http:", "https:", "ws:", "wss:"]
      }
    }
  })
);
app.use(
  cors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true
  })
);
app.use(express.json({ limit: "512kb" }));

app.get("/health", sendHealth);

const publicDir = resolvePublicDir();
app.use(express.static(publicDir, { index: false, maxAge: process.env.NODE_ENV === "production" ? "1h" : 0 }));

app.get("/demo", (_req, res) => {
  res.redirect(302, "/demo.html");
});

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "nmdpra-eam-api",
    health: "/api/health",
    demo: "/demo"
  });
});

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});

app.use(errorHandler);

export { app };
export default app;
