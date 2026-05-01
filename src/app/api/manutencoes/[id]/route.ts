import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    const body = await request.json();
    const { id: _, ...updateData } = body;

    if (updateData.performedAt) updateData.performedAt = new Date(updateData.performedAt);
    if (updateData.nextMaintenanceAt) updateData.nextMaintenanceAt = new Date(updateData.nextMaintenanceAt);

    const maintenance = await prisma.maintenance.update({ where: { id }, data: updateData });
    return NextResponse.json(maintenance);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    await prisma.maintenance.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
