import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMINISTRADORA') {
      return NextResponse.json({ message: 'Acesso restrito' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year');

    if (!yearStr) {
      return NextResponse.json({ message: 'Ano é obrigatório' }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 2000) {
      return NextResponse.json({ message: 'Ano inválido' }, { status: 400 });
    }

    // Find all installments in the target year
    const installments = await prisma.creditCardInstallment.findMany({
      where: { year },
      select: {
        month: true,
        value: true
      }
    });

    // Initialize months 1 to 12
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0
    }));

    // Sum values
    for (const inst of installments) {
      if (inst.month >= 1 && inst.month <= 12) {
        monthlyData[inst.month - 1].total += inst.value;
      }
    }

    // Round values to 2 decimal places
    monthlyData.forEach(item => {
      item.total = parseFloat(item.total.toFixed(2));
    });

    return NextResponse.json(monthlyData);
  } catch (error: any) {
    console.error('Error generating credit card dashboard stats:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
