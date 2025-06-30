import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,  // prevent bundling fs module on client
    }
    return config
  }
}

export default nextConfig;
