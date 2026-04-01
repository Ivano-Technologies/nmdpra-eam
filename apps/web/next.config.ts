import type { NextConfig } from "next";

/**
 * Optional: Express deployment for PDF generation and legacy email send only.
 * Set BACKEND_API_ORIGIN (no trailing slash) to proxy:
 *   `/api/reports/mvp.pdf` and `/api/reports/mvp/email`
 * Do not proxy `/api/licenses/*` here — those routes are implemented in this
 * app (App Router + Convex). A blanket license rewrite would shadow them and
 * cause 404s if the Express project is missing or misconfigured.
 * `/api/reports/mvp` (JSON) stays on Next (Pages API → Convex).
 */
const backendApiOrigin =
  process.env.BACKEND_API_ORIGIN?.trim().replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  transpilePackages: ["@rmlis/shared"],
  // Do not set `turbopack.root` to the monorepo root: resolution looks for
  // `node_modules/@rmlis/shared` from that root, but pnpm links the workspace
  // package under `apps/web/node_modules`, which breaks Vercel builds.
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://eam.techivano.com/api"
  },
  async rewrites() {
    const consentLegacy = {
      source: "/api/consent",
      destination: "/api/user/consent"
    };
    if (!backendApiOrigin) {
      return [consentLegacy];
    }
    return [
      consentLegacy,
      {
        source: "/api/reports/mvp.pdf",
        destination: `${backendApiOrigin}/api/reports/mvp.pdf`
      },
      {
        source: "/api/reports/mvp/email",
        destination: `${backendApiOrigin}/api/reports/mvp/email`
      }
    ];
  }
};

export default nextConfig;
