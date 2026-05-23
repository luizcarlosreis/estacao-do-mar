import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const callerRole = request.headers.get('x-user-role');
  if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'SINDICO' && callerRole !== 'PORTEIRO') {
    return NextResponse.json({ message: 'Acesso restrito a funcionários autorizados' }, { status: 403 });
  }

  const prisma = getPrisma();
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMINISTRADORA', 'SINDICO', 'PORTEIRO']
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Remover senhas do retorno
    const safeUsers = users.map(({ password, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ message: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const callerRole = request.headers.get('x-user-role');
  if (callerRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Acesso restrito a administradores' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { cpf, name, email, password, role, residentType, ddd, phone, isActive } = body;

    if (!cpf || cpf.trim() === '') {
      return NextResponse.json({ message: 'O CPF é obrigatório' }, { status: 400 });
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'O nome é obrigatório' }, { status: 400 });
    }

    if (!role || !['ADMINISTRADORA', 'SINDICO', 'PORTEIRO'].includes(role)) {
      return NextResponse.json({ message: 'Perfil (Role) inválido' }, { status: 400 });
    }

    const prisma = getPrisma();

    // Verificar se o CPF já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { cpf }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Este CPF já está cadastrado no sistema' }, { status: 400 });
    }

    const defaultPassword = cpf.substring(0, 5);
    const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        cpf,
        name: name.toUpperCase(),
        email: email || null,
        password: hashedPassword,
        role,
        residentType: residentType || role, // Mapeia residentType para o tipo do perfil
        isActive: isActive !== undefined ? isActive : true,
        ddd: ddd || null,
        phone: phone || null,
        telegramLinkToken: randomUUID()
      }
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json({ message: error.message || 'Erro ao criar usuário' }, { status: 500 });
  }
}
