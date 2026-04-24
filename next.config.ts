import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Suppress workspace root warning by setting explicit root
  // This warning occurs when multiple lockfiles are detected
  async rewrites() {
    // ============================================================================
    // STEP 3: SINGLE SOURCE OF TRUTH FOR API URL (FIX)
    // Enforce NEXT_PUBLIC_API_URL - no fallback
    // ============================================================================
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!backendUrl) {
      throw new Error(
        '❌ [FATAL] NEXT_PUBLIC_API_URL environment variable is REQUIRED\n' +
        'Set NEXT_PUBLIC_API_URL in .env.local or environment\n' +
        'Example: NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1'
      );
    }
    
    // Remove /api/v1 suffix if it exists in the env var for the rewrite
    const baseUrl = backendUrl.replace(/\/api\/v1$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    // Must be absolute and match outputFileTracingRoot in build environments.
    root: projectRoot,
  },
  // Suppress font loading warnings (these are network-related and non-critical)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
