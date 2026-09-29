import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { enforceRateLimit, secureErrorResponse } from "@/lib/security";

/**
 * Unsubscribe from the trial e-mails. The link carries a random per-account token, which is the
 * only authorisation needed. GET shows a confirmation button (mail scanners open links, so a GET
 * never changes anything); POST opts out — from that button or from the mail provider's one-click
 * List-Unsubscribe.
 */
const page = (title: string, body: string, form = "") => new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070f24;color:#eef1f8;font-family:system-ui,sans-serif;padding:24px;box-sizing:border-box}main{max-width:420px;text-align:center}h1{font-family:Georgia,serif;font-weight:600;color:#f1d9a0}p{color:#c3cbe0;line-height:1.6}button,a{display:inline-block;margin-top:12px;min-height:48px;padding:0 26px;border:0;border-radius:999px;background:#d9b26a;color:#0b1633;font:inherit;font-weight:700;text-decoration:none;line-height:48px;cursor:pointer}</style></head>
<body><main><h1>${title}</h1><p>${body}</p>${form}</main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

const tokenOf = (request: Request) => (new URL(request.url).searchParams.get("t") ?? "").slice(0, 128);

export async function GET(request: Request) {
  const token = tokenOf(request);
  if (token.length < 32) return page("Link inválido", "Este link de descadastro não é válido.");
  return page("Parar de receber e-mails?", "Você não vai mais receber os e-mails sobre o teste Premium do Veias da Sintonia. Sua conta continua funcionando normalmente.",
    `<form method="post" action="/api/email/unsubscribe?t=${encodeURIComponent(token)}"><button type="submit">Confirmar</button></form>`);
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, "unsubscribe", "all", 30, 3600);
    const token = tokenOf(request);
    if (token.length >= 32) await getDb().update(users).set({ emailOptOut: true, updatedAt: new Date().toISOString() }).where(eq(users.emailToken, token));
    return page("Pronto", "Você não vai mais receber estes e-mails. Se mudar de ideia, é só falar com a gente pelo app.", `<a href="/">Abrir o app</a>`);
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível concluir agora.");
  }
}
