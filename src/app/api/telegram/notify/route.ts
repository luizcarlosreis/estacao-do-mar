import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST: Enviar notificação de encomenda via Telegram
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ message: 'packageId é obrigatório.' }, { status: 400 });
    }

    // Buscar encomenda com morador
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        resident: true,
        unit: true
      }
    });

    if (!pkg) {
      return NextResponse.json({ message: 'Encomenda não encontrada.' }, { status: 404 });
    }

    if (!pkg.resident.telegramChatId) {
      return NextResponse.json({ message: 'Este morador não possui Telegram vinculado.' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ message: 'Token do bot do Telegram não configurado.' }, { status: 500 });
    }

    // Montar mensagem bonita
    const message = [
      `📦 *Nova Encomenda na Portaria!*`,
      ``,
      `Olá *${pkg.resident.name}*! 👋`,
      ``,
      `Uma encomenda foi recebida para o seu apartamento:`,
      ``,
      `🏢 *Unidade:* AP ${pkg.unit.number} - ${pkg.unit.block}`,
      `📋 *Tipo:* ${pkg.type}${pkg.size ? ` (${pkg.size})` : ''}`,
      pkg.carrier ? `🚚 *Transportadora:* ${pkg.carrier}` : null,
      `👤 *Recebido por:* ${pkg.conciergeName}`,
      `📅 *Data:* ${new Date(pkg.receivedAt).toLocaleString('pt-BR')}`,
      pkg.observations ? `📝 *Obs:* ${pkg.observations}` : null,
      ``,
      `Por favor, retire na portaria. 🏃‍♂️`
    ].filter(Boolean).join('\n');

    // Enviar via API do Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: pkg.resident.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      console.error('Erro Telegram API:', telegramData);
      return NextResponse.json(
        { message: `Erro do Telegram: ${telegramData.description || 'Falha desconhecida'}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ 
      message: 'Notificação enviada com sucesso!',
      telegramMessageId: telegramData.result?.message_id 
    });
  } catch (error) {
    console.error('Erro ao enviar notificação Telegram:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
