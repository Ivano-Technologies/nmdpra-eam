# nmdpra-eam

## Client demo (API + static UI)

1. Set `CONVEX_URL` (and optional `CORS_ORIGIN` if the browser loads the demo from another origin).
2. Run `pnpm --filter @rmlis/api dev` and open `http://localhost:3000/demo.html`.
3. Use **Refresh data** to reload buckets and risk ranking; use export links for CSV and MVP PDF.

`GET /api/licenses/export.csv` outputs **issue** and **expiry** columns as **en-GB** (DD/MM/YYYY) for Excel-friendly review.

Cross-origin: open `demo.html` with `?api=http://localhost:3000` when served from a different host or port.

## Vercel (production)

**Final deploy steps** (sync → Convex → preflight → deploy → env → tests): **[`docs/vercel-deploy.md`](docs/vercel-deploy.md)**.

Summary: [`vercel.json`](vercel.json) runs `pnpm install` and `pnpm build`. Root **`pnpm build`** compiles `@rmlis/shared` → `@rmlis/reporting` → `@rmlis/api` so workspace packages are built before the API. Use **`pnpm build:all`** for every workspace package (`pnpm -r build`). Traffic is rewritten to the serverless [`api/index.js`](api/index.js) handler. Set variables from [`.env.example`](.env.example). PDF uses `puppeteer-core` and `@sparticuz/chromium`; optional `PUPPETEER_EXECUTABLE_PATH` / `CHROME_PATH` for local Chrome when not on Vercel.