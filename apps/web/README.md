# @rmlis/web

Next.js (App Router) frontend for RMLIS: landing page, Clerk sign-in, and authenticated dashboard backed by the Express API.

Clerk runs via [`src/proxy.ts`](src/proxy.ts) (`clerkMiddleware` from `@clerk/nextjs/server`); `/dashboard` is protected. [`src/app/layout.tsx`](src/app/layout.tsx) wraps the app with `<ClerkProvider>` inside `<body>`.

## Security note (MVP)

**Auth is UI-only in MVP. API endpoints are not yet secured** — anyone who can reach the API URL can call the same JSON/PDF routes the dashboard uses. Lock this down before a production launch (e.g. verify Clerk JWT on the API).

## Setup

```bash
cd apps/web
cp .env.example .env.local
# Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and NEXT_PUBLIC_API_BASE_URL
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The API must allow your origin via **`CORS_ORIGIN`** on the API server (e.g. `http://localhost:3000` for local dashboard).

## Build

```bash
pnpm build
```

Requires Clerk env vars. `NEXT_PUBLIC_API_BASE_URL` defaults to `https://eam.techivano.com/api` via `next.config.ts` if unset.

## Vercel

Create a **separate** Vercel project with **Root Directory** `apps/web`, Framework **Next.js**. Set the same env vars as in `.env.example`. Add the web production URL to the **API** project’s `CORS_ORIGIN` so browser `fetch` succeeds.

**Pre-demo checklist:** See [Pre-demo verification](../docs/vercel-deploy.md#pre-demo-verification) in `docs/vercel-deploy.md` (backend URLs, frontend flows, CORS, confirm `apps/web` root in Vercel).
