# MVP audit — feature checklist

Grouped by module. Items are covered by Playwright specs in this folder unless noted as manual/optional.

## Public / marketing

- [ ] `/` landing: hero, nav, footer, sign-in entry
- [ ] `/data-policy` static page

## Auth (Clerk)

- [ ] `/sign-in` renders Clerk embedded flow
- [ ] Authenticated session reaches `/dashboard`
- [ ] Sign out via UserButton (or session cleared)
- [ ] Session persists across reload on `/dashboard`
- [ ] Password reset / sign-up: Clerk-hosted (manual or optional; not custom DB)

## Dashboard (single route `/dashboard`, hash sections)

- [ ] `#section-overview` — risk overview, KPIs (role-dependent)
- [ ] `#section-expiry-radar` — expiry chart/table
- [ ] `#section-risk-ranking` — risk table
- [ ] `#section-reports` — MVP report actions (JSON / PDF / email UI)
- [ ] `#section-data-upload` — Excel upload (admin/owner only)
- [ ] `#section-weekly-insight` — weekly block
- [ ] Command palette (⌘K) navigates to sections
- [ ] Sidebar collapse / mobile menu (smoke)
- [ ] Notifications bell opens popover
- [ ] **Client** role: simplified dashboard (`#section-client`) when `publicMetadata.role` is `client`
- [ ] **Owner** role: owner panel, user roles, metrics, audit (`owner`/`admin` sections)

## Settings

- [ ] `/settings` — theme controls
- [ ] `/settings` — danger zone (non-destructive smoke only)

## API — Next.js App Router

- [ ] `GET /api/health`
- [ ] `GET /api/licenses/risk-ranking` (auth)
- [ ] `GET /api/audit-logs` (auth)
- [ ] `GET/POST /api/users`, `POST /api/users/set-role` (auth)
- [ ] `GET/PATCH /api/user/preferences`
- [ ] `POST /api/user/consent`
- [ ] `GET /api/user/export`
- [ ] `POST /api/user/delete-request`
- [ ] `GET/PATCH /api/user/notifications`
- [ ] `POST /api/org/delete` (guarded)
- [ ] `GET /api/owner/metrics` (owner)
- [ ] `GET/POST /api/report-subscriptions`
- [ ] `POST /api/upload` (with fixture xlsx when org configured)
- [ ] `GET /api/cron/send-reports` — cron auth (`CRON_SECRET` / `verifyCronRequest`)
- [ ] `GET /api/cron/weekly-summary` — cron auth
- [ ] `GET /api/cron/reingest` — cron auth
- [ ] `POST /api/reports/mvp/email` — PDF email (mock Resend in E2E)
- [ ] `GET /api/__e2e__/last-resend` — mock payload (only when `MOCK_RESEND=1`)

## API — Pages Router

- [ ] `GET /api/reports/mvp` — JSON MVP report (Clerk + Convex)
- [ ] `GET /api/reports/mvp.pdf` — PDF download

## Express API (`apps/api`, when used for rewrites or standalone)

- [ ] `GET /api/health`
- [ ] `GET /api/licenses/overview`
- [ ] `GET /api/licenses/expiring`
- [ ] `GET /api/licenses/risk-ranking`
- [ ] `GET /api/licenses/mvp-report`
- [ ] `GET /api/licenses/export.csv`
- [ ] `GET /api/reports/mvp.pdf`
- [ ] `POST /api/reports/mvp/email`

## Background / ops

- [ ] `services/worker` — daily cron `dailyLicenseMonitor` (smoke: process exists; full E2E optional)
- [ ] Convex functions — exercised via dashboard/API (not isolated in E2E)

## Error & edge

- [ ] Unknown route → not-found UI (`/_not-found` / 404)
- [ ] Upload / form validation errors (empty or invalid submit)
- [ ] Unauthenticated access to `/dashboard` redirects to sign-in

## Email (E2E)

- [ ] Mock Resend: `MOCK_RESEND=1` — no outbound HTTP; payload via `/api/__e2e__/last-resend`
- [ ] Report email POST returns 200 and payload contains expected subject/recipient

## PDF

- [ ] `GET /api/reports/mvp.pdf` returns non-empty `application/pdf` (`%PDF` magic)
