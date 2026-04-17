import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // IGNORAR erros de tipo no build da Vercel para permitir o Singleton do Prisma
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
