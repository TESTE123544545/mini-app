import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { ageFromDate, signFromDate } from "@/lib/birth";
import { useApp } from "../store";
import { Button, Card, Eyebrow, Field, Gap, H1, P, Screen } from "../ui";
import { C, F } from "../theme";

/** "15/03/1990" typed with a mask → "1990-03-15" (or null while incomplete or impossible). */
export function brToIso(value: string) {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d) || date > new Date() || Number(y) < 1900) return null;
  return `${y}-${mo}-${d}`;
}
export const maskDate = (text: string) => { const n = text.replace(/\D/g, "").slice(0, 8); return n.length > 4 ? `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}` : n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n; };
export const maskTime = (text: string) => { const n = text.replace(/\D/g, "").slice(0, 4); return n.length > 2 ? `${n.slice(0, 2)}:${n.slice(2)}` : n; };

export function AuthFlow() {
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome");
  if (mode === "welcome") return <Welcome onStart={() => setMode("register")} onLogin={() => setMode("login")}/>;
  return mode === "login" ? <Login onBack={() => setMode("welcome")} onRegister={() => setMode("register")}/> : <Register onBack={() => setMode("welcome")} onLogin={() => setMode("login")}/>;
}

function Welcome({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return <Screen scroll={false}>
    <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
      <Image source={require("../../assets/icon.png")} style={{ width: 96, height: 96, borderRadius: 24, alignSelf: "center" }}/>
      <Eyebrow>Veias da Sintonia</Eyebrow>
      <H1>Descubra o que o seu signo pede para você prosperar.</H1>
      <P>Astrologia que vira ação: um passo por dia, uma árvore que cresce com a sua constância. Sem promessas mágicas, só um caminho.</P>
      <Gap n={6}/>
      <Button label="Começar grátis" onPress={onStart}/>
      <Button kind="ghost" label="Já tenho conta" onPress={onLogin}/>
    </View>
  </Screen>;
}

function Login({ onBack, onRegister }: { onBack: () => void; onRegister: () => void }) {
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError("");
    try { await signIn(email.trim(), password); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível entrar."); setBusy(false); }
  }
  return <Screen>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable onPress={onBack}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
      <Gap/>
      <Eyebrow>Entrar</Eyebrow>
      <H1>Que bom ter você de volta.</H1>
      <Gap/>
      <Card>
        <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="voce@email.com"/>
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="password" placeholder="Sua senha"/>
        {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
        <Gap n={4}/>
        <Button label="Entrar" onPress={submit} busy={busy} disabled={!email || !password}/>
      </Card>
      <Gap/>
      <Button kind="ghost" label="Criar uma conta" onPress={onRegister}/>
    </KeyboardAvoidingView>
  </Screen>;
}

function Register({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const { signUp } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const iso = brToIso(birth);
  const sign = iso ? signFromDate(iso) : null;
  const age = iso ? ageFromDate(iso) : null;

  async function submit() {
    if (!iso) return;
    setBusy(true); setError("");
    const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
    try { await signUp(email.trim(), password, { name: name.trim(), birthDate: iso, birthTime: timeOk, birthPlace: place.trim() }); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar a conta."); setBusy(false); }
  }

  return <Screen>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable onPress={step === 0 ? onBack : () => setStep(step - 1)}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
      <Gap/>
      <Eyebrow>{`Passo ${step + 1} de 3`}</Eyebrow>
      {step === 0 && <>
        <H1>Como podemos chamar você?</H1><Gap/>
        <Card><Field label="Seu nome" value={name} onChangeText={setName} placeholder="Seu nome" autoComplete="name"/><Gap n={4}/>
          <Button label="Continuar" onPress={() => setStep(1)} disabled={name.trim().length < 2}/></Card>
      </>}
      {step === 1 && <>
        <H1>Quando e onde você nasceu?</H1><Gap/>
        <Card>
          <Field label="Data de nascimento" value={birth} onChangeText={(t) => setBirth(maskDate(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA"/>
          <Field label="Hora de nascimento (opcional)" value={time} onChangeText={(t) => setTime(maskTime(t))} keyboardType="number-pad" placeholder="HH:MM"/>
          <Field label="Cidade de nascimento (opcional)" value={place} onChangeText={setPlace} placeholder="Cidade"/>
          {sign && <P>Seu signo é <Text style={{ fontFamily: F.bold, color: C.goldSoft }}>{sign}</Text>{age !== null ? ` · ${age} anos` : ""}.</P>}
          <Gap n={4}/>
          <Button label="Continuar" onPress={() => setStep(2)} disabled={!iso}/>
        </Card>
      </>}
      {step === 2 && <>
        <H1>Crie seu acesso.</H1><Gap/>
        <Card>
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="voce@email.com"/>
          <Field label="Senha (mínimo 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Crie uma senha"/>
          {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
          <P dim>Ao criar a conta você ganha 3 dias de Premium para experimentar tudo.</P>
          <Gap n={4}/>
          <Button label="Criar minha conta" onPress={submit} busy={busy} disabled={!email.includes("@") || password.length < 8}/>
        </Card>
        <Gap/>
        <Button kind="ghost" label="Já tenho conta" onPress={onLogin}/>
      </>}
    </KeyboardAvoidingView>
  </Screen>;
}

