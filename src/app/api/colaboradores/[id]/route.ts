import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await context.params;
    const body = await request.json();
    const { id: _, ...updateData } = body;

    const dataToUpdate: any = {};
    if (updateData.name) dataToUpdate.name = updateData.name;
    if (updateData.cpf) dataToUpdate.cpf = updateData.cpf;
    if (updateData.email !== undefined) dataToUpdate.email = updateData.email;
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone;
    if (updateData.role) dataToUpdate.role = updateData.role;
    if (updateData.shift !== undefined) dataToUpdate.shift = updateData.shift;
    if (updateData.birthDate) dataToUpdate.birthDate = new Date(updateData.birthDate);
    
    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    const employee = await prisma.employee.update({ where: { id }, data: dataToUpdate });
    return NextResponse.json(employee);
  } catch (error: any) {
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
    await prisma.employee.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
