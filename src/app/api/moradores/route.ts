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
    const { cpf, name, email, password, unitId, ddd, phone } = await request.json();
    const hashedPassword = await bcrypt.hash(password || cpf, 10);
    const user = await (getPrisma()).user.create({
      data: {
        cpf,
        name,
        email,
        password: hashedPassword,
        role: 'MORADOR',
        unitId: unitId || null,
        ddd,
        phone,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}


