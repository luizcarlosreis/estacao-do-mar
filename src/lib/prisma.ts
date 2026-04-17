import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// EXPORTAMOS APENAS A FUNÇÃO. 
// Isso garante que NENHUM código de conexão rode no momento do 'import'.
export const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') return {} as any;

  if (!global.prisma) {
    // Se estivermos no build, injetamos a URL dummy
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
      process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
    }
    global.prisma = new PrismaClient();
  }
  return global.prisma;
};

// NÃO exportamos uma instância padrão (prisma) para evitar avaliação de módulo prematura.