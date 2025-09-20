import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      // add other domains as needed
    ],
  },
};

export default nextConfig;
