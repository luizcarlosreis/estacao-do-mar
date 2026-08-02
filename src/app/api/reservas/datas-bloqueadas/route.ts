import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Retorna datas de reservas ativas (não canceladas) e bloqueios administrativos.
 * Acessível a todos os perfis para exibir o calendário de disponibilidade.
 */
export async function GET(_request: NextRequest) {
  try {
    const prisma = getPrisma();
    const reservations = await prisma.ballroomReservation.findMany({
      where: { status: { not: 'CANCELADO' } },
      select: { id: true, date: true, status: true },
      orderBy: { date: 'asc' },
    });

    let blocks: any[] = [];
    try {
      blocks = await prisma.ballroomBlock.findMany({
        select: { id: true, date: true, reason: true },
        orderBy: { date: 'asc' },
      });
    } catch (e: any) {
      console.warn('BallroomBlock table query notice:', e?.message);
    }

    const blockedDates = [
      ...reservations.map(r => ({ id: r.id, date: r.date, status: r.status, type: 'RESERVA' })),
      ...blocks.map(b => ({ id: b.id, date: b.date, status: 'BLOQUEADO', reason: b.reason, type: 'BLOQUEIO_ADMIN' }))
    ];

    return NextResponse.json(blockedDates);
  } catch (error: any) {
    console.error('API GET Datas Bloqueadas Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}
