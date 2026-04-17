import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = getPrisma();
  const data = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();
    const data = await prisma.task.create({
      data: {
        ...body,
        performedAt: body.performedAt ? new Date(body.performedAt) : null,
      }
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
