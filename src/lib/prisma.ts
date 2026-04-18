import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') return {} as any;

  if (global.prisma) return global.prisma;

  const dbUrl = process.env.DATABASE_URL;

  // Se não houver URL (fase de BUILD na Vercel), retornamos um Proxy inofensivo
  if (!dbUrl || dbUrl.trim() === "") {
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        // Retornamos uma função que não faz nada ou lança erro apenas se for chamada
        return () => {
          console.warn("Prisma chamado durante o build ou sem DATABASE_URL.");
          return Promise.resolve(null);
        };
      }
    }) as any;
  }

  try {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
    return global.prisma;
  } catch (err) {
    console.error("Erro ao inicializar Driver Adapter:", err);
    // Fallback mínimo
    return new PrismaClient() as any;
  }
};