import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST: Vincular telegramChatId ao morador logado
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const { userId, telegramChatId } = body;

    if (!userId || !telegramChatId) {
      return NextResponse.json(
        { message: 'userId e telegramChatId são obrigatórios.' },
        { status: 400 }
      );
    }

    const chatIdStr = String(telegramChatId).trim();

    // Verificar se o morador existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'Morador não encontrado.' }, { status: 404 });
    }

    // Atualizar o telegramChatId
    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: chatIdStr }
    });

    // Enviar mensagem de boas-vindas via Bot
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatIdStr,
            text: `✅ *Telegram vinculado com sucesso!*\n\nOlá ${user.name}! 🏢\nSeu Telegram foi vinculado ao sistema *Estação do Mar*.\n\nVocê agora receberá notificações de encomendas diretamente aqui. 📦`,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error('Erro ao enviar mensagem de boas-vindas:', e);
      }
    }

    return NextResponse.json({ 
      message: 'Telegram vinculado com sucesso!',
      telegramChatId: chatIdStr 
    });
  } catch (error) {
    console.error('Erro ao vincular Telegram:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// DELETE: Desvincular Telegram
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'userId é obrigatório.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null }
    });

    return NextResponse.json({ message: 'Telegram desvinculado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desvincular Telegram:', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
