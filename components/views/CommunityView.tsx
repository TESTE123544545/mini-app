"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Ban, Flag, Lock, MessageCircle, Pin, Reply, Send, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { MAX_MESSAGE, type MessageView, type RoomInfo } from "@/lib/community/rooms";

type Room = RoomInfo & { canEnter: boolean; members: number | null; unread: number };
type Me = {
  adult: boolean; minAge: number; joined?: boolean; founder?: boolean; sign?: string; rules?: string[]; reasons?: string[]; maxBio?: number;
  profile?: { username: string; displayName: string; bio: string; sign: string; joinedAt: string; suspendedUntil: string | null };
  rooms?: Room[]; blocked?: string[];
};
type Card = { username: string; displayName: string; sign: string; bio: string; joinedAt: string; badges: string[]; me: boolean };
type Report = { id: number; messageId: number; reason: string; createdAt: string; room: string; body: string; removed: boolean; username: string; reports: number };
type Panel = { reports: Report[]; numbers: { members: number; messages24h: number; active24h: number; open: number }; log: { id: number; actor: string; action: string; targetUsername: string | null; note: string; createdAt: string }[] };
type Screen = "rooms" | "room" | "profile" | "team";

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/community/${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Algo deu errado. Tente de novo.");
  return data;
}

const clock = (iso: string) => {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time}`;
};
const GLYPH: Record<string, string> = { Áries: "♈", Touro: "♉", Gêmeos: "♊", Câncer: "♋", Leão: "♌", Virgem: "♍", Libra: "♎", Escorpião: "♏", Sagitário: "♐", Capricórnio: "♑", Aquário: "♒", Peixes: "♓" };

function Badges({ badges }: { badges: string[] }) {
  return <>
    {badges.includes("fundador") && <span className="comm-badge comm-badge--founder">Fundador</span>}
    {badges.includes("premium") && <span className="comm-badge comm-badge--premium">Premium</span>}
  </>;
}

export function CommunityView() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState<Screen>("rooms");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    try { setMe(await api<Me>("me")); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível abrir a comunidade."); }
  }, []);
  useEffect(() => {
    let live = true;
    api<Me>("me").then((data) => { if (live) setMe(data); }).catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : "Não foi possível abrir a comunidade."); });
    return () => { live = false; };
  }, []);
  // The room list (unread counters) refreshes while it is on screen.
  useEffect(() => {
    if (screen !== "rooms" || !me?.joined) return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") void reload(); }, 20_000);
    return () => clearInterval(timer);
  }, [screen, me?.joined, reload]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3200); return () => clearTimeout(timer); }, [notice]);

  async function openCard(username: string) {
    try { setCard((await api<{ member: Card }>(`members?u=${encodeURIComponent(username)}`)).member); } catch (reason) { setNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o perfil."); }
  }

  if (error && !me) return <div className="view-stack"><section className="surface-card"><p>{error}</p><button type="button" className="ghost-button" onClick={() => void reload()}>Tentar de novo</button></section></div>;
  if (!me) return <div className="view-stack"><div className="live-skeleton" aria-busy="true" aria-label="Carregando a comunidade"><span/><span/><span/></div></div>;

  if (!me.adult) return <div className="view-stack comm"><section className="surface-card comm-intro">
    <p className="eyebrow">Comunidade da Sintonia</p>
    <h2>Em breve para você</h2>
    <p>A comunidade é um espaço de conversa entre pessoas de {me.minAge} anos ou mais. Você continua tendo acesso a todo o restante do app.</p>
  </section></div>;

  if (!me.joined) return <JoinForm me={me} onDone={async () => { track("community_joined"); await reload(); }}/>;

  const profile = me.profile!;
  const room = me.rooms?.find((item) => item.id === roomId) ?? null;

  return <div className="view-stack comm">
    {notice && <div className="comm-toast" role="status">{notice}</div>}
    <nav className="comm-tabs" aria-label="Comunidade">
      <button type="button" className={screen === "rooms" || screen === "room" ? "active" : ""} onClick={() => setScreen("rooms")}><MessageCircle size={15}/> Salas</button>
      <button type="button" className={screen === "profile" ? "active" : ""} onClick={() => setScreen("profile")}><UserRound size={15}/> Meu perfil</button>
      {me.founder && <button type="button" className={screen === "team" ? "active" : ""} onClick={() => setScreen("team")}><ShieldCheck size={15}/> Equipe</button>}
    </nav>

    {screen === "rooms" && <RoomList me={me} onOpen={(id) => { setRoomId(id); setScreen("room"); }} onLocked={(item) => setNotice(`${item.name} é só para quem é de ${item.sign}.`)}/>}
    {screen === "room" && room && <RoomChat key={room.id} me={me} room={room} onBack={() => { setScreen("rooms"); void reload(); }} onCard={openCard} onNotice={setNotice} onBlockChange={reload}/>}
    {screen === "profile" && <MyProfile me={me} onSaved={async () => { setNotice("Perfil atualizado."); await reload(); }} onUnblock={async (username) => { await api("block", { username, block: false }); await reload(); }}/>}
    {screen === "team" && me.founder && <TeamPanel onNotice={setNotice}/>}

    {card && <div className="comm-modal" role="dialog" aria-label={`Perfil de ${card.displayName}`} onClick={() => setCard(null)}>
      <section className="surface-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="comm-close" aria-label="Fechar" onClick={() => setCard(null)}><X size={18}/></button>
        <span className="comm-avatar comm-avatar--big" aria-hidden="true">{GLYPH[card.sign] ?? "✦"}</span>
        <h2>{card.displayName}</h2>
        <p className="comm-meta"><Badges badges={card.badges}/> <span>{card.sign}</span> · <span>@{card.username}</span></p>
        {card.bio && <p>{card.bio}</p>}
        <p className="comm-meta">Na comunidade desde {new Date(card.joinedAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
        {!card.me && <button type="button" className="ghost-button" onClick={async () => { await api("block", { username: card.username, block: true }); setNotice(`${card.displayName} foi bloqueado(a).`); setCard(null); await reload(); }}><Ban size={15}/> Bloquear</button>}
      </section>
    </div>}
    <p className="disclaimer">Conversas em grupo ficam visíveis para os membros da sala. A equipe pode apagar mensagens que quebrem as regras. Aqui ninguém dá promessa de ganho nem aconselhamento financeiro, médico ou psicológico. Você está como @{profile.username}.</p>
  </div>;
}

function JoinForm({ me, onDone }: { me: Me; onDone: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true); setError("");
    try { await api("join", { username: username.trim().toLowerCase(), displayName: displayName.trim(), bio: bio.trim(), acceptRules: true }); await onDone(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível entrar agora."); setBusy(false); }
  }
  return <div className="view-stack comm">
    <section className="surface-card comm-intro">
      <p className="eyebrow">Comunidade da Sintonia</p>
      <h2>Converse com quem também quer prosperar</h2>
      <p>Um espaço para trocar ideias sobre objetivos, hábitos e astrologia: o Chat Global e o clube do seu signo{me.sign ? ` (${me.sign})` : ""}. O seu signo vem da data de nascimento da conta e não pode ser trocado.</p>
      <ul className="comm-rules">{me.rules?.map((rule) => <li key={rule}>{rule}</li>)}</ul>
    </section>
    <section className="surface-card comm-form">
      <label>Nome de usuário<input value={username} maxLength={20} autoCapitalize="none" autoCorrect="off" onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="ex.: ana_prospera"/></label>
      <label>Nome de exibição<input value={displayName} maxLength={30} onChange={(event) => setDisplayName(event.target.value)} placeholder="Como você quer ser chamado(a)"/></label>
      <label>Sobre você (opcional)<textarea rows={2} maxLength={me.maxBio ?? 160} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Uma frase sobre o que você busca"/></label>
      <label className="comm-check"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)}/> Li e aceito as regras da comunidade e sei que as mensagens ficam visíveis para os membros da sala.</label>
      {error && <p className="radar-error" role="alert">{error}</p>}
      <button type="button" className="gold-button" disabled={busy || !accepted || username.length < 3 || displayName.trim().length < 2} onClick={submit}>Entrar na comunidade</button>
    </section>
  </div>;
}

function RoomList({ me, onOpen, onLocked }: { me: Me; onOpen: (id: string) => void; onLocked: (room: Room) => void }) {
  const rooms = me.rooms ?? [];
  const global = rooms.find((item) => item.kind === "global");
  const mine = rooms.find((item) => item.kind === "club" && item.sign === me.profile?.sign);
  const others = rooms.filter((item) => item.kind === "club" && item !== mine);
  const card = (item: Room) => <button type="button" key={item.id} className={`surface-card comm-room ${item.canEnter ? "" : "is-locked"}`} onClick={() => (item.canEnter ? onOpen(item.id) : onLocked(item))}>
    <span className="comm-avatar" aria-hidden="true">{item.glyph}</span>
    <span className="comm-room__text"><strong>{item.name}</strong><small>{item.canEnter ? item.tagline : `Só para o signo de ${item.sign}`}{item.members !== null ? ` · ${item.members} ${item.members === 1 ? "membro" : "membros"}` : ""}</small></span>
    {item.unread > 0 ? <span className="comm-unread" aria-label={`${item.unread} mensagens novas`}>{item.unread > 99 ? "99+" : item.unread}</span> : !item.canEnter ? <Lock size={16} aria-hidden="true"/> : null}
  </button>;
  return <>
    {global && card(global)}
    {mine && <><p className="eyebrow comm-section">Seu clube</p>{card(mine)}</>}
    <p className="eyebrow comm-section">Outros clubes</p>
    <div className="comm-rooms">{others.map(card)}</div>
  </>;
}

function RoomChat({ me, room, onBack, onCard, onNotice, onBlockChange }: { me: Me; room: Room; onBack: () => void; onCard: (username: string) => void; onNotice: (text: string) => void; onBlockChange: () => Promise<void> }) {
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
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastId = useRef(0);

  const merge = useCallback((incoming: MessageView[], mode: "append" | "prepend") => {
    setMessages((current) => {
      const known = new Set(current.map((item) => item.id));
      const fresh = incoming.filter((item) => !known.has(item.id));
      // Tombstones and pins can change on messages we already have: refresh those in place.
      const updated = current.map((item) => incoming.find((candidate) => candidate.id === item.id) ?? item);
      return mode === "append" ? [...updated, ...fresh] : [...fresh, ...updated];
    });
  }, []);

  useEffect(() => {
    let live = true;
    api<{ messages: MessageView[]; pinned: MessageView[] }>(`messages?room=${room.id}`).then((data) => {
      if (!live) return;
      setMessages(data.messages); setPinned(data.pinned); setMore(data.messages.length >= 40); setLoaded(true);
      lastId.current = data.messages.at(-1)?.id ?? 0;
    }).catch((reason) => { if (live) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar."); setLoaded(true); } });
    return () => { live = false; };
  }, [room.id]);

  // New messages: ask only for what is newer than the last one we have, every few seconds while the screen is visible.
  useEffect(() => {
    if (!loaded) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      api<{ messages: MessageView[] }>(`messages?room=${room.id}&after=${lastId.current}`).then((data) => {
        setOffline(false);
        if (!data.messages.length) return;
        lastId.current = Math.max(lastId.current, ...data.messages.map((item) => item.id));
        merge(data.messages, "append");
      }).catch(() => setOffline(true));
    }, 4000);
    return () => clearInterval(timer);
  }, [loaded, room.id, merge]);

  useEffect(() => {
    const element = listRef.current;
    if (element && stick.current) element.scrollTop = element.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    const first = messages[0]?.id;
    if (!first) return;
    try {
      const data = await api<{ messages: MessageView[] }>(`messages?room=${room.id}&before=${first}`);
      setMore(data.messages.length >= 40);
      const element = listRef.current; const previous = element?.scrollHeight ?? 0;
      stick.current = false;
      merge(data.messages, "prepend");
      requestAnimationFrame(() => { if (element) element.scrollTop = element.scrollHeight - previous; });
    } catch { onNotice("Não foi possível carregar as anteriores."); }
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    try {
      await api("messages", { room: room.id, body, replyTo: replyTo?.id });
      setText(""); setReplyTo(null); stick.current = true;
      track("community_message_sent", { room: room.kind });
      const data = await api<{ messages: MessageView[] }>(`messages?room=${room.id}&after=${lastId.current}`);
      if (data.messages.length) { lastId.current = Math.max(lastId.current, ...data.messages.map((item) => item.id)); merge(data.messages, "append"); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível enviar."); }
    finally { setSending(false); }
  }

  async function team(action: "pin" | "unpin" | "remove", message: MessageView) {
    try {
      await api("mod", { action, messageId: message.id });
      const data = await api<{ messages: MessageView[]; pinned: MessageView[] }>(`messages?room=${room.id}`);
      setPinned(data.pinned); merge(data.messages, "append"); setMenu(null);
    } catch (reason) { onNotice(reason instanceof Error ? reason.message : "Não foi possível concluir."); }
  }

  const bubble = (message: MessageView) => <article key={message.id} className={`comm-msg ${message.mine ? "is-mine" : ""} ${message.removed ? "is-removed" : ""}`}>
    <button type="button" className="comm-avatar" aria-label={`Ver perfil de ${message.author.displayName}`} onClick={() => onCard(message.author.username)}>{GLYPH[message.author.sign] ?? "✦"}</button>
    <div className="comm-msg__body">
      <header><button type="button" className="comm-name" onClick={() => onCard(message.author.username)}>{message.author.displayName}</button><Badges badges={message.author.badges}/><small>{message.author.sign} · {clock(message.createdAt)}</small></header>
      {message.replyTo && <blockquote>↪ @{message.replyTo.username}: {message.replyTo.body || "mensagem removida"}</blockquote>}
      <p>{message.removed ? "Mensagem removida pela equipe." : message.body}</p>
      {!message.removed && <footer>
        <button type="button" onClick={() => setReplyTo(message)}><Reply size={13}/> Responder</button>
        <button type="button" onClick={() => setMenu(message)}>Mais</button>
      </footer>}
    </div>
  </article>;

  return <section className="comm-room-view">
    <header className="comm-room-head">
      <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={16}/> Salas</button>
      <div><strong>{room.glyph} {room.name}</strong><small>{room.tagline}</small></div>
    </header>
    {pinned.length > 0 && <div className="comm-pinned" aria-label="Mensagens fixadas">{pinned.map((message) => <p key={message.id}><Pin size={13}/> <strong>{message.author.displayName}:</strong> {message.body}</p>)}</div>}
    {offline && <p className="comm-offline" role="status">Reconectando…</p>}
    <div className="comm-list" ref={listRef} onScroll={(event) => { const el = event.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
      {!loaded && <div className="live-skeleton" aria-busy="true"><span/><span/><span/></div>}
      {loaded && more && messages.length > 0 && <button type="button" className="ghost-button" onClick={loadOlder}>Ver mensagens anteriores</button>}
      {loaded && messages.length === 0 && !error && <p className="comm-empty">Ainda não há mensagens aqui. Que tal começar a conversa?</p>}
      {messages.map(bubble)}
    </div>
    {replyTo && <p className="comm-replying">Respondendo a <strong>{replyTo.author.displayName}</strong>: {replyTo.body.slice(0, 60)} <button type="button" aria-label="Cancelar resposta" onClick={() => setReplyTo(null)}><X size={14}/></button></p>}
    {error && <p className="radar-error" role="alert">{error}</p>}
    <div className="comm-composer">
      <textarea rows={1} value={text} maxLength={MAX_MESSAGE} placeholder="Escreva uma mensagem" onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}/>
      <button type="button" className="chat-send" aria-label="Enviar" disabled={!text.trim() || sending} onClick={() => void send()}><Send size={18}/></button>
    </div>
    <small className="comm-count">{text.length}/{MAX_MESSAGE}</small>

    {menu && <div className="comm-modal" role="dialog" aria-label="Opções da mensagem" onClick={() => setMenu(null)}>
      <section className="surface-card comm-sheet" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow">{menu.author.displayName}</p>
        {!menu.mine && <button type="button" onClick={() => { setReporting(menu); setMenu(null); }}><Flag size={15}/> Denunciar mensagem</button>}
        {!menu.mine && <button type="button" onClick={async () => { await api("block", { username: menu.author.username, block: true }); onNotice(`${menu.author.displayName} foi bloqueado(a).`); setMenu(null); setMessages((current) => current.filter((item) => item.author.username !== menu.author.username)); await onBlockChange(); }}><Ban size={15}/> Bloquear {menu.author.displayName}</button>}
        {me.founder && <button type="button" onClick={() => void team(menu.pinned ? "unpin" : "pin", menu)}><Pin size={15}/> {menu.pinned ? "Desafixar" : "Fixar na sala"}</button>}
        {me.founder && !menu.mine && <button type="button" onClick={() => void team("remove", menu)}><Trash2 size={15}/> Remover mensagem</button>}
        <button type="button" className="ghost-button" onClick={() => setMenu(null)}>Fechar</button>
      </section>
    </div>}

    {reporting && <div className="comm-modal" role="dialog" aria-label="Denunciar" onClick={() => setReporting(null)}>
      <section className="surface-card comm-sheet" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow">Por que você está denunciando?</p>
        {me.reasons?.map((reason) => <button type="button" key={reason} onClick={async () => { try { await api("report", { messageId: reporting.id, reason }); onNotice("Denúncia enviada. A equipe vai analisar."); } catch (failure) { onNotice(failure instanceof Error ? failure.message : "Não foi possível denunciar."); } setReporting(null); }}>{reason}</button>)}
        <button type="button" className="ghost-button" onClick={() => setReporting(null)}>Cancelar</button>
      </section>
    </div>}
  </section>;
}

function MyProfile({ me, onSaved, onUnblock }: { me: Me; onSaved: () => Promise<void>; onUnblock: (username: string) => Promise<void> }) {
  const profile = me.profile!;
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <>
    <section className="surface-card comm-form">
      <span className="comm-avatar comm-avatar--big" aria-hidden="true">{GLYPH[profile.sign] ?? "✦"}</span>
      <h2>@{profile.username}</h2>
      <p className="comm-meta">{profile.sign} · na comunidade desde {new Date(profile.joinedAt.replace(" ", "T") + "Z").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
      {me.founder ? <p>Sua conta é a oficial da comunidade: o nome e o selo de Fundador são definidos pelo servidor.</p> : <label>Nome de exibição<input value={displayName} maxLength={30} onChange={(event) => setDisplayName(event.target.value)}/></label>}
      <label>Sobre você<textarea rows={2} maxLength={me.maxBio ?? 160} value={bio} onChange={(event) => setBio(event.target.value)}/></label>
      <p className="disclaimer">O signo vem da data de nascimento da conta, e o nome de usuário não muda. O selo Premium aparece sozinho enquanto a sua assinatura estiver ativa.</p>
      {error && <p className="radar-error" role="alert">{error}</p>}
      <button type="button" className="gold-button" disabled={busy || displayName.trim().length < 2} onClick={async () => { setBusy(true); setError(""); try { await api("profile", { displayName: me.founder ? profile.displayName : displayName.trim(), bio: bio.trim() }); await onSaved(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar."); } finally { setBusy(false); } }}>Salvar</button>
    </section>
    <section className="surface-card">
      <p className="eyebrow">Pessoas bloqueadas</p>
      {me.blocked?.length ? <ul className="comm-blocked">{me.blocked.map((username) => <li key={username}>@{username} <button type="button" className="ghost-button" onClick={() => void onUnblock(username)}>Desbloquear</button></li>)}</ul> : <p>Você não bloqueou ninguém.</p>}
    </section>
  </>;
}

function TeamPanel({ onNotice }: { onNotice: (text: string) => void }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const load = useCallback(async () => { try { setPanel(await api<Panel>("mod")); } catch (reason) { onNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o painel."); } }, [onNotice]);
  useEffect(() => {
    let live = true;
    api<Panel>("mod").then((data) => { if (live) setPanel(data); }).catch((reason) => { if (live) onNotice(reason instanceof Error ? reason.message : "Não foi possível abrir o painel."); });
    return () => { live = false; };
  }, [onNotice]);
  async function act(body: unknown, message: string) {
    try { await api("mod", body); onNotice(message); await load(); } catch (reason) { onNotice(reason instanceof Error ? reason.message : "Não foi possível concluir."); }
  }
  if (!panel) return <div className="live-skeleton" aria-busy="true"><span/><span/><span/></div>;
  return <>
    <section className="surface-card comm-numbers">
      <p className="eyebrow">Hoje na comunidade</p>
      <dl><div><dt>Membros</dt><dd>{panel.numbers.members}</dd></div><div><dt>Mensagens (24 h)</dt><dd>{panel.numbers.messages24h}</dd></div><div><dt>Ativos (24 h)</dt><dd>{panel.numbers.active24h}</dd></div><div><dt>Denúncias abertas</dt><dd>{panel.numbers.open}</dd></div></dl>
    </section>
    <section className="surface-card">
      <p className="eyebrow">Denúncias</p>
      {panel.reports.length === 0 && <p>Nenhuma denúncia aberta.</p>}
      {panel.reports.map((report) => <article className="comm-report" key={report.id}>
        <p><strong>@{report.username}</strong> · {report.room} · {report.reports} denúncia(s) · {report.reason}</p>
        <blockquote>{report.body}</blockquote>
        <div className="comm-actions">
          <button type="button" className="ghost-button" onClick={() => void act({ action: "remove", messageId: report.messageId, note: report.reason }, "Mensagem removida.")}>Remover</button>
          <button type="button" className="ghost-button" onClick={() => void act({ action: "suspend", username: report.username, days: 3, note: report.reason }, `@${report.username} suspenso por 3 dias.`)}>Suspender 3 dias</button>
          <button type="button" className="ghost-button" onClick={() => void act({ action: "dismiss", reportId: report.id }, "Denúncia dispensada.")}>Dispensar</button>
        </div>
      </article>)}
    </section>
    <section className="surface-card">
      <p className="eyebrow">Registro da equipe</p>
      {panel.log.length === 0 && <p>Ainda sem ações.</p>}
      <ul className="comm-log">{panel.log.map((item) => <li key={item.id}><strong>{item.action}</strong> {item.targetUsername ? `@${item.targetUsername}` : ""} <small>{clock(item.createdAt)}{item.note ? ` · ${item.note}` : ""}</small></li>)}</ul>
    </section>
  </>;
}
