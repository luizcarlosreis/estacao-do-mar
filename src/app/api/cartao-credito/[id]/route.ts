import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'ID é obrigatório' }, { status: 400 });
    }

    // Delete the purchase (cascade deletes installments)
    await prisma.creditCardPurchase.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Compra excluída com sucesso' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error deleting credit card purchase:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'ID é obrigatório' }, { status: 400 });
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

    // Generate new installments
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
        purchaseId: id,
        month: m,
        year: y,
        installmentNumber: i,
        value: val
      });
    }

    // Run transaction
    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // 1. Delete old installments
      await tx.creditCardInstallment.deleteMany({
        where: { purchaseId: id }
      });

      // 2. Update the purchase
      const purchase = await tx.creditCardPurchase.update({
        where: { id },
        data: {
          date: new Date(date),
          provider: provider.toUpperCase(),
          description: description.toUpperCase(),
          totalValue: parsedTotalValue,
          isFinanced: !!isFinanced,
          installmentsCount: parsedInstallmentsCount,
          startMonth: parsedStartMonth,
          startYear: parsedStartYear
        }
      });

      // 3. Create new installments
      await tx.creditCardInstallment.createMany({
        data: installments
      });

      return purchase;
    });

    return NextResponse.json(updatedPurchase);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating credit card purchase:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
