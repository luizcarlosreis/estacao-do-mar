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

// GET /api/boleto-teste
export async function GET(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idBoleto = searchParams.get('idBoleto');
  const idUnidade = searchParams.get('idUnidade');
  const nomeUnidade = searchParams.get('nomeUnidade') || 'Unidade';

  try {
    // 1. Download/Visualização de um boleto específico
    if (idBoleto) {
      const downloadUrl = `https://api.winker.com.br/v1/billing/${idBoleto}/download`;
      console.log(`[API] Solicitando download do boleto: ${downloadUrl}`);
      const downloadRes = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': WINKER_API_TOKEN,
          'Accept': 'application/json, application/pdf',
          'Content-Type': 'application/json'
        }
      });

      if (!downloadRes.ok) {
        console.error(`[API] Erro ao baixar boleto (Status: ${downloadRes.status}). Redirecionando para a intranet...`);
        return NextResponse.redirect(`https://app.winker.com.br/intra/meuCondominio/boleto/view/rateio/${idBoleto}`);
      }

      const contentType = downloadRes.headers.get('content-type') || '';
      
      // Se a API retornou JSON com a URL de redirecionamento para o PDF
      if (contentType.includes('application/json')) {
        const json = await downloadRes.json();
        const pdfUrl = json.url || json.link || json.download_url;
        if (pdfUrl) {
          console.log(`[API] Redirecionando ou buscando PDF da URL: ${pdfUrl}`);
          const pdfRes = await fetch(pdfUrl);
          if (pdfRes.ok) {
            const pdfBuffer = await pdfRes.arrayBuffer();
            return new NextResponse(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="boleto_${idBoleto}.pdf"`
              }
            });
          }
        }
      }

      // Caso padrão: serve os dados binários do PDF diretamente
      const pdfBuffer = await downloadRes.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="boleto_${idBoleto}.pdf"`
        }
      });
    }

    // 2. Listagem de boletos de uma unidade
    if (!idUnidade) {
      return NextResponse.json({ message: 'ID da unidade é obrigatório para listagem.' }, { status: 400 });
    }

    const billingUrl = `https://api.winker.com.br/v1/billing_unit?id_portal=10493&id_unit=${idUnidade}`;
    console.log(`[API] Buscando cobranças no endpoint: ${billingUrl}`);
    const billingRes = await fetch(billingUrl, {
      method: 'GET',
      headers: {
        'Authorization': WINKER_API_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Se retornar 404, tratamos como nenhum boleto cadastrado para esta unidade
    if (billingRes.status === 404) {
      console.log(`[API] Nenhum boleto encontrado (404) para a unidade ${idUnidade}`);
      return NextResponse.json([]);
    }

    if (!billingRes.ok) {
      const errorMsg = await billingRes.text();
      console.error(`[API] Erro na API de cobrança: Status ${billingRes.status} - ${errorMsg}`);
      return NextResponse.json(
        { message: 'Falha ao buscar faturas na API do Winker.' },
        { status: billingRes.status }
      );
    }

    const data = await billingRes.json();
    const rawItems = Array.isArray(data) ? data : (data.items || data.data || []);
    
    // Mapeador resiliente para padronizar os dados de boleto para o frontend
    const mappedBoletos = rawItems.map((item: any) => {
      const id = String(item.id_billing_billet || item.id_billing_unit || item.id_unit_billing || item.id || item.id_cobranca || item.id_boleto || '');
      
      // Mapear referência (ex: "202604" -> "04/2026")
      let referencia = item.reference || item.referencia || item.mes_referencia || item.date_ref || '';
      if (item.month_reference && item.year_reference) {
        referencia = `${item.month_reference}/${item.year_reference}`;
      } else if (referencia.includes('-')) {
        const parts = referencia.split('-');
        if (parts.length >= 2) {
          referencia = `${parts[1]}/${parts[0]}`;
        }
      } else if (referencia.length === 6) {
        // Formato YYYYMM
        referencia = `${referencia.substring(4)}/${referencia.substring(0, 4)}`;
      }

      // Mapear data de vencimento (ex: "2026-06-20T15:47:15-0300" -> "20/06/2026")
      let vencimento = item.due_date || item.vencimento || item.data_vencimento || '';
      if (vencimento && vencimento.includes('-')) {
        const parts = vencimento.split('T')[0].split('-');
        if (parts.length === 3) {
          vencimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      // Mapear valor financeiro (ex: 404.62 -> "R$ 404,62")
      const rawValor = item.amount || item.value || item.valor || item.valor_principal || item.price || 0;
      let valor = '';
      if (typeof rawValor === 'string' && rawValor.includes('R$')) {
        valor = rawValor;
      } else {
        const numValor = parseFloat(String(rawValor)) || 0;
        valor = `R$ ${numValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      // Linha Digitável
      const linhaDigitavel = item.digitable_line || item.linha_digitavel || item.codigo_barras || item.barcode || null;

      // Mapeamento de Status
      const rawStatus = String(item.status || item.situacao || item.situation || '').toLowerCase();
      let status = 'Aberto';
      if (rawStatus.includes('paid') || rawStatus.includes('pago') || rawStatus.includes('liquid') || rawStatus.includes('quitar')) {
        status = 'Pago';
      } else if (rawStatus.includes('expire') || rawStatus.includes('vencid') || rawStatus.includes('overdue') || rawStatus.includes('atraso')) {
        status = 'Vencido';
      } else {
        // Se a data de vencimento passou e não está pago, assume Vencido
        if (vencimento) {
          try {
            const parts = vencimento.split('/');
            const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today) {
              status = 'Vencido';
            }
          } catch (e) {}
        }
      }

      return {
        id,
        unidadeId: idUnidade,
        unidadeNome: nomeUnidade,
        referencia,
        vencimento,
        valor,
        linhaDigitavel,
        status
      };
    });

    // Ordenar boletos por vencimento decrescente
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
    console.error('Erro na listagem/download de faturas da API:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

// POST /api/boleto-teste (Mantido por compatibilidade de rotas, mas sem ação necessária)
export async function POST(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
