import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const path = req.nextUrl.pathname;

  // Rotas públicas
  if (path === '/login' || path.startsWith('/api/login') || path.startsWith('/api/seed')) {
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

      // Verificação de acessos (Autorização RBAC)
      
      // ADMIN: Acesso a tudo
      if (role === 'SUPER_ADMIN') {
        return NextResponse.next();
      }

      // ZELADORIA: Apartamento, Moradores, Veículos, Autorizações, Manutençao e Tarefas
      if (role === 'ZELADOR') {
        const allowedPaths = ['/', '/unidades', '/moradores', '/veiculos', '/autorizacoes', '/manutencoes', '/tarefas', '/api'];
        if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }

      // PORTARIA: Apartamento, Moradores, Veículos e Autorizações
      if (role === 'PORTEIRO') {
        const allowedPaths = ['/', '/unidades', '/moradores', '/veiculos', '/autorizacoes', '/api'];
        if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }

      // MORADORES: Moradores, Veículos e Autorizações
      if (role === 'MORADOR') {
        const allowedPaths = ['/', '/moradores', '/veiculos', '/autorizacoes', '/api'];
        if (!allowedPaths.some(p => path.startsWith(p) || path === '/')) {
          return NextResponse.redirect(new URL('/autorizacoes', req.url)); // ou '/'
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
