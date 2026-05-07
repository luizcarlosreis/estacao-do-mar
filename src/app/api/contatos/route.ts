import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prisma = getPrisma();
    const contacts = await prisma.contact.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    return NextResponse.json({ message: 'Erro ao buscar contatos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const prisma = getPrisma();
    
    const contact = await prisma.contact.create({
      data: {
        name: data.name.toUpperCase(),
        description: data.description?.toUpperCase() || null,
        phones: data.phones ? JSON.stringify(data.phones) : null,
        email: data.email?.toLowerCase() || null,
        specialty: data.specialty?.toUpperCase() || null,
        document: data.document?.toUpperCase() || null
      }
    });
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    return NextResponse.json({ message: 'Erro ao criar contato' }, { status: 500 });
  }
}
