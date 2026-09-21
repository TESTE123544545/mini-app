"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign, Flame, Gem, Home, Leaf, LockKeyhole, Plus, Rocket, Sparkles, Target, Trophy, UserRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type View = "home" | "tree" | "missions" | "journal" | "profile";
type Goal = { id: number; title: string; category: string; progress: number };
type JournalEntry = { date: string; answers: string[] };
type Profile = { name: string; birthDate: string; objective: string; sign: string };

const zodiac = [
  ["Capricórnio", 120], ["Aquário", 219], ["Peixes", 321], ["Áries", 420],
  ["Touro", 521], ["Gêmeos", 621], ["Câncer", 723], ["Leão", 823],
  ["Virgem", 923], ["Libra", 1023], ["Escorpião", 1122], ["Sagitário", 1222], ["Capricórnio", 1232],
] as const;

const signGuides: Record<string, { strengths: string[]; care: string[]; style: string }> = {
  "Áries": { strengths: ["iniciativa", "coragem", "ação"], care: ["impulsividade", "decisões precipitadas"], style: "Transforme energia em um primeiro passo claro e sustentável." },
  "Touro": { strengths: ["constância", "praticidade", "paciência"], care: ["apego ao conhecido", "adiamento de mudanças"], style: "Construa com calma, metas tangíveis e ritmo consistente." },
  "Gêmeos": { strengths: ["curiosidade", "comunicação", "adaptação"], care: ["dispersão", "excesso de ideias"], style: "Escolha uma ideia por vez e transforme conversa em ação." },
  "Câncer": { strengths: ["intuição", "cuidado", "memória"], care: ["insegurança", "apego emocional"], style: "Crie segurança com rotinas acolhedoras e decisões conscientes." },
  "Leão": { strengths: ["criatividade", "presença", "liderança"], care: ["necessidade de validação", "excesso de confiança"], style: "Lidere pelo exemplo e coloque sua expressão a serviço de uma meta." },
  "Virgem": { strengths: ["análise", "organização", "melhoria"], care: ["perfeccionismo", "autocrítica"], style: "Use método sem esperar perfeição: progresso também é prosperar." },
  "Libra": { strengths: ["diplomacia", "estética", "parceria"], care: ["indecisão", "priorizar demais o outro"], style: "Equilibre suas escolhas com critérios que também respeitem você." },
  "Escorpião": { strengths: ["foco", "profundidade", "transformação"], care: ["controle", "intensidade excessiva"], style: "Direcione sua intensidade para mudanças graduais e mensuráveis." },
  "Sagitário": { strengths: ["visão", "otimismo", "expansão"], care: ["exagero", "falta de continuidade"], style: "Converta visão de futuro em compromissos pequenos e frequentes." },
  "Capricórnio": { strengths: ["disciplina", "estratégia", "responsabilidade"], care: ["rigidez", "cobrança excessiva"], style: "Use estrutura com leveza e reconheça cada etapa do caminho." },
  "Aquário": { strengths: ["originalidade", "visão coletiva", "inovação"], care: ["distanciamento", "rupturas impulsivas"], style: "Dê forma prática às ideias que podem melhorar sua realidade." },
  "Peixes": { strengths: ["imaginação", "empatia", "sensibilidade"], care: ["idealização", "falta de limites"], style: "Proteja sua energia com limites e traduza inspiração em rotina." },
};

const missions: Record<string, string> = {
  "Áries": "Escolha uma meta e dê o primeiro passo possível em 15 minutos.",
  "Touro": "Revise um gasto recorrente e decida se ele ainda apoia seus objetivos.",
  "Gêmeos": "Anote três ideias e escolha apenas uma para desenvolver hoje.",
  "Câncer": "Organize uma pequena área que influencia sua sensação de segurança.",
  "Leão": "Compartilhe uma habilidade que pode abrir uma nova oportunidade.",
  "Virgem": "Simplifique um processo que está consumindo tempo demais.",
  "Libra": "Tome uma decisão adiada usando três critérios objetivos.",
  "Escorpião": "Encerre uma pendência que continua drenando sua atenção.",
  "Sagitário": "Transforme um plano amplo em uma ação com data e horário.",
  "Capricórnio": "Escolha uma meta adiada e defina seu primeiro passo concreto.",
  "Aquário": "Teste uma forma mais simples de resolver um problema recorrente.",
  "Peixes": "Reserve dez minutos para transformar uma intuição em plano escrito.",
};

