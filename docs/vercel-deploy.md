# Go-live checklist (nmdpra-eam)

Serverless entry: [`api/index.js`](../api/index.js) → compiled Express in [`apps/api/dist`](../apps/api/dist). [`vercel.json`](../vercel.json) uses **rewrites** (`source: "/(.*)"` → `destination: "/api"`), not legacy `routes` / `src` / `dest`.

Root **`pnpm build`** runs `@rmlis/shared` → `@rmlis/reporting` → `@rmlis/api` (see [`package.json`](../package.json)). Full monorepo: **`pnpm build:all`**.

**Workspace resolution (Vercel):** [`apps/api/package.json`](../apps/api/package.json) lists `@rmlis/shared` and `@rmlis/reporting` as `workspace:*`. Each package exposes built **`dist/`** via `main` / `types` / [`exports`](https://nodejs.org/api/packages.html#exports). Root [`.npmrc`](../.npmrc) sets `shamefully-hoist=true` so installs behave like a flatter `node_modules` tree on CI. [`vercel.json`](../vercel.json) uses `pnpm install --frozen-lockfile` then `pnpm build`.

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
| Root | `/` |
| Install | `pnpm install` |
| Build | `pnpm build` |
| Output | *(empty)* |

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
```

See also [`.env.example`](../.env.example).

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

- `GET /api/licenses/expiring`
- `GET /api/licenses/risk-ranking`

### c) PDF (critical)

`GET /api/reports/mvp.pdf` — response includes **`Cache-Control: no-store`** for fresh reports.

### d) Email

`POST /api/reports/mvp/email` (body may include `{ "to": "..." }` or use `REPORT_EMAIL_TO`).

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
