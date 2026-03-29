import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://eam.techivano.com/api"
  },
  turbopack: {
    root: path.resolve(process.cwd(), "../..")
  }
};

export default nextConfig;
