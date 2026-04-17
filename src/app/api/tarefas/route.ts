import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  
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

