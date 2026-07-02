import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');
const WINKER_API_TOKEN = '5c90521e-d469-4b39-b938-81ea1f4e9543';

// Helper function to check authentication on Estação do Mar portal
async function checkAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

function getMonthKey(item: any) {
  let year = '';
  let month = '';

  if (item.year_reference && item.month_reference) {
    year = String(item.year_reference);
    month = String(item.month_reference).padStart(2, '0');
  } else {
    const ref = String(item.reference || item.referencia || item.mes_referencia || item.date_ref || '');
    if (ref.includes('-')) {
      const parts = ref.split('-');
      if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
      } else if (parts[1].length === 4) {
        year = parts[1];
        month = parts[0];
      }
    } else if (ref.includes('/')) {
      const parts = ref.split('/');
      if (parts[1].length === 4) {
        year = parts[1];
        month = parts[0];
      } else if (parts[0].length === 4) {
        year = parts[0];
        month = parts[1];
      }
    } else if (ref.length === 6) {
      if (parseInt(ref.substring(0, 4)) > 2000) {
        year = ref.substring(0, 4);
        month = ref.substring(4);
      } else {
        month = ref.substring(0, 2);
        year = ref.substring(2);
      }
    }
  }

  // Fallback to due date if month/year reference not found
  if (!year || !month) {
    const dueDate = item.due_date || item.vencimento || item.data_vencimento || '';
    if (dueDate && dueDate.includes('-')) {
      const parts = dueDate.split('T')[0].split('-');
      if (parts.length === 3) {
        year = parts[0];
        month = parts[1];
      }
    }
  }

  if (year && month && year.length === 4 && month.length === 2) {
    return {
      key: `${year}-${month}`,
      display: `${month}/${year}`
    };
  }

  return null;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Restringir acesso a SUPER_ADMIN e ADMINISTRADORA
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMINISTRADORA' && user.role !== 'CONSELHO') {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  try {
    let allBoletos: any[] = [];
    let chunk = 0;
    const chunkSize = 15;
    let keepFetching = true;

    // Busca as páginas em lotes paralelos (chunks) para melhor performance
    while (keepFetching) {
      const pages = Array.from({ length: chunkSize }, (_, i) => chunk * chunkSize + i + 1);
      console.log(`[API Dashboard] Buscando lote de páginas: ${pages.join(', ')}`);
      
      const results = await Promise.all(
        pages.map(async (page) => {
          const url = `https://api.winker.com.br/v1/billing_unit?id_portal=10493&page=${page}`;
          try {
            const res = await fetch(url, {
              headers: {
                'Authorization': WINKER_API_TOKEN,
                'Accept': 'application/json'
              }
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          } catch (e) {
            console.error(`Erro ao buscar página ${page}:`, e);
            return [];
          }
        })
      );

      // Agrega os resultados e verifica se atingiu a última página
      let chunkHasFullPage = false;
      for (let i = 0; i < results.length; i++) {
        const list = results[i];
        allBoletos = allBoletos.concat(list);
        if (list.length === 50) {
          chunkHasFullPage = true;
        }
      }

      // Se alguma das páginas retornou menos de 50 itens, significa que chegamos ao fim dos registros
      const hasEndPage = results.some(list => list.length < 50);
      if (hasEndPage || results.every(list => list.length === 0)) {
        keepFetching = false;
      } else {
        chunk++;
      }
    }

    console.log(`[API Dashboard] Total de faturas analisadas: ${allBoletos.length}`);

    const monthlyStats: { [key: string]: { key: string, display: string, totalArrecadado: number, totalAtrasado: number, countArrecadado: number, countAtrasado: number } } = {};

    allBoletos.forEach((item: any) => {
      const monthInfo = getMonthKey(item);
      if (!monthInfo) return;

      const rawValor = item.value || item.amount || item.valor || item.valor_principal || 0;
      const numValor = parseFloat(String(rawValor)) || 0;

      // Determine status
      let vencimento = item.due_date || item.vencimento || item.data_vencimento || '';
      if (vencimento && vencimento.includes('-')) {
        const parts = vencimento.split('T')[0].split('-');
        if (parts.length === 3) {
          vencimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      const rawStatus = String(item.situation || item.status || item.situacao || '').toLowerCase();
      let situacao = 'Aberto';
      if (rawStatus.includes('paid') || rawStatus.includes('pago') || rawStatus.includes('liquid')) {
        situacao = 'Pago';
      } else if (rawStatus.includes('expire') || rawStatus.includes('vencid') || rawStatus.includes('overdue') || rawStatus.includes('atraso')) {
        situacao = 'Atrasado';
      } else {
        if (vencimento) {
          try {
            const parts = vencimento.split('/');
            const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
              situacao = 'Atrasado';
            }
          } catch (e) {}
        }
      }

      const rawValorPago = item.amount_paid || item.valor_pago || '';
      const numValorPago = parseFloat(String(rawValorPago)) || 0;

      if (!monthlyStats[monthInfo.key]) {
        monthlyStats[monthInfo.key] = {
          key: monthInfo.key,
          display: monthInfo.display,
          totalArrecadado: 0,
          totalAtrasado: 0,
          countArrecadado: 0,
          countAtrasado: 0
        };
      }

      if (situacao === 'Pago') {
        const valorEfetivo = numValorPago > 0 ? numValorPago : numValor;
        monthlyStats[monthInfo.key].totalArrecadado += valorEfetivo;
        monthlyStats[monthInfo.key].countArrecadado += 1;
      } else if (situacao === 'Atrasado') {
        monthlyStats[monthInfo.key].totalAtrasado += numValor;
        monthlyStats[monthInfo.key].countAtrasado += 1;
      }
    });

    const result = Object.values(monthlyStats);
    // Sort chronologically by key (YYYY-MM) descending (most recent first)
    result.sort((a, b) => b.key.localeCompare(a.key));

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro no cálculo do dashboard de boletos:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
