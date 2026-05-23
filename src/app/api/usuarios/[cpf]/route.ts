import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  const callerRole = request.headers.get('x-user-role');
  if (callerRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Acesso restrito a administradores' }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const params = await context.params;
    const body = await request.json();

    const targetUser = await prisma.user.findUnique({
      where: { cpf: params.cpf }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se o usuário for o Admin principal, não permitir alterar seu papel/role
    if (params.cpf === 'Admin' && body.role && body.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Não é permitido alterar o perfil do Administrador principal' }, { status: 400 });
    }

    const dataToUpdate: any = { ...body };

    if (body.password) {
      dataToUpdate.password = await bcrypt.hash(body.password, 10);
    }

    if (body.name) {
      dataToUpdate.name = body.name.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { cpf: params.cpf },
      data: dataToUpdate
    });

    const { password, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ message: error.message || 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const callerRole = request.headers.get('x-user-role');
  if (callerRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Acesso restrito a administradores' }, { status: 403 });
  }

  try {
    const prisma = getPrisma();
    const params = await context.params;

    // Impedir a exclusão do administrador principal (Admin)
    if (params.cpf === 'Admin') {
      return NextResponse.json({ message: 'Não é permitido excluir o usuário administrador principal' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { cpf: params.cpf }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { cpf: params.cpf }
    });

    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);

    // Tratamento amigável de restrição de chave estrangeira
    if (
      error.code === 'P2003' || 
      error.message?.includes('foreign key') || 
      error.message?.includes('violates foreign key constraint')
    ) {
      return NextResponse.json(
        { 
          message: 'Não é possível excluir este usuário pois ele possui registros vinculados no sistema (como encomendas, correspondências, reservas, tarefas ou mensagens).' 
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ message: error.message || 'Erro ao excluir usuário' }, { status: 500 });
  }
}
