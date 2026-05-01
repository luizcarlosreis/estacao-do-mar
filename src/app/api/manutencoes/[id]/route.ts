import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  console.log('--- REQUISIÇÃO DE ALTERAÇÃO ---');
  console.log('ID recebido nos params:', id);
  
  try {
    const prisma = getPrisma();
    const body = await request.json();
    console.log('Corpo da requisição:', body);
    
    const { id: _, ...updateData } = body;

    const dataToUpdate: any = {};
    if (updateData.title) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.observation !== undefined) dataToUpdate.observation = updateData.observation;
    if (updateData.performedAt) dataToUpdate.performedAt = new Date(updateData.performedAt);
    if (updateData.nextMaintenanceAt) dataToUpdate.nextMaintenanceAt = new Date(updateData.nextMaintenanceAt);

    console.log('Dados que serão enviados ao Prisma:', dataToUpdate);

    const maintenance = await prisma.maintenance.update({ 
      where: { id }, 
      data: dataToUpdate 
    });
    return NextResponse.json(maintenance);
  } catch (error: any) {
    console.error('Erro no PATCH/PUT:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request, context: any) {
  return PATCH(request, context);
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
