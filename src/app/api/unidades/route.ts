import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      include: {
        residents: { select: { name: true, cpf: true } },
        parkingSpaces: { select: { number: true, block: true } }
      }
    });
    return NextResponse.json(units);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const unit = await prisma.unit.create({ data: body });
    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