const objectives = ["Dinheiro", "Carreira", "Negócios", "Organização financeira", "Disciplina", "Desenvolvimento pessoal"];
const journalQuestions = ["O que eu quero construir?", "O que estou evitando?", "Qual foi minha melhor decisão hoje?", "Qual pequena ação posso realizar amanhã?"];

function getSign(date: string) {
  if (!date) return "Capricórnio";
  const [, month, day] = date.split("-").map(Number);
  const code = month * 100 + day;
  return zodiac.find(([, end]) => code <= end)?.[0] ?? "Capricórnio";
}

function track(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const item = { event, data, at: new Date().toISOString() };
  const events = JSON.parse(localStorage.getItem("vds-analytics") || "[]");
  localStorage.setItem("vds-analytics", JSON.stringify([...events.slice(-49), item]));
  window.dispatchEvent(new CustomEvent("vds:analytics", { detail: item }));
}

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(0);
  const [profile, setProfile] = useState<Profile>({ name: "", birthDate: "", objective: "", sign: "Capricórnio" });
  const [xp, setXp] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("Carreira");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [goalDialog, setGoalDialog] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vds-state");
    if (saved) {
      const state = JSON.parse(saved);
      setProfile(state.profile); setXp(state.xp ?? 0); setMissionDone(state.missionDone ?? false);
      setGoals(state.goals ?? []); setEntries(state.entries ?? []); setOnboarding(3);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || onboarding < 3) return;
    localStorage.setItem("vds-state", JSON.stringify({ profile, xp, missionDone, goals, entries }));
  }, [ready, onboarding, profile, xp, missionDone, goals, entries]);

  const level = Math.floor(xp / 100) + 1;
  const stage = xp < 40 ? "Semente" : xp < 100 ? "Raiz" : xp < 180 ? "Crescimento" : xp < 300 ? "Árvore" : "Árvore Dourada";
  const guide = signGuides[profile.sign] ?? signGuides["Capricórnio"];
  const mainGoal = goals[0];
  const mapScores = useMemo(() => [
    ["Dinheiro", Math.min(100, 28 + xp / 8)], ["Carreira", Math.min(100, 36 + goals.length * 9)],
    ["Negócios", Math.min(100, 24 + xp / 12)], ["Disciplina", Math.min(100, 32 + (missionDone ? 24 : 0) + entries.length * 4)],
    ["Desenvolvimento", Math.min(100, 30 + entries.length * 7)],
  ] as [string, number][], [xp, goals.length, missionDone, entries.length]);

  function finishOnboarding() {
    const sign = getSign(profile.birthDate);
    setProfile({ ...profile, sign }); setXp(30); setOnboarding(3);
    track("signup"); track("onboarding_completed", { sign, objective: profile.objective }); track("first_tree_created");
    toast.success(`Sua árvore de ${sign} foi plantada.`);
  }

  function completeMission() {
    if (missionDone) return;
    setMissionDone(true); setXp((v) => v + 20); track("daily_mission_completed", { sign: profile.sign });
    toast.success("+20 XP · Mais um passo foi dado na sua jornada.");
  }

  function addGoal(title = goalTitle, category = goalCategory) {
    if (!title.trim()) return false;
    setGoals((g) => [...g, { id: Date.now(), title: title.trim(), category, progress: 0 }]);
    setXp((v) => v + 15); setGoalTitle(""); setGoalDialog(false); track("goal_created", { category });
    toast.success("Meta plantada · +15 XP"); return true;
  }

  function advanceGoal(id: number) {
    setGoals((items) => items.map((g) => {
      if (g.id !== id) return g;
      const next = Math.min(100, g.progress + 25);
      if (next === 100 && g.progress < 100) { setXp((v) => v + 50); track("goal_completed", { category: g.category }); toast.success("Um novo fruto nasceu na sua árvore · +50 XP"); }
      return { ...g, progress: next };
    }));
  }

  function saveJournal() {
    if (!answers.some((a) => a.trim())) return toast.error("Escreva ao menos uma reflexão.");
    setEntries((e) => [{ date: new Date().toLocaleDateString("pt-BR"), answers }, ...e]);
    setAnswers(["", "", "", ""]); setXp((v) => v + 10); track("journal_entry_created"); toast.success("Reflexão salva · +10 XP");
  }

  useEffect(() => {
    const context = typeof document === "undefined" ? undefined : (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: unknown) => unknown } }).modelContext;
    if (!context?.registerTool || onboarding < 3) return;
    const controller = new AbortController();
    const register = (tool: unknown) => Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => undefined);
    void register({ name: "complete_daily_mission", title: "Concluir missão diária", description: "Conclui a missão diária visível e adiciona 20 XP à árvore.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { completeMission(); return { completed: true, xpAdded: missionDone ? 0 : 20 }; } });
    void register({ name: "create_goal", title: "Criar meta", description: "Cria uma meta na jornada pessoal do usuário.", inputSchema: { type: "object", properties: { title: { type: "string" }, category: { type: "string", enum: ["Financeiro", "Carreira", "Negócios", "Conhecimento", "Relacionamentos", "Desenvolvimento pessoal"] } }, required: ["title", "category"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const value = input as { title?: string; category?: string }; if (!value.title?.trim() || !value.category) throw new Error("Título e categoria são obrigatórios."); addGoal(value.title, value.category); return { created: true, title: value.title, category: value.category }; } });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarding, missionDone]);

  if (!ready) return <main className="app-shell" />;
  if (onboarding < 3) return <Onboarding step={onboarding} setStep={setOnboarding} profile={profile} setProfile={setProfile} finish={finishOnboarding} />;

  return (
    <main className="app-shell">
      <div className="cosmos" aria-hidden="true" />
      <section className="app-frame">
        <header className="topbar">
          <div><p className="eyebrow">Veias da Sintonia</p><h1>{view === "home" ? `Olá, ${profile.name}` : viewLabels[view]} <span aria-hidden="true">✦</span></h1></div>
          <button className="avatar" onClick={() => setView("profile")} aria-label="Abrir perfil">{profile.name.slice(0, 2).toUpperCase()}</button>
        </header>

        {view === "home" && <HomeView profile={profile} xp={xp} level={level} stage={stage} missionDone={missionDone} completeMission={completeMission} oracleOpen={oracleOpen} setOracleOpen={setOracleOpen} mainGoal={mainGoal} advanceGoal={advanceGoal} openGoals={() => setView("profile")} />}
        {view === "tree" && <TreeView xp={xp} level={level} stage={stage} mapScores={mapScores} goals={goals} />}
        {view === "missions" && <MissionsView profile={profile} missionDone={missionDone} completeMission={completeMission} />}
        {view === "journal" && <JournalView answers={answers} setAnswers={setAnswers} save={saveJournal} entries={entries} />}
        {view === "profile" && <ProfileView profile={profile} guide={guide} goals={goals} advanceGoal={advanceGoal} goalDialog={goalDialog} setGoalDialog={setGoalDialog} goalTitle={goalTitle} setGoalTitle={setGoalTitle} goalCategory={goalCategory} setGoalCategory={setGoalCategory} addGoal={() => addGoal()} />}

        <nav className="bottom-nav" aria-label="Navegação principal">
          <NavButton active={view === "home"} onClick={() => setView("home")} icon={<Home/>} label="Início" />
          <NavButton active={view === "tree"} onClick={() => setView("tree")} icon={<Leaf/>} label="Árvore" />
          <NavButton active={view === "missions"} onClick={() => setView("missions")} icon={<Target/>} label="Missões" />
          <NavButton active={view === "journal"} onClick={() => setView("journal")} icon={<BookOpen/>} label="Diário" />
          <NavButton active={view === "profile"} onClick={() => setView("profile")} icon={<UserRound/>} label="Perfil" />
        </nav>
      </section>
      <Toaster richColors position="top-center" />
    </main>
  );
}

