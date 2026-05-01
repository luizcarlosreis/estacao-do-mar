import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Obter role do JWT para segurança máxima
    const token = request.cookies.get('auth-token')?.value;
    let role = null;
    let userId = null;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        role = payload.role as string;
        userId = payload.id as string;
      } catch (e) {
        console.error('Erro ao verificar token JWT:', e);
      }
    }

    console.log(`API Fale Síndico: Listando para o perfil [${role}]`);
    
    if (!['SUPER_ADMIN', 'SINDICO', 'MORADOR'].includes(role || '')) {
        console.warn(`API Fale Síndico: Acesso negado para o perfil [${role}]`);
        return NextResponse.json([]); 
    }

    const where = role === 'MORADOR' ? { userId: userId as string } : {};

    const messages = await prisma.syndicMessage.findMany({
      where,
      include: {
        unit: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`API Fale Síndico: Encontradas ${messages.length} mensagens`);
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('API GET Fale Sindico Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { type, otherType, description, attachmentUrl, unitId } = body;

    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    const role = payload.role as string;

    if (!['SUPER_ADMIN', 'SINDICO', 'MORADOR'].includes(role || '')) {
        return NextResponse.json({ message: 'Sem permissão' }, { status: 403 });
    }

    if (!type || !description || !unitId) {
      return NextResponse.json({ message: 'Tipo, Descrição e Apartamento são obrigatórios' }, { status: 400 });
    }

    const message = await prisma.syndicMessage.create({
      data: {
        type,
        otherType,
        description,
        attachmentUrl,
        unitId,
        userId,
      },
      include: {
        unit: true,
        user: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('API POST Fale Sindico Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno' }, { status: 500 });
  }
}
