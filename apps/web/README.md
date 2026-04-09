# @rmlis/web

Next.js (App Router) frontend for **Ivano IQ**: marketing site, Clerk sign-in, and authenticated operational-intelligence dashboard, backed by the Express API.

Clerk runs via [`src/middleware.ts`](src/middleware.ts) (`clerkMiddleware` from `@clerk/nextjs/server`); `/dashboard` is protected. [`src/app/layout.tsx`](src/app/layout.tsx) wraps the app with `<ClerkProvider>` inside `<body>`.

## Security note (MVP)

**Auth is UI-only in MVP. API endpoints are not yet secured** — anyone who can reach the API URL can call the same JSON/PDF routes the dashboard uses. Lock this down before a production launch (e.g. verify Clerk JWT on the API).

## Setup

```bash
cd apps/web
cp .env.example .env.local
# Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and NEXT_PUBLIC_API_BASE_URL
pnpm dev
```

If you keep secrets in the **monorepo root** `.env.local` only, copy or symlink that file to `apps/web/.env.local` so Next.js (and Playwright’s `next dev`) load Clerk keys.

Open [http://localhost:3000](http://localhost:3000). The API must allow your origin via **`CORS_ORIGIN`** on the API server (e.g. `http://localhost:3000` for local dashboard).

### Playwright

- **Smoke (default CI):** `pnpm test:e2e` — 14 unauthenticated / public checks (no `E2E_CLERK_EMAIL` in env).
- **Integrated:** requires `E2E_CLERK_EMAIL` + `CLERK_SECRET_KEY` (see `e2e/load-test-env.ts`). Env file precedence for **unset** shell vars: repo-root `.env.local` → `apps/web/.env.local` → `apps/web/.env.e2e.local` (last wins per key). Sign-in uses `@clerk/testing` (`e2e/global-setup.ts`, `e2e/auth.setup.ts`). Set `DEBUG_E2E=1` to log which env files were found and whether Clerk/Resend keys are present.
- **Upload E2E:** Prefer **Clerk → Users → test user → Public metadata** `{ "orgId": "your_tenant_id" }` so the dashboard upload form does not need `E2E_ORG_ID`. If you cannot set metadata, set `E2E_ORG_ID` in `.env.e2e.local` (fallback).
- **Optional:** `E2E_LAB_XLSX_PATH` — full path to a large workbook (e.g. Lab Accreditation export). Screenshots: `e2e/progress/`.

**Integrated checklist**

| Required | Notes |
|----------|--------|
| `E2E_CLERK_EMAIL` | Test user in your Clerk dev instance |
| `CLERK_SECRET_KEY` | In `.env.local` (loaded by `e2e/load-test-env.ts`) |
| `orgId` | Clerk `publicMetadata.orgId` **or** `E2E_ORG_ID` for upload tests |
| `apps/web/.env.local` | Copy/symlink from repo root if secrets live only at monorepo root |

| Optional | Notes |
|----------|--------|
| `RESEND_API_KEY` | Report email routes |
| `BACKEND_API_ORIGIN` | Proxies `/api/reports/mvp.pdf` and `mvp/email` to Express |
| `E2E_LAB_XLSX_PATH` | Large-file upload assertion (`imported` ≥ 200) |

## Build

```bash
pnpm build
```

Requires Clerk env vars. `NEXT_PUBLIC_API_BASE_URL` defaults to `https://eam.techivano.com/api` via `next.config.ts` if unset.

## Vercel

Create a **separate** Vercel project with **Root Directory** `apps/web`, Framework **Next.js**. Set the same env vars as in `.env.example`. If the apex domain serves Next but `/api/*` must hit the Express deployment, set **`BACKEND_API_ORIGIN`** (see `.env.example` and `next.config.ts` rewrites). Otherwise add the web production URL to the **API** project’s **`CORS_ORIGIN`** so browser `fetch` succeeds cross-origin.

**Pre-demo checklist:** See [Pre-demo verification](../docs/vercel-deploy.md#pre-demo-verification) in `docs/vercel-deploy.md` (backend URLs, frontend flows, CORS, confirm `apps/web` root in Vercel).
