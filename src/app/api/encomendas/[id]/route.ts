import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    const body = await request.json();

    const pkg = await prisma.package.update({
      where: { id: params.id },
      data: {
        status: 'RETIRADO',
        withdrawnAt: new Date(),
        withdrawnBy: body.withdrawnBy,
      },
    });

    return NextResponse.json(pkg);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const prisma = getPrisma();
    const params = await context.params;
    await prisma.package.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
