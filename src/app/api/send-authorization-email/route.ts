import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const maxDuration = 60; // Aumenta o timeout para 60s no Vercel (plano Pro) ou mantém 10s no Free

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, authorizationName, unitInfo } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ message: 'PDF não fornecido' }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true';

    console.log('API E-mail: Configuração SMTP:', { smtpHost, smtpPort, smtpSecure, smtpUser });

    if (!smtpUser || !smtpPass) {
      console.error('API E-mail: SMTP_USER ou SMTP_PASS não configurados no ambiente!');
      return NextResponse.json({ 
        message: 'Configuração SMTP ausente. Verifique as variáveis SMTP_USER e SMTP_PASS no Vercel.' 
      }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Portal Estação do Mar" <${smtpUser}>`,
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

    console.log('API E-mail: Enviando mensagem para luiz.carlos.reis@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('API E-mail: Enviado com sucesso! ID:', info.messageId);

    return NextResponse.json({ message: 'E-mail enviado com sucesso', messageId: info.messageId });
  } catch (error: any) {
    console.error('API E-mail: ERRO:', error.code, error.message);
    return NextResponse.json({ 
      message: 'Erro ao enviar e-mail', 
      error: error.message,
      code: error.code,
      details: `Código: ${error.code || 'N/A'} | ${error.responseCode ? 'Resposta SMTP: ' + error.responseCode : ''}`
    }, { status: 500 });
  }
}
