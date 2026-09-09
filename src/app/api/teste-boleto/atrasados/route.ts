import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { fetchAllCondominiumBoletos } from '@/lib/winker';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

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
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMINISTRADORA' && user.role !== 'CONSELHO') {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get('status')?.toLowerCase(); // 'all', 'opened', 'overdue'
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    const allBoletos = await fetchAllCondominiumBoletos(forceRefresh);

    // Filtra mantendo apenas faturas pendentes (abertas ou atrasadas, excluindo pagas e canceladas)
    const pendingItems = allBoletos.filter((item: any) => {
      const sit = String(item.situation || item.status || '').toLowerCase();
      if (sit.includes('paid') || sit.includes('pago') || sit.includes('liquid') || sit.includes('cancel')) {
        return false;
      }
      return true;
    });

    console.log(`[API Boletos Atrasados/Abertos] Total de faturas pendentes: ${pendingItems.length}`);

    // Mapeia os dados no mesmo formato do endpoint individual de faturas
    let mappedBoletos = pendingItems.map((item: any) => {
      const id = String(item.id_unit_billing || item.id_billing_unit || item.id || '');
      const reference = String(item.reference || '');
      const idUnidade = String(item.id_unit || '');
      // Obtém o nome amigável da unidade (ex: "022", "VG. 56")
      const rawUnitName = item.unit || item.full_unit_name || item.unit_name || 'Unidade';
      const nomeUnidade = String(rawUnitName).replace(/^APTO\s*-\s*/i, '').trim() || String(rawUnitName);
      
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

      // Determina situação: Atrasado se tiver overdue/vencid ou se data de vencimento for anterior a hoje
      const rawStatus = String(item.situation || item.status || '').toLowerCase();
      let situacao = 'Aberto';
      if (rawStatus.includes('expire') || rawStatus.includes('vencid') || rawStatus.includes('overdue') || rawStatus.includes('atraso')) {
        situacao = 'Atrasado';
      } else if (vencimento) {
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

    // Filtro opcional por status na URL (?status=opened ou ?status=overdue)
    if (filterStatus === 'opened' || filterStatus === 'aberto') {
      mappedBoletos = mappedBoletos.filter((b: any) => b.situacao === 'Aberto');
    } else if (filterStatus === 'overdue' || filterStatus === 'atrasado') {
      mappedBoletos = mappedBoletos.filter((b: any) => b.situacao === 'Atrasado');
    }

    // Ordenação por unidade (apartamento) e referência
    mappedBoletos.sort((a: any, b: any) => {
      const unitA = a.unidadeNome || '';
      const unitB = b.unidadeNome || '';
      const unitCompare = unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: 'base' });
      
      if (unitCompare !== 0) {
        return unitCompare;
      }
      
      const refA = a.reference || '';
      const refB = b.reference || '';
      return refA.localeCompare(refB, undefined, { numeric: true });
    });

    return NextResponse.json(mappedBoletos);

  } catch (error: any) {
    console.error('Erro na consulta geral de boletos:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
