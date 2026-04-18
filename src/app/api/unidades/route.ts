import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prisma = getPrisma();
    const units = await prisma.unit.findMany({
      include: {
        residents: { select: { name: true, cpf: true } },
        parkingSpaces: { select: { number: true, block: true } },
        vehicles: { select: { plate: true, model: true, type: true } }
      }
    });
    return NextResponse.json(units);
  } catch (error: any) {
    console.error('API GET Unidades Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    
    // Validação básica
    if (!body.number || !body.block) {
      return NextResponse.json({ message: 'Número e Bloco são obrigatórios' }, { status: 400 });
    }

    const unit = await prisma.unit.create({ 
      data: {
        number: String(body.number),
        block: String(body.block)
      }
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error: any) {
    console.error('API POST Unidades Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao salvar unidade' }, { status: 500 });
  }
}
