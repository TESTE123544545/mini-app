import { env } from "cloudflare:workers";

const APP_ORIGIN = "https://veiasdasintonia.com.br";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}

export function emailIsConfigured() {
  return Boolean((env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const bindings = env as unknown as { RESEND_API_KEY?: string; RESET_EMAIL_FROM?: string };
  if (!bindings.RESEND_API_KEY) throw new Error("Serviço de e-mail não configurado");
  const resetUrl = `${APP_ORIGIN}/?reset=${encodeURIComponent(token)}`;
  const safeUrl = escapeHtml(resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${bindings.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: bindings.RESET_EMAIL_FROM || "Veias da Sintonia <contato@veiasdasintonia.com.br>",
      to: [email],
      subject: "Redefina sua senha · Veias da Sintonia",
      text: `Recebemos um pedido para redefinir sua senha. Abra este link em até 30 minutos: ${resetUrl}\n\nSe você não fez o pedido, ignore esta mensagem.`,
      html: `<div style="background:#07143d;padding:32px;font-family:Arial,sans-serif;color:#f8f5ea"><div style="max-width:520px;margin:auto;background:#102866;border:1px solid #d9ad5266;border-radius:20px;padding:28px"><p style="color:#e7c776;font-size:12px;letter-spacing:2px;text-transform:uppercase">Veias da Sintonia</p><h1 style="font-family:Georgia,serif;font-size:28px;font-weight:500">Crie uma nova senha</h1><p style="color:#c4cde3;line-height:1.6">Recebemos um pedido para recuperar sua conta. Este link é válido por 30 minutos.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#e7c776;color:#07143d;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Redefinir minha senha</a></p><p style="color:#8f9bb9;font-size:13px;line-height:1.5">Se você não fez esse pedido, pode ignorar esta mensagem com segurança.</p></div></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Falha no envio (${response.status})`);
}
