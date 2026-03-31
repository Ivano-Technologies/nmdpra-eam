import path from "path";

import type { NextConfig } from "next";

/**
 * When the marketing/dashboard domain points at this Next app but the Express API
 * lives on another Vercel deployment, set BACKEND_API_ORIGIN to that deployment
 * origin (no trailing slash). Only `/api/licenses/*` and `/api/reports/*` are
 * proxied. `/api/reports/mvp` is served by Next (Pages API → Convex); only
 * `mvp.pdf` and `mvp/email` go to the Express deployment.
 */
const backendApiOrigin =
  process.env.BACKEND_API_ORIGIN?.trim().replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://eam.techivano.com/api"
  },
  turbopack: {
    root: path.resolve(process.cwd(), "../..")
  },
  async rewrites() {
    if (!backendApiOrigin) {
      return [];
    }
    return [
      {
        source: "/api/licenses/:path*",
        destination: `${backendApiOrigin}/api/licenses/:path*`
      },
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
