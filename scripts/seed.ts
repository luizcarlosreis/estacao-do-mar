import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin', 10);
  const passwordPortaria = await bcrypt.hash('Portaria', 10);
  const passwordZeladoria = await bcrypt.hash('Zeladoria', 10);

  // Criar Admin
  await prisma.user.upsert({
    where: { cpf: 'Admin' },
    update: {},
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
    update: {},
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
    update: {},
    create: {
      cpf: 'Zeladoria',
      name: 'Zeladoria',
      email: 'zeladoria@estacaodomar.com',
      password: passwordZeladoria,
      role: 'ZELADOR', // Assuming ZELADOR was added to Role in schema.prisma
    },
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
