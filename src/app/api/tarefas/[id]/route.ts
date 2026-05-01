import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    const body = await request.json();
    const { id: _, ...updateData } = body;

    const dataToUpdate: any = {};
    if (updateData.title) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.status) dataToUpdate.status = updateData.status;
    if (updateData.performedAt) dataToUpdate.performedAt = new Date(updateData.performedAt);

    const task = await prisma.task.update({ 
      where: { id }, 
      data: dataToUpdate 
    });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
