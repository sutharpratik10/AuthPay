import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // add other remote patterns as needed
    ],
  },
  turbopack: {
    resolveAlias: {
      // Resolve alias fallback for Node.js built-in modules in client bundles
      fs: { browser: './empty.js' },
      net: { browser: './empty.js' },
      tls: { browser: './empty.js' },
      crypto: { browser: './empty.js' },
      stream: { browser: './empty.js' },
      path: { browser: './empty.js' },
      os: { browser: './empty.js' },
      http: { browser: './empty.js' },
      https: { browser: './empty.js' },
      zlib: { browser: './empty.js' },
      dns: { browser: './empty.js' },
      child_process: { browser: './empty.js' },
    },
  },
};

export default nextConfig;

