import dotenv from "dotenv";
import express from "express";

import { apiRouter } from "./routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use("/api", apiRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.listen(port, () => {
  // Minimal startup log for ops visibility.
  console.log(`[api] listening on http://localhost:${port}`);
});
