import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, authorizationName, unitInfo } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ message: 'PDF não fornecido' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email enviado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ message: 'Erro ao enviar email', error: error.message }, { status: 500 });
  }
}
