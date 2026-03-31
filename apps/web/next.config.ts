import path from "path";

import type { NextConfig } from "next";

/**
 * When the marketing/dashboard domain points at this Next app but the Express API
 * lives on another Vercel deployment, set BACKEND_API_ORIGIN to that deployment
 * origin (no trailing slash). Browser calls to https://your-domain/api/* are then
 * rewritten server-side to the API. Omit to disable rewrites (direct fetch to
 * NEXT_PUBLIC_API_BASE_URL, often with CORS on the API).
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
        source: "/api/:path*",
        destination: `${backendApiOrigin}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
