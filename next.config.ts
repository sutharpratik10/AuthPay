import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      // add other domains as needed
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude Node.js built-in modules from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
