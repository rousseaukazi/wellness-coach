import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/wellness-coach',
  assetPrefix: '/wellness-coach/',
  images: { unoptimized: true },
};

export default nextConfig;
