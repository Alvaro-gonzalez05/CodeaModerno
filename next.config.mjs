/** @type {import('next').NextConfig} */
const nextConfig = {
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
