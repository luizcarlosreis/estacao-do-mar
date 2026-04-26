import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    const prisma = getPrisma();
    
    // Auto-archive old posts (older than 30 days and not renewed)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.post.updateMany({
      where: {
        isArchived: false,
        expiresAt: { lt: new Date() }
      },
      data: { isArchived: true }
    });

    const where: any = { isArchived: false };
    
    if (category && category !== 'ALL') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: { 
            name: true, 
            unit: {
              select: { number: true, block: true }
            }
          }
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Mural GET error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as string;
    
    const { title, description, category, price, images, expiresAt } = await req.json();
    
    if (!title || !description || !category) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const prisma = getPrisma();
    const post = await prisma.post.create({
      data: {
        title,
        description,
        category,
        price: price ? parseFloat(price) : null,
        images: images || [],
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Padrão 30 dias
        userId
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error('Mural POST error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
