import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    const guests = await prisma.ballroomGuest.findMany({
      where: { reservationId: id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(guests);
  } catch (error: any) {
    console.error('API GET Convidados Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const prisma = getPrisma();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ message: 'Nome é obrigatório' }, { status: 400 });
    }

    const guest = await prisma.ballroomGuest.create({
      data: {
        reservationId: id,
        name: body.name.trim().toUpperCase(),
        cpf: body.cpf?.trim() || null,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error: any) {
    console.error('API POST Convidado Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao salvar convidado' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json({ message: 'guestId é obrigatório' }, { status: 400 });
    }

    const prisma = getPrisma();

    await prisma.ballroomGuest.delete({
      where: { id: guestId, reservationId },
    });

    return NextResponse.json({ message: 'Convidado removido' });
  } catch (error: any) {
    console.error('API DELETE Convidado Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao remover convidado' }, { status: 500 });
  }
}
