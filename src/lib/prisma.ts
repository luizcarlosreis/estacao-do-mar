import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Função Senior para acesso ao banco.
 * Garante que o Prisma NUNCA inicialize sem DATABASE_URL.
 */
export const getPrisma = (): PrismaClient => {
  // 1. Bloqueio para lado do cliente
  if (typeof window !== 'undefined') return {} as any;

  // 2. Singleton
  if (global.prisma) return global.prisma;

  const dbUrl = process.env.DATABASE_URL;

  // 3. Fallback de Build (Prevenção de Erro de Constructor)
  if (!dbUrl || dbUrl.trim() === "") {
    // Retornamos um objeto mockado que não dispara o construtor real do Prisma
    // Isso "engana" o build da Vercel sem disparar a validação do motor.
    return new Proxy({} as any, {
      get: (target, prop) => {
        // Se alguém tentar usar qualquer propriedade (ex: prisma.unit), lançamos o erro
        return () => {
          throw new Error("ERRO CRÍTICO: DATABASE_URL não encontrada no ambiente Vercel.");
        };
      }
    }) as PrismaClient;
  }

  // 4. Instanciação Real (Apenas se houver URL)
  global.prisma = new PrismaClient();
  return global.prisma;
};

// Removemos a exportação de instância pré-carregada para evitar importações acidentais no topo.