import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// A função getPrisma é a única forma de acessar o banco.
// Ela garante que o construtor NUNCA rode no carregamento do módulo.
export const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') {
    return {} as PrismaClient; // Evita Prisma no lado do cliente
  }

  if (!global.prisma) {
    // Injeta URL dummy se necessário (apenas para o build)
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
      process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
    }
    
    global.prisma = new PrismaClient();
  }
  
  return global.prisma;
};

// Exportamos um objeto que funciona como a instância, mas é um Proxy.
// Isso permite usar 'import prisma from ...' e 'prisma.user.findMany()' sem quebrar o build.
const prismaProxy = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Resolve para a instância real apenas no momento do acesso à propriedade
    const instance = getPrisma();
    return (instance as any)[prop];
  }
});

export default prismaProxy;