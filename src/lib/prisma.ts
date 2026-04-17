import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const getPrisma = (): PrismaClient => {
  if (globalThis.prisma) return globalThis.prisma;

  // Só cria o cliente se a DATABASE_URL existir.
  // Se não existir (ex: durante o build do Next.js), retornamos uma instância "dummy" 
  // ou lidamos com o erro de forma que não quebre o build.
  if (!process.env.DATABASE_URL) {
    // Durante o build, o Next.js às vezes avalia os módulos. 
    // Se não houver URL, retornamos um objeto que satisfaça o tipo mas não inicialize o binário do Prisma.
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

// Exportamos o resultado da função como default para manter compatibilidade com os imports atuais
const prisma = getPrisma();
export default prisma;
