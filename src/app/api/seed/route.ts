import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const prisma = getPrisma();
    const passwordAdmin = await bcrypt.hash('Admin', 10);
    const passwordPortaria = await bcrypt.hash('Portaria', 10);
    const passwordZeladoria = await bcrypt.hash('Zeladoria', 10);

    // Criar Admin
    await prisma.user.upsert({
      where: { cpf: 'Admin' },
      update: { password: passwordAdmin },
      create: {
        cpf: 'Admin',
        name: 'Administrador',
        email: 'admin@estacaodomar.com',
        password: passwordAdmin,
        role: 'SUPER_ADMIN',
      },
    });

    // Criar Portaria
    await prisma.user.upsert({
      where: { cpf: 'Portaria' },
      update: { password: passwordPortaria },
      create: {
        cpf: 'Portaria',
        name: 'Portaria',
        email: 'portaria@estacaodomar.com',
        password: passwordPortaria,
        role: 'PORTEIRO',
      },
    });

    // Criar Zeladoria
    await prisma.user.upsert({
      where: { cpf: 'Zeladoria' },
      update: { password: passwordZeladoria },
      create: {
        cpf: 'Zeladoria',
        name: 'Zeladoria',
        email: 'zeladoria@estacaodomar.com',
        password: passwordZeladoria,
        role: 'ZELADOR',
      },
    });

    return NextResponse.json({ message: 'Seed concluído com sucesso' });
  } catch (error: any) {
    console.error('Erro no seed:', error);
    return NextResponse.json({ message: 'Erro no seed', error: error.message }, { status: 500 });
  }
}
