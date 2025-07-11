import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ disable ESLint errors during Vercel build
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // prevent bundling fs module on client
    };
    return config;
  },
};

export default nextConfig;
