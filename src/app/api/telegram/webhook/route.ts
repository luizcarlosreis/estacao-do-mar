import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// Opcional: Função para enviar mensagem de volta pro Telegram
async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem pro Telegram:', error);
  }
}

export async function POST(request: Request) {
  try {
    const update = await request.json();

    // Verifica se é uma mensagem e se tem texto
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text.trim();

      // Verifica se é o comando de start com token
      if (text.startsWith('/start ')) {
        const token = text.split(' ')[1];

        if (token) {
          const prisma = await getPrisma();

          // Busca o morador pelo token
          const user = await prisma.user.findUnique({
            where: { telegramLinkToken: token },
          });

          if (user) {
            // Vincula o telegramChatId
            await prisma.user.update({
              where: { id: user.id },
              data: { telegramChatId: chatId },
            });

            // Envia mensagem de sucesso
            await sendTelegramMessage(
              chatId,
              `✅ Olá, ${user.name}! Sua conta do portal Estação do Mar foi vinculada com sucesso. A partir de agora você receberá notificações de encomendas por aqui!`
            );
          } else {
            // Token inválido ou já usado
            await sendTelegramMessage(
              chatId,
              '❌ Link de vinculação inválido ou não encontrado. Por favor, gere um novo link no portal.'
            );
          }
        }
      }
    }

    // O Telegram sempre espera um status 200 para não reenviar o webhook
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro no webhook do Telegram:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
