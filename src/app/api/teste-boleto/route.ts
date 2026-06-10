import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

// Função auxiliar para verificar autenticação no Estação do Mar
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
    return NextResponse.json({ message: 'Não autenticado no portal' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idBoleto = searchParams.get('idBoleto');
  const winkerSession = req.cookies.get('winker-session')?.value;

  if (!winkerSession) {
    return NextResponse.json({ message: 'Sessão do Winker necessária', winkerSessionRequired: true }, { status: 401 });
  }

  try {
    // Caso queira baixar um boleto
    if (idBoleto) {
      const downloadUrl = `https://app.winker.com.br/intra/meuCondominio/boleto/view/rateio/${idBoleto}`;
      const downloadRes = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Cookie': `PHPSESSID=${winkerSession}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!downloadRes.ok) {
        return NextResponse.json({ message: 'Erro ao baixar o boleto do Winker' }, { status: downloadRes.status });
      }

      const cType = downloadRes.headers.get('content-type') || '';
      if (!cType.includes('pdf')) {
        return NextResponse.json({ message: 'O boleto não retornou um PDF válido.' }, { status: 400 });
      }

      const pdfBuffer = await downloadRes.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="boleto_${idBoleto}.pdf"`
        }
      });
    }

    // Caso queira listar os boletos
    const result = await fetchAndScrapeBoletos(winkerSession);
    if (result.sessionExpired) {
      const res = NextResponse.json({ message: 'Sessão do Winker expirou', winkerSessionRequired: true }, { status: 401 });
      res.cookies.delete('winker-session');
      return res;
    }

    return NextResponse.json(result.boletos);
  } catch (error: any) {
    console.error('Erro ao listar/baixar boletos:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

// POST /api/teste-boleto (Login ou Logout)
export async function POST(req: NextRequest) {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json({ message: 'Não autenticado no portal' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, password } = body;

    // Logout
    if (action === 'logout') {
      const res = NextResponse.json({ success: true });
      res.cookies.delete('winker-session');
      return res;
    }

    // Login
    if (!email || !password) {
      return NextResponse.json({ message: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const loginUrl = 'https://app.winker.com.br/intra/default/login';
    const form = new URLSearchParams();
    form.append('LoginForm[username]', email);
    form.append('LoginForm[password]', password);

    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: form.toString(),
      redirect: 'manual'
    });

    const cookies: string[] = [];
    loginRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        cookies.push(value.split(';')[0]);
      }
    });

    let phpsessid = '';
    for (const c of cookies) {
      if (c.startsWith('PHPSESSID=')) {
        phpsessid = c.substring('PHPSESSID='.length);
        break;
      }
    }

    if (!phpsessid) {
      return NextResponse.json({ message: 'E-mail ou senha inválidos no Winker.' }, { status: 400 });
    }

    // Buscar e raspar boletos imediatamente para confirmar
    const result = await fetchAndScrapeBoletos(phpsessid);
    if (result.sessionExpired) {
      return NextResponse.json({ message: 'Credenciais inválidas no Winker.' }, { status: 400 });
    }

    // Login com sucesso: Definir o cookie e retornar os boletos
    const res = NextResponse.json(result.boletos);
    res.cookies.set('winker-session', phpsessid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    return res;

  } catch (error: any) {
    console.error('Erro no POST teste-boleto:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

// Função utilitária para fazer o scrape
async function fetchAndScrapeBoletos(session: string) {
  const baseUrl = 'https://app.winker.com.br/intra/meuCondominio/boleto';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  // 1. Carregar página principal para descobrir unidades e meses
  const initRes = await fetch(baseUrl, {
    headers: {
      'Cookie': `PHPSESSID=${session}`,
      'User-Agent': userAgent
    }
  });

  if (!initRes.ok) {
    throw new Error('Falha ao conectar à Intranet da Winker');
  }

  const html = await initRes.text();

  // Se redirecionou para o login, a sessão expirou
  if (html.includes('LoginForm[username]')) {
    return { sessionExpired: true, boletos: [] };
  }

  // 2. Descobrir Unidades
  const units: { id: string; name: string }[] = [];
  const optionsMatch = html.match(/var UNIDADES_OPTIONS = ({[\s\S]*?});/);
  if (optionsMatch) {
    try {
      const parsed = JSON.parse(optionsMatch[1]);
      for (const [unitId, value] of Object.entries(parsed) as any) {
        units.push({ id: unitId, name: value.nome });
      }
    } catch (e) {
      console.error('Erro ao fazer parse de UNIDADES_OPTIONS:', e);
    }
  }

  // Fallback caso não encontre no JS
  if (units.length === 0) {
    const unidadeSelectRegex = /<select[^>]+id="Unidade_id_unidade"[^>]*>([\s\S]*?)<\/select>/;
    const matchUnidade = html.match(unidadeSelectRegex);
    if (matchUnidade) {
      const optionRegex = /<option[^>]+value="([^"]+)"[^>]*>([^<]+)<\/option>/g;
      let opt;
      while ((opt = optionRegex.exec(matchUnidade[1])) !== null) {
        if (opt[1]) {
          units.push({ id: opt[1], name: opt[2].trim() });
        }
      }
    }
  }

  // 3. Descobrir Referências/Meses
  const months: string[] = [];
  const refSelectRegex = /<select[^>]+id="UnidadeCobranca_data_ref_rateio"[^>]*>([\s\S]*?)<\/select>/;
  const matchRef = html.match(refSelectRegex);
  if (matchRef) {
    const optionRegex = /<option[^>]+value="([^"]+)"[^>]*>[^<]+<\/option>/g;
    let opt;
    while ((opt = optionRegex.exec(matchRef[1])) !== null) {
      if (opt[1]) {
        months.push(opt[1]);
      }
    }
  }

  // Pegar somente os 3 primeiros meses (mais recentes) para manter alta performance
  const monthsToQuery = months.slice(0, 3);
  if (monthsToQuery.length === 0) {
    // Fallback caso não ache
    const now = new Date();
    const getYearMonthStr = (d: Date, offsetMonths: number) => {
      const date = new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}${m}`;
    };
    monthsToQuery.push(getYearMonthStr(now, 0), getYearMonthStr(now, -1));
  }

  const divisionId = '35641';
  const boletos: any[] = [];

  // 4. Efetuar scrape em paralelo das combinações
  const tasks = [];
  for (const unit of units) {
    for (const month of monthsToQuery) {
      const url = `${baseUrl}?dataRefRateio=${month}&idUnidade=${unit.id}&idDivisao=${divisionId}`;
      tasks.push((async () => {
        try {
          const res = await fetch(url, {
            headers: {
              'Cookie': `PHPSESSID=${session}`,
              'User-Agent': userAgent
            }
          });
          if (!res.ok) return;
          const pageHtml = await res.text();
          
          const liRegex = /<li class="list-group-item">([\s\S]*?)<\/li>/g;
          let match;
          while ((match = liRegex.exec(pageHtml)) !== null) {
            const liHtml = match[1];
            if (liHtml.includes('view/rateio/')) {
              const idMatch = liHtml.match(/view\/rateio\/(\d+)/);
              const idB = idMatch ? idMatch[1] : null;

              const dateMatch = liHtml.match(/(\d{2}\/\d{2}\/\d{4})/);
              const vencimento = dateMatch ? dateMatch[1] : null;

              const valorMatch = liHtml.match(/R\$\s*([\d,.]+)/);
              const valor = valorMatch ? valorMatch[1] : null;

              const barcodeMatch = liHtml.match(/copiarCodigoBarras\('(\d+)'/);
              const linhaDigitavel = barcodeMatch ? barcodeMatch[1] : null;

              if (idB && !boletos.some(b => b.id === idB)) {
                boletos.push({
                  id: idB,
                  unidadeId: unit.id,
                  unidadeNome: unit.name,
                  referencia: `${month.substring(4)}/${month.substring(0, 4)}`,
                  vencimento,
                  valor: `R$ ${valor}`,
                  linhaDigitavel
                });
              }
            }
          }
        } catch (e: any) {
          console.error(`Erro ao buscar mês ${month} para unidade ${unit.name}:`, e.message);
        }
      })());
    }
  }

  await Promise.all(tasks);

  // Ordenar boletos por vencimento decrescente
  boletos.sort((a, b) => {
    const partsA = a.vencimento.split('/');
    const partsB = b.vencimento.split('/');
    const dateA = new Date(parseInt(partsA[2]), parseInt(partsA[1]) - 1, parseInt(partsA[0]));
    const dateB = new Date(parseInt(partsB[2]), parseInt(partsB[1]) - 1, parseInt(partsB[0]));
    return dateB.getTime() - dateA.getTime();
  });

  return { sessionExpired: false, boletos };
}
