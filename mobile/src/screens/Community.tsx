import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, KeyboardAvoidingView, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ArrowLeft, Ban, Flag, Lock, Pin, Reply, Send, Trash2, X } from "lucide-react-native";
import { MAX_MESSAGE, type MessageView, type RoomInfo } from "@/lib/community/rooms";
import { api } from "../api";
import { Button, Card, Chip, Eyebrow, Field, Gap, H2, P, Screen } from "../ui";
import { C, F } from "../theme";

type Room = RoomInfo & { canEnter: boolean; members: number | null; unread: number };
type Me = {
  adult: boolean; minAge: number; joined?: boolean; founder?: boolean; sign?: string; rules?: string[]; reasons?: string[]; maxBio?: number;
  profile?: { username: string; displayName: string; bio: string; sign: string; joinedAt: string };
  rooms?: Room[]; blocked?: string[];
};
type CardData = { username: string; displayName: string; sign: string; bio: string; joinedAt: string; badges: string[]; me: boolean };
type Report = { id: number; messageId: number; reason: string; room: string; body: string; username: string; reports: number };
type Panel = { reports: Report[]; numbers: { members: number; messages24h: number; active24h: number; open: number }; log: { id: number; action: string; targetUsername: string | null; note: string }[] };
type Mode = "rooms" | "room" | "profile" | "team";

const GLYPH: Record<string, string> = { Áries: "♈", Touro: "♉", Gêmeos: "♊", Câncer: "♋", Leão: "♌", Virgem: "♍", Libra: "♎", Escorpião: "♏", Sagitário: "♐", Capricórnio: "♑", Aquário: "♒", Peixes: "♓" };
const get = <T,>(path: string) => api<T>(`/api/community/${path}`);
const post = <T,>(path: string, body: unknown) => api<T>(`/api/community/${path}`, { method: "POST", body });
const clock = (iso: string) => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time}`;
};

const Avatar = ({ sign, size = 36, onPress }: { sign: string; size?: number; onPress?: () => void }) =>
  <Pressable onPress={onPress} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}>
    <Text style={{ fontSize: size * 0.5, color: C.gold }}>{GLYPH[sign] ?? "✦"}</Text>
  </Pressable>;

const Badges = ({ badges }: { badges: string[] }) => <>
  {badges.includes("fundador") && <Text style={{ fontFamily: F.black, fontSize: 9, backgroundColor: C.goldDeep, color: C.bg, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: "hidden" }}>FUNDADOR</Text>}
  {badges.includes("premium") && <Text style={{ fontFamily: F.black, fontSize: 9, borderWidth: 1, borderColor: C.gold, color: C.gold, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>PREMIUM</Text>}
</>;

export function CommunityScreen() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("rooms");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [notice, setNotice] = useState("");

  const reload = useCallback(() => get<Me>("me").then((data) => { setMe(data); setError(""); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Não foi possível abrir a comunidade.")), []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (mode !== "rooms" || !me?.joined) return;
    const timer = setInterval(() => { void reload(); }, 20_000);
    return () => clearInterval(timer);
  }, [mode, me?.joined, reload]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3200); return () => clearTimeout(timer); }, [notice]);

  async function openCard(username: string) {
    try { setCard((await get<{ member: CardData }>(`members?u=${encodeURIComponent(username)}`)).member); } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o perfil."); }
  }

  if (error && !me) return <Screen><Card><P>{error}</P><Button kind="ghost" label="Tentar de novo" onPress={() => void reload()}/></Card></Screen>;
  if (!me) return <Screen><P dim>Abrindo a comunidade…</P></Screen>;
  if (!me.adult) return <Screen><Card><Eyebrow>Comunidade da Sintonia</Eyebrow><H2>Em breve para você</H2><P>{`A comunidade é um espaço de conversa entre pessoas de ${me.minAge} anos ou mais. Você continua tendo acesso a todo o restante do app.`}</P></Card></Screen>;
  if (!me.joined) return <Join me={me} onDone={reload}/>;

  const room = me.rooms?.find((item) => item.id === roomId) ?? null;
  const body = mode === "room" && room
    ? <RoomChat me={me} room={room} onBack={() => { setMode("rooms"); void reload(); }} onCard={openCard} onNotice={setNotice} onChanged={reload}/>
    : <Screen>
      {notice ? <Card style={{ borderColor: C.gold }}><Text style={{ fontFamily: F.bold, color: C.goldSoft, textAlign: "center" }}>{notice}</Text></Card> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label="Salas" on={mode === "rooms"} onPress={() => setMode("rooms")}/>
        <Chip label="Meu perfil" on={mode === "profile"} onPress={() => setMode("profile")}/>
        {me.founder ? <Chip label="Equipe" on={mode === "team"} onPress={() => setMode("team")}/> : null}
      </View>
      {mode === "rooms" && <RoomList me={me} onOpen={(id) => { setRoomId(id); setMode("room"); }} onLocked={(item) => setNotice(`${item.name} é só para quem é de ${item.sign}.`)}/>}
      {mode === "profile" && <MyProfile me={me} onSaved={async () => { setNotice("Perfil atualizado."); await reload(); }} onUnblock={async (username) => { await post("block", { username, block: false }); await reload(); }}/>}
      {mode === "team" && me.founder ? <Team onNotice={setNotice}/> : null}
      <P dim>Conversas em grupo ficam visíveis para os membros da sala. A equipe pode apagar mensagens que quebrem as regras. Aqui ninguém dá promessa de ganho nem aconselhamento financeiro, médico ou psicológico.</P>
    </Screen>;

  return <>
    {body}
    <Modal visible={card !== null} transparent animationType="fade" onRequestClose={() => setCard(null)}>
      <Pressable onPress={() => setCard(null)} style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.92)", justifyContent: "center", padding: 20 }}>
        {card && <Card style={{ alignItems: "center" }}>
          <Avatar sign={card.sign} size={64}/>
          <H2>{card.displayName}</H2>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}><Badges badges={card.badges}/><Text style={{ fontFamily: F.body, color: C.ink3 }}>{`${card.sign} · @${card.username}`}</Text></View>
          {card.bio ? <P>{card.bio}</P> : null}
          <P dim>{`Na comunidade desde ${new Date(card.joinedAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}</P>
          {!card.me && <Button kind="ghost" label="Bloquear" icon={<Ban size={15} color={C.gold}/>} onPress={async () => { await post("block", { username: card.username, block: true }); setNotice(`${card.displayName} foi bloqueado(a).`); setCard(null); await reload(); }}/>}
          <Button kind="ghost" label="Fechar" onPress={() => setCard(null)}/>
        </Card>}
      </Pressable>
    </Modal>
  </>;
}

