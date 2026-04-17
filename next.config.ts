import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Removido o bloco eslint que causou erro no Next.js 16
};

export default nextConfig;