const viewLabels: Record<View, string> = { home: "Início", tree: "Sua Árvore", missions: "Missões", journal: "Seu Diário", profile: "Seu Caminho" };

function Onboarding({ step, setStep, profile, setProfile, finish }: { step: number; setStep: (n: number) => void; profile: Profile; setProfile: (p: Profile) => void; finish: () => void }) {
  return <main className="onboarding">
    <div className="stars" aria-hidden="true" />
    <section className="onboarding-card">
      <div className="brand-mark"><Leaf/></div><p className="brand-name">Veias da Sintonia</p>
      {step === 0 && <><div className="onboarding-tree"><Image src="/prosperity-tree.png" alt="Árvore da Prosperidade" width={500} height={750} priority /></div><p className="step-count">01 · 03</p><h1>E se o seu signo pudesse ser um guia para você entender melhor a sua forma de prosperar?</h1><p>Uma jornada simbólica para transformar autoconhecimento em pequenas ações.</p><button className="gold-button" onClick={() => setStep(1)}>Começar minha jornada <ChevronRight/></button></>}
      {step === 1 && <><div className="symbol-ring"><Sparkles/><span>✦</span></div><p className="step-count">02 · 03</p><h1>Conheça seus padrões. Cultive seus hábitos.</h1><p>Descubra forças, organize objetivos e transforme intenção em ação — no seu ritmo.</p><div className="mini-pill-row"><span>Reflexão</span><span>Constância</span><span>Metas</span></div><button className="gold-button" onClick={() => setStep(2)}>Descobrir meu signo <ChevronRight/></button></>}
      {step === 2 && <><p className="step-count">03 · 03</p><h1>Plante sua primeira intenção.</h1><p>Esses dados personalizam sua experiência e ficam somente neste dispositivo.</p><div className="form-stack"><label>Como podemos chamar você?<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Seu nome" /></label><label>Data de nascimento<input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} /></label><fieldset><legend>Seu objetivo principal</legend><div className="choice-grid">{objectives.map((o) => <button type="button" className={profile.objective === o ? "selected" : ""} onClick={() => setProfile({ ...profile, objective: o })} key={o}>{o}</button>)}</div></fieldset></div><button className="gold-button" disabled={!profile.name.trim() || !profile.birthDate || !profile.objective} onClick={finish}>Criar minha árvore <Leaf/></button></>}
    </section>
  </main>;
}

function HomeView({ profile, xp, level, stage, missionDone, completeMission, oracleOpen, setOracleOpen, mainGoal, advanceGoal, openGoals }: { profile: Profile; xp: number; level: number; stage: string; missionDone: boolean; completeMission: () => void; oracleOpen: boolean; setOracleOpen: (v: boolean) => void; mainGoal?: Goal; advanceGoal: (id: number) => void; openGoals: () => void }) {
  return <><div className="welcome-copy"><p>Hoje é um novo dia para construir sua prosperidade.</p><span className="sign-pill"><Sparkles size={14}/>{profile.sign}</span></div><TreeCard xp={xp} level={level} stage={stage}/>
    <section className={`mission-card ${missionDone ? "done" : ""}`}><div className="mission-icon">{missionDone ? <Check/> : <Target/>}</div><div className="mission-copy"><p className="eyebrow">Missão do dia · {missionDone ? "concluída" : "+20 XP"}</p><h2>{missionDone ? "Intenção em movimento" : "Dê forma ao que importa"}</h2><p>{missions[profile.sign]}</p></div><button className="gold-button" disabled={missionDone} onClick={completeMission}>{missionDone ? <><Check/> Missão concluída</> : <><Target/> Começar missão</>}</button></section>
    <section className="oracle-card"><div><p className="eyebrow">Oráculo do dia</p><h2>{oracleOpen ? "A clareza cresce quando a decisão encontra um gesto." : "Uma mensagem para o seu momento"}</h2>{oracleOpen && <p>Transforme em ação: escolha uma pendência simples e reserve 15 minutos para ela.</p>}</div><button className="ghost-button" onClick={() => { setOracleOpen(!oracleOpen); track("oracle_revealed"); }}>{oracleOpen ? "Recolher" : "Revelar mensagem"}</button></section>
    <section className="goal-snapshot"><div className="section-heading"><div><p className="eyebrow">Meta principal</p><h2>{mainGoal ? mainGoal.title : "Plante sua primeira meta"}</h2></div><button onClick={openGoals}>{mainGoal ? "Ver metas" : <><Plus size={16}/> Criar</>}</button></div>{mainGoal ? <><Progress value={mainGoal.progress}/><div className="goal-foot"><span>{mainGoal.category} · {mainGoal.progress}%</span><button onClick={() => advanceGoal(mainGoal.id)}>Avançar +25%</button></div></> : <p>Metas concluídas se transformam em frutos na sua árvore.</p>}</section>
    <div className="tomorrow"><Sparkles/><div><strong>Volte amanhã</strong><span>Uma nova missão e uma mensagem esperam por você.</span></div></div>
  </>;
}

function TreeCard({ xp, level, stage }: { xp: number; level: number; stage: string }) {
  const progress = xp % 100;
  return <section className="tree-card"><div className="tree-card__heading"><div><p className="eyebrow">Sua evolução</p><h2>{stage}</h2></div><div className="level-medal"><span>{level}</span><small>NÍVEL</small></div></div><div className="tree-stage"><div className="orb orb-one"/><div className="orb orb-two"/><Image className="prosperity-tree" src="/prosperity-tree.png" alt="Árvore dourada com raízes, folhas e frutos simbolizando a evolução pessoal" width={768} height={1152} priority/><div className="tree-glow"/></div><div className="xp-row"><div><span>{xp} XP</span><small>continue nutrindo sua árvore</small></div><strong>{progress}%</strong></div><Progress value={progress}/><div className="stats-row"><div><Flame/><strong>1</strong><span>dia</span></div><div><Leaf/><strong>{Math.floor(xp / 100)}</strong><span>frutos</span></div><div><Sparkles/><strong>{xp}</strong><span>pontos</span></div></div></section>;
}

function TreeView({ xp, level, stage, mapScores, goals }: { xp: number; level: number; stage: string; mapScores: [string, number][]; goals: Goal[] }) {
  return <div className="view-stack"><p className="view-intro">Cada ação fortalece raízes, galhos e frutos da sua jornada.</p><TreeCard xp={xp} level={level} stage={stage}/><section className="surface-card"><div className="section-heading"><div><p className="eyebrow">Meu mapa da prosperidade</p><h2>Índice de evolução pessoal</h2></div></div><div className="pillar-list">{mapScores.map(([name, score]) => <div key={name}><div><span>{name}</span><strong>{Math.round(score)}</strong></div><Progress value={score}/></div>)}</div><p className="disclaimer">Este índice reflete suas ações dentro do app. Não é uma previsão financeira.</p></section><section className="milestone-grid"><div><span>Raízes</span><strong>{xp >= 40 ? "Desbloqueadas" : "Em formação"}</strong></div><div><span>Flores</span><strong>{xp >= 180 ? "Desbloqueadas" : `${180 - xp} XP`}</strong></div><div><span>Frutos</span><strong>{goals.filter((g) => g.progress === 100).length} conquistados</strong></div><div><span>Próximo estágio</span><strong>{xp >= 300 ? "Árvore Dourada" : "300 XP"}</strong></div></section></div>;
}

function MissionsView({ profile, missionDone, completeMission }: { profile: Profile; missionDone: boolean; completeMission: () => void }) {
  return <div className="view-stack"><p className="view-intro">Missões práticas, inspiradas simbolicamente em {profile.sign} e no seu objetivo de {profile.objective.toLowerCase()}.</p><section className={`featured-mission ${missionDone ? "done" : ""}`}><div className="mission-badge"><Target/><span>Hoje</span></div><p className="eyebrow">Missão diária · +20 XP</p><h2>{missions[profile.sign]}</h2><p>Leva cerca de 15 minutos. O valor está na ação realizada, não em uma promessa de resultado.</p><button className="gold-button" onClick={completeMission} disabled={missionDone}>{missionDone ? <><Check/> Concluída hoje</> : "Concluir missão"}</button></section><section className="surface-card locked-card"><div className="lock"><LockKeyhole/></div><div><p className="eyebrow">Desafio semanal · Premium</p><h2>7 dias de raízes fortes</h2><p>Uma sequência de ações para construir disciplina com gentileza.</p></div><button onClick={() => { track("paywall_viewed"); toast("Disponível na jornada Premium."); }}>Conhecer Premium</button></section><section className="achievement-row"><Trophy/><div><strong>Próxima conquista</strong><span>Complete 7 missões para desbloquear “Raízes Fortes”.</span></div><span>1/7</span></section></div>;
}

function JournalView({ answers, setAnswers, save, entries }: { answers: string[]; setAnswers: (a: string[]) => void; save: () => void; entries: JournalEntry[] }) {
  return <div className="view-stack"><p className="view-intro">Um espaço privado para observar padrões e transformar reflexão em escolha.</p><section className="surface-card journal-form"><p className="eyebrow">Reflexão de hoje · +10 XP</p>{journalQuestions.map((q, i) => <label key={q}>{q}<textarea rows={2} value={answers[i]} onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }} placeholder="Escreva sem julgar..."/></label>)}<button className="gold-button" onClick={save}>Salvar reflexão <BookOpen/></button></section><section className="history"><div className="section-heading"><div><p className="eyebrow">Histórico</p><h2>Sua evolução em palavras</h2></div><span>{entries.length} registros</span></div>{entries.length ? entries.map((entry, idx) => <article key={`${entry.date}-${idx}`}><time>{entry.date}</time><p>{entry.answers.find(Boolean)}</p></article>) : <div className="empty-state"><BookOpen/><p>Seu primeiro registro aparecerá aqui.</p></div>}</section></div>;
}

