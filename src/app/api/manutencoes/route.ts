import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const data = await prisma.maintenance.findMany({ orderBy: { performedAt: 'desc' } });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await prisma.maintenance.create({
      data: {
        ...body,
        performedAt: new Date(body.performedAt),
        nextMaintenanceAt: new Date(body.nextMaintenanceAt),
      }
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