function Join({ me, onDone }: { me: Me; onDone: () => Promise<unknown> }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { await post("join", { username, displayName: displayName.trim(), bio: bio.trim(), acceptRules: true }); await onDone(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível entrar agora."); setBusy(false); }
  }
  return <Screen>
    <Card>
      <Eyebrow>Comunidade da Sintonia</Eyebrow>
      <H2>Converse com quem também quer prosperar</H2>
      <P>{`Um espaço para trocar ideias sobre objetivos, hábitos e astrologia: o Chat Global e o clube do seu signo${me.sign ? ` (${me.sign})` : ""}. O seu signo vem da data de nascimento da conta e não pode ser trocado.`}</P>
      {me.rules?.map((rule) => <Text key={rule} style={{ fontFamily: F.body, fontSize: 13, color: C.ink2, lineHeight: 19 }}>{`• ${rule}`}</Text>)}
    </Card>
    <Card>
      <Field label="Nome de usuário" value={username} onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))} maxLength={20} autoCapitalize="none" autoCorrect={false} placeholder="ex.: ana_prospera"/>
      <Field label="Nome de exibição" value={displayName} onChangeText={setDisplayName} maxLength={30} placeholder="Como você quer ser chamado(a)"/>
      <Field label="Sobre você (opcional)" multiline value={bio} onChangeText={setBio} maxLength={me.maxBio ?? 160} placeholder="Uma frase sobre o que você busca"/>
      <Pressable onPress={() => setAccepted(!accepted)} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.gold, backgroundColor: accepted ? C.goldDeep : "transparent", alignItems: "center", justifyContent: "center" }}>{accepted ? <Text style={{ color: C.bg, fontFamily: F.black }}>✓</Text> : null}</View>
        <Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink2, lineHeight: 19 }}>Li e aceito as regras da comunidade e sei que as mensagens ficam visíveis para os membros da sala.</Text>
      </Pressable>
      {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
      <Button label="Entrar na comunidade" onPress={submit} busy={busy} disabled={!accepted || username.length < 3 || displayName.trim().length < 2}/>
    </Card>
  </Screen>;
}

