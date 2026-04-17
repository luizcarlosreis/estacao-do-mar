import { PrismaClient } from '@prisma/client';

const getPrismaInstance = () => {
  // Injeta uma URL dummy se a variável estiver ausente durante o build
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof getPrismaInstance>;
}

const prisma = globalThis.prisma ?? getPrismaInstance();

export default prisma;
export const getPrisma = () => prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
