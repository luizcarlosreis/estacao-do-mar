import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  // Evita rodar no cliente
  if (typeof window !== 'undefined') return {} as any;

  if (global.prisma) return global.prisma;

  const dbUrl = process.env.DATABASE_URL;

  // Diagnóstico para o desenvolvedor
  if (!dbUrl || dbUrl.trim() === "") {
    console.error("CRITICAL: DATABASE_URL is missing in environment variables.");
    
    // Fallback de MOCK para permitir que o Next.js complete o build sem travar
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        return () => {
          throw new Error("Conexão com o banco falhou: DATABASE_URL não configurada no painel da Vercel.");
        };
      }
    }) as PrismaClient;
  }

  try {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    return global.prisma;
  } catch (err) {
    console.error("Failed to initialize PrismaClient", err);
    throw err;
  }
};

const prisma = getPrisma();
export default prisma;