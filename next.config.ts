import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // optimizePackageImports: ['package-name'], // Add heavy packages here if needed
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
