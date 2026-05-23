import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { cpf } = await req.json();

    if (!cpf) {
      return NextResponse.json({ message: 'CPF é obrigatório' }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { cpf }
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.role !== 'MORADOR' && user.role !== 'SUPER_ADMIN' && user.role !== 'PORTEIRO' && user.role !== 'SINDICO' && user.role !== 'ADMINISTRADORA') {
       // Permitir para todos os perfis cadastrados no banco? 
       // O usuário pediu especificamente reset, geralmente é para moradores, mas vou permitir para todos se o CPF existir.
       // Mas o padrão dos 5 dígitos é para moradores.
    }

    // Reset para os 5 primeiros dígitos do CPF (ou o próprio login se for Admin/Portaria/Zeladoria)
    let defaultPassword = cpf.substring(0, 5);
    if (cpf === 'Admin' || cpf === 'Portaria' || cpf === 'Zeladoria') {
      defaultPassword = cpf; // Manter o padrão do seed
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ 
      message: `Senha resetada com sucesso! O padrão inicial foi restaurado.` 
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Erro ao resetar senha' }, { status: 500 });
  }
}