function RoomList({ me, onOpen, onLocked }: { me: Me; onOpen: (id: string) => void; onLocked: (room: Room) => void }) {
  const rooms = me.rooms ?? [];
  const global = rooms.find((item) => item.kind === "global");
  const mine = rooms.find((item) => item.kind === "club" && item.sign === me.profile?.sign);
  const others = rooms.filter((item) => item.kind === "club" && item !== mine);
  const row = (item: Room) => <Pressable key={item.id} onPress={() => (item.canEnter ? onOpen(item.id) : onLocked(item))} style={{ opacity: item.canEnter ? 1 : 0.6 }}>
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 19, color: C.gold }}>{item.glyph}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink }}>{item.name}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{`${item.canEnter ? item.tagline : `Só para o signo de ${item.sign}`}${item.members !== null ? ` · ${item.members} ${item.members === 1 ? "membro" : "membros"}` : ""}`}</Text>
      </View>
      {item.unread > 0 ? <View style={{ minWidth: 24, height: 24, borderRadius: 12, backgroundColor: C.goldDeep, paddingHorizontal: 7, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: F.black, fontSize: 12, color: C.bg }}>{item.unread > 99 ? "99+" : item.unread}</Text></View> : !item.canEnter ? <Lock size={16} color={C.ink3}/> : null}
    </Card>
  </Pressable>;
  return <>
    {global ? row(global) : null}
    {mine ? <><Eyebrow>Seu clube</Eyebrow>{row(mine)}</> : null}
    <Eyebrow>Outros clubes</Eyebrow>
    {others.map(row)}
  </>;
}

