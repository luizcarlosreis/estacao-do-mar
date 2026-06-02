import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const { id } = await params;
    
    const prisma = getPrisma();
    const post = await prisma.post.findUnique({ where: { id } });
    
    if (!post) return NextResponse.json({ message: 'Post não encontrado' }, { status: 404 });
    if (post.userId !== userId && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }

    // Tenta ler o corpo da requisição para verificar se é alteração ou renovação
    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {
      // Corpo vazio
    }

    let updatedData: any = {};

    if (body && (body.title || body.description || body.category)) {
      // Lógica de alteração/edição de campos
      updatedData = {
        title: body.title,
        description: body.description,
        category: body.category,
        price: body.price ? parseFloat(body.price) : null
      };

      if (body.expiresAt && payload.role === 'SUPER_ADMIN') {
        const [year, month, day] = body.expiresAt.split('-').map(Number);
        updatedData.expiresAt = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) + (3 * 60 * 60 * 1000));
      }
    } else {
      // Lógica de renovação simples
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      updatedData = {
        expiresAt: newExpiresAt,
        isArchived: false
      };
    }

    const updated = await prisma.post.update({
      where: { id },
      data: updatedData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const { id } = await params;
    
    const prisma = getPrisma();
    const post = await prisma.post.findUnique({ where: { id } });
    
    if (!post) return NextResponse.json({ message: 'Post não encontrado' }, { status: 404 });
    if (post.userId !== userId && payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
