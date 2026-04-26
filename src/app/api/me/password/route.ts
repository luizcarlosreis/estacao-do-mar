import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ message: 'A nova senha deve ter pelo menos 4 caracteres' }, { status: 400 });
    }

    const prisma = getPrisma();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ message: 'Erro ao alterar senha' }, { status: 500 });
  }
}
