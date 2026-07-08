import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const body = await request.json();
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
    if (body.name) {
      body.name = body.name.toUpperCase();
    }
    if (body.hasOwnProperty('phones')) {
      const phones = body.phones;
      body.phones = Array.isArray(phones) && phones.length > 0 ? JSON.stringify(phones) : null;
      body.ddd = (Array.isArray(phones) && phones[0]?.ddd) || null;
      body.phone = (Array.isArray(phones) && phones[0]?.phone) || null;
    }
    const resident = await prisma.user.update({ where: { cpf: params.cpf }, data: body });
    return NextResponse.json(resident);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    await prisma.user.delete({ where: { cpf: params.cpf } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Erro ao excluir morador:', error);
    
    // Tratamento amigável para erro de integridade referencial / chave estrangeira
    if (
      error.code === 'P2003' || 
      error.message?.includes('foreign key') || 
      error.message?.includes('violates foreign key constraint')
    ) {
      return NextResponse.json(
        { 
          message: 'Não é possível excluir este morador pois ele possui registros vinculados no sistema (como encomendas, correspondências, reservas, tarefas ou mensagens).' 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: error.message || 'Erro interno ao excluir morador.' }, { status: 500 });
  }
}
