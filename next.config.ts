import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress workspace root warning by setting explicit root
  // This warning occurs when multiple lockfiles are detected
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    // Remove /api/v1 suffix if it exists in the env var for the rewrite
    const baseUrl = backendUrl.replace(/\/api\/v1$/, '');
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  },
  // Suppress font loading warnings (these are network-related and non-critical)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