function RoomChat({ me, room, onBack, onCard, onNotice, onChanged }: { me: Me; room: Room; onBack: () => void; onCard: (username: string) => void; onNotice: (text: string) => void; onChanged: () => Promise<unknown> }) {
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [pinned, setPinned] = useState<MessageView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [more, setMore] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<MessageView | null>(null);
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState<MessageView | null>(null);
  const [reporting, setReporting] = useState<MessageView | null>(null);
  const [error, setError] = useState("");
  const scroller = useRef<ScrollView>(null);
  const lastId = useRef(0);
  const stick = useRef(true);

  const merge = useCallback((incoming: MessageView[], mode: "append" | "prepend") => {
    setMessages((current) => {
      const known = new Set(current.map((item) => item.id));
      const fresh = incoming.filter((item) => !known.has(item.id));
      const updated = current.map((item) => incoming.find((candidate) => candidate.id === item.id) ?? item);
      return mode === "append" ? [...updated, ...fresh] : [...fresh, ...updated];
    });
  }, []);

  useEffect(() => {
    let live = true;
    get<{ messages: MessageView[]; pinned: MessageView[] }>(`messages?room=${room.id}`).then((data) => {
      if (!live) return;
      setMessages(data.messages); setPinned(data.pinned); setMore(data.messages.length >= 40); setLoaded(true);
      lastId.current = data.messages.at(-1)?.id ?? 0;
    }).catch((reason) => { if (live) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar."); setLoaded(true); } });
    return () => { live = false; };
  }, [room.id]);

  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== "active") return;
      get<{ messages: MessageView[] }>(`messages?room=${room.id}&after=${lastId.current}`).then((data) => {
        setOffline(false);
        if (!data.messages.length) return;
        lastId.current = Math.max(lastId.current, ...data.messages.map((item) => item.id));
        merge(data.messages, "append");
      }).catch(() => setOffline(true));
    }, 4000);
    return () => clearInterval(timer);
  }, [loaded, room.id, merge]);

  async function loadOlder() {
    const first = messages[0]?.id;
    if (!first) return;
    try {
      const data = await get<{ messages: MessageView[] }>(`messages?room=${room.id}&before=${first}`);
      setMore(data.messages.length >= 40); stick.current = false; merge(data.messages, "prepend");
    } catch { onNotice("Não foi possível carregar as anteriores."); }
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    try {
      await post("messages", { room: room.id, body, replyTo: replyTo?.id });
      setText(""); setReplyTo(null); stick.current = true;
      const data = await get<{ messages: MessageView[] }>(`messages?room=${room.id}&after=${lastId.current}`);
      if (data.messages.length) { lastId.current = Math.max(lastId.current, ...data.messages.map((item) => item.id)); merge(data.messages, "append"); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar."); }
    finally { setSending(false); }
  }

  async function team(action: "pin" | "unpin" | "remove", message: MessageView) {
    try {
      await post("mod", { action, messageId: message.id });
      const data = await get<{ messages: MessageView[]; pinned: MessageView[] }>(`messages?room=${room.id}`);
      setPinned(data.pinned); merge(data.messages, "append"); setMenu(null);
    } catch (reason) { onNotice(reason instanceof Error ? reason.message : "Não foi possível concluir."); }
  }

  return <View style={{ flex: 1, backgroundColor: C.bg }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, gap: 2 }}>
        <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><ArrowLeft size={16} color={C.gold}/><Text style={{ color: C.gold, fontFamily: F.bold }}>Salas</Text></Pressable>
        <Text style={{ fontFamily: F.display, fontSize: 19, color: C.goldSoft }}>{`${room.glyph} ${room.name}`}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{room.tagline}</Text>
      </View>
      {pinned.map((message) => <View key={message.id} style={{ marginHorizontal: 16, marginBottom: 6, borderWidth: 1, borderColor: C.gold, borderRadius: 12, padding: 10, flexDirection: "row", gap: 6 }}><Pin size={13} color={C.gold}/><Text style={{ flex: 1, fontFamily: F.body, fontSize: 13, color: C.ink }}><Text style={{ fontFamily: F.bold }}>{`${message.author.displayName}: `}</Text>{message.body}</Text></View>)}
      {offline ? <Text style={{ textAlign: "center", color: C.gold, fontFamily: F.body, fontSize: 12 }}>Reconectando…</Text> : null}
      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => { if (stick.current) scroller.current?.scrollToEnd({ animated: false }); }}
        onScroll={(event) => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; stick.current = contentSize.height - contentOffset.y - layoutMeasurement.height < 80; }} scrollEventThrottle={100}>
        {!loaded ? <P dim>Carregando…</P> : null}
        {loaded && more && messages.length > 0 ? <Button kind="ghost" label="Ver mensagens anteriores" onPress={loadOlder}/> : null}
        {loaded && messages.length === 0 && !error ? <P dim>Ainda não há mensagens aqui. Que tal começar a conversa?</P> : null}
        {messages.map((message) => <View key={message.id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", opacity: message.removed ? 0.55 : 1 }}>
          <Avatar sign={message.author.sign} size={34} onPress={() => onCard(message.author.username)}/>
          <View style={{ flex: 1, borderWidth: 1, borderColor: message.mine ? C.gold : C.lineSoft, borderRadius: 16, borderTopLeftRadius: 6, backgroundColor: C.card, padding: 10, gap: 3 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
              <Text onPress={() => onCard(message.author.username)} style={{ fontFamily: F.black, fontSize: 13, color: C.ink }}>{message.author.displayName}</Text>
              <Badges badges={message.author.badges}/>
              <Text style={{ fontFamily: F.body, fontSize: 10, color: C.ink3 }}>{`${message.author.sign} · ${clock(message.createdAt)}`}</Text>
            </View>
            {message.replyTo ? <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3, borderLeftWidth: 2, borderLeftColor: C.line, paddingLeft: 8 }}>{`↪ @${message.replyTo.username}: ${message.replyTo.body || "mensagem removida"}`}</Text> : null}
            <Text selectable style={{ fontFamily: F.body, fontSize: 14.5, lineHeight: 21, color: C.ink, fontStyle: message.removed ? "italic" : "normal" }}>{message.removed ? "Mensagem removida pela equipe." : message.body}</Text>
            {!message.removed && <View style={{ flexDirection: "row", gap: 16, marginTop: 2 }}>
              <Pressable onPress={() => setReplyTo(message)} style={{ flexDirection: "row", gap: 4, alignItems: "center" }}><Reply size={13} color={C.ink3}/><Text style={{ fontFamily: F.bold, fontSize: 12, color: C.ink3 }}>Responder</Text></Pressable>
              <Pressable onPress={() => setMenu(message)}><Text style={{ fontFamily: F.bold, fontSize: 12, color: C.ink3 }}>Mais</Text></Pressable>
            </View>}
          </View>
        </View>)}
      </ScrollView>
      {replyTo ? <View style={{ marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderColor: C.line, borderRadius: 12, padding: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.body, fontSize: 12, color: C.ink2 }}>{`Respondendo a ${replyTo.author.displayName}: ${replyTo.body.slice(0, 60)}`}</Text>
        <Pressable accessibilityLabel="Cancelar resposta" onPress={() => setReplyTo(null)}><X size={14} color={C.ink3}/></Pressable>
      </View> : null}
      {error ? <Text style={{ marginHorizontal: 16, color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", padding: 16, paddingTop: 8 }}>
        <TextInput value={text} onChangeText={setText} multiline maxLength={MAX_MESSAGE} placeholder="Escreva uma mensagem" placeholderTextColor={C.ink3} style={{ flex: 1, maxHeight: 110, fontFamily: F.body, fontSize: 15, color: C.ink, backgroundColor: C.card2, borderRadius: 18, borderWidth: 1, borderColor: C.lineSoft, paddingHorizontal: 14, paddingVertical: 10 }}/>
        <Pressable accessibilityLabel="Enviar" disabled={!text.trim() || sending} onPress={() => void send()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.goldDeep, alignItems: "center", justifyContent: "center", opacity: !text.trim() || sending ? 0.5 : 1 }}><Send size={18} color={C.bg}/></Pressable>
      </View>
    </KeyboardAvoidingView>

    <Modal visible={menu !== null} transparent animationType="slide" onRequestClose={() => setMenu(null)}>
      <Pressable onPress={() => setMenu(null)} style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.85)", justifyContent: "flex-end", padding: 16 }}>
        {menu && <Card>
          <Eyebrow>{menu.author.displayName}</Eyebrow>
          {!menu.mine && <Button kind="ghost" label="Denunciar mensagem" icon={<Flag size={15} color={C.gold}/>} onPress={() => { setReporting(menu); setMenu(null); }}/>}
          {!menu.mine && <Button kind="ghost" label={`Bloquear ${menu.author.displayName}`} icon={<Ban size={15} color={C.gold}/>} onPress={async () => { await post("block", { username: menu.author.username, block: true }); onNotice(`${menu.author.displayName} foi bloqueado(a).`); setMessages((current) => current.filter((item) => item.author.username !== menu.author.username)); setMenu(null); await onChanged(); }}/>}
          {me.founder && <Button kind="ghost" label={menu.pinned ? "Desafixar" : "Fixar na sala"} icon={<Pin size={15} color={C.gold}/>} onPress={() => void team(menu.pinned ? "unpin" : "pin", menu)}/>}
          {me.founder && !menu.mine && <Button kind="ghost" label="Remover mensagem" icon={<Trash2 size={15} color={C.gold}/>} onPress={() => void team("remove", menu)}/>}
          <Button kind="ghost" label="Fechar" onPress={() => setMenu(null)}/>
        </Card>}
      </Pressable>
    </Modal>

    <Modal visible={reporting !== null} transparent animationType="slide" onRequestClose={() => setReporting(null)}>
      <Pressable onPress={() => setReporting(null)} style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.85)", justifyContent: "flex-end", padding: 16 }}>
        {reporting && <Card>
          <Eyebrow>Por que você está denunciando?</Eyebrow>
          {me.reasons?.map((reason) => <Button key={reason} kind="ghost" label={reason} onPress={async () => { try { await post("report", { messageId: reporting.id, reason }); onNotice("Denúncia enviada. A equipe vai analisar."); } catch (failure) { onNotice(failure instanceof Error ? failure.message : "Não foi possível denunciar."); } setReporting(null); }}/>)}
          <Button kind="ghost" label="Cancelar" onPress={() => setReporting(null)}/>
        </Card>}
      </Pressable>
    </Modal>
  </View>;
}

