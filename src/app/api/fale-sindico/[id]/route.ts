import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

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

    // Segurança JWT
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (!['SUPER_ADMIN', 'SINDICO'].includes(role)) {
      return NextResponse.json({ message: 'Acesso negado para exclusão' }, { status: 403 });
    }

    await prisma.syndicMessage.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
