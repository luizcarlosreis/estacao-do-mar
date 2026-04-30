import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, authorizationName, unitInfo } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ message: 'PDF não fornecido' }, { status: 400 });
    }

    console.log('Iniciando envio de e-mail...');
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE === 'true'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('API de E-mail: Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('API de E-mail: Conexão SMTP estabelecida com sucesso');

    const mailOptions = {
      from: `"Portal Estação do Mar" <${process.env.SMTP_USER}>`,
      to: 'luiz.carlos.reis@gmail.com',
      subject: `Nova Autorização: ${authorizationName} - Unidade ${unitInfo}`,
      text: `Olá,\n\nUma nova autorização de uso foi gerada para a unidade ${unitInfo}.\nSeguem os detalhes em anexo.`,
      attachments: [
        {
          filename: `Autorizacao_${authorizationName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    };

    console.log('API de E-mail: Tentando enviar mensagem...');
    const info = await transporter.sendMail(mailOptions);
    console.log('API de E-mail: E-mail enviado com sucesso! ID:', info.messageId);

    return NextResponse.json({ message: 'E-mail enviado com sucesso', messageId: info.messageId });
  } catch (error: any) {
    console.error('API de E-mail: ERRO CRÍTICO:', error);
    return NextResponse.json({ 
      message: 'Erro ao enviar e-mail', 
      error: error.message 
    }, { status: 500 });
  }
}
