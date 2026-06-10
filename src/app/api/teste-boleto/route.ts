import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function GET(req: NextRequest) {
  // 1. Validar autenticação do usuário do portal
  const token = req.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idBoleto = searchParams.get('idBoleto');

  try {
    // 2. Autenticação na Intranet da Winker (Yii2 form-based login)
    const loginUrl = 'https://app.winker.com.br/intra/default/login';
    const form = new URLSearchParams();
    form.append('LoginForm[username]', 'luiz.carlos.reis@gmail.com');
    form.append('LoginForm[password]', '280173');

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
    const cookieHeader = cookies.join('; ');

    if (!cookieHeader) {
      return NextResponse.json({ message: 'Não foi possível obter o cookie de sessão da Winker' }, { status: 500 });
    }

    // 3. Caso queira baixar um boleto específico
    if (idBoleto) {
      const downloadUrl = `https://app.winker.com.br/intra/meuCondominio/boleto/view/rateio/${idBoleto}`;
      const downloadRes = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!downloadRes.ok) {
        return NextResponse.json({ message: `Erro ao baixar boleto da Winker: ${downloadRes.statusText}` }, { status: downloadRes.status });
      }

      const cType = downloadRes.headers.get('content-type') || '';
      if (!cType.includes('pdf')) {
        return NextResponse.json({ message: 'O boleto requisitado não retornou um PDF válido.' }, { status: 400 });
      }

      const pdfBuffer = await downloadRes.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="boleto_${idBoleto}.pdf"`
        }
      });
    }

    // 4. Caso queira listar os boletos
    const units = [
      { id: '863361', name: 'Apartamento 83' },
      { id: '863378', name: 'Garagem VG. 56' }
    ];

    const now = new Date();
    const getYearMonthStr = (d: Date, offsetMonths: number) => {
      const date = new Date(d.getFullYear(), d.getMonth() + offsetMonths, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      return `${y}${m}`;
    };

    const months = [
      getYearMonthStr(now, 1),  // Próximo mês
      getYearMonthStr(now, 0),  // Mês atual
      getYearMonthStr(now, -1), // Mês anterior
      getYearMonthStr(now, -2)  // Dois meses atrás
    ];

    const divisionId = '35641';
    const boletos: any[] = [];

    const tasks = [];
    for (const unit of units) {
      for (const month of months) {
        const url = `https://app.winker.com.br/intra/meuCondominio/boleto?dataRefRateio=${month}&idUnidade=${unit.id}&idDivisao=${divisionId}`;
        
        tasks.push((async () => {
          try {
            const res = await fetch(url, {
              headers: {
                'Cookie': cookieHeader,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            if (!res.ok) return;
            const html = await res.text();
            
            const liRegex = /<li class="list-group-item">([\s\S]*?)<\/li>/g;
            let match;
            while ((match = liRegex.exec(html)) !== null) {
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

    return NextResponse.json(boletos);

  } catch (error: any) {
    console.error('Erro no processamento do boleto:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
