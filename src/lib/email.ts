import nodemailer from "nodemailer";

// Envio de e-mail via conta Gmail com senha de app (não a senha normal da
// conta) — gerada em myaccount.google.com/apppasswords, com verificação em
// duas etapas ativada. GMAIL_USER é o remetente e também quem recebe a
// senha de app.
const transporte =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

export async function enviarEmail({
  para,
  assunto,
  html,
}: {
  para: string;
  assunto: string;
  html: string;
}) {
  if (!transporte) {
    console.warn(
      `[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail "${assunto}" para ${para} não foi enviado.`
    );
    return;
  }

  await transporte.sendMail({
    from: `"Arena JR" <${process.env.GMAIL_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
}
