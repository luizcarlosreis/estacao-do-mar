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

  if (!idBoleto) {
    return NextResponse.json({ message: 'O ID do boleto é obrigatório para o download via API' }, { status: 400 });
  }

  try {
    // 2. Autenticação na API da Winker
    const loginUrl = 'https://api.winker.com.br/v1/auth/login';
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'luiz.carlos.reis@gmail.com',
        password: '280173',
        key: '1298309864872831'
      })
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      return NextResponse.json({ message: `Erro ao logar na Winker: ${errText}` }, { status: 500 });
    }

    const { token: winkerToken } = await loginRes.json();

    // 3. Efetuar o download do boleto via API da Winker
    const downloadUrl = `https://api.winker.com.br/v1/billing/${idBoleto}/download`;
    const downloadRes = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': winkerToken
      }
    });

    if (downloadRes.status === 404) {
      return NextResponse.json({ message: `Boleto com ID "${idBoleto}" não foi encontrado no sistema da Winker.` }, { status: 404 });
    }

    if (!downloadRes.ok) {
      const errText = await downloadRes.text();
      return NextResponse.json({ message: `Erro ao baixar o boleto: ${errText}` }, { status: downloadRes.status });
    }

    const pdfBuffer = await downloadRes.arrayBuffer();

    // Retornar o PDF binário diretamente
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="boleto_${idBoleto}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('Erro no download do boleto:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
