import type { NextConfig } from "next";

const backendDestination =
  process.env.BACKEND_INTERNAL_URL || "http://todolistapp-backend-router.mtdrworkshop.svc.cluster.local";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${backendDestination}/auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendDestination}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
