"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Eye, EyeOff, LockKeyhole, Mail, MapPin, UserRound } from "lucide-react";
import { ageFromDate, signFromDate } from "@/lib/birth";
import { localDayKey } from "@/lib/daily";

export type RegisterSeed = { name: string; birthDate: string; birthTime: string; birthPlace: string };

type Step = "name" | "date" | "time" | "place" | "reveal" | "email" | "password";
const STEPS: Step[] = ["name", "date", "time", "place", "reveal", "email", "password"];

const COPY: Record<Step, { title: string; lede: string }> = {
  name: { title: "Como podemos chamar você?", lede: "Vamos montar o seu mapa de prosperidade, uma pergunta por vez." },
  date: { title: "Qual é a sua data de nascimento?", lede: "Com ela descobrimos a sua idade e o seu signo." },
  time: { title: "Que horas você nasceu?", lede: "Se não souber o horário exato, tudo bem: um palpite ou pular funciona." },
  place: { title: "Em que cidade você nasceu?", lede: "Cidade e estado, se quiser. Ex.: Belo Horizonte, MG." },
  reveal: { title: "", lede: "" },
  email: { title: "Qual é o seu e-mail?", lede: "É com ele que você entra e recupera a sua senha." },
  password: { title: "Crie uma senha", lede: "Pelo menos 8 caracteres. Sua jornada fica guardada na sua conta." },
};

/** The sign-up: a few basic questions first (name, birth), then the e-mail and password. */
export function RegisterWizard({ onRegister, onLogin }: { onRegister: (data: { email: string; password: string; seed: RegisterSeed }) => Promise<void>; onLogin: () => void }) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const index = STEPS.indexOf(step);
  const age = ageFromDate(birthDate);
  const sign = age === null ? null : signFromDate(birthDate);
  const firstName = name.trim().split(/\s+/)[0] ?? "";

  const edit = (set: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement>) => { setError(""); set(event.target.value); };
  function go(next: Step) { setError(""); setStep(next); }
  function back() { if (index > 0) go(STEPS[index - 1]); }

  function problem(): string {
    if (step === "name") return name.trim().length < 2 ? "Digite o seu nome." : "";
    if (step === "date") return age === null ? "Digite uma data de nascimento válida." : "";
    if (step === "place") return birthPlace.trim().length < 2 ? "Digite a cidade onde você nasceu, ou toque em “Não sei”." : "";
    if (step === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? "" : "Digite um e-mail válido.";
    if (step === "password") {
      if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
      if (password !== confirmation) return "As senhas não são iguais.";
    }
    return "";
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = problem();
    if (found) return setError(found);
    if (step !== "password") return go(STEPS[index + 1]);
    setError(""); setLoading(true);
    try {
      await onRegister({ email: email.trim(), password, seed: { name: name.trim(), birthDate, birthTime, birthPlace: birthPlace.trim() } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar a conta.");
      setLoading(false);
    }
  }

  const copy = step === "reveal"
    ? { title: `Prazer, ${firstName}.`, lede: "Veja o que a sua data de nascimento já nos conta. Falta só criar o seu acesso." }
    : COPY[step];

  return <section className="entry-panel" aria-labelledby="entry-auth-title">
    <div className="entry-steps" role="progressbar" aria-label={`Passo ${index + 1} de ${STEPS.length}`} aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1}>
      {STEPS.map((item, position) => <i key={item} className={position <= index ? "is-done" : ""}/>)}
    </div>
    <h1 className="entry-title entry-title--panel" id="entry-auth-title">{copy.title}</h1>
    <p className="entry-lede">{copy.lede}</p>

    <form className="entry-form" onSubmit={submit} key={step}>
      {step === "name" && <label className="entry-field">Nome<span className="entry-input"><UserRound aria-hidden="true"/><input name="name" autoComplete="given-name" autoFocus value={name} onChange={edit(setName)} placeholder="Seu nome" maxLength={80}/></span></label>}

      {step === "date" && <>
        <label className="entry-field">Data de nascimento<span className="entry-input"><CalendarDays aria-hidden="true"/><input type="date" name="bday" autoComplete="bday" autoFocus value={birthDate} min="1900-01-01" max={localDayKey()} onChange={edit(setBirthDate)}/></span></label>
        {sign && age !== null && <p className="entry-message entry-message--ok" role="status">Você tem {age} {age === 1 ? "ano" : "anos"} e é de {sign}.</p>}
      </>}

      {step === "time" && <>
        <label className="entry-field">Horário de nascimento<span className="entry-input"><Clock3 aria-hidden="true"/><input type="time" name="birth-time" autoFocus value={birthTime} onChange={edit(setBirthTime)}/></span></label>
        <button type="button" className="entry-link" onClick={() => { setBirthTime(""); go("place"); }}>Não sei o horário</button>
      </>}

      {step === "place" && <>
        <label className="entry-field">Cidade onde nasceu<span className="entry-input"><MapPin aria-hidden="true"/><input name="birth-place" autoComplete="off" autoFocus value={birthPlace} onChange={edit(setBirthPlace)} placeholder="Cidade, UF" maxLength={80}/></span></label>
        <button type="button" className="entry-link" onClick={() => { setBirthPlace(""); go("reveal"); }}>Não sei</button>
      </>}

      {step === "reveal" && sign && age !== null && <div className="entry-reveal">
        <span>{age} {age === 1 ? "ano" : "anos"}</span>
        <strong>Signo de {sign}</strong>
        <small>{[birthTime && `nascido(a) às ${birthTime}`, birthPlace.trim() && `em ${birthPlace.trim()}`].filter(Boolean).join(" ") || "Sua leitura diária parte daqui."}</small>
      </div>}

      {step === "email" && <label className="entry-field">E-mail<span className="entry-input"><Mail aria-hidden="true"/><input type="email" name="email" autoComplete="username" autoFocus value={email} onChange={edit(setEmail)} placeholder="voce@email.com"/></span></label>}

      {step === "password" && <>
        <label className="entry-field">Senha<span className="entry-input"><LockKeyhole aria-hidden="true"/><input type={visible ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={edit(setPassword)} placeholder="Mínimo de 8 caracteres"/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff/> : <Eye/>}</button></span></label>
        <label className="entry-field">Confirme sua senha<span className="entry-input"><LockKeyhole aria-hidden="true"/><input type={visible ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={edit(setConfirmation)} placeholder="Digite novamente"/></span></label>
      </>}

      {error && <p className="entry-message entry-message--error" role="alert">{error}</p>}
      <button className="entry-pill entry-pill--solid entry-pill--wide" disabled={loading} aria-busy={loading}>{loading ? "Aguarde…" : step === "password" ? "Criar minha conta" : "Continuar"}{!loading && <ArrowRight aria-hidden="true"/>}</button>
      {index > 0 && <button type="button" className="entry-step-back" onClick={back} disabled={loading}><ArrowLeft aria-hidden="true"/> Voltar</button>}
    </form>

    {step === "password" && <p className="entry-legal">Ao criar a conta, você confirma ter 18 anos ou mais (ou 16, com autorização dos responsáveis) e concorda com os <a href="/termos" target="_blank" rel="noopener">Termos de uso</a> e a <a href="/privacidade" target="_blank" rel="noopener">Política de Privacidade</a>.</p>}

    <div className="entry-have-account">
      <span>Já tem conta?</span>
      <button type="button" className="entry-pill entry-pill--line entry-pill--wide" onClick={onLogin}>Clique aqui para entrar</button>
    </div>
  </section>;
}
