import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') {
    return {} as PrismaClient;
  }

  if (!global.prisma) {
    // Padrão mais compatível para injetar a URL diretamente no construtor
    // Isso evita que o Prisma reclame da variável de ambiente ausente
    const url = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
    
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });
  }
  
  return global.prisma;
};

const prismaProxy = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const instance = getPrisma();
    return (instance as any)[prop];
  }
});

export default prismaProxy;