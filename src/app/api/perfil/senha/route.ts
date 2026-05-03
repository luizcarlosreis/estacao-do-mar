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
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Senha atual incorreta' }, { status: 401 });
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar no banco
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ message: 'Erro ao alterar senha' }, { status: 500 });
  }
}
