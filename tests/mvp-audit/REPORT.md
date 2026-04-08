# MVP Playwright audit — report

**Run date:** 2026-04-08  
**Config:** [playwright.mvp-audit.config.ts](../../playwright.mvp-audit.config.ts)  
**Command:** `pnpm test:mvp-audit` (from repo root)  
**Prerequisites:** `npx playwright install --with-deps`; repo root and/or `apps/web` `.env.local` with `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, etc.  
**Integrated (Clerk) tests:** require `E2E_CLERK_EMAIL` and `CLERK_SECRET_KEY` (see [apps/web/README.md](../../apps/web/README.md)). Without them, only the **mvp-public** project runs.

## Pass rate

| Scope | Result |
|--------|--------|
| **mvp-public** (no Clerk E2E user) | 4/4 passed (latest run in CI-like env) |
| **mvp-setup + mvp-authenticated** | Run when `E2E_CLERK_EMAIL` + `CLERK_SECRET_KEY` are set — not executed in secret-less automation |

**Target 100%:** run `pnpm test:mvp-audit` locally with `.env.local` / `apps/web/.env.e2e.local` populated for Clerk + Convex, then re-check this table.

## Checklist status (see [CHECKLIST.md](./CHECKLIST.md))

- **Automated (public):** landing, data policy, health API, 404 page, screenshots under `screenshots/`.
- **Automated (authenticated, when creds present):** dashboard navigation, reports (JSON/PDF/email mock), settings, API route smoke, cron 401 without secret, optional cron with `CRON_SECRET`, upload (skipped unless `E2E_ORG_ID` / metadata), RBAC badge, errors smoke.
- **Manual / optional:** Clerk sign-up & password reset UI, `services/worker` cron in production, Express-only routes when using a separate API deployment, full RBAC matrix (requires multiple Clerk users).

## Bugs found and fixes (application / tooling)

1. **Resend mock for deterministic E2E** — Introduced workspace package `@rmlis/resend-client` (`MOCK_RESEND` / `E2E_MAIL_MOCK`) so tests avoid real outbound email; Express `postMvpEmail` and Next cron/notifications use the same helper. Added `GET /api/__e2e__/last-resend` (404 when not in mock mode).
2. **PDF/email without Express** — When `BACKEND_API_ORIGIN` is unset, Next had no PDF/email handlers (only rewrites when Express is configured). Added `pages/api/reports/mvp.pdf.ts` and `app/api/reports/mvp/email/route.ts` mirroring Express behaviour so a single `next dev` can serve PDFs and report email.
3. **Playwright env for Next child** — `MOCK_RESEND` must be passed into the `webServer` process (`env` in config); `globalSetup` alone is insufficient.
4. **Root Playwright config module resolution** — Added `@rmlis/e2e-env` to **root** `devDependencies` so `playwright.mvp-audit.config.ts` can import `@rmlis/e2e-env`.
5. **Shared E2E dotenv** — New package `packages/e2e-env` with `findRepoRoot()` + layered `.env` loading; `apps/web/e2e/load-test-env.ts` re-exports it.

## Screenshots captured (naming: `[slug].png`)

| File | Description |
|------|-------------|
| `public-landing.png` | Home / landing |
| `public-data-policy.png` | `/data-policy` |
| `public-404.png` | Unknown route 404 |
| `reports-mvp-sample.pdf` | Saved PDF bytes from `GET /api/reports/mvp.pdf` (authenticated run) |
| *(authenticated runs)* | `dashboard-*`, `reports-*`, `settings-*`, `rbac-*`, `upload-*`, etc. |

## Known limitations

- **Clerk E2E:** Ticket-based sign-in via `@clerk/testing` (`auth.setup.ts`); not a custom email/password DB user.
- **Upload test:** Skips unless org is available (`E2E_ORG_ID` or Clerk `publicMetadata.orgId`).
- **Cron integration:** Optional test sends `Authorization: Bearer` only when `CRON_SECRET` is set.
- **NODE_ENV warning:** If the shell sets a non-standard `NODE_ENV`, Next may warn during `next dev` under Playwright.

## Optional: real Resend (non-CI)

Set `MVP_AUDIT_MOCK_EMAIL=0` and provide `RESEND_API_KEY` / `RESEND_FROM_EMAIL` to exercise real delivery (not required for CI).
