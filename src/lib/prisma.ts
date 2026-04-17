import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Se a variável estiver ausente (ex: no build), injeta o dummy ANTES do construtor
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;