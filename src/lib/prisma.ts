import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Esta função garante que o PrismaClient NUNCA seja instanciado sem uma URL.
// Se a URL faltar (como no build), ele retorna null ou lança erro apenas quando usado.
export const getPrisma = (): PrismaClient => {
  if (global.prisma) return global.prisma;

  const url = process.env.DATABASE_URL;
  
  if (!url || url.trim() === "") {
    // No build da Vercel, retornamos um Proxy "burro" que não faz nada,
    // mas que permite que o arquivo seja importado sem quebrar.
    return new Proxy({} as any, {
      get: () => {
        throw new Error("DATABASE_URL não configurada no ambiente da Vercel.");
      }
    }) as PrismaClient;
  }

  global.prisma = new PrismaClient();
  return global.prisma;
};

// Export padrão para quem preferir
const prisma = getPrisma();
export default prisma;