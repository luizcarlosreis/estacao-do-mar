import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const role = request.headers.get('x-user-role');
    const unitId = request.headers.get('x-user-unit');
    if (role !== 'SUPER_ADMIN' && role !== 'SINDICO' && role !== 'MORADOR' && role !== 'ADMINISTRADORA' && role !== 'CONSELHO') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const anual = searchParams.get('anual') === 'true';
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    if (anual) {
      if (!yearStr) {
        return NextResponse.json({ message: 'Ano é obrigatório para consulta anual' }, { status: 400 });
      }
      const year = parseInt(yearStr);
      if (isNaN(year)) {
        return NextResponse.json({ message: 'Ano inválido' }, { status: 400 });
      }

      const prisma = getPrisma();
      const targetUnitId = (role === 'MORADOR') ? (unitId || 'undefined') : (searchParams.get('unitId') || 'undefined');

      const [readings, prices] = await Promise.all([
        prisma.gasReading.findMany({
          where: {
            identifier: targetUnitId,
            OR: [
              { year },
              { year: year - 1, month: 12 }
            ]
          },
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        }),
        prisma.gasPrice.findMany({
          where: {
            year
          },
          orderBy: {
            month: 'asc'
          }
        })
      ]);

      return NextResponse.json({
        readings: readings.map(r => ({
          month: r.month,
          year: r.year,
          value: r.value,
          readAt: r.readAt
        })),
        prices: prices.map(p => ({
          month: p.month,
          year: p.year,
          pricePerKilo: p.pricePerKilo
        }))
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    if (!monthStr || !yearStr) {
      return NextResponse.json({ message: 'Mês e Ano são obrigatórios' }, { status: 400 });
    }

    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ message: 'Parâmetros inválidos' }, { status: 400 });
    }

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const prisma = getPrisma();
    const isMorador = role === 'MORADOR';

    const [readings, prevReadings, gasPrice, prevGasPrice] = await Promise.all([
      prisma.gasReading.findMany({
        where: isMorador 
          ? { month, year, identifier: unitId || 'undefined' } 
          : { month, year }
      }),
      prisma.gasReading.findMany({
        where: isMorador 
          ? { month: prevMonth, year: prevYear, identifier: unitId || 'undefined' } 
          : { month: prevMonth, year: prevYear }
      }),
      prisma.gasPrice.findUnique({
        where: {
          month_year: {
            month,
            year
          }
        }
      }),
      prisma.gasPrice.findUnique({
        where: {
          month_year: {
            month: prevMonth,
            year: prevYear
          }
        }
      })
    ]);

    const readAt = readings.length > 0 ? readings[0].readAt : null;
    const pricePerKilo = gasPrice ? gasPrice.pricePerKilo : null;
    const previousPricePerKilo = prevGasPrice ? prevGasPrice.pricePerKilo : null;

    return NextResponse.json({
      readAt,
      pricePerKilo,
      previousPricePerKilo,
      readings: readings.map(r => ({
        identifier: r.identifier,
        value: r.value
      })),
      previousReadings: prevReadings.map(r => ({
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
    const { month, year, readAt, readings, pricePerKilo } = body;

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

    // Validação monetária do preço por quilo (obrigatório)
    if (pricePerKilo === null || pricePerKilo === undefined || pricePerKilo === '') {
      return NextResponse.json({ message: 'O Valor do Kilo (R$) é obrigatório para salvar as leituras.' }, { status: 400 });
    }

    const parsedPrice = parseFloat(String(pricePerKilo).replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ message: 'O valor do quilo do gás deve ser um número maior ou igual a zero.' }, { status: 400 });
    }

    // Validação de até 4 casas decimais para o preço
    const priceStr = String(pricePerKilo);
    const priceParts = priceStr.split('.');
    if (priceParts[1] && priceParts[1].length > 4) {
      return NextResponse.json({ message: 'O valor do quilo do gás excede o limite permitido de 4 casas decimais.' }, { status: 400 });
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

    // Persistência atômica via transação interativa com Promise.all e timeout de 20 segundos
    await prisma.$transaction(
      async (tx) => {
        // Grava ou atualiza o preço do quilo para este mês/ano
        await tx.gasPrice.upsert({
          where: {
            month_year: {
              month: parsedMonth,
              year: parsedYear
            }
          },
          update: {
            pricePerKilo: parsedPrice
          },
          create: {
            month: parsedMonth,
            year: parsedYear,
            pricePerKilo: parsedPrice
          }
        });

        // Grava ou atualiza as leituras físicas
        await Promise.all(
          readings.map(r => {
            const val = (r.value !== null && r.value !== undefined && r.value !== '') ? parseFloat(r.value) : null;
            return tx.gasReading.upsert({
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
      },
      {
        timeout: 20000 // 20 segundos de limite para evitar timeout sob concorrência ou frio no Neon
      }
    );

    return NextResponse.json({ message: 'Leituras salvas com sucesso!' });
  } catch (error: any) {
    console.error('POST GasReadings Error:', error.message);
    return NextResponse.json({ message: error.message || 'Erro ao registrar leituras de gás' }, { status: 500 });
  }
}
