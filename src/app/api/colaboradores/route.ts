import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prisma = getPrisma();
  const employees = await prisma.employee.findMany();
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  try {
    const body = await request.json();
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
    const employee = await prisma.employee.create({ data: body });
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
