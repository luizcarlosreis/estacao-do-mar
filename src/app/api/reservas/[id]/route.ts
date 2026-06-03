import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const prisma = getPrisma();

    const reservation = await prisma.ballroomReservation.update({
      where: { id },
      data: {
        status: body.status,
        adminNotes: body.adminNotes,
        keyPickupTime: body.keyPickupTime,
      },
    });

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error('API PUT Reserva Error:', error.message);
    return NextResponse.json({ message: 'Erro ao atualizar reserva' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    await prisma.ballroomGuest.deleteMany({
      where: { reservationId: id },
    });

    await prisma.ballroomReservation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reserva e convidados excluídos' });
  } catch (error: any) {
    console.error('API DELETE Reserva Error:', error.message);
    return NextResponse.json({ message: 'Erro ao excluir reserva' }, { status: 500 });
  }
}
