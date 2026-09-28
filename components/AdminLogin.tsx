"use client";

import { useState } from "react";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";

/** Developer login for /admin: e-mail + password, then the 6-digit code sent by e-mail. */
export function AdminLogin() {
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function post(url: string, body: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({})) as { error?: string; challenge?: string };
    if (!response.ok) throw new Error(result.error ?? "Não foi possível entrar agora.");
    return result;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      if (step === "password") {
        const result = await post("/api/admin/login", { email, password });
        setChallenge(result.challenge ?? "");
        setPassword("");
        setStep("code");
      } else {
        await post("/api/admin/verify", { challenge, code });
        window.location.reload();
        return;
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível entrar agora.");
      if (step === "code" && /Entre de novo/.test(String(failure))) { setStep("password"); setCode(""); }
    }
    setBusy(false);
  }

  return <main className="adm adm-login">
    <form className="adm-login__card" onSubmit={submit}>
      <BrandLockup/>
      <p className="adm-eyebrow">Acesso restrito · equipe</p>
      <h1>Painel</h1>
      {step === "password" ? <>
        <p className="adm-login__lede">Entre com uma conta da equipe. Depois enviamos um código para o seu e-mail.</p>
        <label className="adm-field"><span>E-mail</span><span className="adm-input"><Mail aria-hidden="true"/><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)}/></span></label>
        <label className="adm-field"><span>Senha</span><span className="adm-input"><LockKeyhole aria-hidden="true"/><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)}/></span></label>
      </> : <>
        <p className="adm-login__lede">Enviamos um código de 6 dígitos para <strong>{email}</strong>. Ele vale por 10 minutos.</p>
        <label className="adm-field"><span>Código</span><span className="adm-input"><KeyRound aria-hidden="true"/><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus value={code} onChange={(event) => setCode(event.target.value)}/></span></label>
      </>}
      {error && <p className="adm-login__error" role="alert">{error}</p>}
      <button type="submit" className="adm-login__submit" disabled={busy}>{busy ? "Aguarde…" : step === "password" ? "Continuar" : "Entrar no painel"}</button>
      {step === "code" && <button type="button" className="adm-login__link" onClick={() => { setStep("password"); setCode(""); setError(""); }}>Voltar</button>}
    </form>
  </main>;
}
