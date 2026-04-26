import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPrisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { unit: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Remover senha por segurança
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar perfil' }, { status: 500 });
  }
}
