import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const { id } = params;
    
    const message = await prisma.syndicMessage.findUnique({
      where: { id },
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
  context: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const { id } = params;
    
    const body = await request.json();
    const { status } = body;

    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role === 'MORADOR') {
      return NextResponse.json({ message: 'Acesso negado para edição de status' }, { status: 403 });
    }

    const message = await prisma.syndicMessage.update({
      where: { id },
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
  context: { params: { id: string } }
) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const { id } = params;

    // Segurança JWT
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    if (!['SUPER_ADMIN', 'SINDICO', 'MORADOR'].includes(role)) {
      return NextResponse.json({ message: 'Acesso negado para exclusão' }, { status: 403 });
    }

    if (role === 'MORADOR') {
      const msg = await prisma.syndicMessage.findUnique({ where: { id } });
      if (!msg || msg.userId !== payload.id) {
        return NextResponse.json({ message: 'Você só pode excluir suas próprias mensagens' }, { status: 403 });
      }
    }

    await prisma.syndicMessage.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro na API DELETE:', error);
    return NextResponse.json({ message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
