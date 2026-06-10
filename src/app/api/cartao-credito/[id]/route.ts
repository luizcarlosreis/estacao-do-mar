import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = getPrisma();
    
    // Auth Check
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ message: 'ID é obrigatório' }, { status: 400 });
    }

    // Delete the purchase (cascade deletes installments)
    await prisma.creditCardPurchase.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Compra excluída com sucesso' });
  } catch (error: any) {
    console.error('Error deleting credit card purchase:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
