import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Plus, Send, X } from "lucide-react-native";
import { api, ApiError } from "../api";
import { useApp } from "../store";
import { Button, Card, Eyebrow, H2, P, Screen } from "../ui";
import { C, F } from "../theme";
import type { View as TabView } from "../nav";

type Turn = { role: "user" | "assistant"; content: string };
type Thread = { id: number; title: string; updatedAt: string };
const NAME = "Sintonia";
const STARTERS = ["Como vai ser meu dia hoje?", "O que o céu de hoje pede de mim?", "Me dá uma frase para hoje"];

export function ChatScreen({ go, initialPrompt, onPromptUsed }: { go: (view: TabView) => void; initialPrompt: string | null; onPromptUsed: () => void }) {
  const { profile, isPremium, openPaywall, say } = useApp();
  const greeting = useMemo<Turn>(() => ({ role: "assistant", content: `Oi, sou a ${NAME}. Esse é um espaço pra você pensar em voz alta, desabafar ou só conversar sobre a sua jornada, ${profile.name.split(" ")[0]}. Como você está agora?` }), [profile.name]);
  const [messages, setMessages] = useState<Turn[]>([greeting]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const list = useRef<ScrollView>(null);

  useEffect(() => { list.current?.scrollToEnd({ animated: true }); }, [messages, sending]);
  useEffect(() => {
    if (!isPremium) return;
    api<{ threads?: Thread[] }>("/api/chat/threads").then((data) => { if (Array.isArray(data?.threads)) setThreads(data.threads); }).catch(() => {});
  }, [isPremium]);

  const sendRef = useRef<(preset?: string) => Promise<void>>(async () => {});
  useEffect(() => {
    if (!isPremium || !initialPrompt) return;
    onPromptUsed();
    void sendRef.current(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per handed-over question
  }, [initialPrompt, isPremium]);

  if (!isPremium) return <Screen>
    <Pressable onPress={() => go("home")}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
    <Card>
      <Eyebrow>Conversar</Eyebrow>
      <H2>Desabafe com a IA sempre que precisar</H2>
      <P>Um espaço de escuta, disponível a qualquer hora, com contexto do seu signo e da sua jornada.</P>
      <Button label="Desbloquear conversa" onPress={() => openPaywall("chat")}/>
    </Card>
  </Screen>;

  function newChat() { if (sending) return; setThreadId(null); setMessages([greeting]); setInput(""); }

  async function openThread(id: number) {
    if (id === threadId || sending) return;
    try {
      const data = await api<{ messages?: Turn[] }>(`/api/chat/threads?id=${id}`);
      if (!Array.isArray(data.messages)) throw new Error();
      setThreadId(id); setMessages(data.messages.length ? data.messages : [greeting]);
    } catch { say("Não foi possível abrir essa conversa agora."); }
  }
  async function deleteThread(id: number) {
    setThreads((current) => current.filter((item) => item.id !== id));
    if (id === threadId) newChat();
    try { await api(`/api/chat/threads?id=${id}`, { method: "DELETE" }); } catch { say("Não foi possível remover essa conversa agora."); }
  }

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || sending) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput(""); setSending(true);
    try {
      const { reply, threadId: saved } = await api<{ reply: string; threadId?: number }>("/api/chat", { method: "POST", body: { threadId: threadId ?? undefined, message: text, lang: "pt" } });
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      if (typeof saved === "number") {
        const isNew = saved !== threadId;
        setThreadId(saved);
        setThreads((current) => {
          const rest = current.filter((item) => item.id !== saved);
          const title = isNew ? (text.length > 40 ? `${text.slice(0, 40)}…` : text) : (current.find((item) => item.id === saved)?.title ?? text);
          return [{ id: saved, title, updatedAt: new Date().toISOString() }, ...rest];
        });
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof ApiError || error instanceof Error ? error.message : "Não foi possível responder agora." }]);
    } finally { setSending(false); }
  }
  sendRef.current = send;

  return <Screen scroll={false}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Pressable onPress={() => go("home")}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginVertical: 10 }} contentContainerStyle={{ gap: 8 }}>
        <Pressable onPress={newChat} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: threadId === null ? C.gold : C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}><Plus size={14} color={C.gold}/><Text style={{ fontFamily: F.bold, color: C.ink, fontSize: 13 }}>Novo chat</Text></Pressable>
        {threads.map((item) => <Pressable key={item.id} onPress={() => openThread(item.id)} style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: item.id === threadId ? C.gold : C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 200 }}>
          <Text numberOfLines={1} style={{ fontFamily: F.bold, color: C.ink, fontSize: 13, flexShrink: 1 }}>{item.title || "Conversa"}</Text>
          <Pressable accessibilityLabel="Remover conversa" onPress={() => deleteThread(item.id)} hitSlop={8}><X size={13} color={C.ink3}/></Pressable>
        </Pressable>)}
      </ScrollView>
      <ScrollView ref={list} style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
        {messages.map((turn, index) => <View key={index} style={{ alignSelf: turn.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: turn.role === "user" ? C.goldDeep : C.card, borderRadius: 18, borderWidth: turn.role === "user" ? 0 : 1, borderColor: C.lineSoft, padding: 12, gap: 2 }}>
          {turn.role === "assistant" && <Text style={{ fontFamily: F.black, fontSize: 11, color: C.gold }}>{NAME}</Text>}
          <Text selectable style={{ fontFamily: F.body, fontSize: 15, lineHeight: 22, color: turn.role === "user" ? C.bg : C.ink2 }}>{turn.content}</Text>
        </View>)}
        {sending && <View style={{ alignSelf: "flex-start", backgroundColor: C.card, borderRadius: 18, padding: 12 }}><Text style={{ color: C.ink3, fontFamily: F.body }}>{NAME} está escrevendo…</Text></View>}
        {messages.length === 1 && !sending && <View style={{ gap: 8 }}>{STARTERS.map((starter) => <Button key={starter} kind="ghost" label={starter} onPress={() => send(starter)}/>)}</View>}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
        <TextInput value={input} onChangeText={setInput} multiline maxLength={2000} placeholder="Escreva o que você está sentindo…" placeholderTextColor={C.ink3} style={{ flex: 1, maxHeight: 120, fontFamily: F.body, fontSize: 15, color: C.ink, backgroundColor: C.card2, borderRadius: 18, borderWidth: 1, borderColor: C.lineSoft, paddingHorizontal: 14, paddingVertical: 10 }}/>
        <Pressable accessibilityLabel="Enviar" disabled={!input.trim() || sending} onPress={() => send()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.goldDeep, alignItems: "center", justifyContent: "center", opacity: !input.trim() || sending ? 0.5 : 1 }}><Send size={18} color={C.bg}/></Pressable>
      </View>
      <Text style={{ fontFamily: F.body, fontSize: 11, color: C.ink3, textAlign: "center", marginTop: 6, marginBottom: 8 }}>A IA não substitui ajuda profissional. Em emergência, ligue 188 (CVV) ou 192.</Text>
    </KeyboardAvoidingView>
  </Screen>;
}
