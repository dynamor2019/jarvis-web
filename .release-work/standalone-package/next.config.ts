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
    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
    ];

    return [
      {
        source: '/_next/static/:path*',
        headers: corsHeaders,
      },
      {
        source: '/:path*',
        headers: [
          ...corsHeaders,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
