import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const role = request.headers.get('x-user-role');
  const unitId = request.headers.get('x-user-unit');
  
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';
  
  const whereClause: any = { role: 'MORADOR' };
  
  if (role === 'MORADOR') {
    if (unitId) {
      whereClause.unitId = unitId;
    } else {
      // Se é morador e não tem unidade vinculada, não vê ninguém
      whereClause.unitId = 'none-placeholder';
    }
  }

  if (activeOnly) {
    whereClause.isActive = true;
  }

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: whereClause,
    include: { unit: true }
  });

  // Garantir que todos possuem telegramLinkToken
  const updatedUsers = await Promise.all(
    users.map(async (u) => {
      if (!u.telegramLinkToken) {
        const token = randomUUID();
        await prisma.user.update({
          where: { id: u.id },
          data: { telegramLinkToken: token }
        });
        return { ...u, telegramLinkToken: token };
      }
      return u;
    })
  );

  return NextResponse.json(updatedUsers);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf, name, email, password, unitId, ddd, phone, rg } = body;

    if (!cpf || cpf.trim() === '') {
      return NextResponse.json(
        { message: 'O CPF é obrigatório para o cadastro do morador' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verificar se CPF já existe
    const existingUser = await prisma.user.findUnique({
      where: { cpf }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'CPF já cadastrado na base de Moradores' },
        { status: 400 }
      );
    }

    const defaultPassword = cpf.substring(0, 5);
    const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);
    const user = await prisma.user.create({
      data: {
        cpf,
        name: name.toUpperCase(),
        email: email || null,
        rg: rg || null,
        password: hashedPassword,
        role: 'MORADOR',
        unitId: unitId || null,
        ddd,
        phone,
        residentType: body.residentType || 'MORADOR',
        isActive: body.isActive !== undefined ? body.isActive : true,
        telegramLinkToken: randomUUID()
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}


