import { env } from "cloudflare:workers";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}

type EmailAddress = { email: string; name?: string };
type EmailBinding = { send(message: { from: string | EmailAddress; to: string | string[]; subject: string; html?: string; text?: string }): Promise<{ messageId: string }> };
type EmailEnv = { EMAIL?: EmailBinding; RESEND_API_KEY?: string; RESET_EMAIL_FROM?: string };
const bindings = () => env as unknown as EmailEnv;

const SENDER: EmailAddress = { email: "contato@veiasdasintonia.com.br", name: "Veias da Sintonia" };

/**
 * Resend sends today (RESEND_API_KEY). An EMAIL binding (Cloudflare Email Service) is used instead
 * when present — it needs the Workers Paid plan, which this account does not have yet.
 */
export function emailIsConfigured() {
  const current = bindings();
  return Boolean(current.EMAIL || current.RESEND_API_KEY);
}

async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const current = bindings();
  if (current.EMAIL) {
    await current.EMAIL.send({ from: SENDER, ...message });
    return;
  }
  if (!current.RESEND_API_KEY) throw new Error("Serviço de e-mail não configurado");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${current.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: current.RESET_EMAIL_FROM || `${SENDER.name} <${SENDER.email}>`, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
  });
  if (!response.ok) throw new Error(`Falha no envio (${response.status})`);
}

/** Sends the reset link in the app's light studio look: warm white card, ink type, black pill. */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl);
  await sendEmail({
    to: email,
    subject: "Crie uma nova senha · Veias da Sintonia",
    text: `Recebemos um pedido para criar uma nova senha na sua conta do Veias da Sintonia. Abra este link em até 30 minutos: ${resetUrl}\n\nSe você não fez esse pedido, pode ignorar esta mensagem.`,
    html: `<div style="background:#e9e7e3;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#141414"><div style="max-width:520px;margin:auto;background:#ffffff;border-radius:20px;padding:32px 28px"><p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#141414">Veias da Sintonia</p><h1 style="margin:0 0 12px;font-size:26px;line-height:1.15;color:#141414">Crie uma nova senha</h1><p style="margin:0;color:#4f4b45;line-height:1.6">Recebemos um pedido para recuperar sua conta. Este link vale por 30 minutos e só pode ser usado uma vez.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#141414;color:#faf8f3;text-decoration:none;font-weight:700;padding:15px 26px;border-radius:999px">Criar nova senha</a></p><p style="margin:0;color:#6b665e;font-size:13px;line-height:1.5">Se você não fez esse pedido, pode ignorar esta mensagem com segurança. Sua senha atual continua valendo.</p></div></div>`,
  });
}
