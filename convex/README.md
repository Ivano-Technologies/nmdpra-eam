# Convex backend

This directory holds Convex functions for **Ivano IQ** (vendors, licenses, ingestion, reporting queries).

## Setup

1. Install the Convex CLI (already available via `pnpm exec convex`).
2. Run `npx convex dev` from the repository root and sign in. This creates a deployment and sets `CONVEX_DEPLOYMENT` / URL for codegen and pushes functions.
3. In the Convex dashboard, set environment variables:
   - `INGEST_SECRET` — shared with the local `.env` / `.env.local` `INGEST_SECRET` used by `pnpm ingest` and the `ingest:importLicenses` mutation.

## HTTP client (API / scripts)

The Express API and `packages/db` ingest script call Convex using `CONVEX_URL` (deployment URL) from the environment.
