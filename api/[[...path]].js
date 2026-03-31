"use strict";

/**
 * Vercel catch-all under /api so /api/health, /api/licenses/*, etc. invoke this
 * function. With only api/index.js, Vercel looks for api/health.js and returns 404.
 *
 * @see https://vercel.com/docs/functions/routing#catch-all-dynamic-routes
 */
const { app } = require("../apps/api/dist/app.js");

module.exports = app;
