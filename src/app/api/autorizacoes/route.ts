import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const unitId = request.headers.get('x-user-unit');
    const prisma = getPrisma();
    
    const whereClause: any = {};
    if (role === 'MORADOR' || role === 'CONSELHO') {
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
              select: { name: true, phone: true, ddd: true, email: true, cpf: true }
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

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    const { companions = [], ...authData } = body;

    // Obter CPF do solicitante do JWT
    const token = request.cookies.get('auth-token')?.value;
    let requesterCpf = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        requesterCpf = payload.cpf as string;
      } catch (e) {}
    }

    // Validação dos campos obrigatórios
    if (!authData.unitId || !authData.name || !authData.entryDate || !authData.exitDate) {
      return NextResponse.json(
        { message: 'Apartamento, Nome, Data de Entrada e Data de Saída são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de período: não pode haver sobreposição de datas para o mesmo apartamento
    if (authData.entryDate && authData.exitDate) {
      const entry = new Date(`${authData.entryDate.substring(0, 10)}T12:00:00Z`);
      const exit = new Date(`${authData.exitDate.substring(0, 10)}T12:00:00Z`);

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
        requesterCpf,
        entryDate: authData.entryDate ? new Date(`${authData.entryDate.substring(0, 10)}T12:00:00Z`) : null,
        exitDate: authData.exitDate ? new Date(`${authData.exitDate.substring(0, 10)}T12:00:00Z`) : null,
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
              select: { name: true, phone: true, ddd: true, email: true, cpf: true }
            }
          }
        }, 
        companions: true 
      },
    });

    return NextResponse.json(authorization, { status: 201 });
  } catch (error: any) {
    console.error('API POST Autorizacoes Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao salvar autorização' }, { status: 500 });
  }
}
