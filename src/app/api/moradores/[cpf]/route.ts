import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
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

export async function DELETE(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    await prisma.user.delete({ where: { cpf: params.cpf } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
