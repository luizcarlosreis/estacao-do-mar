import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const prisma = getPrisma();

    console.log("Running DDL query to create CreditCardPurchase and CreditCardInstallment tables...");

    // Create CreditCardPurchase table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditCardPurchase" (
          "id" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL,
          "provider" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "totalValue" DOUBLE PRECISION NOT NULL,
          "isFinanced" BOOLEAN NOT NULL DEFAULT false,
          "installmentsCount" INTEGER NOT NULL DEFAULT 1,
          "startMonth" INTEGER NOT NULL,
          "startYear" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "CreditCardPurchase_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create CreditCardInstallment table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditCardInstallment" (
          "id" TEXT NOT NULL,
          "purchaseId" TEXT NOT NULL,
          "month" INTEGER NOT NULL,
          "year" INTEGER NOT NULL,
          "installmentNumber" INTEGER NOT NULL,
          "value" DOUBLE PRECISION NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "CreditCardInstallment_pkey" PRIMARY KEY ("id")
      );
    `);

    // Safe foreign key setup
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CreditCardInstallment" 
        DROP CONSTRAINT IF EXISTS "CreditCardInstallment_purchaseId_fkey";
      `);
    } catch (e) {
      // Ignore if constraint does not exist
    }

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CreditCardInstallment" 
      ADD CONSTRAINT "CreditCardInstallment_purchaseId_fkey" 
      FOREIGN KEY ("purchaseId") REFERENCES "CreditCardPurchase"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    console.log("DDL queries completed successfully!");

    return NextResponse.json({ 
      success: true,
      message: 'Estrutura do banco de dados de produção sincronizada com sucesso!' 
    });
  } catch (error: any) {
    console.error('Error syncing database schema:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
