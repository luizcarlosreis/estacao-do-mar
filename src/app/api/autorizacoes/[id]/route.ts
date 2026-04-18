import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    const authorization = await prisma.authorization.findUnique({
      where: { id },
      include: { unit: true, companions: true },
    });
    if (!authorization) {
      return NextResponse.json({ message: 'Autorização não encontrada' }, { status: 404 });
    }
    return NextResponse.json(authorization);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    const body = await request.json();
    const { companions = [], ...authData } = body;

    // Validação de período — excluindo o próprio registro do conflito
    if (authData.entryDate && authData.exitDate) {
      const entry = new Date(authData.entryDate);
      const exit = new Date(authData.exitDate);

      if (exit <= entry) {
        return NextResponse.json(
          { message: 'A data de saída deve ser posterior à data de entrada' },
          { status: 400 }
        );
      }

      const overlap = await prisma.authorization.findFirst({
        where: {
          id: { not: id },
          unitId: authData.unitId,
          entryDate: { lte: exit },
          exitDate: { gte: entry },
        },
      });

      if (overlap) {
        return NextResponse.json(
          { message: `Conflito de período com a autorização de: ${overlap.name}` },
          { status: 409 }
        );
      }
    }

    // Atualiza autorização e recria os acompanhantes
    const updated = await prisma.authorization.update({
      where: { id },
      data: {
        ...authData,
        entryDate: authData.entryDate ? new Date(authData.entryDate) : null,
        exitDate: authData.exitDate ? new Date(authData.exitDate) : null,
        companions: {
          deleteMany: {},
          create: companions.map((c: { name: string; rg?: string; cpf?: string }) => ({
            name: c.name,
            rg: c.rg || null,
            cpf: c.cpf || null,
          })),
        },
      },
      include: { unit: true, companions: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API PATCH Autorizacoes Error:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    await prisma.authorization.delete({ where: { id } });
    return NextResponse.json({ message: 'Autorização excluída com sucesso' });
  } catch (error: any) {
    console.error('API DELETE Autorizacoes Error:', error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
