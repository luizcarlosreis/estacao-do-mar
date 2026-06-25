import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPrisma } from '@/lib/prisma';

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

// GET /api/teste-boleto
export async function GET(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'MORADOR' && user.role !== 'ADMINISTRADORA') {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idBoleto = searchParams.get('idBoleto');
  let idUnidade = searchParams.get('idUnidade');
  const nomeUnidade = searchParams.get('nomeUnidade') || 'Unidade';

  // 1. Resolver unidade caso o perfil seja MORADOR
  let userWinkerUnitId = '';
  if (user.role === 'MORADOR') {
    try {
      const prisma = getPrisma();
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id as string },
        include: { unit: true }
      });
      if (!dbUser || !dbUser.unit) {
        return NextResponse.json({ message: 'Sua unidade de moradia não foi encontrada.' }, { status: 400 });
      }

      // Buscar a lista de unidades do Winker para cruzar com o número da unidade local
      const winkerUnitsUrl = 'https://api.winker.com.br/v1/portal/10493/unit';
      const winkerUnitsRes = await fetch(winkerUnitsUrl, {
        headers: {
          'Authorization': WINKER_API_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (winkerUnitsRes.ok) {
        const winkerUnits = await winkerUnitsRes.json();
        // O número da unidade no local (ex: "22") corresponde ao name no Winker
        const matchedUnit = winkerUnits.find((u: any) => String(u.name) === String(dbUser.unit.number));
        if (matchedUnit) {
          userWinkerUnitId = String(matchedUnit.id_unit);
        }
      }

      if (!userWinkerUnitId) {
        return NextResponse.json({ message: 'Apartamento não localizado no portal Winker.' }, { status: 404 });
      }

      // Força a unidade do morador
      idUnidade = userWinkerUnitId;
    } catch (err: any) {
      return NextResponse.json({ message: 'Erro ao validar unidade: ' + err.message }, { status: 500 });
    }
  }

  try {
    // 2. Download/Visualização de um boleto específico
    if (idBoleto) {
      const reference = searchParams.get('reference') || '';
      
      // Validação de segurança extra para morador
      if (user.role === 'MORADOR') {
        const billingUrl = `https://api.winker.com.br/v1/billing_unit?id_portal=10493&id_unit=${idUnidade}`;
        const billingRes = await fetch(billingUrl, {
          method: 'GET',
          headers: {
            'Authorization': WINKER_API_TOKEN,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        if (billingRes.ok) {
          const billingData = await billingRes.json();
          const rawItems = Array.isArray(billingData) ? billingData : (billingData.items || billingData.data || []);
          const belongsToUser = rawItems.some((item: any) => String(item.id_unit_billing || item.id_billing_unit) === String(idBoleto));
          if (!belongsToUser) {
            return NextResponse.json({ message: 'Acesso negado a este boleto.' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ message: 'Erro ao validar propriedade do boleto.' }, { status: 403 });
        }
      }

      const downloadUrl = `https://api.winker.com.br/v1/billing_unit/${idBoleto}/file?id_portal=10493&id_unit=${idUnidade}&reference=${reference}`;
      console.log(`[API] Solicitando download do boleto via file endpoint: ${downloadUrl}`);
      const downloadRes = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': WINKER_API_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!downloadRes.ok) {
        console.error(`[API] Erro ao baixar boleto. Status: ${downloadRes.status}`);
        return NextResponse.json(
          { message: 'Erro ao baixar o boleto do Winker via API' },
          { status: downloadRes.status }
        );
      }

      const json = await downloadRes.json();
      const pdfUrl = json.url || json.link || json.download_url;
      if (pdfUrl) {
        console.log(`[API] Buscando PDF da URL: ${pdfUrl}`);
        const pdfRes = await fetch(pdfUrl);
        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer();
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="boleto_${idBoleto}.pdf"`
            }
          });
        }
      }

      return NextResponse.json({ message: 'URL do PDF não encontrada na resposta' }, { status: 404 });
    }

    // 3. Listagem de boletos de uma unidade
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
    
    const mappedBoletos = rawItems.map((item: any) => {
      const id = String(item.id_unit_billing || item.id_billing_unit || item.id || '');
      const reference = String(item.reference || '');
      
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

      let dataPagamento = item.payment_date || item.data_pagamento || '';
      if (dataPagamento && dataPagamento.includes('-')) {
        const parts = dataPagamento.split('T')[0].split('-');
        if (parts.length === 3) {
          dataPagamento = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } else {
        dataPagamento = '-';
      }

      const rawValorPago = item.amount_paid || item.valor_pago || '';
      let valorPago = '-';
      if (rawValorPago && parseFloat(String(rawValorPago)) > 0) {
        if (typeof rawValorPago === 'string' && rawValorPago.includes('R$')) {
          valorPago = rawValorPago;
        } else {
          const numValorPago = parseFloat(String(rawValorPago)) || 0;
          valorPago = `R$ ${numValorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }

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

// POST /api/teste-boleto (Mantido por compatibilidade)
export async function POST(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'MORADOR' && user.role !== 'ADMINISTRADORA') {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}
