import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Retorna apenas as datas de reservas ativas (não canceladas).
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
    return NextResponse.json(reservations);
  } catch (error: any) {
    console.error('API GET Datas Bloqueadas Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}
