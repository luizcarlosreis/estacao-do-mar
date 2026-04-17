import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  // Se já existir no global (desenvolvimento), retorna
  if (globalThis.prisma) return globalThis.prisma;

  const url = process.env.DATABASE_URL;

  // Se não houver URL (fase de build ou erro de config)
  if (!url || url.trim() === "") {
    console.warn("⚠️ DATABASE_URL não encontrada. Usando Proxy para evitar quebra no build.");
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === 'then') return undefined;
        return () => {
          throw new Error(`Prisma falhou: DATABASE_URL não configurada ou vazia. Verifique as variáveis de ambiente na Vercel.`);
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

// Removemos a inicialização imediata do singleton no topo do arquivo
// Para manter compatibilidade, o default export agora é uma função getter disfarçada? 
// Não, melhor mudar os imports para usar getPrisma() explicitamente.
