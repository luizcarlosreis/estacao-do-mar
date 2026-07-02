import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');
const WINKER_API_TOKEN = '5c90521e-d469-4b39-b938-81ea1f4e9543';

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
    return NextResponse.json({ message: 'Não autenticado no portal' }, { status: 401 });
  }

  // Permissão apenas para administradores
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMINISTRADORA' && user.role !== 'CONSELHO') {
    return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
  }

  const url = 'https://api.winker.com.br/v1/portal/10493/unit';

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': WINKER_API_TOKEN,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error(`Erro ao buscar unidades da API Winker: Status ${res.status} - ${errorMsg}`);
      return NextResponse.json(
        { message: 'Falha ao buscar lista de unidades na API do Winker.' },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ message: 'Resposta inválida da API do Winker' }, { status: 502 });
    }

    // Mapear para um formato limpo
    const units = data.map((item: any) => ({
      id: String(item.id_unit),
      name: item.name || '',
      idDivision: String(item.id_division),
      division: item.division || 'Principal'
    }));

    // Ordenação natural (alfanumérica) das unidades (ex: Apt 11 antes de Apt 12, vagas depois)
    units.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return NextResponse.json(units);
  } catch (error: any) {
    console.error('Erro na rota de listagem de unidades:', error);
    return NextResponse.json({ message: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
