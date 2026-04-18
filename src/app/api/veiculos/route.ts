import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prisma = getPrisma();
    const data = await prisma.vehicle.findMany({
      include: { unit: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('ERRO FATAL NA API DE VEICULOS:', error);
    return NextResponse.json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    
    const data = await prisma.vehicle.create({
      data: {
        plate: body.plate,
        model: body.model,
        color: body.color,
        type: body.type,
        unitId: body.unitId
      }
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
