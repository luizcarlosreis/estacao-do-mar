import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPER_ADMIN' && role !== 'SINDICO') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    if (!monthStr || !yearStr) {
      return NextResponse.json({ message: 'Mês e Ano são obrigatórios' }, { status: 400 });
    }

    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ message: 'Parâmetros inválidos' }, { status: 400 });
    }

    const prisma = getPrisma();
    const readings = await prisma.gasReading.findMany({
      where: { month, year }
    });

    const readAt = readings.length > 0 ? readings[0].readAt : null;

    return NextResponse.json({
      readAt,
      readings: readings.map(r => ({
        identifier: r.identifier,
        value: r.value
      }))
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('GET GasReadings Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'SUPER_ADMIN' && role !== 'SINDICO') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { month, year, readAt, readings } = body;

    // Validações básicas
    if (!month || !year || !readAt || !Array.isArray(readings)) {
      return NextResponse.json({ message: 'Dados incompletos ou inválidos' }, { status: 400 });
    }

    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return NextResponse.json({ message: 'Mês inválido' }, { status: 400 });
    }

    if (isNaN(parsedYear)) {
      return NextResponse.json({ message: 'Ano inválido' }, { status: 400 });
    }

    const parsedReadAt = new Date(readAt);
    if (isNaN(parsedReadAt.getTime())) {
      return NextResponse.json({ message: 'Data de leitura inválida' }, { status: 400 });
    }

    // Validação rígida de formato de casas decimais para cada lançamento
    for (const r of readings) {
      if (r.value !== null && r.value !== undefined && r.value !== '') {
        const numVal = parseFloat(r.value);
        if (isNaN(numVal) || numVal < 0) {
          return NextResponse.json({ message: `O valor da leitura para "${r.identifier}" deve ser um número maior ou igual a zero.` }, { status: 400 });
        }

        // Validação de até 3 casas decimais
        const valStr = String(r.value);
        const parts = valStr.split('.');
        if (parts[1] && parts[1].length > 3) {
          return NextResponse.json({ message: `O valor "${r.value}" excede o limite permitido de 3 casas decimais.` }, { status: 400 });
        }
      }
    }

    const prisma = getPrisma();

    // Persistência atômica via transação
    await prisma.$transaction(
      readings.map(r => {
        const val = (r.value !== null && r.value !== undefined && r.value !== '') ? parseFloat(r.value) : null;
        return prisma.gasReading.upsert({
          where: {
            month_year_identifier: {
              month: parsedMonth,
              year: parsedYear,
              identifier: r.identifier
            }
          },
          update: {
            readAt: parsedReadAt,
            value: val,
            unitId: r.unitId || null
          },
          create: {
            month: parsedMonth,
            year: parsedYear,
            readAt: parsedReadAt,
            value: val,
            identifier: r.identifier,
            unitId: r.unitId || null
          }
        });
      })
    );

    return NextResponse.json({ message: 'Leituras salvas com sucesso!' });
  } catch (error: any) {
    console.error('POST GasReadings Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao registrar leituras de gás' }, { status: 500 });
  }
}
