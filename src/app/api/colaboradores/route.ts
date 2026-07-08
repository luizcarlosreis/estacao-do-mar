import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET() {
  
  const employees = await (getPrisma()).employee.findMany();
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  
  try {
    const body = await request.json();
    const { id: _, ...createData } = body;
    if (createData.password) {
      createData.password = await bcrypt.hash(createData.password, 10);
    }
    if (createData.birthDate && createData.birthDate.trim() !== '') {
      createData.birthDate = new Date(createData.birthDate);
    } else {
      createData.birthDate = null;
    }
    const employee = await (getPrisma()).employee.create({ data: createData });
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

