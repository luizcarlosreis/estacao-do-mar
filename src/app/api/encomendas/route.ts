import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_123');

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const packageNumber = searchParams.get('packageNumber');

    const where: any = {};
    if (packageNumber && packageNumber.trim() !== '') {
      where.number = parseInt(packageNumber);
    } else {
      if (unitId) where.unitId = unitId;
      if (status && status !== 'TODOS') where.status = status;

      if (month || year) {
        const y = year ? parseInt(year) : new Date().getFullYear();
        if (month) {
          const m = parseInt(month);
          where.receivedAt = {
            gte: new Date(y, m - 1, 1),
            lt: new Date(y, m, 1),
          };
        } else {
          where.receivedAt = {
            gte: new Date(y, 0, 1),
            lt: new Date(y + 1, 0, 1),
          };
        }
      }
    }

    const data = await prisma.package.findMany({
      where,
      include: {
        unit: true,
        resident: true,
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    
    const pkg = await prisma.package.create({
      data: {
        unitId: body.unitId,
        residentId: body.residentId,
        type: body.type,
        size: body.size,
        carrier: body.carrier,
        observations: body.observations,
        conciergeName: body.conciergeName,
      },
      include: {
        unit: true,
        resident: true,
      }
    });

    // Notificação por E-mail
    if (pkg.resident.email) {
      console.log(`Tentando enviar e-mail para: ${pkg.resident.email}`);
      try {
        const emailResponse = await resend.emails.send({
          from: 'Estação do Mar <contato@estacaodomar.com.br>',
          to: pkg.resident.email,
          subject: `📦 Nova Encomenda Recebida na Portaria (Nº #${pkg.number})`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #334155;">
              <h2 style="color: #0f172a;">Olá, ${pkg.resident.name}!</h2>
              <p>Uma nova encomenda foi recebida para você na portaria do <strong>Condomínio Estação do Mar</strong>.</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>🔢 Número da Mercadoria:</strong> #${pkg.number}</p>
                <p style="margin: 5px 0;"><strong>📦 Tipo:</strong> ${pkg.type}</p>
                <p style="margin: 5px 0;"><strong>🏷️ Transportadora/Remetente:</strong> ${pkg.carrier || 'Não informada'}</p>
                <p style="margin: 5px 0;"><strong>🏢 Unidade:</strong> ${pkg.unit.number} - ${pkg.unit.block}</p>
                <p style="margin: 5px 0;"><strong>🕒 Recebido em:</strong> ${new Date(pkg.receivedAt).toLocaleString('pt-BR')}</p>
              </div>

              <p>Por favor, dirija-se à portaria para efetuar a retirada.</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">Esta é uma mensagem automática do sistema Estação do Mar. Por favor não responda.</p>
            </div>
          `,
        });
        console.log('Resposta do Resend:', emailResponse);
      } catch (err) {
        console.error('Erro CRÍTICO ao enviar e-mail via Resend:', err);
      }
    } else {
      console.log(`Morador ${pkg.resident.name} não possui e-mail cadastrado.`);
    }

    return NextResponse.json(pkg);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
