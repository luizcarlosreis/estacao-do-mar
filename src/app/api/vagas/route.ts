import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  
  const spaces = await (getPrisma()).parkingSpace.findMany({
    include: { unit: { select: { number: true, block: true } } }
  });
  return NextResponse.json(spaces);
}

export async function POST(request: Request) {
  
  try {
    const body = await request.json();
    const space = await (getPrisma()).parkingSpace.create({ data: body });
    return NextResponse.json(space, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}


