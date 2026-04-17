import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
}

export const getPrisma = (): PrismaClient => {
  if (typeof window !== 'undefined') return {} as any;

  if (global.prisma) return global.prisma;

  const dbUrl = process.env.DATABASE_URL;

  // Se não houver URL, usamos o modo biblioteca padrão (fallback para build)
  if (!dbUrl || dbUrl.trim() === "") {
    global.prisma = new PrismaClient();
    return global.prisma;
  }

  // No runtime real, usamos o Driver Adapter (pg) que é mais estável na Vercel
  try {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
    return global.prisma;
  } catch (err) {
    console.error("Erro ao inicializar Driver Adapter:", err);
    global.prisma = new PrismaClient(); // Fallback
    return global.prisma;
  }
};