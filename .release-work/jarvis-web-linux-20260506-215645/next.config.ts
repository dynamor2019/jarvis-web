import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      ],
    },
    // Reduce process spawning pressure on Windows build environments.
    cpus: 1,
    // Disable optional MCP server and startup preloading on low-resource Linux hosts.
    mcpServer: false,
    preloadEntriesOnStart: false,
  },
  output: 'standalone',
  distDir: '.next_build',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
