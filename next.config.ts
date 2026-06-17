import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  }
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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

