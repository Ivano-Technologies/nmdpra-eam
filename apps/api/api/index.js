"use strict";

/**
 * Vercel serverless entry when Root Directory is `apps/api`.
 * Requires `pnpm build` so `dist/app.js` exists.
 */
const { app } = require("../dist/app.js");

module.exports = app;