function ProfileView({ profile, guide, goals, advanceGoal, goalDialog, setGoalDialog, goalTitle, setGoalTitle, goalCategory, setGoalCategory, addGoal }: { profile: Profile; guide: { strengths: string[]; care: string[]; style: string }; goals: Goal[]; advanceGoal: (id: number) => void; goalDialog: boolean; setGoalDialog: (v: boolean) => void; goalTitle: string; setGoalTitle: (s: string) => void; goalCategory: string; setGoalCategory: (s: string) => void; addGoal: () => void }) {
  return <div className="view-stack"><section className="sign-profile"><div className="zodiac-medallion"><Sparkles/><strong>{profile.sign.slice(0,2).toUpperCase()}</strong></div><p className="eyebrow">Meu signo para prosperar</p><h2>{profile.sign}</h2><p>{guide.style}</p><div className="insight-grid"><div><span>Forças</span>{guide.strengths.map((x) => <b key={x}>{x}</b>)}</div><div><span>Pontos de atenção</span>{guide.care.map((x) => <b key={x}>{x}</b>)}</div></div></section>
    <section className="surface-card goals-card"><div className="section-heading"><div><p className="eyebrow">Minhas metas</p><h2>Frutos em construção</h2></div><Dialog open={goalDialog} onOpenChange={setGoalDialog}><DialogTrigger asChild><button className="round-button" aria-label="Adicionar meta"><Plus/></button></DialogTrigger><DialogContent className="goal-dialog"><DialogHeader><DialogTitle>Plante uma nova meta</DialogTitle><DialogDescription>Defina algo que possa ser acompanhado por pequenas ações.</DialogDescription></DialogHeader><label>Nome da meta<input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Ex.: criar minha reserva"/></label><label>Categoria<select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)}>{["Financeiro","Carreira","Negócios","Conhecimento","Relacionamentos","Desenvolvimento pessoal"].map((x) => <option key={x}>{x}</option>)}</select></label><button className="gold-button" onClick={addGoal}>Criar meta · +15 XP</button></DialogContent></Dialog></div>{goals.length ? goals.map((g) => <article className="goal-item" key={g.id}><div><strong>{g.title}</strong><span>{g.category} · {g.progress}%</span></div><Progress value={g.progress}/><button onClick={() => advanceGoal(g.id)} disabled={g.progress === 100}>{g.progress === 100 ? "Fruto conquistado" : "Avançar +25%"}</button></article>) : <div className="empty-state"><Target/><p>Crie uma meta para começar a cultivar seu primeiro fruto.</p></div>}</section>
    <section className="premium-card"><div className="premium-icon"><Gem/></div><p className="eyebrow">Central da Prosperidade</p><h2>Você já descobriu seu signo.<br/>Agora use-o como ferramenta de evolução.</h2><p>Desbloqueie missões personalizadas, histórico completo, metas ilimitadas, mapa de evolução e conteúdos aprofundados.</p><ul><li><Check/> Guia completo dos 12 signos</li><li><Check/> Exercícios, aulas e desafios</li><li><Check/> Evolução completa da árvore</li></ul><button className="gold-button" onClick={() => { track("paywall_viewed"); track("checkout_started", { provider: "not_configured" }); toast("A assinatura será conectada a um checkout seguro em breve."); }}>Desbloquear minha jornada</button><small>Sem promessas financeiras. Uma experiência de autoconhecimento, hábitos e metas.</small></section>
    <section className="content-list"><div className="section-heading"><div><p className="eyebrow">Conteúdo</p><h2>Sua biblioteca</h2></div></div>{[[BookOpen,"Guia Use Seu Signo para Prosperar","Introdução"],[Rocket,"Estratégias para cada signo","Premium"],[BriefcaseBusiness,"Decisões e carreira","Premium"],[CircleDollarSign,"Organização financeira consciente","Premium"]].map(([Icon,title,badge]) => <button key={String(title)} onClick={() => { if (badge === "Premium") { track("paywall_viewed"); toast("Conteúdo disponível no Premium."); } else { track("ebook_opened"); toast("Conteúdo demonstrativo aberto."); } }}><span className="content-icon"><Icon/></span><span><strong>{String(title)}</strong><small>{String(badge)}</small></span><ChevronRight/></button>)}</section>
  </div>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>; }
