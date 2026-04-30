import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    const unitId = request.headers.get('x-user-unit');
    const prisma = getPrisma();
    
    const whereClause: any = {};
    if (role === 'MORADOR') {
      if (unitId) {
        whereClause.unitId = unitId;
      } else {
        whereClause.unitId = 'none-placeholder';
      }
    }

    const authorizations = await prisma.authorization.findMany({
      where: whereClause,
      include: {
        unit: { 
          include: { 
            residents: {
              select: { name: true, phone: true, ddd: true, email: true },
              take: 1
            }
          }
        },
        companions: true,
      },
      orderBy: { entryDate: 'asc' },
    });
    return NextResponse.json(authorizations);
  } catch (error: any) {
    console.error('API GET Autorizacoes Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    const { companions = [], ...authData } = body;

    // Validação dos campos obrigatórios
    if (!authData.unitId || !authData.name) {
      return NextResponse.json(
        { message: 'Apartamento e Nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de período: não pode haver sobreposição de datas para o mesmo apartamento
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
          unitId: authData.unitId,
          entryDate: { lte: exit },
          exitDate: { gte: entry },
        },
      });

      if (overlap) {
        return NextResponse.json(
          { message: `Já existe uma autorização para este apartamento no período informado (conflito com: ${overlap.name})` },
          { status: 409 }
        );
      }
    }

    const authorization = await prisma.authorization.create({
      data: {
        ...authData,
        entryDate: authData.entryDate ? new Date(authData.entryDate) : null,
        exitDate: authData.exitDate ? new Date(authData.exitDate) : null,
        companions: {
          create: companions.map((c: { name: string; rg?: string; cpf?: string }) => ({
            name: c.name,
            rg: c.rg || null,
            cpf: c.cpf || null,
          })),
        },
      },
      include: {
        unit: { 
          include: { 
            residents: {
              select: { name: true, phone: true, ddd: true, email: true },
              take: 1
            }
          }
        },
        companions: true,
      },
    });

    return NextResponse.json(authorization, { status: 201 });
  } catch (error: any) {
    console.error('API POST Autorizacoes Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao salvar autorização' }, { status: 500 });
  }
}
