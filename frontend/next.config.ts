import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: { proxyClientMaxBodySize: "22mb" },
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/admin/:path*`,
      },
      {
        source: "/api/files/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/files/:path*`,
      },
      {
        source: "/api/learning/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/learning/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${process.env.BACKEND_URL || "http://127.0.0.1:4000"}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
