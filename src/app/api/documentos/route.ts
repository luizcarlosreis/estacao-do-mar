import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(documents);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Verificar se é Admin
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso restrito ao Administrador' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, fileUrl, fileName, fileSize } = body;

    if (!title || !fileUrl || !fileName) {
      return NextResponse.json({ message: 'Título e Arquivo são obrigatórios' }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title: title.toUpperCase(),
        description: description?.toUpperCase() || '',
        fileUrl,
        fileName,
        fileSize,
      },
    });

    return NextResponse.json(document);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
