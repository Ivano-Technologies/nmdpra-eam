"use strict";

/**
 * Vercel catch-all when Root Directory is `apps/api` (see root `vercel.json` pattern).
 */
const { app } = require("../dist/app.js");

module.exports = app;
