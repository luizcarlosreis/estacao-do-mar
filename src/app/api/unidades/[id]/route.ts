import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { residents: true, parkingSpaces: true }
  });
  if (!unit) return NextResponse.json({ message: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(unit);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const unit = await prisma.unit.update({ where: { id }, data: body });
    return NextResponse.json(unit);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.unit.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
