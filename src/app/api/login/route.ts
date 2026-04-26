import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-estacao-do-mar');

export async function POST(req: NextRequest) {
  try {
    const { cpf, password } = await req.json();

    if (!cpf || !password) {
      return NextResponse.json({ message: 'CPF e senha são obrigatórios' }, { status: 400 });
    }

    const prisma = getPrisma();
    // Procura o usuário
    let user = await prisma.user.findUnique({
      where: { cpf }
    });

    // Lógica para moradores: se não tem senha setada (ou se for igual aos 5 primeiros do CPF)
    // Opcionalmente, pode ser apenas comparar a senha fornecida com a salva.
    // Mas a instrução diz: "o login do usuário será o seu cpf e a senha as 5 primeiras posições do cpf"
    
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ message: 'Credenciais inválidas' }, { status: 401 });
      }

      // Se passou, cria o token
      const token = await new SignJWT({ 
        id: user.id, 
        role: user.role, 
        cpf: user.cpf, 
        unitId: user.unitId,
        name: user.name
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      const response = NextResponse.json({ message: 'Login realizado com sucesso', user: { id: user.id, name: user.name, role: user.role, unitId: user.unitId } });
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 1 dia
      });

      return response;
    }

    return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Erro interno no servidor' }, { status: 500 });
  }
}
