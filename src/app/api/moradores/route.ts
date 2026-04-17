import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: 'MORADOR' },
    include: { unit: true }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const { cpf, name, email, password, unitId } = await request.json();
    
    const hashedPassword = await bcrypt.hash(password || cpf, 10);

    const user = await prisma.user.create({
      data: {
        cpf,
        name,
        email,
        password: hashedPassword,
        role: 'MORADOR',
        unitId: unitId || null,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
