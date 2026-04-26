import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const { id: postId } = await params;
    const { content } = await req.json();
    
    if (!content) return NextResponse.json({ message: 'Conteúdo obrigatório' }, { status: 400 });

    const prisma = getPrisma();
    const comment = await prisma.postComment.create({
      data: { postId, userId, content },
      include: {
        user: { select: { name: true } }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
