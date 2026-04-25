import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    const unitId = request.headers.get('x-user-unit');
    const prisma = getPrisma();
    
    const whereClause: any = {};
    if (role === 'MORADOR') {
      if (unitId) {
        whereClause.unitId = unitId;
      } else {
        whereClause.unitId = 'none-placeholder';
      }
    }

    const data = await prisma.vehicle.findMany({
      where: whereClause,
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
