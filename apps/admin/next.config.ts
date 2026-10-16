import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Only the container image (apps/admin/Dockerfile) builds the standalone server.
  // CI and local development keep `next start`, which does not support standalone output.
  ...(process.env.ADMIN_NEXT_OUTPUT === 'standalone' ? { output: 'standalone' as const } : {}),
};

export default nextConfig;
