import path from "node:path";
import type { NextConfig } from "next";

/** Monorepo root (…/nmdpra-eam). Prevents Turbopack from picking a parent folder with another lockfile. */
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot
  },
  transpilePackages: [
    "@rmlis/shared",
    "@rmlis/resend-client",
    "@rmlis/report-core",
    "@rmlis/reporting"
  ],
  // Do not set `turbopack.root` to the monorepo root: resolution looks for
  // `node_modules/@rmlis/shared` from that root, but pnpm links the workspace
  // package under `apps/web/node_modules`, which breaks Vercel builds.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  },
  async rewrites() {
    return [
      {
        source: "/api/consent",
        destination: "/api/user/consent"
      }
    ];
  }
};

export default nextConfig;
