import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.task.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        unit: { select: { id: true, block: true, number: true } }
      }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { id: _, ...createData } = body;
    let performedAtDate = null;
    if (body.performedAt) {
      const [year, month, day] = body.performedAt.split('-').map(Number);
      performedAtDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    const data = await prisma.task.create({
      data: {
        ...createData,
        userId: body.userId || null,
        unitId: body.unitId || null,
        performedAt: performedAtDate,
        attachmentUrl: body.attachmentUrl || null,
        attachmentName: body.attachmentName || null,
      }
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
