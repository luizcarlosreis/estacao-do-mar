import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const path = req.nextUrl.pathname;

  // Rotas públicas
  if (path === '/login' || path.startsWith('/api/login') || path.startsWith('/api/seed') || path === '/api/telegram/webhook') {
    if (token && path === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Rotas protegidas (tudo menos arquivos estáticos, _next, etc)
  // Como o Next.js lida com _next no matcher, normalmente isso não passa aqui, mas garantindo:
  if (!path.startsWith('/_next') && !path.includes('.')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      // Bloquear requisições de escrita para o perfil Conselho
      if (role === 'CONSELHO' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const readOnlyApiPaths = [
          '/api/unidades',
          '/api/autorizacoes',
          '/api/teste-boleto',
          '/api/cartao-credito',
          '/api/contatos',
          '/api/documentos',
          '/api/encomendas',
          '/api/leitura-gas',
          '/api/manutencoes',
          '/api/moradores',
          '/api/reservas',
          '/api/tarefas',
          '/api/veiculos'
        ];
        if (readOnlyApiPaths.some(p => path.startsWith(p))) {
          return NextResponse.json({ message: 'Acesso restrito a leitura para o perfil Conselho' }, { status: 403 });
        }
      }

      // Verificação de acessos (Autorização RBAC)
      
      if (role !== 'SUPER_ADMIN') {
        // ZELADORIA (usando role SINDICO provisoriamente para evitar migrations): Apartamento, Moradores, Veículos, Autorizações, Manutençao, Tarefas e Leitura de Gás
        if (role === 'SINDICO') {
          const allowedPaths = ['/', '/unidades', '/moradores', '/veiculos', '/autorizacoes', '/manutencoes', '/tarefas', '/leitura-gas', '/colaboradores', '/api', '/teste-boleto'];
          if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
            return NextResponse.redirect(new URL('/', req.url));
          }
        }

        // PORTARIA: Apartamento, Moradores, Veículos e Autorizações
        else if (role === 'PORTEIRO') {
          const allowedPaths = ['/', '/unidades', '/moradores', '/veiculos', '/autorizacoes', '/api', '/teste-boleto'];
          if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
            return NextResponse.redirect(new URL('/', req.url));
          }
        }

        // MORADORES: Moradores, Veículos, Autorizações e Leitura de Gás
        else if (role === 'MORADOR') {
          const allowedPaths = ['/', '/moradores', '/veiculos', '/autorizacoes', '/leitura-gas', '/api', '/teste-boleto', '/mural', '/encomendas', '/reservas', '/fale-sindico', '/documentos'];
          if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
            return NextResponse.redirect(new URL('/autorizacoes', req.url)); // ou '/'
          }
        }

        // CONSELHO: Consulta total (read-only) de Moradores, Veículos, Autorizações, Gás, Encomendas, Reservas, Documentos, Unidades, Manutenções, Contatos, Cartão de Crédito e Tarefas
        else if (role === 'CONSELHO') {
          const allowedPaths = ['/', '/moradores', '/veiculos', '/autorizacoes', '/leitura-gas', '/api', '/teste-boleto', '/encomendas', '/reservas', '/documentos', '/unidades', '/manutencoes', '/contatos', '/cartao-credito', '/tarefas'];
          if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
            return NextResponse.redirect(new URL('/autorizacoes', req.url)); // ou '/'
          }
        }

        // ADMINISTRADORA: Moradores e Leitura de Gás
        else if (role === 'ADMINISTRADORA') {
          const allowedPaths = ['/', '/moradores', '/leitura-gas', '/api', '/teste-boleto'];
          if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
            return NextResponse.redirect(new URL('/', req.url));
          }
        }
      }

      // Passar dados do usuário para o Header assim a API pode ler
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', payload.id as string);
      requestHeaders.set('x-user-role', payload.role as string);
      if (payload.unitId) {
        requestHeaders.set('x-user-unit', payload.unitId as string);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (err) {
      // Token inválido ou expirado
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
