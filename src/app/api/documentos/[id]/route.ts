import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;

    // Verificar se é Admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const prisma = getPrisma();
    const { id } = await params;

    // Verificar se é Admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description } = body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        title: title ? title.toUpperCase() : undefined,
        description: description !== undefined ? description.toUpperCase() : undefined,
      },
    });

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

