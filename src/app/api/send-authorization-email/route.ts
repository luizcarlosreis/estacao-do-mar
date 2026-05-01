import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, authorizationName, unitInfo } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ message: 'PDF não fornecido' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('API E-mail: RESEND_API_KEY não configurada no ambiente!');
      return NextResponse.json({ 
        message: 'Configuração Resend ausente. Verifique a variável RESEND_API_KEY no ambiente.' 
      }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    console.log('API E-mail: Enviando mensagem via Resend para luiz.carlos.reis@gmail.com...');
    
    const { data, error } = await resend.emails.send({
      from: 'Portal Estação do Mar <onboarding@resend.dev>', // onboarding@resend.dev restringe envio para apenas e-mail verificado no tier gratuito
      to: ['luiz.carlos.reis@gmail.com'],
      subject: `Nova Autorização: ${authorizationName} - Unidade ${unitInfo}`,
      text: `Olá,\n\nUma nova autorização de uso foi gerada para a unidade ${unitInfo}.\nSeguem os detalhes em anexo.`,
      attachments: [
        {
          filename: `Autorizacao_${authorizationName.replace(/\s+/g, '_')}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
        },
      ],
    });

    if (error) {
      console.error('API E-mail: ERRO RESEND:', error);
      return NextResponse.json({ 
        message: 'Erro ao enviar e-mail pelo Resend', 
        error: error.message,
      }, { status: 500 });
    }

    console.log('API E-mail: Enviado com sucesso via Resend! ID:', data?.id);

    return NextResponse.json({ message: 'E-mail enviado com sucesso', messageId: data?.id });
  } catch (error: any) {
    console.error('API E-mail: ERRO:', error.message);
    return NextResponse.json({ 
      message: 'Erro ao enviar e-mail', 
      error: error.message,
    }, { status: 500 });
  }
}
