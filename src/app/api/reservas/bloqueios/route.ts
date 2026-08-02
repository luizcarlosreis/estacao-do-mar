import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const prisma = getPrisma();
    const blocks = await prisma.ballroomBlock.findMany({
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(blocks);
  } catch (error: any) {
    console.error('API GET Bloqueios Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json({ message: 'Data é obrigatória' }, { status: 400 });
    }

    const prisma = getPrisma();
    const targetDate = new Date(date.split('T')[0] + 'T00:00:00.000Z');

    // Verifica se já existe uma reserva ativa nessa data
    const existingReservation = await prisma.ballroomReservation.findFirst({
      where: {
        date: targetDate,
        status: { not: 'CANCELADO' }
      }
    });

    if (existingReservation) {
      return NextResponse.json({ message: 'Esta data já possui uma reserva ativa ou solicitada' }, { status: 400 });
    }

    const block = await prisma.ballroomBlock.upsert({
      where: { date: targetDate },
      create: {
        date: targetDate,
        reason: reason?.trim() || 'Bloqueio Administrativo',
      },
      update: {
        reason: reason?.trim() || 'Bloqueio Administrativo',
      }
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error: any) {
    console.error('API POST Bloqueio Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao criar bloqueio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID é obrigatório' }, { status: 400 });
    }

    const prisma = getPrisma();
    await prisma.ballroomBlock.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Bloqueio removido com sucesso' });
  } catch (error: any) {
    console.error('API DELETE Bloqueio Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao remover bloqueio' }, { status: 500 });
  }
}
