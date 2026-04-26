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

    // Lógica de renovação: seta nova expiração para 30 dias a partir de agora
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const updated = await prisma.post.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        isArchived: false
      }
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
