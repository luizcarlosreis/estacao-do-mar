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
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Ajuda com problemas de certificado em alguns servidores
      }
    });

    // Verificar conexão antes de tentar enviar
    try {
      await transporter.verify();
      console.log('Conexão SMTP verificada com sucesso');
    } catch (verifyError) {
      console.error('Falha na verificação SMTP:', verifyError);
      throw new Error(`Falha na conexão SMTP: ${verifyError.message}`);
    }

    const mailOptions = {
      from: `"Estação do Mar" <${process.env.SMTP_USER}>`,
      to: 'luiz.carlos.reis@gmail.com',
      subject: `Nova Autorização: ${authorizationName} - Apt ${unitInfo}`,
      text: `Segue em anexo a nova autorização de uso para ${authorizationName} do apartamento ${unitInfo}.`,
      attachments: [
        {
          filename: `Autorizacao_${authorizationName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado! MessageId:', info.messageId);

    return NextResponse.json({ message: 'Email enviado com sucesso', messageId: info.messageId });
  } catch (error: any) {
    console.error('ERRO NO ENDPOINT DE EMAIL:', error);
    return NextResponse.json({ 
      message: 'Erro ao enviar email', 
      error: error.message,
      details: error.code // Pode ajudar a identificar erros tipo EAUTH, ETIMEDOUT
    }, { status: 500 });
  }
}
