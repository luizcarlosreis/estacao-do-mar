import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET() {
  
  const users = await (getPrisma()).user.findMany({
    where: { role: 'MORADOR' },
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


