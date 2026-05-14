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
    
    let whereClause: any = {};
    if (role === 'MORADOR') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Moradores veem:
      // 1) Todas as suas próprias reservas
      // 2) Reservas futuras com status SOLICITADO ou EFETIVADO de todos os apartamentos
      const conditions: any[] = [
        // Reservas futuras ativas de todos os apartamentos
        {
          date: { gte: today },
          status: { in: ['SOLICITADO', 'EFETIVADO'] },
        },
      ];

      // Adiciona próprias reservas se tem unitId
      if (unitId) {
        conditions.push({ unitId });
      }

      whereClause = { OR: conditions };
    }

    const reservations = await prisma.ballroomReservation.findMany({
      where: whereClause,
      include: {
        unit: true,
        guests: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('API GET Reservas Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();

    const { ...resData } = body;

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
    if (!resData.unitId || !resData.name || !resData.date) {
      return NextResponse.json(
        { message: 'Apartamento, Nome e Data são obrigatórios' },
        { status: 400 }
      );
    }

    // Validação de data: não pode haver outra reserva para a mesma data (exceto canceladas)
    const targetDate = new Date(`${resData.date.substring(0, 10)}T12:00:00Z`);
    
    const overlap = await prisma.ballroomReservation.findFirst({
      where: {
        date: targetDate,
        status: { not: 'CANCELADO' }
      },
    });

    if (overlap) {
      return NextResponse.json(
        { message: `Esta data já possui uma reserva (${overlap.status === 'EFETIVADO' ? 'Efetivada' : 'Solicitada'})` },
        { status: 409 }
      );
    }

    const reservation = await prisma.ballroomReservation.create({
      data: {
        ...resData,
        requesterCpf,
        date: targetDate,
        status: 'SOLICITADO',
      },
      include: { 
        unit: true
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    console.error('API POST Reservas Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao salvar reserva' }, { status: 500 });
  }
}
