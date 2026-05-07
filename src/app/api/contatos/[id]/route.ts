import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const prisma = getPrisma();
    
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: data.name?.toUpperCase(),
        description: data.description?.toUpperCase(),
        ddd: data.ddd,
        phone: data.phone,
        email: data.email?.toLowerCase(),
        specialty: data.specialty?.toUpperCase(),
        document: data.document?.toUpperCase()
      }
    });
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    return NextResponse.json({ message: 'Erro ao atualizar contato' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.contact.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
    return NextResponse.json({ message: 'Erro ao excluir contato' }, { status: 500 });
  }
}
