import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  if (globalThis.prisma) return globalThis.prisma;

  const url = process.env.DATABASE_URL;

  if (!url || url.trim() === "") {
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        return () => {
          throw new Error(`Prisma falhou: DATABASE_URL não configurada. Verifique as variáveis de ambiente na Vercel.`);
        };
      },
    });
  }

  const client = new PrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client;
  }
  
  return client;
};

// Mantemos o export default para evitar erros de importação, 
// mas agora ele aponta para a função getPrisma.
export default getPrisma;
