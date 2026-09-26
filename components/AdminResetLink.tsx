"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

type Result = { email: string; url: string; expiresAt: string };

/** Team-only (ADMIN_EMAILS): create a one-time "Crie uma nova senha" link to send by hand. */
export function AdminResetLink() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true); setResult(null); setCopied(false);
    try {
      const response = await fetch("/api/admin/reset-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      const data = await response.json().catch(() => ({})) as Partial<Result> & { error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Não foi possível gerar o link.");
      setResult(data as Result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o link.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.url); setCopied(true); } catch { toast.error("Copie o link manualmente."); }
  }

  const expires = result ? new Date(result.expiresAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

  return <section className="surface-card admin-reset">
    <div className="section-heading"><div><h2>Recuperar senha de alguém</h2><p className="admin-metrics__sub">Gera um link de uso único para você enviar à pessoa (por WhatsApp, por exemplo). Vale por 24 horas.</p></div><KeyRound aria-hidden="true"/></div>
    <form className="admin-reset__form" onSubmit={generate}>
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@da-pessoa.com" aria-label="E-mail da conta" required/>
      <button type="submit" className="gold-button" disabled={busy}>{busy ? "Gerando…" : "Gerar link"}</button>
    </form>
    {result && <div className="admin-reset__result">
      <p>Link para <strong>{result.email}</strong> · válido até {expires}</p>
      <code>{result.url}</code>
      <button type="button" className="ghost-button" onClick={copy}>{copied ? <><Check size={15}/> Copiado</> : <><Copy size={15}/> Copiar link</>}</button>
    </div>}
  </section>;
}
