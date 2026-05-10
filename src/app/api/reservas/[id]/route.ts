import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const prisma = getPrisma();

    const reservation = await prisma.ballroomReservation.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes,
      },
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error('API PUT Reserva Error:', error.message);
    return NextResponse.json({ message: 'Erro ao atualizar reserva' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const prisma = getPrisma();

    await prisma.ballroomReservation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reserva excluída' });
  } catch (error: any) {
    console.error('API DELETE Reserva Error:', error.message);
    return NextResponse.json({ message: 'Erro ao excluir reserva' }, { status: 500 });
  }
}
