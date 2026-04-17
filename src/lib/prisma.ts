import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// A função getPrisma é a ÚNICA que deve ser usada.
// Ela garante que o PrismaClient só seja instanciado quando chamado.
export const getPrisma = (): PrismaClient => {
  if (globalThis.prisma) return globalThis.prisma;

  // Se não houver URL, usamos o dummy apenas para não explodir o construtor durante o build
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
  }

  const client = new PrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client;
  }
  
  return client;
};

// REMOVEMOS qualquer inicialização no topo do arquivo.
// O export default agora é uma função, não uma instância.
export default getPrisma;