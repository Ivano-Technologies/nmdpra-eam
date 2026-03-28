"use strict";

/**
 * Vercel serverless entry: compiled Express app (no listen).
 * Build must run first: `pnpm build` produces apps/api/dist/app.js
 */
const { app } = require("../apps/api/dist/app.js");

module.exports = app;
