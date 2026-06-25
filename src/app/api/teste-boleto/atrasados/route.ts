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

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Restringir acesso a SUPER_ADMIN e ADMINISTRADORA
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMINISTRADORA') {
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
      console.log(`[API Atrasados] Buscando lote de páginas: ${pages.join(', ')}`);
      
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

    console.log(`[API Atrasados] Total de faturas analisadas: ${allBoletos.length}`);

    // Filtra mantendo apenas faturas vencidas/atrasadas
    const overdueItems = allBoletos.filter((item: any) => {
      const sit = String(item.situation || item.status || '').toLowerCase();
      return sit.includes('overdue') || sit.includes('atraso') || sit.includes('vencid');
    });

    console.log(`[API Atrasados] Total de faturas em atraso filtradas: ${overdueItems.length}`);

    // Mapeia os dados no mesmo formato do endpoint individual de faturas
    const mappedBoletos = overdueItems.map((item: any) => {
      const id = String(item.id_unit_billing || item.id_billing_unit || item.id || '');
      const reference = String(item.reference || '');
      const idUnidade = String(item.id_unit || '');
      // Obtém o nome amigável da unidade (ex: "16", "VG. 56")
      const nomeUnidade = item.unit || item.full_unit_name || item.unit_name || 'Unidade';
      
      let referencia = item.reference || item.referencia || item.mes_referencia || item.date_ref || '';
      if (item.month_reference && item.year_reference) {
        referencia = `${item.month_reference}/${item.year_reference}`;
      } else if (referencia.includes('-')) {
        const parts = referencia.split('-');
        if (parts.length >= 2) {
          referencia = `${parts[1]}/${parts[0]}`;
        }
      } else if (referencia.length === 6) {
        referencia = `${referencia.substring(4)}/${referencia.substring(0, 4)}`;
      }

      let vencimento = item.due_date || item.vencimento || item.data_vencimento || '';
      if (vencimento && vencimento.includes('-')) {
        const parts = vencimento.split('T')[0].split('-');
        if (parts.length === 3) {
          vencimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      const rawValor = item.value || item.amount || item.valor || item.valor_principal || 0;
      let valorOriginal = '';
      if (typeof rawValor === 'string' && rawValor.includes('R$')) {
        valorOriginal = rawValor;
      } else {
        const numValor = parseFloat(String(rawValor)) || 0;
        valorOriginal = `R$ ${numValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      const situacao = 'Atrasado';
      const dataPagamento = '-';
      const valorPago = '-';
      const nossoNumero = item.our_number_formated || item.our_number || '-';
      const linhaDigitavel = item.digitable_line || item.linha_digitavel || item.codigo_barras || item.barcode || null;

      return {
        id,
        unidadeId: idUnidade,
        unidadeNome: nomeUnidade,
        reference,
        referencia,
        vencimento,
        valorOriginal,
        situacao,
        dataPagamento,
        valorPago,
        nossoNumero,
        linhaDigitavel
      };
    });

    // Ordenação decrescente por vencimento (mais recentes primeiro)
    mappedBoletos.sort((a: any, b: any) => {
      if (!a.vencimento) return 1;
      if (!b.vencimento) return -1;
      const partsA = a.vencimento.split('/');
      const partsB = b.vencimento.split('/');
      const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]));
      const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]));
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(mappedBoletos);

  } catch (error: any) {
    console.error('Erro na consulta geral de boletos atrasados:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
