import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf } = await params;
  const user = await prisma.user.findUnique({
    where: { cpf },
    include: { unit: true }
  });
  if (!user) return NextResponse.json({ message: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  try {
    const { cpf } = await params;
    const body = await request.json();
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
    const user = await prisma.user.update({
      where: { cpf },
      data: body
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf } = await params;
  await prisma.user.delete({ where: { cpf } });
  return new Response(null, { status: 204 });
}
