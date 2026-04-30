import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const message = await prisma.syndicMessage.findUnique({
      where: { id: params.id },
      include: {
        unit: true,
        user: { select: { name: true, email: true } }
      }
    });
    if (!message) return NextResponse.json({ message: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { status } = body;

    const message = await prisma.syndicMessage.update({
      where: { id: params.id },
      data: { status },
      include: {
        unit: true,
        user: { select: { name: true, email: true } }
      }
    });
    return NextResponse.json(message);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    await prisma.syndicMessage.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