function MyProfile({ me, onSaved, onUnblock }: { me: Me; onSaved: () => Promise<unknown>; onUnblock: (username: string) => Promise<unknown> }) {
  const profile = me.profile!;
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <>
    <Card style={{ alignItems: "center" }}>
      <Avatar sign={profile.sign} size={64}/>
      <H2>{`@${profile.username}`}</H2>
      <P dim>{`${profile.sign} · na comunidade desde ${new Date(profile.joinedAt.replace(" ", "T") + "Z").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}</P>
    </Card>
    <Card>
      {me.founder ? <P>Sua conta é a oficial da comunidade: o nome e o selo de Fundador são definidos pelo servidor.</P> : <Field label="Nome de exibição" value={displayName} onChangeText={setDisplayName} maxLength={30}/>}
      <Field label="Sobre você" multiline value={bio} onChangeText={setBio} maxLength={me.maxBio ?? 160}/>
      <P dim>O signo vem da data de nascimento da conta, e o nome de usuário não muda. O selo Premium aparece sozinho enquanto a sua assinatura estiver ativa.</P>
      {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
      <Button label="Salvar" busy={busy} disabled={displayName.trim().length < 2} onPress={async () => { setBusy(true); setError(""); try { await post("profile", { displayName: me.founder ? profile.displayName : displayName.trim(), bio: bio.trim() }); await onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar."); } finally { setBusy(false); } }}/>
    </Card>
    <Card>
      <Eyebrow>Pessoas bloqueadas</Eyebrow>
      {me.blocked?.length ? me.blocked.map((username) => <View key={username} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Text style={{ fontFamily: F.body, color: C.ink }}>{`@${username}`}</Text><Button kind="ghost" label="Desbloquear" onPress={() => void onUnblock(username)}/>
      </View>) : <P>Você não bloqueou ninguém.</P>}
    </Card>
  </>;
}

function Team({ onNotice }: { onNotice: (text: string) => void }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const load = useCallback(() => get<Panel>("mod").then(setPanel).catch((reason) => onNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o painel.")), [onNotice]);
  useEffect(() => { void load(); }, [load]);
  async function act(body: unknown, message: string) {
    try { await post("mod", body); onNotice(message); await load(); } catch (reason) { onNotice(reason instanceof Error ? reason.message : "Não foi possível concluir."); }
  }
  if (!panel) return <P dim>Carregando…</P>;
  return <>
    <Card>
      <Eyebrow>Hoje na comunidade</Eyebrow>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {([["Membros", panel.numbers.members], ["Mensagens (24 h)", panel.numbers.messages24h], ["Ativos (24 h)", panel.numbers.active24h], ["Denúncias abertas", panel.numbers.open]] as const).map(([label, value]) =>
          <View key={label} style={{ width: "48%", borderWidth: 1, borderColor: C.lineSoft, borderRadius: 12, padding: 10 }}><Text style={{ fontFamily: F.body, fontSize: 11, color: C.ink3 }}>{label}</Text><Text style={{ fontFamily: F.black, fontSize: 22, color: C.goldDeep }}>{value}</Text></View>)}
      </View>
    </Card>
    <Card>
      <Eyebrow>Denúncias</Eyebrow>
      {panel.reports.length === 0 ? <P>Nenhuma denúncia aberta.</P> : null}
      {panel.reports.map((report) => <View key={report.id} style={{ borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 10, gap: 6 }}>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink2 }}>{`@${report.username} · ${report.room} · ${report.reports} denúncia(s) · ${report.reason}`}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 14, color: C.ink, borderLeftWidth: 2, borderLeftColor: C.goldDeep, paddingLeft: 8 }}>{report.body}</Text>
        <Button kind="ghost" label="Remover" onPress={() => void act({ action: "remove", messageId: report.messageId, note: report.reason }, "Mensagem removida.")}/>
        <Button kind="ghost" label="Suspender 3 dias" onPress={() => void act({ action: "suspend", username: report.username, days: 3, note: report.reason }, `@${report.username} suspenso por 3 dias.`)}/>
        <Button kind="ghost" label="Dispensar" onPress={() => void act({ action: "dismiss", reportId: report.id }, "Denúncia dispensada.")}/>
      </View>)}
    </Card>
    <Card>
      <Eyebrow>Registro da equipe</Eyebrow>
      {panel.log.length === 0 ? <P>Ainda sem ações.</P> : panel.log.map((item) => <Text key={item.id} style={{ fontFamily: F.body, fontSize: 13, color: C.ink2 }}>{`${item.action} ${item.targetUsername ? `@${item.targetUsername}` : ""}${item.note ? ` · ${item.note}` : ""}`}</Text>)}
    </Card>
    <Gap/>
  </>;
}
