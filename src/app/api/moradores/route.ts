import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const role = request.headers.get('x-user-role');
  const unitId = request.headers.get('x-user-unit');
  
  const whereClause: any = { role: 'MORADOR' };
  
  if (role === 'MORADOR') {
    if (unitId) {
      whereClause.unitId = unitId;
    } else {
      // Se é morador e não tem unidade vinculada, não vê ninguém
      whereClause.unitId = 'none-placeholder';
    }
  }

  const users = await (getPrisma()).user.findMany({
    where: whereClause,
    include: { unit: true }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf, name, email, password, unitId, ddd, phone } = body;

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
        password: hashedPassword,
        role: 'MORADOR',
        unitId: unitId || null,
        ddd,
        phone,
        residentType: body.residentType || 'MORADOR'
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}


