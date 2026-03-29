# Go-live checklist (nmdpra-eam)

Serverless entry: [`api/index.js`](../api/index.js) → compiled Express in [`apps/api/dist`](../apps/api/dist). [`vercel.json`](../vercel.json) uses **rewrites** (`source: "/(.*)"` → `destination: "/api"`), not legacy `routes` / `src` / `dest`.

Root **`pnpm build`** runs **`@rmlis/api` build**, which compiles **`@rmlis/shared`** and **`@rmlis/reporting`** first, then the API (see [`apps/api/package.json`](../apps/api/package.json)). Full monorepo: **`pnpm build:all`**.

**Workspace resolution (Vercel):** [`apps/api/package.json`](../apps/api/package.json) lists `@rmlis/shared` and `@rmlis/reporting` as `workspace:*`. Each package exposes built **`dist/`** via `main` / `types` / [`exports`](https://nodejs.org/api/packages.html#exports). [`apps/api/tsconfig.json`](../apps/api/tsconfig.json) `paths` map to **`dist/`** (not `src/`) so TypeScript does not pull sibling packages into the API build (**TS6059** with `rootDir`). Root [`.npmrc`](../.npmrc) sets `shamefully-hoist=true`. [`vercel.json`](../vercel.json) uses `pnpm install --frozen-lockfile` then `pnpm build`.

Do these steps **in order**.

---

## 1) Sync and build (~1 minute)

```bash
git checkout main
git pull origin main
pnpm build
node -e "require('./api/index.js')"
```

Must finish with **no errors**. Optional: `node apps/api/dist/server.js` for a local listen smoke test.

---

## 2) Convex (required before Vercel)

```bash
npx convex deploy
```

Ensures indexes (e.g. `by_vendor_type_expiry`) and ingest/query logic match production.

---

## 3) Vercel import settings (confirm)

| Field | Value |
|--------|--------|
| Framework | **Other** |
| Root | **`/`** (repo root) **or** **`apps/api`** |
| Install | `pnpm install --frozen-lockfile` (or leave default if set in [`vercel.json`](../vercel.json)) |
| Build | `pnpm build` |
| Output | *(empty)* |

If Root is **`apps/api`**, this repo includes [`apps/api/vercel.json`](../apps/api/vercel.json) and [`apps/api/api/index.js`](../apps/api/api/index.js) so the serverless entry and rewrites match the subdirectory layout. If Root is **`/`**, use the root [`api/index.js`](../api/index.js) + root [`vercel.json`](../vercel.json).

### Web app (Next.js) — separate Vercel project

| Field | Value |
|--------|--------|
| Framework | **Next.js** |
| Root | **`apps/web`** |
| Build | *(default `next build`)* |
| Output | *(Next default)* |

Set env vars per [`apps/web/.env.example`](../apps/web/.env.example). **`NEXT_PUBLIC_API_BASE_URL`** should point at your deployed API (e.g. `https://eam.techivano.com/api`).

**CORS:** On the **API** Vercel project, set **`CORS_ORIGIN`** to your web app’s origin (comma-separated for Preview + Production URLs). In production, if `CORS_ORIGIN` is unset, the API does **not** send permissive CORS headers.

---

## 4) Environment variables (set, then redeploy)

**Vercel → Project → Settings → Environment Variables** — add to **Production** and **Preview** (no stray quotes/spaces). Then **Redeploy**.

```
CONVEX_URL=<your convex url>
INGEST_SECRET=<same as Convex dashboard>

RESEND_API_KEY=<your key>
RESEND_FROM_EMAIL=reports@nmdpra.app
REPORT_EMAIL_TO=<your email>

NODE_ENV=production

# Required when the Next.js dashboard calls the API from the browser (comma-separated origins)
CORS_ORIGIN=https://your-web-app.vercel.app
```

See also [`.env.example`](../.env.example) and [`apps/web/.env.example`](../apps/web/.env.example).

---

## 5) Deploy

Dashboard **Deploy**, or `npx vercel --prod` (with CLI linked).

---

## 6) Post-deploy tests (strict order)

Use your Vercel URL (e.g. `https://<project>.vercel.app`).

### a) Liveness

`GET /health` or `GET /api/health`

Expect JSON including `ok`, `service`, `version`, `convexConfigured`, and **`latencyMs`** (ms from request start through middleware to handler; useful for cold starts and slow paths).

### b) Data

- `GET /api/licenses/mvp-report` (dashboard JSON: summary + rows)
- `GET /api/licenses/expiring`
- `GET /api/licenses/risk-ranking`

### c) PDF (critical)

`GET /api/reports/mvp.pdf` — response includes **`Cache-Control: no-store`** for fresh reports.

### d) Email

`POST /api/reports/mvp/email` (body may include `{ "to": "..." }` or use `REPORT_EMAIL_TO`).

---

## Pre-demo verification

Run through this list before a client or stakeholder demo.

### Confirm Vercel settings

- **API project:** Root **`/`** or **`apps/api`** (see §3 above), not the web app.
- **Web project (Next.js):** Root Directory must be **`apps/web`**. If this is wrong in the Vercel UI, the frontend deploy will fail or serve the wrong app.

### Backend (production API base, e.g. `https://eam.techivano.com`)

- [ ] `GET /api/health` — JSON includes `ok: true`
- [ ] `GET /api/licenses/mvp-report` — KPIs and rows as expected
- [ ] `GET /api/licenses/risk-ranking` — table data
- [ ] `GET /api/reports/mvp.pdf` — PDF downloads or opens

### Frontend (web URL)

- [ ] Landing page loads
- [ ] Clerk login works
- [ ] After login, `/dashboard` loads
- [ ] KPI cards, expiry chart, and risk table populate (or show empty states)
- [ ] Download PDF and Send email actions work

### Deployment / CORS

- [ ] API is reachable at your public domain (e.g. `https://eam.techivano.com`)
- [ ] Web app URL is known (e.g. `https://<project>.vercel.app` or custom domain)
- [ ] **`CORS_ORIGIN`** on the **API** project includes the **exact** web origin (scheme + host, no trailing slash); comma-separate Preview + Production if both are used

### UX (before stakeholder demo)

- [ ] Browser **console** has no unexpected errors on landing and dashboard
- [ ] **Mobile** (or narrow viewport): layout readable; section jump links and cards stack sensibly
- [ ] **Dashboard** loads in a few seconds on a typical connection (cold start may add latency on first API hit)
- [ ] **System live** pill turns green when `/api/health` succeeds
- [ ] **PDF** opens from the dashboard without blocking dialogs
- [ ] **Email**: while sending, “Sending report…” appears; success or error message after completion

---

## Fast troubleshooting

| Symptom | What to check |
|---------|----------------|
| Build **Cannot find module '@rmlis/shared'** / **'@rmlis/reporting/mvp'** | Root **Install** must be `pnpm install` from repo root (not `npm`). Confirm workspace `dependencies` and `exports` / `dist` as above; run `pnpm build` locally. |
| PDF **500** | `puppeteer-core` + `@sparticuz/chromium`; `executablePath: await chromium.executablePath()`; [`vercel.json`](../vercel.json) function `maxDuration` / `memory`; Vercel logs |
| **Empty** data | `pnpm ingest -- --json=C:\path\to\data.json` (local env matches Convex) |
| Env **ignored** | **Redeploy** after saving env vars |
| **404** | Root `/`, `api/index.js` present after build; [`vercel.json`](../vercel.json) **rewrites** to `/api` (same role as older “routes → /api” docs) |

---

## Demo script (talk track)

1. **Health** — “System is live and connected.”
2. **Expiring** — “Here are licences in risk windows.”
3. **Risk ranking** — “We prioritize vendors by compliance risk.”
4. **PDF** — “This report is generated automatically.”
5. **Email** — “This can be sent on a schedule without manual steps.”

---

## Stakeholder checklist

- Vendor names (not raw IDs); dates en-GB where applicable  
- PDF and email attachments open cleanly  
- No unexpected 500s  
