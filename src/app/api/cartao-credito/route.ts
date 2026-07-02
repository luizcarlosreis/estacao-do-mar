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
    if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMINISTRADORA' && payload.role !== 'CONSELHO') {
      return NextResponse.json({ message: 'Acesso restrito' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    if (!monthStr || !yearStr) {
      return NextResponse.json({ message: 'Mês e Ano são obrigatórios' }, { status: 400 });
    }

    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ message: 'Mês e Ano inválidos' }, { status: 400 });
    }

    const installments = await prisma.creditCardInstallment.findMany({
      where: { month, year },
      include: {
        purchase: true
      },
      orderBy: {
        purchase: {
          date: 'asc'
        }
      }
    });

    return NextResponse.json(installments);
  } catch (error: any) {
    console.error('Error fetching credit card installments:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { date, provider, description, totalValue, isFinanced, installmentsCount, startMonth, startYear } = body;

    if (!date || !provider || !description || totalValue === undefined || startMonth === undefined || startYear === undefined) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const parsedTotalValue = parseFloat(totalValue);
    const parsedStartMonth = parseInt(startMonth, 10);
    const parsedStartYear = parseInt(startYear, 10);
    const parsedInstallmentsCount = isFinanced ? parseInt(installmentsCount, 10) : 1;

    if (isNaN(parsedTotalValue) || parsedTotalValue <= 0) {
      return NextResponse.json({ message: 'Valor total inválido' }, { status: 400 });
    }
    if (isNaN(parsedStartMonth) || parsedStartMonth < 1 || parsedStartMonth > 12) {
      return NextResponse.json({ message: 'Mês de início inválido' }, { status: 400 });
    }
    if (isNaN(parsedStartYear) || parsedStartYear < 2000) {
      return NextResponse.json({ message: 'Ano de início inválido' }, { status: 400 });
    }
    if (isFinanced && (isNaN(parsedInstallmentsCount) || parsedInstallmentsCount < 1)) {
      return NextResponse.json({ message: 'Quantidade de prestações inválida' }, { status: 400 });
    }

    // Generate installments
    const baseValue = parseFloat((parsedTotalValue / parsedInstallmentsCount).toFixed(2));
    const installments = [];
    let accumulated = 0;

    for (let i = 1; i <= parsedInstallmentsCount; i++) {
      let val = baseValue;
      if (i === parsedInstallmentsCount) {
        val = parseFloat((parsedTotalValue - accumulated).toFixed(2));
      } else {
        accumulated += val;
      }

      let m = parsedStartMonth + (i - 1);
      let y = parsedStartYear;
      while (m > 12) {
        m -= 12;
        y += 1;
      }

      installments.push({
        month: m,
        year: y,
        installmentNumber: i,
        value: val
      });
    }

    const purchase = await prisma.creditCardPurchase.create({
      data: {
        date: new Date(date),
        provider: provider.toUpperCase(),
        description: description.toUpperCase(),
        totalValue: parsedTotalValue,
        isFinanced: !!isFinanced,
        installmentsCount: parsedInstallmentsCount,
        startMonth: parsedStartMonth,
        startYear: parsedStartYear,
        installments: {
          create: installments
        }
      },
      include: {
        installments: true
      }
    });

    return NextResponse.json(purchase);
  } catch (error: any) {
    console.error('Error creating credit card purchase:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
