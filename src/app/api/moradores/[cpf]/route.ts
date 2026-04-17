import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { cpf }: { params: Promise<{ cpf: string }> }) {
  try {
    const { cpf: paramCpf } = await { params: { cpf: '' } }.params; // Placeholder for types
    // Correct way:
    const params = await (arguments[1].params as Promise<{ cpf: string }>);
    const body = await request.json();
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
    const resident = await prisma.user.update({ where: { cpf: params.cpf }, data: body });
    return NextResponse.json(resident);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
