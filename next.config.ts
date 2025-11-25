import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
