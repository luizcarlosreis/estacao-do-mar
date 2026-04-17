import { PrismaClient } from '@prisma/client';

// @ts-ignore
const prisma = global.prisma || new PrismaClient({
  // Fallback para evitar erro durante o build estático
  datasourceUrl: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"
});

if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  global.prisma = prisma;
}

export default prisma;
export const getPrisma = () => prisma;

declare global {
  var prisma: PrismaClient | undefined;
}
