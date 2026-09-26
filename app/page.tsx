"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Anchor, Apple, ArrowLeft, Star, BookOpen, BriefcaseBusiness, CalendarDays, Camera, CameraOff, Check, ChevronRight, CircleDollarSign, Cloud, Compass, Crown, Eye, EyeOff, Flame, Flower2, Gem, Home, ImagePlus, Leaf, LockKeyhole, LogOut, Mail, MoonStar, Orbit, Pencil, Play, Plus, Rocket, Route, Save, Send, Settings2, ShieldCheck, Sparkles, Sprout, Sun, Sunrise, Sunset, Target, Telescope, TreeDeciduous, Trophy, UserRound, Wind, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { dailyPlan, dayPart, dayPartLabel, greetingLabel, journalAnchors, localDayKey, weekPlan, type DailyPlan, type DayPart } from "@/lib/daily";
import { ACHIEVEMENT_CATEGORIES, achievementState, weeklyReport, type Achievement, type JourneySnapshot } from "@/lib/journey";
import { findTrail, trailStatus, trails, type Trail, type TrailProgress } from "@/lib/trails";
import { TREE_PART_HOTSPOTS, TREE_STAGES, treeStageFor, type TreePartHotspot } from "@/lib/treeStages";
import { ProsperityTree } from "@/components/ProsperityTree";
import { SignsView } from "@/components/views/SignsView";
import { IntroExperience, introModeFor, type IntroMode } from "@/components/IntroExperience";
import { ZodiacBackdrop } from "@/components/ZodiacBackdrop";
import { DiagnosticView } from "@/components/diagnostic/DiagnosticView";
import { DiagnosticHomeCards, DiagnosticTreeFocus } from "@/components/diagnostic/DiagnosticEntryPoints";
import { track } from "@/lib/analytics";
import { GUIDES, type GuideId } from "@/lib/library";
import { LibraryReader } from "@/components/LibraryReader";
import { AdminAchievements } from "@/components/AdminAchievements";
import { recallLogin, rememberLogin, stopSilentLogin } from "@/lib/savedLogin";
import { loadDiagnostics, saveDiagnostic, type DiagnosticResult } from "@/lib/diagnostic";

type View = "home" | "premium" | "diagnostic" | "signs" | "tree" | "missions" | "journal" | "profile" | "goal" | "chat";
type GoalKind = "financial" | "non_financial" | "partial";
type Goal = {
  id: number; title: string; category: string; progress: number; isPrimary?: boolean;
  kind?: GoalKind; targetAmount?: number; currentAmount?: number; deadline?: string;
  motivation?: string; stage?: string; blocker?: string; dailyMinutes?: number;
};
type JournalEntry = { date: string; answers: string[] };
type CloudState = {
  profile: Partial<Profile>; xp?: number; missionDone?: boolean; ritualDone?: boolean; streak?: number;
  goals?: Goal[]; entries?: JournalEntry[]; trail?: TrailProgress | null; unlockedAchievements?: string[];
};
/** Error/notice payload shared by the JSON API routes. */
type ApiMessage = { error?: string; message?: string };
type Theme = "dourado" | "lua" | "aurora";
type Plan = "free" | "premium";
type Profile = { name: string; birthDate: string; objective: string; sign: string; intention: string; theme: Theme; hasAvatar?: boolean; plan?: Plan };
type Account = { email: string; deviceId: string | null; isAdmin?: boolean };

const emptyProfile: Profile = { name: "", birthDate: "", objective: "", sign: "Capricórnio", intention: "", theme: "dourado", hasAvatar: false, plan: "free" };
const FREE_GOAL_LIMIT = 3;
/** Extra XP for finishing the three daily cares (mission, ritual, reflection) on the same day. */
const DAY_COMPLETE_BONUS = 20;
/** Journal entries are dated "dd/mm/aaaa" (pt-BR); the app's day key is "aaaa-mm-dd". */
const dayKeyToBr = (key: string) => key.split("-").reverse().join("/");
const TOTAL_ONBOARDING_STEPS = 10;
const FREE_JOURNAL_HISTORY = 7;
const FREE_THEMES: readonly Theme[] = ["dourado"];


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

const guideIcon: Record<GuideId, typeof BookOpen> = { intro: BookOpen, "sign-strategies": Rocket, career: BriefcaseBusiness, money: CircleDollarSign };

const objectives = ["Dinheiro", "Carreira", "Negócios", "Organização financeira", "Disciplina", "Desenvolvimento pessoal"];

const goalAmountPresets = [100, 500, 1000, 5000, 10000, 50000];
const stageOptions: readonly [string, string][] = [
  ["starting", "Estou começando agora"], ["lost", "Já comecei, mas estou perdido(a)"],
  ["advancing", "Já estou avançando"], ["close", "Estou perto de conseguir"], ["restart", "Preciso recomeçar"],
];
const blockerOptions: readonly [string, string][] = [
  ["money", "Falta de dinheiro"], ["organization", "Falta de organização"], ["discipline", "Falta de disciplina"],
  ["fear", "Medo de começar"], ["knowledge", "Falta de conhecimento"], ["opportunity", "Falta de oportunidades"],
  ["consistency", "Falta de constância"], ["unclear", "Não sei exatamente o que fazer"], ["other", "Outro"],
];
const dailyMinutesOptions: readonly [number, string][] = [[5, "5 minutos"], [10, "10 minutos"], [15, "15 minutos"], [30, "30 minutos"], [60, "1 hora ou mais"]];
const stageLabelByKey = Object.fromEntries(stageOptions) as Record<string, string>;
const blockerLabelByKey = Object.fromEntries(blockerOptions) as Record<string, string>;

const dayPartIcon: Record<DayPart, React.ReactNode> = { dawn: <Sunrise />, day: <Sun />, dusk: <Sunset />, night: <MoonStar /> };
const achievementIcon: Record<Achievement["icon"], React.ReactNode> = { sprout: <Sprout />, anchor: <Anchor />, flame: <Flame />, apple: <Apple />, shield: <ShieldCheck />, orbit: <Orbit />, crown: <Crown />, gem: <Gem />, star: <Star />, trophy: <Trophy />, book: <BookOpen />, route: <Route /> };
const treePartIcon: Record<string, React.ReactNode> = { raizes: <Anchor />, tronco: <TreeDeciduous />, galhos: <Target />, folhas: <Leaf />, flores: <Flower2 />, frutos: <Apple />, copa: <Crown /> };

/** Short, non-intrusive haptic confirmation. Silently ignored where unsupported. */
function haptic(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try { navigator.vibrate(pattern); } catch { /* no haptics available */ }
}

/** Stripe's customer portal: update the card, see invoices or cancel — no hoops. */
async function openBillingPortal() {
  try {
    const response = await fetch("/api/billing/stripe/portal", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error ?? "Não foi possível abrir o gerenciamento da assinatura agora.");
    window.location.assign(result.url);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Não foi possível abrir o gerenciamento da assinatura agora.");
  }
}

/** Signs back in with the credential the browser's password manager kept for this site, if any. */
async function signInWithSavedLogin(): Promise<Account | null> {
  const saved = await recallLogin();
  if (!saved) return null;
  try {
    const response = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "login", email: saved.email, password: saved.password }) });
    if (!response.ok) return null;
    const { user } = await response.json() as { user?: Account };
    return user ?? null;
  } catch {
    return null;
  }
}

function getSign(date: string) {
  if (!date) return "Capricórnio";
  const [, month, day] = date.split("-").map(Number);
  const code = month * 100 + day;
  return zodiac.find(([, end]) => code <= end)?.[0] ?? "Capricórnio";
}


export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [navigated, setNavigated] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [welcomeAuthMode, setWelcomeAuthMode] = useState<"register" | "login" | null>(null);
  const [onboarding, setOnboarding] = useState(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [xp, setXp] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const [ritualDone, setRitualDone] = useState(false);
  const [ritualOpen, setRitualOpen] = useState(false);
  const [treeCelebrating, setTreeCelebrating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [oracleOpen, setOracleOpen] = useState(false);
  const [dayKey, setDayKey] = useState(() => localDayKey());
  const [part, setPart] = useState<DayPart>(() => dayPart(new Date().getHours()));
  const [xpBurst, setXpBurst] = useState<{ id: number; amount: number } | null>(null);
  const [stageUnlocked, setStageUnlocked] = useState<{ name: string; note: string } | null>(null);
  const [activeTrail, setActiveTrail] = useState<TrailProgress | null>(null);
  const [paywall, setPaywall] = useState<string | null>(null);
  const treeStageBaseline = useRef<number | null>(null);
  const lastDay = useRef(dayKey);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("Carreira");
  const [obGoalKind, setObGoalKind] = useState<GoalKind | "">("");
  const [obGoalAmount, setObGoalAmount] = useState<number | "">("");
  const [obGoalStage, setObGoalStage] = useState("");
  const [obGoalBlocker, setObGoalBlocker] = useState("");
  const [obGoalDailyMinutes, setObGoalDailyMinutes] = useState<number | "">("");
  const [obGoalMotivation, setObGoalMotivation] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [goalDialog, setGoalDialog] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [syncReady, setSyncReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"loading" | "saved" | "offline">("loading");
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [intro, setIntro] = useState<IntroMode | null>(null);
  const notifiedAchievements = useRef<Set<string> | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("vds-device-id") || crypto.randomUUID();
    localStorage.setItem("vds-device-id", id);
    localStorage.removeItem("vds-state");
    // Initial browser state is intentionally hydrated once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceId(id);
    fetch("/api/auth")
      .then((response) => response.ok ? response.json() as Promise<{ user: Account | null }> : Promise.reject(new Error("auth unavailable")))
      .then(async ({ user }) => {
        // No session (expired, or the browser's history/cookies were cleared): try the password the
        // browser saved for this site before showing the welcome screen, so the account is recognised.
        const signedIn: Account | null = user ?? await signInWithSavedLogin();
        setAccount(signedIn);
        if (!signedIn) return null;
        setIntro(user ? introModeFor(signedIn.email) : "full");
        return loadCloudState(signedIn, id);
      })
      .catch(() => toast.error("Não foi possível verificar sua conta."))
      .finally(() => setReady(true));
  // Runs once on mount: the session check must not re-run when loadCloudState is recreated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSessionExpired() {
    localStorage.removeItem("vds-state");
    setAccount(null); setProfile(emptyProfile); setXp(0); setMissionDone(false); setRitualDone(false); setStreak(0); setGoals([]); setEntries([]); setActiveTrail(null); setOnboarding(0); setView("home"); setSyncReady(false); setUnlockedAchievements([]); setWelcomeAuthMode("login");
    treeStageBaseline.current = null;
    notifiedAchievements.current = null;
    toast.error("Sua sessão expirou. Entre novamente para continuar sua jornada.");
  }

  async function loadCloudState(user: Account, fallbackDeviceId: string) {
    try {
      const response = await fetch(`/api/sync?day=${localDayKey()}`);
      if (response.status === 401) { handleSessionExpired(); return; }
      if (!response.ok) throw new Error("sync unavailable");
      const { state, deviceId: cloudDeviceId } = await response.json() as { state: CloudState | null; deviceId: string | null };
      const resolvedId = cloudDeviceId || fallbackDeviceId;
      localStorage.setItem("vds-device-id", resolvedId);
      setDeviceId(resolvedId);
      setAccount({ ...user, deviceId: cloudDeviceId });
      if (state) {
        const nextProfile = { ...emptyProfile, ...state.profile };
        setProfile(nextProfile); setXp(state.xp ?? 0); setMissionDone(state.missionDone ?? false); setRitualDone(state.ritualDone ?? false); setStreak(state.streak ?? 0);
        setGoals(state.goals ?? []); setEntries(state.entries ?? []); setActiveTrail(state.trail ?? null); setOnboarding(TOTAL_ONBOARDING_STEPS);
        setUnlockedAchievements(state.unlockedAchievements ?? []);
        notifiedAchievements.current = new Set(state.unlockedAchievements ?? []);
        if (nextProfile.hasAvatar) setAvatarVersion(Date.now());
      } else {
        setProfile(emptyProfile); setXp(0); setMissionDone(false); setRitualDone(false); setStreak(0); setGoals([]); setEntries([]); setActiveTrail(null); setOnboarding(0); setUnlockedAchievements([]);
        notifiedAchievements.current = new Set();
      }
      setSyncStatus("saved");
      setSyncReady(true);
    } catch {
      setSyncStatus("offline");
      setSyncReady(true);
    }
  }

  async function handleAuthenticated(user: Account) {
    // Every login or sign-up plays the full journey (signos → portal); reopening an app that is
    // already signed in gets the short portal crossing instead (see the auth check on mount).
    setIntro("full");
    setAccount(user);
    const currentId = localStorage.getItem("vds-device-id") || crypto.randomUUID();
    await loadCloudState(user, currentId);
  }

  async function logout() {
    await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    stopSilentLogin();
    localStorage.removeItem("vds-state");
    localStorage.setItem("vds-device-id", crypto.randomUUID());
    setAccount(null); setProfile(emptyProfile); setXp(0); setMissionDone(false); setRitualDone(false); setStreak(0); setGoals([]); setEntries([]); setActiveTrail(null); setOnboarding(0); setView("home"); setSyncReady(false); setUnlockedAchievements([]); setWelcomeAuthMode(null); setIntro(null);
    treeStageBaseline.current = null;
    notifiedAchievements.current = null;
    toast.success("Você saiu da sua conta.");
  }

  useEffect(() => {
    if (!syncReady || !account || !deviceId || onboarding < TOTAL_ONBOARDING_STEPS || !profile.name) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSyncStatus("loading");
    const timer = window.setTimeout(() => {
      fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId, dayKey, profile: { name: profile.name, birthDate: profile.birthDate, objective: profile.objective, sign: profile.sign, intention: profile.intention, theme: profile.theme }, xp, missionDone, ritualDone, goals, entries, trail: activeTrail, unlockedAchievements }),
      }).then(async (response) => {
        if (response.status === 401) { handleSessionExpired(); return; }
        if (!response.ok) throw new Error("sync failed");
        const result = await response.json().catch(() => null) as { streak?: number } | null;
        if (result && typeof result.streak === "number") setStreak(result.streak);
        setSyncStatus("saved");
      }).catch(() => setSyncStatus("offline"));
    }, 700);
    return () => window.clearTimeout(timer);
  // dayKey is read but deliberately left out: a rollover must first clear the daily
  // flags below, otherwise this would persist yesterday's mission as today's.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncReady, account, deviceId, onboarding, profile, xp, missionDone, ritualDone, goals, entries, activeTrail, unlockedAchievements]);

  // The app can stay open across a sunset or a midnight: keep the ambience and the day's content honest.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setDayKey(localDayKey());
      setPart(dayPart(new Date().getHours()));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lastDay.current === dayKey) return;
    lastDay.current = dayKey;
    setMissionDone(false);
    setRitualDone(false);
    setOracleOpen(false);
    setAnswers(["", "", "", ""]);
  }, [dayKey]);

  // Back from Stripe Checkout: confirm right away so Premium does not wait on the webhook.
  useEffect(() => {
    if (!account || !syncReady) return;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("checkout");
    if (!outcome) return;
    const sessionId = params.get("session_id");
    window.history.replaceState({}, "", window.location.pathname);
    if (outcome === "cancel") { toast("Pagamento não concluído. Você pode assinar quando quiser."); return; }
    if (outcome !== "success" || !sessionId) return;
    fetch("/api/billing/stripe/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) })
      .then((response) => response.json() as Promise<{ plan?: string; error?: string }>)
      .then((result) => {
        if (result.plan === "premium") {
          setProfile((current) => ({ ...current, plan: "premium" }));
          track("checkout_completed", { provider: "stripe" });
          toast.success("Premium ativado. Obrigado por apoiar sua jornada!");
        } else if (result.error) toast.error(result.error);
        else toast("Pagamento recebido. O Premium é liberado em instantes.");
      })
      .catch(() => toast("Pagamento recebido. O Premium é liberado em instantes."));
  }, [account, syncReady]);

  const journaledToday = entries.some((entry) => entry.date === dayKeyToBr(dayKey));
  useEffect(() => {
    if (!syncReady || !account || !missionDone || !ritualDone || !journaledToday) return;
    const key = `vds-daybonus:${account.email}`;
    try { if (localStorage.getItem(key) === dayKey) return; localStorage.setItem(key, dayKey); } catch { return; }
    awardXp(DAY_COMPLETE_BONUS);
    toast.success(`🌳 Dia completo! Missão, ritual e reflexão · +${DAY_COMPLETE_BONUS} XP`);
    track("day_completed");
  }, [syncReady, account, missionDone, ritualDone, journaledToday, dayKey]);

  // The diagnostic lives on this device, per account (see lib/diagnostic.ts).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDiagnostics(loadDiagnostics(account?.email));
  }, [account?.email]);

  const isPremium = profile.plan === "premium";
  const level = Math.floor(xp / 100) + 1;
  const treeStage = useMemo(() => treeStageFor(xp), [xp]);
  const stage = treeStage.stage.name;
  const guide = signGuides[profile.sign] ?? signGuides["Capricórnio"];
  const mainGoal = goals[0];
  const plan = useMemo(() => dailyPlan({ dayKey, sign: profile.sign, objective: profile.objective }), [dayKey, profile.sign, profile.objective]);
  const week = useMemo(() => weekPlan(profile.sign, 7, new Date(`${dayKey}T00:00:00`)), [profile.sign, dayKey]);
  const snapshot = useMemo<JourneySnapshot>(() => ({ xp, level, streak, entries, goals, trailDays: activeTrail?.completedDays.length ?? 0, unlockedKeys: unlockedAchievements }), [xp, level, streak, entries, goals, activeTrail, unlockedAchievements]);

  useEffect(() => {
    if (!syncReady || !notifiedAchievements.current) return;
    const known = notifiedAchievements.current;
    const newlyReached = achievementState(snapshot).resolved.filter((item) => item.unlocked && !known.has(item.key));
    if (!newlyReached.length) return;
    for (const item of newlyReached) known.add(item.key);
    setUnlockedAchievements((current) => [...current, ...newlyReached.map((item) => item.key)]);
    const bonus = newlyReached.reduce((sum, item) => sum + (item.xpBonus ?? 0), 0);
    if (bonus) awardXp(bonus);
    // Several at once (e.g. existing progress meeting new achievements) become one summary, not a toast storm.
    if (newlyReached.length > 2) {
      toast.success(`🏆 ${newlyReached.length} conquistas desbloqueadas${bonus ? ` · +${bonus} XP` : ""}`, { description: newlyReached.map((item) => item.name).join(" · ") });
    } else {
      for (const item of newlyReached) toast.success(item.xpBonus ? `🏆 Conquista desbloqueada: ${item.name} · +${item.xpBonus} XP` : `🏆 Conquista desbloqueada: ${item.name}`);
    }
  }, [syncReady, snapshot]);

  useEffect(() => {
    if (!syncReady) return;
    if (treeStageBaseline.current === null) { treeStageBaseline.current = treeStage.stageIndex; return; }
    if (treeStage.stageIndex > treeStageBaseline.current) {
      setStageUnlocked({ name: treeStage.stage.name, note: treeStage.stage.note });
      haptic([18, 60, 26]);
    }
    treeStageBaseline.current = treeStage.stageIndex;
  }, [syncReady, treeStage.stageIndex, treeStage.stage.name, treeStage.stage.note]);

  useEffect(() => {
    if (!stageUnlocked) return;
    const timer = window.setTimeout(() => setStageUnlocked(null), 3400);
    return () => window.clearTimeout(timer);
  }, [stageUnlocked]);

  useEffect(() => {
    if (!xpBurst) return;
    const timer = window.setTimeout(() => setXpBurst(null), 1300);
    return () => window.clearTimeout(timer);
  }, [xpBurst]);
  const mapScores = useMemo(() => [
    ["Dinheiro", Math.min(100, 28 + xp / 8)], ["Carreira", Math.min(100, 36 + goals.length * 9)],
    ["Negócios", Math.min(100, 24 + xp / 12)], ["Disciplina", Math.min(100, 32 + (missionDone ? 24 : 0) + entries.length * 4)],
    ["Desenvolvimento", Math.min(100, 30 + entries.length * 7)],
  ] as [string, number][], [xp, goals.length, missionDone, entries.length]);

  function finishOnboarding() {
    const sign = getSign(profile.birthDate);
    const kind: GoalKind = obGoalKind || "non_financial";
    const hasAmount = kind !== "non_financial" && obGoalAmount !== "";
    const primaryGoal: Goal = {
      id: Date.now(),
      title: goalTitle.trim() || profile.objective,
      category: profile.objective,
      progress: 0,
      isPrimary: true,
      kind,
      targetAmount: hasAmount ? (obGoalAmount as number) : undefined,
      currentAmount: hasAmount ? 0 : undefined,
      motivation: obGoalMotivation.trim(),
      stage: obGoalStage || undefined,
      blocker: obGoalBlocker || undefined,
      dailyMinutes: obGoalDailyMinutes === "" ? undefined : obGoalDailyMinutes,
    };
    setProfile({ ...profile, sign });
    setGoals((current) => [primaryGoal, ...current]);
    setXp(30); setOnboarding(TOTAL_ONBOARDING_STEPS);
    setGoalTitle(""); setObGoalKind(""); setObGoalAmount(""); setObGoalStage(""); setObGoalBlocker(""); setObGoalDailyMinutes(""); setObGoalMotivation("");
    track("signup"); track("onboarding_completed", { sign, objective: profile.objective, goalKind: kind });
    track("first_tree_created"); track("goal_created", { category: profile.objective, primary: true });
    toast.success(`Sua árvore de ${sign} foi plantada.`);
  }

  function openPaywall(reason: string) {
    haptic(8);
    track("paywall_viewed", { from: reason });
    setPaywall(reason);
  }

  function awardXp(amount: number) {
    setXp((value) => value + amount);
    setXpBurst({ id: Date.now(), amount });
    haptic(14);
  }

  function completeMission() {
    if (missionDone) return;
    setMissionDone(true); awardXp(20); track("daily_mission_completed", { sign: profile.sign, theme: plan.theme.key });
    celebrateTree();
    toast.success("+20 XP · Mais um passo foi dado na sua jornada.");
  }

  function celebrateTree() {
    setTreeCelebrating(true);
    window.setTimeout(() => setTreeCelebrating(false), 1400);
  }

  function completeRitual(mood: string) {
    if (ritualDone) return;
    setRitualDone(true);
    awardXp(10);
    setRitualOpen(false);
    celebrateTree();
    track("daily_ritual_completed", { sign: profile.sign, objective: profile.objective, mood, theme: plan.theme.key });
    toast.success("Ritual concluído · sua árvore recebeu +10 XP");
  }

  function addGoal(title = goalTitle, category = goalCategory) {
    if (!title.trim()) return false;
    if (!isPremium && goals.length >= FREE_GOAL_LIMIT) { openPaywall("goal_limit"); return false; }
    setGoals((g) => [...g, { id: Date.now(), title: title.trim(), category, progress: 0 }]);
    awardXp(15); setGoalTitle(""); setGoalDialog(false); track("goal_created", { category });
    toast.success("Meta plantada · +15 XP"); return true;
  }

  function advanceGoal(id: number) {
    const goal = goals.find((item) => item.id === id);
    if (!goal || goal.progress === 100) return;
    const next = Math.min(100, goal.progress + 25);
    setGoals((items) => items.map((item) => (item.id === id ? { ...item, progress: next } : item)));
    if (next === 100) {
      awardXp(50); celebrateTree(); track("goal_completed", { category: goal.category });
      toast.success("Um novo fruto nasceu na sua árvore · +50 XP");
    } else {
      haptic(10);
      toast.success(`${goal.title} · ${next}%`);
    }
  }

  /** For financial goals: adds to the saved amount and recomputes progress from it, instead of a flat +25%. */
  function addGoalAmount(id: number, amount: number) {
    const goal = goals.find((item) => item.id === id);
    if (!goal || !goal.targetAmount || amount <= 0 || goal.progress === 100) return;
    const currentAmount = Math.min(goal.targetAmount, (goal.currentAmount ?? 0) + amount);
    const next = Math.round((currentAmount / goal.targetAmount) * 100);
    setGoals((items) => items.map((item) => (item.id === id ? { ...item, currentAmount, progress: next } : item)));
    if (next === 100) {
      awardXp(50); celebrateTree(); track("goal_completed", { category: goal.category });
      toast.success("Meta alcançada · um novo fruto nasceu na sua árvore · +50 XP");
    } else {
      haptic(10);
      toast.success(`+R$${amount.toLocaleString("pt-BR")} guardados · ${next}%`);
    }
  }

  function startTrail(trailId: string) {
    const trail = findTrail(trailId);
    if (!trail) return;
    if (trail.premium && !isPremium) { openPaywall("trail_start"); return; }
    setActiveTrail({ trailId, startedAt: dayKey, completedDays: [] });
    track("trail_started", { trail: trailId });
    toast.success(`${trail.title} · dia 1 começou`);
  }

  function completeTrailDay(day: number) {
    setActiveTrail((current) => {
      if (!current || current.completedDays.includes(day)) return current;
      return { ...current, completedDays: [...current.completedDays, day] };
    });
    const trail = findTrail(activeTrail?.trailId);
    awardXp(15);
    celebrateTree();
    track("trail_day_completed", { trail: activeTrail?.trailId, day });
    const isLast = trail && day >= trail.length;
    toast.success(isLast ? "Trilha concluída · sua árvore guarda essa conquista" : `Dia ${day} concluído · +15 XP`);
  }

  function abandonTrail() {
    setActiveTrail(null);
    track("trail_abandoned");
  }

  function saveJournal() {
    if (!answers.some((a) => a.trim())) return toast.error("Escreva ao menos uma reflexão.");
    setEntries((e) => [{ date: new Date().toLocaleDateString("pt-BR"), answers }, ...e]);
    setAnswers(["", "", "", ""]); awardXp(10); track("journal_entry_created"); toast.success("Reflexão salva · +10 XP");
  }

  useEffect(() => {
    const context = typeof document === "undefined" ? undefined : (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: unknown) => unknown } }).modelContext;
    if (!context?.registerTool || onboarding < TOTAL_ONBOARDING_STEPS) return;
    const controller = new AbortController();
    const register = (tool: unknown) => Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => undefined);
    void register({ name: "complete_daily_mission", title: "Concluir missão diária", description: "Conclui a missão diária visível e adiciona 20 XP à árvore.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: () => { completeMission(); return { completed: true, xpAdded: missionDone ? 0 : 20 }; } });
    void register({ name: "create_goal", title: "Criar meta", description: "Cria uma meta na jornada pessoal do usuário.", inputSchema: { type: "object", properties: { title: { type: "string" }, category: { type: "string", enum: ["Financeiro", "Carreira", "Negócios", "Conhecimento", "Relacionamentos", "Desenvolvimento pessoal"] } }, required: ["title", "category"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input: unknown) => { const value = input as { title?: string; category?: string }; if (!value.title?.trim() || !value.category) throw new Error("Título e categoria são obrigatórios."); addGoal(value.title, value.category); return { created: true, title: value.title, category: value.category }; } });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarding, missionDone]);

  if (!ready) return <AppSplash />;
  if (!account) {
    if (!welcomeAuthMode) return <WelcomeHero onStart={() => setWelcomeAuthMode("register")} onLogin={() => setWelcomeAuthMode("login")} />;
    return <AuthScreen onAuthenticated={handleAuthenticated} initialMode={welcomeAuthMode} onBack={() => setWelcomeAuthMode(null)} />;
  }
  if (onboarding < TOTAL_ONBOARDING_STEPS) return <Onboarding step={onboarding} setStep={setOnboarding} profile={profile} setProfile={setProfile} finish={finishOnboarding}
    goalTitle={goalTitle} setGoalTitle={setGoalTitle} goalKind={obGoalKind} setGoalKind={setObGoalKind} goalAmount={obGoalAmount} setGoalAmount={setObGoalAmount}
    goalStage={obGoalStage} setGoalStage={setObGoalStage} goalBlocker={obGoalBlocker} setGoalBlocker={setObGoalBlocker}
    goalDailyMinutes={obGoalDailyMinutes} setGoalDailyMinutes={setObGoalDailyMinutes} goalMotivation={obGoalMotivation} setGoalMotivation={setObGoalMotivation} />;

  function openTree(source: string) {
    track("prosperity_tree_opened", { source });
    navigate("tree");
  }

  function navigate(next: View) {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Tapping the tab you're already on brings you back to the top, like native tab bars.
    if (next === view) { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); return; }
    haptic(8);
    // Tabs slide in the direction of the bar; drill-in screens (goal, chat) always push forward and pop back.
    const from = tabOrder.indexOf(view), to = tabOrder.indexOf(next);
    const direction = from === -1 ? "back" : to === -1 || to > from ? "forward" : "back";
    const root = document.documentElement;
    const commit = () => { setView(next); setNavigated(true); };
    if (!document.startViewTransition) { commit(); window.scrollTo(0, 0); return; }
    root.dataset.navDirection = direction;
    // The outgoing snapshot was taken mid-scroll; keep it where it was on screen while the new tab starts at the top.
    root.style.setProperty("--nav-scroll-offset", `${-window.scrollY}px`);
    const transition = document.startViewTransition(() => { flushSync(commit); window.scrollTo(0, 0); });
    activeNavTransition = transition;
    // A quick second tap skips this transition; only the latest one may clear the shared direction state.
    const cleanup = () => {
      if (activeNavTransition !== transition) return;
      activeNavTransition = null;
      delete root.dataset.navDirection;
      root.style.removeProperty("--nav-scroll-offset");
    };
    transition.finished.then(cleanup, cleanup);
    // A skipped transition (hidden page, a second quick tap) rejects `ready`; the DOM update still happens.
    transition.ready.catch(() => {});
  }

  return (
    <main className="app-shell" data-theme={profile.theme} data-daypart={part}>
      <ZodiacBackdrop step={view} sign={profile.sign} />
      <div className="cosmos" aria-hidden="true" />
      <section className="app-frame" data-navigated={navigated || undefined}>
        <header className="topbar">
          <div><p className="eyebrow">Veias da Sintonia</p><h1>{view === "home" ? `Olá, ${profile.name.split(" ")[0]}` : viewLabels[view]}{" "}<span aria-hidden="true">✦</span></h1></div>
          <div className="topbar-actions">
            <button type="button" className={`premium-pill ${isPremium ? "is-active" : ""} ${view === "premium" ? "is-current" : ""}`} onClick={() => navigate("premium")} aria-current={view === "premium" ? "page" : undefined}><Gem aria-hidden="true"/><span>Premium</span></button>
            <button className={`avatar ${profile.hasAvatar ? "has-photo" : ""}`} onClick={() => navigate("profile")} aria-label="Abrir perfil">{profile.hasAvatar ? <Image unoptimized src={`/api/profile/avatar?v=${avatarVersion}`} alt="" width={44} height={44} /> : profile.name.slice(0, 2).toUpperCase()}</button>
          </div>
        </header>

        <div className="view-swap" key={view}>
          {view === "home" && <HomeView profile={profile} plan={plan} week={week} part={part} xp={xp} level={level} stage={stage} streak={streak} fruits={goals.filter((goal) => goal.progress === 100).length} missionDone={missionDone} ritualDone={ritualDone} treeCelebrating={treeCelebrating} completeMission={completeMission} openRitual={() => { haptic(8); setRitualOpen(true); }} oracleOpen={oracleOpen} setOracleOpen={setOracleOpen} mainGoal={mainGoal} advanceGoal={advanceGoal} openGoals={() => navigate(mainGoal ? "goal" : "profile")} navigate={navigate} isPremium={isPremium} openPaywall={openPaywall} diagnostic={diagnostics[0]} openTree={(source) => openTree(source)} />}
          {view === "premium" && <PremiumView isPremium={isPremium} />}
          {view === "diagnostic" && <DiagnosticView results={diagnostics} profileSign={profile.sign || undefined} xp={xp} onComplete={(result) => setDiagnostics((current) => saveDiagnostic(account?.email, result, current))} onOpenTree={() => openTree("diagnostic_result")} />}
          {view === "signs" && <SignsView profile={profile} isPremium={isPremium} openPaywall={openPaywall} navigate={navigate} />}
          {view === "tree" && <TreeView xp={xp} level={level} stage={stage} streak={streak} mapScores={mapScores} goals={goals} diagnostic={diagnostics[0]} openDiagnostic={() => navigate("diagnostic")} snapshot={snapshot} cares={{ missionDone, ritualDone, journaledToday }} navigate={navigate} openRitual={() => { haptic(8); setRitualOpen(true); }} />}
          {view === "missions" && <JourneyView profile={profile} plan={plan} snapshot={snapshot} week={week} missionDone={missionDone} ritualDone={ritualDone} completeMission={completeMission} openRitual={() => { haptic(8); setRitualOpen(true); }} activeTrail={activeTrail} startTrail={startTrail} completeTrailDay={completeTrailDay} abandonTrail={abandonTrail} isPremium={isPremium} openPaywall={openPaywall} />}
          {view === "journal" && <JournalView plan={plan} answers={answers} setAnswers={setAnswers} save={saveJournal} entries={entries} isPremium={isPremium} openPaywall={openPaywall} />}
          {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} account={account} guide={guide} goals={goals} advanceGoal={advanceGoal} goalDialog={goalDialog} setGoalDialog={setGoalDialog} goalTitle={goalTitle} setGoalTitle={setGoalTitle} goalCategory={goalCategory} setGoalCategory={setGoalCategory} addGoal={() => addGoal()} syncStatus={syncStatus} avatarVersion={avatarVersion} setAvatarVersion={setAvatarVersion} logout={logout} isPremium={isPremium} openPaywall={openPaywall} navigate={navigate} />}
          {view === "goal" && <GoalDetailView goal={mainGoal} advanceGoal={advanceGoal} addGoalAmount={addGoalAmount} navigate={navigate} isPremium={isPremium} openPaywall={openPaywall} />}
          {view === "chat" && <ChatView profile={profile} isPremium={isPremium} navigate={navigate} openPaywall={openPaywall} onSessionExpired={handleSessionExpired} />}
        </div>

        <nav className="bottom-nav" aria-label="Navegação principal" style={{ "--tab-index": Math.max(tabOrder.indexOf(view), 0), "--tab-count": navTabs.length } as React.CSSProperties}>
          <span className={`nav-indicator ${tabOrder.includes(view) ? "" : "is-hidden"}`} aria-hidden="true" />
          {navTabs.map(({ view: tab, label, icon }) => <NavButton key={tab} active={view === tab} onClick={() => navigate(tab)} icon={icon} label={label} />)}
        </nav>
      </section>
      <DailyRitual open={ritualOpen} onOpenChange={setRitualOpen} profile={profile} plan={plan} done={ritualDone} onComplete={completeRitual} />
      <PaywallDialog reason={paywall} onOpenChange={(open) => { if (!open) setPaywall(null); }} />
      {xpBurst && <div className="xp-float" key={xpBurst.id} aria-hidden="true">+{xpBurst.amount} XP</div>}
      {stageUnlocked && <TreeStageUnlockedOverlay name={stageUnlocked.name} note={stageUnlocked.note} />}
      {intro && <IntroExperience mode={intro} accountKey={account?.email} onComplete={() => setIntro(null)} />}
      <Toaster richColors position="top-center" />
    </main>
  );
}

const navTabs: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: "home", label: "Início", icon: <Home/> },
  // "Diagnóstico" does not fit a seven-column bar on phones; the screen itself is titled "Meu Diagnóstico".
  { view: "diagnostic", label: "Momento", icon: <Telescope/> },
  { view: "signs", label: "Signos", icon: <Sparkles/> },
  { view: "tree", label: "Árvore", icon: <Leaf/> },
  { view: "missions", label: "Jornada", icon: <Route/> },
  { view: "journal", label: "Diário", icon: <BookOpen/> },
  { view: "profile", label: "Perfil", icon: <UserRound/> },
];
const tabOrder = navTabs.map((tab) => tab.view);
let activeNavTransition: ViewTransition | null = null;
const viewLabels: Record<View, string> = { home: "Início", premium: "Premium", diagnostic: "Meu Diagnóstico", signs: "Signos & Astrologia", tree: "Sua Árvore", missions: "Sua Jornada", journal: "Seu Diário", profile: "Seu Caminho", goal: "Meu Objetivo", chat: "Conversar" };

function AppSplash() {
  return <main className="app-splash"><div className="stars" aria-hidden="true"/><div><div className="brand-mark"><Leaf/></div><p>Veias da Sintonia</p><div className="splash-bar" aria-hidden="true"><i/></div></div></main>;
}

const paywallHeadline: Record<string, string> = {
  goal_limit: `Você atingiu o limite de ${FREE_GOAL_LIMIT} metas do plano grátis`,
  journal_history: "Seu histórico completo tem mais reflexões esperando",
  weekly_report: "A leitura completa do seu relatório está pronta",
  theme_lock: "Esse tema é exclusivo do Premium",
  trail_start: "Essa trilha é Premium",
  premium_card: "Destrave a jornada completa",
  chat: "Converse com a IA sempre que precisar",
  goal_steps: "Passos personalizados pro seu objetivo",
  signs_weekly: "Previsão astrológica completa para o seu signo prosperar",
  wheel: "A Roda da Fortuna é um ritual diário do Premium",
  tarot: "Sua carta do dia é exclusiva do Premium",
  content_library: "Guias completos da sua biblioteca",
};

const comparisonRows: [string, string, string][] = [
  ["Metas ativas", `Até ${FREE_GOAL_LIMIT}`, "Ilimitadas"],
  ["Histórico do diário", `Últimos ${FREE_JOURNAL_HISTORY} registros`, "Completo"],
  ["Relatório semanal", "Só os números", "Leitura e recomendação completas"],
  ["Trilhas guiadas", "1 introdutória (7 dias)", "Todas, incluindo 21 dias de constância"],
  ["Temas da árvore", "Sol dourado", "Sol dourado, Lua azul e Aurora"],
];

type PremiumPrice = { id: string; amount: number; currency: string; nickname: string | null; interval: "day" | "week" | "month" | "year" | null; intervalCount: number };

const intervalLabel = (price: PremiumPrice) => {
  if (!price.interval) return { title: "Acesso vitalício", period: "pagamento único" };
  if (price.interval === "year") return { title: "Anual", period: "/ano" };
  if (price.interval === "month" && price.intervalCount === 3) return { title: "Trimestral", period: "/trimestre" };
  if (price.interval === "month" && price.intervalCount === 6) return { title: "Semestral", period: "/semestre" };
  if (price.interval === "month") return { title: "Mensal", period: "/mês" };
  if (price.interval === "week") return { title: "Semanal", period: "/semana" };
  return { title: "Diário", period: "/dia" };
};
const formatMoney = (amount: number, currency: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);

/** Premium offer body — shared by the paywall dialog and the Premium tab. Prices come live from Stripe. */
function PremiumOffer({ reason }: { reason: string }) {
  const previewDay = findTrail("constancia-21")?.days[0];
  const [prices, setPrices] = useState<PremiumPrice[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (prices !== null) return;
    fetch("/api/billing/stripe/plans")
      .then((response): Promise<{ prices: PremiumPrice[] }> => response.ok ? response.json() : Promise.resolve({ prices: [] }))
      .then(({ prices: loaded }) => {
        setPrices(loaded);
        setSelected((loaded.find((price) => price.interval === "month" && price.intervalCount === 1) ?? loaded[0])?.id ?? null);
      })
      .catch(() => setPrices([]));
  }, [prices]);

  async function subscribe() {
    if (!selected) return;
    setOpening(true);
    track("checkout_started", { provider: "stripe", from: reason, price: selected });
    try {
      const response = await fetch("/api/billing/stripe/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ priceId: selected }) });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Não foi possível abrir o pagamento agora.");
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o pagamento agora.");
      setOpening(false);
    }
  }

  const chosen = prices?.find((price) => price.id === selected);
  const monthly = prices?.find((price) => price.interval === "month" && price.intervalCount === 1);

  return <>
      {previewDay && <div className="paywall-preview">
        <span className="paywall-preview-tag"><LockKeyhole size={12}/> 21 dias de constância · Dia 1</span>
        <div className="paywall-preview-blur" aria-hidden="true"><strong>{previewDay.title}</strong><p>{previewDay.message}</p></div>
      </div>}

      <div className="paywall-compare">
        <div className="paywall-compare-head"><span/><span>Grátis</span><span>Premium</span></div>
        {comparisonRows.map(([label, free, premium]) => <div className="paywall-compare-row" key={label}><span>{label}</span><span>{free}</span><span className="is-premium"><Check size={13}/>{premium}</span></div>)}
      </div>

      {prices === null && <p className="paywall-fine-print">Carregando planos…</p>}
      {prices && prices.length > 1 && <div className="paywall-plans" role="radiogroup" aria-label="Escolha seu plano">
        {prices.map((price) => {
          const label = intervalLabel(price);
          // A longer plan shows what it costs per month next to the monthly one, never a fake discount.
          const perMonth = monthly && price.interval === "year" ? price.amount / (12 * price.intervalCount)
            : monthly && price.interval === "month" && price.intervalCount > 1 ? price.amount / price.intervalCount : null;
          return <button type="button" role="radio" aria-checked={selected === price.id} key={price.id} className={`paywall-plan ${selected === price.id ? "is-selected" : ""}`} onClick={() => setSelected(price.id)}>
            <span><strong>{price.nickname || label.title}</strong>{perMonth !== null && <small>{formatMoney(perMonth, price.currency)}/mês</small>}</span>
            <b>{formatMoney(price.amount, price.currency)}<small>{label.period}</small></b>
          </button>;
        })}
      </div>}

      {prices && prices.length > 0 && chosen
        ? <>
            <button className="gold-button" disabled={opening} onClick={subscribe}>{opening ? "Abrindo pagamento seguro…" : chosen.interval ? `Assinar Premium · ${formatMoney(chosen.amount, chosen.currency)}${intervalLabel(chosen).period}` : `Desbloquear Premium · ${formatMoney(chosen.amount, chosen.currency)}`}</button>
            <p className="paywall-fine-print">{chosen.interval ? "Pagamento processado com segurança pelo Stripe. Sem fidelidade: cancele quando quiser em Perfil → Gerenciar assinatura." : "Pagamento único, sem mensalidade. Processado com segurança pelo Stripe."}</p>
          </>
        : prices && <>
            <button className="gold-button" disabled>Assinar Premium</button>
            <p className="paywall-fine-print">A assinatura do Premium estará disponível em breve.</p>
          </>}
  </>;
}

function PaywallDialog({ reason, onOpenChange }: { reason: string | null; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={reason !== null} onOpenChange={onOpenChange}>
    <DialogContent className="goal-dialog paywall-dialog">
      <DialogHeader>
        <div className="paywall-icon"><Gem/></div>
        <DialogTitle>{reason ? paywallHeadline[reason] ?? "Destrave a jornada completa" : ""}</DialogTitle>
        <DialogDescription>Sem promessas financeiras — uma experiência mais completa de autoconhecimento, hábitos e metas.</DialogDescription>
      </DialogHeader>
      {reason && <PremiumOffer reason={reason}/>}
    </DialogContent>
  </Dialog>;
}

/** The Premium tab, one tap away from every screen through the header button. */
function PremiumView({ isPremium }: { isPremium: boolean }) {
  useEffect(() => { track("premium_tab_viewed", { isPremium }); }, [isPremium]);
  if (isPremium) {
    return <div className="view-stack premium-view">
      <section className="premium-card is-active"><div className="premium-icon"><Gem/></div><p className="eyebrow">Seu plano</p><h2>Premium ativo</h2><p>Trilhas ilimitadas, histórico completo, metas sem limite e todos os temas já estão liberados na sua conta.</p><button type="button" className="ghost-button" onClick={openBillingPortal}>Gerenciar assinatura</button></section>
    </div>;
  }
  return <div className="view-stack premium-view">
    <section className="surface-card premium-view__hero">
      <div className="paywall-icon"><Gem/></div>
      <p className="eyebrow">Veias da Sintonia Premium</p>
      <h2>Destrave a jornada completa</h2>
      <p>Sem promessas financeiras — uma experiência mais completa de autoconhecimento, hábitos e metas.</p>
    </section>
    <section className="surface-card premium-view__offer paywall-dialog">
      <PremiumOffer reason="premium_tab"/>
    </section>
  </div>;
}

function TreeStageUnlockedOverlay({ name, note }: { name: string; note: string }) {
  return <div className="levelup" role="status" aria-live="polite">
    <div>
      <div className="levelup-ring"><Leaf/></div>
      <p className="eyebrow">Nova etapa desbloqueada</p>
      <h2>{name}</h2>
      <p>{note}</p>
    </div>
  </div>;
}

function WelcomeHero({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return <main className="welcome-hero">
    <video className="welcome-portal-video" autoPlay muted loop playsInline preload="auto" poster="/portal-poster.webp" aria-hidden="true">
      <source src="/portal-v3.mp4" type="video/mp4" />
    </video>
    <div className="welcome-portal-overlay" />
    <header className="welcome-nav">
      <div className="welcome-brand"><Leaf size={20} strokeWidth={1.6} /><span>Veias da Sintonia</span></div>
      <button type="button" className="liquid-glass welcome-login-pill" onClick={onLogin}>Entrar</button>
    </header>
    <div className="welcome-portal-content">
      <div className="welcome-actions">
        <button type="button" className="gold-button fx-pulse" onClick={onStart}>Começar minha jornada <ChevronRight/></button>
        <button type="button" className="liquid-glass welcome-secondary" onClick={onLogin}>Já tenho conta</button>
      </div>
      <Link href="/signos" className="welcome-signs-link">Conheça os 12 signos do zodíaco</Link>
    </div>
  </main>;
}

type AuthMode = "register" | "login" | "recover" | "reset";

function AuthScreen({ onAuthenticated, initialMode, onBack }: { onAuthenticated: (user: Account, mode: "register" | "login") => Promise<void>; initialMode?: "register" | "login"; onBack?: () => void }) {
  const [mode, setMode] = useState<AuthMode>(initialMode ?? "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset");
    if (token) queueMicrotask(() => {
      setResetToken(token);
      setMode("reset");
      window.history.replaceState({}, "", window.location.pathname);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setNotice("");
    if ((mode === "register" || mode === "reset") && password !== confirmation) return setError("As senhas não são iguais.");
    setLoading(true);
    try {
      if (mode === "recover") {
        const response = await fetch("/api/auth/recover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
        const result = await response.json() as ApiMessage & { user?: Account };
        if (!response.ok) throw new Error(result.error || "Não foi possível enviar o e-mail.");
        setNotice(result.message ?? "Se houver uma conta com este e-mail, você receberá as instruções."); return;
      }
      if (mode === "reset") {
        const response = await fetch("/api/auth/recover", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: resetToken, password }) });
        const result = await response.json() as ApiMessage & { user?: Account };
        if (!response.ok) throw new Error(result.error || "Não foi possível alterar a senha.");
        window.history.replaceState({}, "", "/");
        setPassword(""); setConfirmation(""); setResetToken(""); setMode("login"); setNotice("Senha alterada. Agora entre com sua nova senha."); return;
      }
      const response = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: mode, email, password }) });
      const result = await response.json() as ApiMessage & { user?: Account };
      if (!response.ok) throw new Error(result.error || "Não foi possível continuar.");
      // Offer the browser's "Salvar senha" so the account can be recognised after history is cleared.
      if (!result.user) throw new Error("Não foi possível continuar.");
      void rememberLogin(email.trim(), password);
      await onAuthenticated(result.user, mode as "register" | "login");
      toast.success(mode === "register" ? "Conta criada com sucesso." : "Bem-vindo de volta.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next); setError(""); setNotice(""); setPassword(""); setConfirmation("");
  }

  const titles: Record<AuthMode, string> = { register: "Crie sua conta", login: "Entre na sua conta", recover: "Recupere sua senha", reset: "Crie uma nova senha" };
  const descriptions: Record<AuthMode, string> = { register: "Salve sua árvore, metas e reflexões para acessar em qualquer celular.", login: "Continue sua evolução de onde parou.", recover: "Digite seu e-mail e enviaremos um link seguro para você.", reset: "Escolha uma senha nova com pelo menos 8 caracteres." };

  return <main className="auth-screen"><div className="stars" aria-hidden="true"/><section className="auth-card">
    <div className="auth-brand"><div className="brand-mark"><Leaf/></div><p className="brand-name">Veias da Sintonia</p></div>
    {(mode === "recover" || mode === "reset") && <button className="auth-back" type="button" onClick={() => switchMode("login")}><ArrowLeft/> Voltar para entrar</button>}
    {(mode === "register" || mode === "login") && onBack && <button className="auth-back" type="button" onClick={onBack}><ArrowLeft/> Voltar</button>}
    <p className="eyebrow">Sua jornada, sempre com você</p>
    <h1>{titles[mode]}</h1>
    <p className="auth-copy">{descriptions[mode]}</p>
    {(mode === "register" || mode === "login") && <div className="auth-tabs" role="tablist" aria-label="Acesso à conta"><button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>Criar conta</button><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Já tenho conta</button></div>}
    <form className="auth-form" onSubmit={submit}>
      {mode !== "reset" && <label>E-mail<div className="input-with-icon"><Mail/><input type="email" name="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" required/></div></label>}
      {mode !== "recover" && <label>{mode === "reset" ? "Nova senha" : "Senha"}<div className="input-with-icon"><LockKeyhole/><input type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} required/><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff/> : <Eye/>}</button></div></label>}
      {(mode === "register" || mode === "reset") && <label>Confirme sua senha<div className="input-with-icon"><LockKeyhole/><input type={visible ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite novamente" minLength={8} required/></div></label>}
      {mode === "login" && <button className="forgot-button link-grow" type="button" onClick={() => switchMode("recover")}>Esqueci minha senha</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="form-success" role="status"><Check/> {notice}</p>}
      {!(mode === "recover" && notice) && <button className="gold-button" disabled={loading}>{loading ? "Aguarde…" : mode === "register" ? "Criar minha conta" : mode === "login" ? "Entrar" : mode === "recover" ? "Enviar link de recuperação" : "Salvar nova senha"}<ChevronRight/></button>}
    </form>
    <p className="auth-security"><LockKeyhole/> Sua senha é protegida e sua jornada fica vinculada à sua conta.</p>
  </section><Toaster richColors position="top-center"/></main>;
}

type OnboardingProps = {
  step: number; setStep: (n: number) => void; profile: Profile; setProfile: (p: Profile) => void; finish: () => void;
  goalTitle: string; setGoalTitle: (v: string) => void;
  goalKind: GoalKind | ""; setGoalKind: (v: GoalKind | "") => void;
  goalAmount: number | ""; setGoalAmount: (v: number | "") => void;
  goalStage: string; setGoalStage: (v: string) => void;
  goalBlocker: string; setGoalBlocker: (v: string) => void;
  goalDailyMinutes: number | ""; setGoalDailyMinutes: (v: number | "") => void;
  goalMotivation: string; setGoalMotivation: (v: string) => void;
};

function Onboarding({ step, setStep, profile, setProfile, finish, goalTitle, setGoalTitle, goalKind, setGoalKind, goalAmount, setGoalAmount, goalStage, setGoalStage, goalBlocker, setGoalBlocker, goalDailyMinutes, setGoalDailyMinutes, goalMotivation, setGoalMotivation }: OnboardingProps) {
  const needsAmount = goalKind === "financial" || goalKind === "partial";
  const previewSign = profile.birthDate ? getSign(profile.birthDate) : null;
  // Keeps the first screenful of choices within the ~4-item working-memory guideline;
  // the rest reveal on demand instead of all competing for attention at once.
  const [showAllObjectives, setShowAllObjectives] = useState(false);
  const [showAllBlockers, setShowAllBlockers] = useState(false);
  const [showAllAmounts, setShowAllAmounts] = useState(false);
  const objectivesExpanded = showAllObjectives || objectives.slice(4).includes(profile.objective);
  const blockersExpanded = showAllBlockers || blockerOptions.slice(4).some(([value]) => value === goalBlocker);
  const amountsExpanded = showAllAmounts || (typeof goalAmount === "number" && goalAmountPresets.slice(4).includes(goalAmount));
  return <main className="onboarding">
    <div className="stars" aria-hidden="true" />
    <section className="onboarding-card">
      <div className="brand-mark"><Leaf/></div><p className="brand-name">Veias da Sintonia</p>
      {step >= 2 && <div className="onboarding-chrome">{step >= 3 && <button type="button" className="auth-back" onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Voltar</button>}<div className="onboarding-progress-bar" aria-hidden="true"><i style={{ width: `${((step - 1) / 8) * 100}%` }}/></div></div>}
      {step === 0 && <><div className="onboarding-tree"><ProsperityTree xp={0}/></div><p className="step-count">01 · 10</p><h1>E se o seu signo pudesse ser um guia para você entender melhor a sua forma de prosperar?</h1><p>Uma jornada simbólica para transformar autoconhecimento em pequenas ações.</p><button className="gold-button" onClick={() => setStep(1)}>Começar minha jornada <ChevronRight/></button></>}
      {step === 1 && <><div className="symbol-ring"><Sparkles/><span>✦</span></div><p className="step-count">02 · 10</p><h1>Conheça seus padrões. Cultive seus hábitos.</h1><p>Descubra forças, organize objetivos e transforme intenção em ação — no seu ritmo.</p><div className="mini-pill-row"><span>Reflexão</span><span>Constância</span><span>Metas</span></div><button className="gold-button" onClick={() => setStep(2)}>Descobrir meu signo <ChevronRight/></button></>}
      {step === 2 && <><p className="step-count">03 · 10</p><h1>Vamos começar por você.</h1><p>Esses dados personalizam sua experiência e ficam protegidos na sua conta.</p><div className="form-stack"><label>Como podemos chamar você?<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Seu nome" /></label><label>Data de nascimento<input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} /></label><fieldset><legend>O que mais te chama agora?</legend><div className="choice-grid">{(objectivesExpanded ? objectives : objectives.slice(0, 4)).map((o) => <button type="button" className={profile.objective === o ? "selected" : ""} onClick={() => setProfile({ ...profile, objective: o })} key={o}>{o}</button>)}</div>{!objectivesExpanded && <button type="button" className="choice-grid-more" onClick={() => setShowAllObjectives(true)}>+{objectives.length - 4} opções</button>}</fieldset></div><button className="gold-button" disabled={!profile.name.trim() || !profile.birthDate || !profile.objective} onClick={() => setStep(3)}>Continuar <ChevronRight/></button></>}
      {step === 3 && <><p className="step-count">04 · 10</p><h1>Se você pudesse conquistar UMA coisa importante nos próximos meses, o que seria?</h1><p>Pode ser específico — isso vai moldar sua árvore e seus desafios.</p><div className="form-stack"><label>Meu objetivo<input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Ex: comprar meu primeiro carro" /></label></div><button className="gold-button" disabled={!goalTitle.trim()} onClick={() => setStep(4)}>Continuar <ChevronRight/></button></>}
      {step === 4 && <><p className="step-count">05 · 10</p><h1>Esse objetivo envolve dinheiro?</h1><p>Nem toda conquista é financeira — sem problema se não for.</p><div className="choice-grid">{([["financial", "Sim"], ["partial", "Parcialmente"], ["non_financial", "Não"]] as [GoalKind, string][]).map(([value, label]) => <button type="button" className={goalKind === value ? "selected" : ""} onClick={() => setGoalKind(value)} key={value}>{label}</button>)}</div>{needsAmount && <div className="form-stack"><label>Quanto você deseja alcançar?<div className="choice-grid">{(amountsExpanded ? goalAmountPresets : goalAmountPresets.slice(0, 4)).map((amount) => <button type="button" className={goalAmount === amount ? "selected" : ""} onClick={() => setGoalAmount(amount)} key={amount}>R${amount.toLocaleString("pt-BR")}</button>)}</div>{!amountsExpanded && <button type="button" className="choice-grid-more" onClick={() => setShowAllAmounts(true)}>+{goalAmountPresets.length - 4} opções</button>}</label><label>Outro valor<input type="number" min={0} value={goalAmount === "" ? "" : goalAmount} onChange={(e) => setGoalAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="R$" /></label></div>}<button className="gold-button" disabled={!goalKind || (needsAmount && goalAmount === "")} onClick={() => setStep(5)}>Continuar <ChevronRight/></button></>}
      {step === 5 && <><p className="step-count">06 · 10</p><h1>Como você se sente hoje em relação a esse objetivo?</h1><div className="choice-grid">{stageOptions.map(([value, label]) => <button type="button" className={goalStage === value ? "selected" : ""} onClick={() => setGoalStage(value)} key={value}>{label}</button>)}</div><button className="gold-button" disabled={!goalStage} onClick={() => setStep(6)}>Continuar <ChevronRight/></button></>}
      {step === 6 && <><p className="step-count">07 · 10</p><h1>O que mais está segurando você neste momento?</h1><div className="choice-grid">{(blockersExpanded ? blockerOptions : blockerOptions.slice(0, 4)).map(([value, label]) => <button type="button" className={goalBlocker === value ? "selected" : ""} onClick={() => setGoalBlocker(value)} key={value}>{label}</button>)}</div>{!blockersExpanded && <button type="button" className="choice-grid-more" onClick={() => setShowAllBlockers(true)}>+{blockerOptions.length - 4} opções</button>}<button className="gold-button" disabled={!goalBlocker} onClick={() => setStep(7)}>Continuar <ChevronRight/></button></>}
      {step === 7 && <><p className="step-count">08 · 10</p><h1>Quanto tempo você consegue dedicar à sua evolução todos os dias?</h1><div className="choice-grid">{dailyMinutesOptions.map(([value, label]) => <button type="button" className={goalDailyMinutes === value ? "selected" : ""} onClick={() => setGoalDailyMinutes(value)} key={value}>{label}</button>)}</div><button className="gold-button" disabled={goalDailyMinutes === ""} onClick={() => setStep(8)}>Continuar <ChevronRight/></button></>}
      {step === 8 && <><p className="step-count">09 · 10</p><h1>Por que esse objetivo é importante para você?</h1><p>Você vai rever essa resposta nos momentos em que precisar lembrar por que começou.</p><div className="form-stack"><label>Meu motivo<textarea maxLength={280} rows={4} value={goalMotivation} onChange={(e) => setGoalMotivation(e.target.value)} placeholder="Ex: quero mais segurança para minha família." /></label></div><button className="gold-button" onClick={() => setStep(9)}>Continuar <ChevronRight/></button></>}
      {step === 9 && <><p className="step-count">10 · 10</p><h1>Seu Perfil de Prosperidade está pronto.</h1><p>Seu signo é uma camada simbólica de personalização — não uma previsão. O que move sua árvore são suas ações registradas aqui.</p><div className="prosperity-summary"><div><span>Signo</span><strong>{previewSign ?? "—"}</strong></div><div><span>Objetivo</span><strong>{goalTitle || profile.objective}</strong></div></div><button className="gold-button" onClick={finish}>🌱 Plantar minha semente</button></>}
    </section>
  </main>;
}

type WeekDay = ReturnType<typeof weekPlan>[number];

function HomeView({ profile, plan, week, part, xp, level, stage, streak, fruits, missionDone, ritualDone, treeCelebrating, completeMission, openRitual, oracleOpen, setOracleOpen, mainGoal, advanceGoal, openGoals, navigate, isPremium, openPaywall, diagnostic, openTree }: { profile: Profile; plan: DailyPlan; week: WeekDay[]; part: DayPart; xp: number; level: number; stage: string; streak: number; fruits: number; missionDone: boolean; ritualDone: boolean; treeCelebrating: boolean; completeMission: () => void; openRitual: () => void; oracleOpen: boolean; setOracleOpen: (v: boolean) => void; mainGoal?: Goal; advanceGoal: (id: number) => void; openGoals: () => void; navigate: (view: View) => void; isPremium: boolean; openPaywall: (reason: string) => void; diagnostic?: DiagnosticResult; openTree: (source: string) => void }) {
  const firstName = profile.name.split(" ")[0];
  const tomorrow = week[1];
  return <div className="home-flow">
    <button type="button" className="chat-entry" onClick={() => (isPremium ? navigate("chat") : openPaywall("chat"))}>
      <span className="chat-entry-icon"><Sparkles/></span>
      <span><strong>Conversar com a IA</strong><small>Desabafe, pense em voz alta ou peça um conselho — a qualquer hora</small></span>
      {!isPremium && <LockKeyhole size={16}/>}
      <ChevronRight/>
    </button>
    {!diagnostic && <DiagnosticHomeCards onOpenDiagnostic={() => navigate("diagnostic")} onOpenTree={() => openTree("home")}/>}
    <section className="daily-briefing">
      <div className="briefing-orbit" aria-hidden="true"><span/><span/><span/></div>
      <div className="briefing-top"><span className="theme-pill"><Compass/>Dia de {plan.theme.name}</span><span className="day-phase">{dayPartIcon[part]}{dayPartLabel[part]}</span></div>
      <p className="eyebrow">Seu clima de prosperidade</p>
      <h2>{greetingLabel[part]}, {firstName}. {plan.theme.verb} é a palavra de hoje.</h2>
      <p>{plan.theme.guidance} Sua intenção principal continua sendo <strong>{profile.objective.toLowerCase()}</strong>.</p>
      <div className="briefing-voice" onClick={() => navigate("signs")} role="button" tabIndex={0} style={{ cursor: "pointer" }}><em>“{plan.voice}”</em><span>Leitura de hoje para {profile.sign} · Toque para ver mapa de prosperidade ➔</span></div>
      <button className={`ritual-button ${ritualDone ? "done" : ""}`} onClick={openRitual}>{ritualDone ? <Check/> : <Play/>}<span><strong>{ritualDone ? "Ritual concluído" : "Começar ritual de 3 minutos"}</strong><small>{ritualDone ? "Sua árvore foi nutrida hoje" : "Check-in · respiração · ação"}</small></span><ChevronRight/></button>
    </section>
    <section className={`mission-card ${missionDone ? "done" : ""}`}><div className="mission-icon">{missionDone ? <Check/> : <Target/>}</div><div className="mission-copy"><p className="eyebrow">Missão do dia · {missionDone ? "concluída" : "+20 XP"}</p><h2>{missionDone ? "Intenção em movimento" : plan.theme.verb}</h2><p>{plan.mission}</p></div><button className="gold-button" disabled={missionDone} onClick={completeMission}>{missionDone ? <><Check/> Missão concluída</> : <><Target/> Começar missão</>}</button></section>
    {diagnostic && <DiagnosticHomeCards result={diagnostic} onOpenDiagnostic={() => navigate("diagnostic")} onOpenTree={() => openTree("home")}/>}
    <TreeCard xp={xp} level={level} stage={stage} streak={streak} fruits={fruits} celebrating={treeCelebrating} goalProgress={mainGoal?.progress}/>
    <section className="week-orbit" aria-label="Próximos sete dias">
      <div className="section-heading"><div><p className="eyebrow">Seu ciclo</p><h2>Próximos 7 dias</h2></div><CalendarDays/></div>
      <div className="week-days">{week.map((day) => <div className={day.offset === 0 ? "today" : day.offset === 1 ? "next" : ""} key={day.dayKey}><span>{day.weekday}</span><strong>{day.day}</strong><b>{day.theme.name}</b></div>)}</div>
      <p>{missionDone ? `Missão de hoje concluída. Amanhã o foco muda para ${tomorrow.theme.name.toLowerCase()}.` : "Cada dia traz um foco simbólico diferente — nenhum deles é uma previsão."}</p>
    </section>
    <section className="journey-shortcuts" aria-label="Atalhos da jornada"><button onClick={() => navigate("missions")}><span><Route/></span><strong>Jornada</strong><small>{missionDone ? "Missão feita" : "Missão de hoje"}</small></button><button onClick={() => navigate("journal")}><span><BookOpen/></span><strong>Refletir</strong><small>Meu diário</small></button><button onClick={() => navigate("tree")}><span><Leaf/></span><strong>Minha árvore</strong><small>{stage}</small></button></section>
    <section className="oracle-card"><div><p className="eyebrow">Oráculo do dia</p><h2>{oracleOpen ? plan.oracle.message : "Uma mensagem para o seu momento"}</h2>{oracleOpen && <p>Transforme em ação: {plan.oracle.action.charAt(0).toLowerCase() + plan.oracle.action.slice(1)}</p>}</div><button className="ghost-button" onClick={() => { setOracleOpen(!oracleOpen); if (!oracleOpen) { haptic(8); track("oracle_revealed"); } }}>{oracleOpen ? "Recolher" : "Revelar mensagem"}</button></section>
    <section className="goal-snapshot"><div className="section-heading"><div><p className="eyebrow">Meu objetivo</p><h2>{mainGoal ? mainGoal.title : "Plante sua primeira meta"}</h2></div><button onClick={openGoals}>{mainGoal ? "Ver objetivo" : <><Plus size={16}/> Criar</>}</button></div>{mainGoal ? <><Progress value={mainGoal.progress}/><div className="goal-foot"><span>{mainGoal.category} · {mainGoal.progress}%</span>{(mainGoal.kind === "financial" || mainGoal.kind === "partial") && mainGoal.targetAmount ? <button onClick={openGoals} disabled={mainGoal.progress === 100}>{mainGoal.progress === 100 ? "Fruto conquistado" : "Adicionar valor"}</button> : <button onClick={() => advanceGoal(mainGoal.id)} disabled={mainGoal.progress === 100}>{mainGoal.progress === 100 ? "Fruto conquistado" : "Avançar +25%"}</button>}</div></> : <p>Metas concluídas se transformam em frutos na sua árvore.</p>}</section>
    <div className="tomorrow"><Sparkles/><div><strong>Amanhã: dia de {tomorrow.theme.name.toLowerCase()}</strong><span>{tomorrow.theme.guidance}</span></div></div>
    <AiInsightBubble profile={profile} week={week}/>
  </div>;
}

/** Floating, dismiss-once-per-week bubble surfacing the AI weekly report. Display only — no chat, no reply box. */
function AiInsightBubble({ profile, week }: { profile: Profile; week: WeekDay[] }) {
  const [report, setReport] = useState<{ summary: string; recommendation: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isPremium = profile.plan === "premium";

  useEffect(() => {
    if (!isPremium) return;
    let cancelled = false;
    fetch("/api/journey/weekly-report-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dayKey: localDayKey(), nextThemeVerb: week[1].theme.verb }),
    }).then((response) => (response.ok ? response.json() as Promise<{ summary: string; recommendation: string }> : null))
      .then((data) => {
        if (cancelled || !data?.summary) return;
        const seenKey = `vds-ai-bubble-seen:${data.summary.slice(0, 40)}`;
        setReport(data);
        setDismissed(localStorage.getItem(seenKey) === "1");
      }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  if (!report || dismissed) return null;

  function dismiss() {
    if (report) localStorage.setItem(`vds-ai-bubble-seen:${report.summary.slice(0, 40)}`, "1");
    setDismissed(true);
  }

  return <div className="ai-bubble" role="status">
    <button className="ai-bubble-close" onClick={dismiss} aria-label="Fechar">×</button>
    <div className="ai-bubble-icon"><Sparkles/></div>
    <div><p className="eyebrow">Leitura da semana · por IA</p><p>{report.summary}</p></div>
  </div>;
}

/** A digit that rolls a 0-9 strip into place via CSS transition — driven purely by the `digit` prop changing. */
function OdometerDigit({ digit }: { digit: number }) {
  return <span className="odometer-digit"><span className="odometer-strip" style={{ transform: `translateY(${-digit * 10}%)` }}>
    {Array.from({ length: 10 }, (_, n) => <span key={n}>{n}</span>)}
  </span></span>;
}

/** Renders an integer as rolling digits; non-digit characters (thousands separators) render as plain text. */
function Odometer({ value }: { value: number }) {
  const text = Math.round(value).toLocaleString("pt-BR");
  return <span className="odometer" aria-label={text}>
    {text.split("").map((char, index) => (/\d/.test(char)
      ? <OdometerDigit key={index} digit={Number(char)} />
      : <span key={index} className="odometer-sep">{char}</span>))}
  </span>;
}

function TreeCard({ xp, level, stage, streak, fruits = 0, celebrating = false, goalProgress, onSelectPart }: { xp: number; level: number; stage: string; streak: number; fruits?: number; celebrating?: boolean; goalProgress?: number; onSelectPart?: (part: TreePartHotspot) => void }) {
  const { next, stageProgress } = treeStageFor(xp);
  const progressPct = Math.round(stageProgress * 100);
  return <section className={`tree-card ${celebrating ? "is-growing" : ""}`}><div className="tree-card__heading"><div><p className="eyebrow">Sua árvore viva</p><h2>{stage}</h2></div><div className="level-medal"><span>{level}</span><small>NÍVEL</small></div></div><div className="tree-stage"><ProsperityTree xp={xp} celebrating={celebrating} goalProgress={goalProgress}/>{onSelectPart && <div className="tree-parts">{TREE_PART_HOTSPOTS.map((part) => { const locked = xp < part.unlockedAt; return <button key={part.key} className={locked ? "locked" : ""} style={{ left: `${part.x}%`, top: `${part.y}%` }} onClick={() => { haptic(8); onSelectPart(part); }} aria-label={`${part.name}${locked ? " (bloqueado)" : ""}`}>{locked ? <LockKeyhole/> : treePartIcon[part.key] ?? <Sparkles/>}</button>; })}</div>}</div><div className="xp-row"><div><span><Odometer value={xp}/> XP</span><small>{next ? `Próxima evolução: ${next.name} · faltam ${next.minXP - xp} XP` : "sua árvore alcançou o estágio máximo"}</small></div><strong>{progressPct}%</strong></div><Progress value={progressPct}/><div className="stats-row"><div><Flame/><strong><Odometer value={streak}/></strong><span>{streak === 1 ? "dia" : "dias"}</span></div><div><Apple/><strong><Odometer value={fruits}/></strong><span>{fruits === 1 ? "fruto" : "frutos"}</span></div><div><Sparkles/><strong><Odometer value={xp}/></strong><span>pontos</span></div></div></section>;
}

function TreeView({ xp, level, stage, streak, mapScores, goals, diagnostic, openDiagnostic, snapshot, cares, navigate, openRitual }: { xp: number; level: number; stage: string; streak: number; mapScores: [string, number][]; goals: Goal[]; diagnostic?: DiagnosticResult; openDiagnostic: () => void; snapshot: JourneySnapshot; cares: { missionDone: boolean; ritualDone: boolean; journaledToday: boolean }; navigate: (view: View) => void; openRitual: () => void }) {
  const { upcoming } = useMemo(() => achievementState(snapshot), [snapshot]);
  const caresDone = [cares.missionDone, cares.ritualDone, cares.journaledToday].filter(Boolean).length;
  const [selected, setSelected] = useState<TreePartHotspot | null>(null);
  const fruits = goals.filter((goal) => goal.progress === 100).length;
  const goalProgress = goals[0]?.progress;
  const finalStage = TREE_STAGES[TREE_STAGES.length - 1];
  return <div className="view-stack">
    <p className="view-intro">Toque nas partes da árvore para entender o que cada uma representa na sua jornada.</p>
    <DiagnosticTreeFocus result={diagnostic} onOpenDiagnostic={openDiagnostic}/>
    <section className="surface-card tree-cares">
      <div className="section-heading"><div><p className="eyebrow">Cuidados de hoje · {caresDone}/3</p><h2>{caresDone === 3 ? "Dia completo — sua árvore agradece" : "Nutra sua árvore hoje"}</h2></div><Leaf/></div>
      <div className="tree-cares__list">
        {([
          ["Missão do dia", "+20 XP", cares.missionDone, () => navigate("home")],
          ["Ritual de 3 minutos", "+10 XP", cares.ritualDone, openRitual],
          ["Reflexão no diário", "+10 XP", cares.journaledToday, () => navigate("journal")],
        ] as [string, string, boolean, () => void][]).map(([label, reward, done, go]) => <button type="button" key={label} className={done ? "is-done" : ""} onClick={go} disabled={done}>
          <span className="tree-cares__check" aria-hidden="true">{done ? <Check/> : null}</span>
          <span><strong>{label}</strong><small>{done ? "Feito hoje" : reward}</small></span>
          {!done && <ChevronRight aria-hidden="true"/>}
        </button>)}
      </div>
      <p className="disclaimer">Complete os três no mesmo dia e ganhe +{DAY_COMPLETE_BONUS} XP de bônus.</p>
    </section>
    {upcoming.length > 0 && <section className="surface-card tree-next">
      <div className="section-heading"><div><p className="eyebrow">Próximas conquistas</p><h2>O que falta para crescer</h2></div><Trophy/></div>
      <div className="tree-next__list">{upcoming.map((item) => <div key={item.key} className={`tree-next__item tier-${item.tier}`}>
        <div><strong>{item.name}</strong><small>{item.hint} · {item.current.toLocaleString("pt-BR")}/{item.target.toLocaleString("pt-BR")}</small></div>
        <Progress value={Math.round((item.current / item.target) * 100)}/>
      </div>)}</div>
      <button type="button" className="ghost-button" onClick={() => navigate("missions")}>Ver todas as conquistas</button>
    </section>}
    <TreeCard xp={xp} level={level} stage={stage} streak={streak} fruits={fruits} goalProgress={goalProgress} onSelectPart={setSelected}/>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="goal-dialog permission-dialog">
        <DialogHeader><DialogTitle>{selected?.name ?? "Parte da árvore"}</DialogTitle><DialogDescription>O que esta parte representa e como ela cresce.</DialogDescription></DialogHeader>
        {selected && <div className="part-sheet">
          <div><span className={xp < selected.unlockedAt ? "locked" : ""}>{treePartIcon[selected.key] ?? <Sparkles/>}</span><div><strong>{xp < selected.unlockedAt ? "Ainda em formação" : "Desbloqueada"}</strong><small>{xp < selected.unlockedAt ? `Faltam ${selected.unlockedAt - xp} XP para esta parte aparecer.` : `Liberada a partir de ${selected.unlockedAt} XP.`}</small></div></div>
          <p>{selected.note}</p>
        </div>}
      </DialogContent>
    </Dialog>
    <section className="surface-card"><div className="section-heading"><div><p className="eyebrow">Linha do tempo</p><h2>A evolução da sua árvore</h2></div><TreeDeciduous/></div><div className="evolution-timeline">{TREE_STAGES.map((item) => <div key={item.id} className={xp >= item.minXP ? "reached" : ""}><i/><div><strong>{item.name}</strong><small>{xp >= item.minXP ? item.note : `${item.minXP} XP · ${item.note}`}</small></div></div>)}</div></section>
    <section className="surface-card"><div className="section-heading"><div><p className="eyebrow">Meu mapa da prosperidade</p><h2>Índice de evolução pessoal</h2></div></div><div className="pillar-list">{mapScores.map(([name, score]) => <div key={name}><div><span>{name}</span><strong>{Math.round(score)}</strong></div><Progress value={score}/></div>)}</div><p className="disclaimer">Este índice reflete suas ações dentro do app. Não é uma previsão financeira.</p></section>
    <section className="milestone-grid"><div><span>Raízes</span><strong>{xp >= TREE_STAGES[1].minXP ? "Desbloqueadas" : "Em formação"}</strong></div><div><span>Flores</span><strong>{xp >= TREE_STAGES[9].minXP ? "Desbloqueadas" : `${TREE_STAGES[9].minXP - xp} XP`}</strong></div><div><span>Frutos</span><strong>{fruits} {fruits === 1 ? "conquistado" : "conquistados"}</strong></div><div><span>Próximo estágio</span><strong>{xp >= finalStage.minXP ? finalStage.name : `${finalStage.minXP - xp} XP`}</strong></div></section>
  </div>;
}

const ritualTitles = ["Como você chega agora?", "Sua mensagem de hoje", "Respire e volte para si", "Um gesto pequeno agora"];

function DailyRitual({ open, onOpenChange, profile, plan, done, onComplete }: { open: boolean; onOpenChange: (open: boolean) => void; profile: Profile; plan: DailyPlan; done: boolean; onComplete: (mood: string) => void }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState("");
  const moods = [{ label: "Leve", icon: "☀️" }, { label: "Focado", icon: "✨" }, { label: "Cansado", icon: "🌙" }, { label: "Ansioso", icon: "🌊" }];
  const moodNotes: Record<string, string> = {
    "Leve": "Aproveite a leveza para adiantar algo que costuma pesar.",
    "Focado": "Use o foco em uma frente só; ele rende mais concentrado.",
    "Cansado": "Reduza a meta do dia até ela caber no cansaço de hoje.",
    "Ansioso": "Diminua o campo de visão: só o próximo passo importa agora.",
  };
  function changeOpen(next: boolean) {
    onOpenChange(next);
    if (!next) { setStep(0); setMood(""); }
  }
  function advance(next: number) {
    haptic(8);
    setStep(next);
  }
  return <Dialog open={open} onOpenChange={changeOpen}><DialogContent className="ritual-dialog">
    <DialogHeader>
      <div className="ritual-progress" aria-label={`Etapa ${step + 1} de 4`}>{[0, 1, 2, 3].map((index) => <i key={index} className={step >= index ? "active" : ""}/>)}</div>
      <DialogTitle>{done ? "Seu ritual de hoje floresceu" : ritualTitles[step]}</DialogTitle>
      <DialogDescription>{done ? "Volte amanhã para um novo momento." : `Ritual de ${profile.sign} · dia de ${plan.theme.name.toLowerCase()} · cerca de 3 minutos`}</DialogDescription>
    </DialogHeader>
    {done ? <div className="ritual-complete"><span><Check/></span><p>Sua presença de hoje já nutriu a Árvore da Prosperidade.</p><button className="gold-button" onClick={() => changeOpen(false)}>Continuar minha jornada</button></div>
      : step === 0 ? <div className="mood-grid">{moods.map((item) => <button className={mood === item.label ? "selected" : ""} key={item.label} onClick={() => { haptic(8); setMood(item.label); }}><span>{item.icon}</span>{item.label}</button>)}<button className="gold-button ritual-next" disabled={!mood} onClick={() => advance(1)}>Continuar <ChevronRight/></button></div>
      : step === 1 ? <div className="ritual-message"><div className="ritual-quote"><Compass/><p>{plan.voice}</p></div><p>{moodNotes[mood] ?? plan.theme.guidance}</p><p className="ritual-theme">Hoje o convite é <strong>{plan.theme.verb.toLowerCase()}</strong>, aplicado a {profile.objective.toLowerCase()}.</p><button className="gold-button" onClick={() => advance(2)}>Fazer a respiração <ChevronRight/></button></div>
      : step === 2 ? <div className="breathing-step"><div className="breathing-orb"><Wind/><span>Inspire<br/><small>e expire</small></span></div><p>Faça três respirações lentas. Não precisa mudar o que sente; apenas observe.</p><button className="gold-button" onClick={() => advance(3)}>Estou presente <ChevronRight/></button></div>
      : <div className="ritual-action"><span><Target/></span><p className="eyebrow">Gesto de 2 minutos</p><h3>{plan.micro}</h3><p>A missão maior do dia continua te esperando na Jornada. Aqui basta criar movimento.</p><button className="gold-button" onClick={() => onComplete(mood)}><Sparkles/> Nutrir minha árvore · +10 XP</button></div>}
  </DialogContent></Dialog>;
}

function JourneyView({ profile, plan, snapshot, week, missionDone, ritualDone, completeMission, openRitual, activeTrail, startTrail, completeTrailDay, abandonTrail, isPremium, openPaywall }: { profile: Profile; plan: DailyPlan; snapshot: JourneySnapshot; week: WeekDay[]; missionDone: boolean; ritualDone: boolean; completeMission: () => void; openRitual: () => void; activeTrail: TrailProgress | null; startTrail: (id: string) => void; completeTrailDay: (day: number) => void; abandonTrail: () => void; isPremium: boolean; openPaywall: (reason: string) => void }) {
  const [openAchievement, setOpenAchievement] = useState<string | null>(null);
  const { resolved, unlockedCount, total, next } = useMemo(() => achievementState(snapshot), [snapshot]);
  const report = useMemo(() => weeklyReport(snapshot, week[1].theme.verb), [snapshot, week]);
  const [aiReport, setAiReport] = useState<{ summary: string; recommendation: string } | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAiReport(null);
    if (!isPremium) return;
    let cancelled = false;
    setAiReportLoading(true);
    fetch("/api/journey/weekly-report-ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dayKey: localDayKey(), nextThemeVerb: week[1].theme.verb }),
    }).then((response) => (response.ok ? response.json() as Promise<{ summary: string; recommendation: string }> : null))
      .then((data) => { if (!cancelled && data?.summary) setAiReport(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAiReportLoading(false); });
    return () => { cancelled = true; };
    // Depends on report.rangeLabel (not the whole `week` array) so this only re-fires when the 7-day window actually rolls over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, report.rangeLabel]);

  const selected = resolved.find((item) => item.key === openAchievement);
  const trailDay = Math.min(snapshot.streak, 7);
  return <div className="view-stack">
    <p className="view-intro">Sua jornada acompanha o que você fez de verdade — missão de hoje, sequência, conquistas e o resumo da semana.</p>

    <section className="surface-card streak-card">
      <div className="streak-ring" style={{ "--streak-fill": Math.min(100, (trailDay / 7) * 100) } as React.CSSProperties} aria-hidden="true"><div><strong>{snapshot.streak}</strong><small>dias</small></div></div>
      <div><p className="eyebrow">Sua sequência</p><h2>{snapshot.streak === 0 ? "Comece sua sequência hoje" : snapshot.streak >= 7 ? "Sete dias de constância" : `${snapshot.streak} ${snapshot.streak === 1 ? "dia" : "dias"} seguidos`}</h2><p>{snapshot.streak === 0 ? "Concluir o ritual ou a missão de hoje inicia a contagem." : ritualDone || missionDone ? "Hoje já está contado. Volte amanhã para manter a sequência." : "Conclua o ritual ou a missão de hoje para não interromper a contagem."}</p></div>
    </section>

    <section className={`featured-mission ${missionDone ? "done" : ""}`}>
      <div className="mission-badge"><Target/><span>Hoje · {plan.theme.name}</span></div>
      <p className="eyebrow">Missão diária · +20 XP</p>
      <h2>{plan.mission}</h2>
      <p>Leva cerca de 15 minutos e foi escolhida para {profile.objective.toLowerCase()}. O valor está na ação realizada, não em uma promessa de resultado.</p>
      <button className={`gold-button ${missionDone ? "" : "fx-pulse"}`} onClick={completeMission} disabled={missionDone}>{missionDone ? <><Check/> Concluída hoje</> : "Concluir missão"}</button>
    </section>

    {!ritualDone && <section className="achievement-row"><Wind/><div><strong>Ritual de 3 minutos</strong><span>Check-in, respiração e um gesto pequeno.</span></div><button className="ghost-button" onClick={openRitual}>Fazer</button></section>}

    <TrailHub activeTrail={activeTrail} startTrail={startTrail} completeTrailDay={completeTrailDay} abandonTrail={abandonTrail} isPremium={isPremium} />

    <section className="weekly-report">
      <div className="section-heading"><div><p className="eyebrow">Relatório da semana</p><h2>Como foram seus últimos 7 dias</h2></div><Compass/></div>
      <p className="report-range">{report.rangeLabel}</p>
      <div className="report-grid">
        <div className="report-metric"><span>Reflexões</span><strong><Odometer value={report.reflections}/></strong><small>{report.moodNote}</small></div>
        <div className="report-metric"><span>Sequência</span><strong><Odometer value={report.streak}/></strong><small>dias seguidos de presença</small></div>
        <div className="report-metric"><span>Metas avançando</span><strong><Odometer value={report.goalsAdvancing}/></strong><small>em progresso agora</small></div>
        <div className="report-metric"><span>Frutos</span><strong><Odometer value={report.fruits}/></strong><small>metas concluídas até aqui</small></div>
      </div>
      {isPremium ? (aiReportLoading && !aiReport
        ? <div className="report-note report-note-loading" aria-busy="true" aria-label="Gerando leitura da semana">
            <Sparkles/><div><span className="skeleton skeleton-line" style={{ width: "100%" }}/><span className="skeleton skeleton-line" style={{ width: "82%" }}/><span className="skeleton skeleton-line" style={{ width: "58%" }}/></div>
          </div>
        : <div className="report-note"><Sparkles/><div>{aiReport?.summary ?? report.summary} {aiReport?.recommendation ?? report.recommendation}</div></div>)
        : <button className="report-locked" onClick={() => openPaywall("weekly_report")}>
            <span className="report-locked-blur" aria-hidden="true"><Sparkles/><div>{report.summary} {report.recommendation}</div></span>
            <span className="report-locked-cta"><LockKeyhole/> Desbloquear leitura completa da semana</span>
          </button>}
    </section>

    <section className="surface-card">
      <div className="section-heading"><div><p className="eyebrow">Conquistas</p><h2>{unlockedCount} de {total} desbloqueadas</h2></div><Trophy/></div>
      {ACHIEVEMENT_CATEGORIES.map((category) => { const items = resolved.filter((item) => item.category === category.id); if (!items.length) return null; return <div key={category.id} className={`achievement-group ${category.id === "exclusivas" ? "is-exclusive" : ""}`}>
        <p className="achievement-group__title">{category.label} <span>{items.filter((item) => item.unlocked).length}/{items.length}</span></p>
        <div className="achievement-grid">{items.map((item) => <button key={item.key} className={`${item.unlocked ? "unlocked" : ""} tier-${item.tier}`} onClick={() => { haptic(8); setOpenAchievement(item.key); }}><span>{item.unlocked ? achievementIcon[item.icon] : <LockKeyhole/>}</span><small>{item.name}</small><em className="achievement-tier">{item.tier === "exclusiva" ? "exclusiva" : item.tier}</em></button>)}</div>
      </div>; })}
      {next && <p className="disclaimer">Próxima: {next.name} — {next.hint.toLowerCase()} ({next.current}/{next.target}).</p>}
    </section>

    <Dialog open={selected !== undefined} onOpenChange={(open) => { if (!open) setOpenAchievement(null); }}>
      <DialogContent className="goal-dialog permission-dialog">
        <DialogHeader><DialogTitle>{selected?.name ?? "Conquista"}</DialogTitle><DialogDescription>{selected?.unlocked ? "Desbloqueada na sua jornada." : selected?.hint}</DialogDescription></DialogHeader>
        {selected && <div className="achievement-story">
          <span className={selected.unlocked ? "" : "locked"}>{selected.unlocked ? achievementIcon[selected.icon] : <LockKeyhole/>}</span>
          <p>{selected.story}</p>
          <Progress value={Math.round((selected.current / selected.target) * 100)}/>
          <b>{selected.unlocked ? selected.reward : `${selected.current} de ${selected.target}`}</b>
        </div>}
      </DialogContent>
    </Dialog>
  </div>;
}

/** Premium members do not need the "· Premium" tag; the length is shown once. */
function trailSubtitle(item: Trail, isPremium: boolean) {
  const subtitle = isPremium ? item.subtitle.replace(/\s*·\s*Premium$/i, "") : item.subtitle;
  return /\d+ dias/.test(subtitle) ? subtitle : `${subtitle} · ${item.length} dias`;
}

function TrailHub({ activeTrail, startTrail, completeTrailDay, abandonTrail, isPremium }: { activeTrail: TrailProgress | null; startTrail: (id: string) => void; completeTrailDay: (day: number) => void; abandonTrail: () => void; isPremium: boolean }) {
  const trail = findTrail(activeTrail?.trailId);
  if (!activeTrail || !trail) {
    return <section className="trail-card">
      <div className="section-heading"><div><p className="eyebrow">Trilhas guiadas</p><h2>Escolha um caminho</h2></div><Route/></div>
      <p className="trail-hub-intro">Cada trilha libera um capítulo pequeno por dia: mensagem, prática e reflexão.</p>
      <div className="trail-list">{trails.map((item) => { const locked = item.premium && !isPremium; return <button key={item.id} className={locked ? "locked" : ""} onClick={() => startTrail(item.id)}>
        <span className="trail-list-icon">{locked ? <LockKeyhole/> : <Sprout/>}</span>
        <span className="trail-list-copy"><strong>{item.title}</strong><small>{trailSubtitle(item, isPremium)}</small></span>
        <ChevronRight/>
      </button>; })}</div>
    </section>;
  }

  const status = trailStatus(trail, activeTrail);
  const dayToShow = Math.min(status.currentDay, status.unlocked);
  const content = trail.days[dayToShow - 1];
  const dayDone = activeTrail.completedDays.includes(dayToShow);
  const caughtUp = dayDone && status.unlocked <= status.currentDay;

  return <section className="trail-card">
    <div className="section-heading"><div><p className="eyebrow">{trail.title}</p><h2>{status.finished ? "Trilha concluída" : `Dia ${dayToShow} de ${trail.length}`}</h2></div><Route/></div>
    <div className="trail-steps">{trail.days.map((day) => <div key={day.day} className={activeTrail.completedDays.includes(day.day) ? "done" : day.day === dayToShow ? "current" : ""}>{day.day}</div>)}</div>

    {status.finished ? <div className="trail-finished"><Sparkles/><p>Você completou os {trail.length} dias. Sua árvore guarda essa conquista — escolha outra trilha quando quiser continuar.</p></div>
      : caughtUp ? <div className="trail-finished"><Check/><p>Dia {dayToShow} concluído. Uma nova etapa libera amanhã.</p></div>
      : content ? <div className="trail-day">
          <p className="eyebrow">{content.title}</p>
          <p className="trail-day-message">{content.message}</p>
          <div className="trail-day-block"><span>Prática</span><p>{content.practice}</p></div>
          <div className="trail-day-block"><span>Reflexão</span><p>{content.reflection}</p></div>
          <button className="gold-button" onClick={() => completeTrailDay(dayToShow)}><Check/> Concluir dia {dayToShow} · +15 XP</button>
        </div> : null}

    <button className="ghost-button trail-switch" onClick={abandonTrail}>Trocar de trilha</button>
  </section>;
}

function JournalView({ plan, answers, setAnswers, save, entries, isPremium, openPaywall }: { plan: DailyPlan; answers: string[]; setAnswers: (a: string[]) => void; save: () => void; entries: JournalEntry[]; isPremium: boolean; openPaywall: (reason: string) => void }) {
  const questions = useMemo(() => [plan.journalQuestion, ...journalAnchors], [plan.journalQuestion]);
  const visibleEntries = isPremium ? entries : entries.slice(0, FREE_JOURNAL_HISTORY);
  const hiddenCount = entries.length - visibleEntries.length;
  return <div className="view-stack"><p className="view-intro">Um espaço privado para observar padrões e transformar reflexão em escolha.</p><section className="surface-card journal-form"><p className="eyebrow">Reflexão de hoje · +10 XP</p><p className="journal-hint"><Compass/> A primeira pergunta muda todos os dias — hoje ela vem do tema {plan.theme.name.toLowerCase()}.</p>{questions.map((question, index) => <label key={question}>{question}<textarea rows={2} value={answers[index]} onChange={(event) => { const next = [...answers]; next[index] = event.target.value; setAnswers(next); }} placeholder="Escreva sem julgar..."/></label>)}<button className="gold-button" onClick={save}>Salvar reflexão <BookOpen/></button></section><section className="history"><div className="section-heading"><div><p className="eyebrow">Histórico</p><h2>Sua evolução em palavras</h2></div><span>{entries.length} {entries.length === 1 ? "registro" : "registros"}</span></div>{entries.length ? visibleEntries.map((entry, idx) => <article key={`${entry.date}-${idx}`}><time>{entry.date}</time><p>{entry.answers.find(Boolean)}</p></article>) : <div className="empty-state"><BookOpen/><p>Seu primeiro registro aparecerá aqui.</p></div>}{hiddenCount > 0 && <button className="history-locked" onClick={() => openPaywall("journal_history")}><LockKeyhole/> Ver mais {hiddenCount} {hiddenCount === 1 ? "registro" : "registros"} · Premium</button>}</section></div>;
}

async function prepareAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a foto.");
  context.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 512, 512);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
  if (!blob) throw new Error("Não foi possível preparar a foto.");
  return new File([blob], "foto-perfil.webp", { type: "image/webp" });
}

function ProfileView({ profile, setProfile, account, guide, goals, advanceGoal, goalDialog, setGoalDialog, goalTitle, setGoalTitle, goalCategory, setGoalCategory, addGoal, syncStatus, avatarVersion, setAvatarVersion, logout, isPremium, openPaywall, navigate }: { profile: Profile; setProfile: (profile: Profile) => void; account: Account; guide: { strengths: string[]; care: string[]; style: string }; goals: Goal[]; advanceGoal: (id: number) => void; goalDialog: boolean; setGoalDialog: (v: boolean) => void; goalTitle: string; setGoalTitle: (s: string) => void; goalCategory: string; setGoalCategory: (s: string) => void; addGoal: () => void; syncStatus: "loading" | "saved" | "offline"; avatarVersion: number; setAvatarVersion: (value: number) => void; logout: () => Promise<void>; isPremium: boolean; openPaywall: (reason: string) => void; navigate?: (v: View) => void }) {
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraVideo = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"ask" | "granted" | "denied" | "unsupported">("ask");
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (!navigator.permissions?.query) return;
    navigator.permissions.query({ name: "camera" as PermissionName }).then((status) => {
      setCameraPermission(status.state === "prompt" ? "ask" : status.state);
      status.onchange = () => setCameraPermission(status.state === "prompt" ? "ask" : status.state);
    }).catch(() => setCameraPermission("ask"));
    return () => { cameraStream.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setPhotoLoading(true);
    try {
      const avatar = await prepareAvatar(file);
      const form = new FormData(); form.append("avatar", avatar);
      const response = await fetch("/api/profile/avatar", { method: "PUT", body: form });
      const result = await response.json() as ApiMessage & { user?: Account };
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar a foto.");
      setProfile({ ...profile, hasAvatar: true }); setDraft({ ...draft, hasAvatar: true }); setAvatarVersion(Date.now());
      toast.success("Foto de perfil atualizada.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Não foi possível salvar a foto.");
    } finally { setPhotoLoading(false); }
  }

  async function removePhoto() {
    setPhotoLoading(true);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setProfile({ ...profile, hasAvatar: false }); setDraft({ ...draft, hasAvatar: false });
      toast.success("Foto removida.");
    } catch { toast.error("Não foi possível remover a foto."); }
    finally { setPhotoLoading(false); }
  }

  function stopCamera() {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    setCameraActive(false);
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermission("unsupported");
      return toast.error("A câmera ao vivo não está disponível neste aparelho. Use a opção de câmera do sistema.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      cameraStream.current = stream;
      setCameraActive(true);
      if (cameraVideo.current) cameraVideo.current.srcObject = stream;
      setCameraPermission("granted");
    } catch (reason) {
      const denied = reason instanceof DOMException && (reason.name === "NotAllowedError" || reason.name === "SecurityError");
      setCameraPermission(denied ? "denied" : "unsupported");
      toast.error(denied ? "A câmera não foi permitida. Você pode liberar nas configurações do aplicativo." : "Não foi possível abrir a câmera.");
    }
  }

  async function capturePhoto() {
    const video = cameraVideo.current;
    if (!video?.videoWidth || !video.videoHeight) return toast.error("Aguarde a imagem da câmera aparecer.");
    const size = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) return toast.error("Não foi possível capturar a foto.");
    context.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .82));
    if (!blob) return toast.error("Não foi possível capturar a foto.");
    stopCamera(); setCameraOpen(false);
    await uploadPhoto(new File([blob], "foto-camera.webp", { type: "image/webp" }));
  }

  function chooseFromGallery() {
    setGalleryOpen(false);
    window.setTimeout(() => galleryInput.current?.click(), 80);
  }

  function saveProfile() {
    if (!draft.name.trim() || !draft.birthDate || !draft.objective) return toast.error("Preencha nome, nascimento e objetivo.");
    setProfile({ ...draft, name: draft.name.trim(), sign: getSign(draft.birthDate) }); setEditing(false); toast.success("Seu perfil foi atualizado.");
  }

  return <div className="view-stack"><section className="profile-identity"><div className={`profile-photo ${profile.hasAvatar ? "has-photo" : ""}`}>{profile.hasAvatar ? <Image unoptimized src={`/api/profile/avatar?v=${avatarVersion}`} alt={`Foto de ${profile.name}`} width={86} height={86}/> : <UserRound/>}<button onClick={() => setCameraOpen(true)} aria-label="Tirar foto"><Camera/></button></div><div><p className="eyebrow">Meu perfil</p><h2>{profile.name}</h2><span>{account.email}</span></div></section>{account.isAdmin && <AdminAchievements/>}
    <section className="surface-card photo-card"><div className="section-heading"><div><p className="eyebrow">Sua imagem</p><h2>Foto de perfil</h2></div><button className="privacy-link" onClick={() => setPrivacyOpen(true)}><ShieldCheck/> Privacidade</button></div><p>Você decide quando usar a câmera e quais fotos compartilhar.</p><div className="photo-actions"><button disabled={photoLoading} onClick={() => setCameraOpen(true)}><Camera/> {photoLoading ? "Enviando…" : "Abrir câmera"}</button><button disabled={photoLoading} onClick={() => setGalleryOpen(true)}><ImagePlus/> Escolher foto</button>{profile.hasAvatar && <button className="danger-button" disabled={photoLoading} onClick={removePhoto}>Remover</button>}</div><input ref={cameraInput} className="file-input" type="file" accept="image/*" capture="user" onChange={(event) => uploadPhoto(event.target.files?.[0])}/><input ref={galleryInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { uploadPhoto(event.target.files?.[0]); event.target.value = ""; }}/></section>
    <Dialog open={cameraOpen} onOpenChange={(open) => { setCameraOpen(open); if (!open) stopCamera(); }}><DialogContent className="goal-dialog permission-dialog"><DialogHeader><DialogTitle>Usar a câmera</DialogTitle><DialogDescription>A câmera só será ligada agora, com sua autorização. O Android mostrará as opções disponíveis para este aparelho.</DialogDescription></DialogHeader><div className="permission-visual"><span className={cameraPermission}><Camera/></span><div><strong>{cameraPermission === "granted" ? "Câmera permitida" : cameraPermission === "denied" ? "Câmera bloqueada" : "Você está no controle"}</strong><small>{cameraPermission === "denied" ? "Libere a câmera nas configurações do aplicativo ou use o seletor do sistema." : "Apenas a foto capturada será enviada ao seu perfil."}</small></div></div>{cameraActive ? <><video className="camera-preview" ref={(element) => { cameraVideo.current = element; if (element && cameraStream.current) element.srcObject = cameraStream.current; }} autoPlay playsInline muted/><button className="gold-button" onClick={capturePhoto}><Camera/> Usar esta foto</button></> : <div className="permission-actions"><button className="gold-button" onClick={startCamera}><ShieldCheck/> Solicitar acesso à câmera</button><button className="ghost-button" onClick={() => cameraInput.current?.click()}><Camera/> Abrir câmera do sistema</button></div>}</DialogContent></Dialog>
    <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}><DialogContent className="goal-dialog permission-dialog"><DialogHeader><DialogTitle>Escolher uma foto</DialogTitle><DialogDescription>O seletor privado do Android permite compartilhar somente a imagem escolhida. O aplicativo não poderá navegar pela sua galeria.</DialogDescription></DialogHeader><div className="permission-visual"><span className="granted"><ImagePlus/></span><div><strong>Acesso limitado por padrão</strong><small>Você pode cancelar sem compartilhar nenhuma foto.</small></div></div><button className="gold-button" onClick={chooseFromGallery}><ImagePlus/> Continuar para a galeria</button></DialogContent></Dialog>
    <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}><DialogContent className="goal-dialog permission-dialog"><DialogHeader><DialogTitle>Central de Privacidade</DialogTitle><DialogDescription>Revise como o aplicativo usa os recursos do seu celular.</DialogDescription></DialogHeader><div className="permission-list"><div><span>{cameraPermission === "denied" ? <CameraOff/> : <Camera/>}</span><div><strong>Câmera</strong><small>{cameraPermission === "granted" ? "Permitida durante o uso." : cameraPermission === "denied" ? "Bloqueada nas configurações." : "Será perguntado somente quando você usar."}</small></div><b>{cameraPermission === "granted" ? "Permitida" : cameraPermission === "denied" ? "Bloqueada" : "Perguntar"}</b></div><div><span><ImagePlus/></span><div><strong>Fotos e galeria</strong><small>Somente as imagens que você escolher.</small></div><b>Limitado</b></div><div><span><Cloud/></span><div><strong>Armazenamento</strong><small>Sua foto e jornada ficam vinculadas à sua conta.</small></div><b>Privado</b></div></div><p className="permission-note"><Settings2/> Você pode alterar permissões a qualquer momento em Configurações do Android › Aplicativos › Seu Signo › Permissões.</p></DialogContent></Dialog>
    <section className="surface-card edit-profile"><div className="section-heading"><div><p className="eyebrow">Personalização</p><h2>Deixe o app com a sua cara</h2></div><button onClick={() => { if (editing) { setDraft(profile); setEditing(false); } else setEditing(true); }}>{editing ? "Cancelar" : <><Pencil/> Editar</>}</button></div>{editing ? <div className="profile-form"><label>Seu nome<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label><label>Data de nascimento<input type="date" value={draft.birthDate} onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })}/></label><label>Objetivo principal<select value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })}>{objectives.map((objective) => <option key={objective}>{objective}</option>)}</select></label><label>Minha intenção<textarea rows={3} maxLength={280} value={draft.intention} onChange={(event) => setDraft({ ...draft, intention: event.target.value })} placeholder="O que você quer cultivar nesta fase?"/></label><fieldset><legend>Cor da minha jornada</legend><div className="theme-picker">{([['dourado','Sol dourado'],['lua','Lua azul'],['aurora','Aurora']] as [Theme,string][]).map(([value,label]) => { const locked = !isPremium && !FREE_THEMES.includes(value); return <button type="button" key={value} data-color={value} className={`${draft.theme === value ? "selected" : ""} ${locked ? "locked" : ""}`} onClick={() => { if (locked) { openPaywall("theme_lock"); return; } setDraft({ ...draft, theme: value }); }}><i/>{label}{locked && <LockKeyhole size={12}/>}</button>; })}</div></fieldset><button className="gold-button" onClick={saveProfile}><Save/> Salvar alterações</button></div> : <div className="profile-summary"><div><span>Objetivo</span><strong>{profile.objective}</strong></div><div><span>Signo</span><strong>{profile.sign}</strong></div><div><span>Intenção</span><strong>{profile.intention || "Adicione uma intenção para sua jornada."}</strong></div></div>}</section>
    <section className="sign-profile"><div className="zodiac-medallion"><Sparkles/><strong>{profile.sign.slice(0,2).toUpperCase()}</strong></div><p className="eyebrow">Meu signo para prosperar</p><h2>{profile.sign}</h2><p>{guide.style}</p><div className="insight-grid"><div><span>Forças</span>{guide.strengths.map((x) => <b key={x}>{x}</b>)}</div><div><span>Pontos de atenção</span>{guide.care.map((x) => <b key={x}>{x}</b>)}</div></div>{navigate && <button type="button" className="gold-button mt-4 w-full" onClick={() => navigate("signs")}><Sparkles size={16}/> Ver Mapa Cósmico de {profile.sign}</button>}</section>
    <section className="surface-card goals-card"><div className="section-heading"><div><p className="eyebrow">Minhas metas {!isPremium && `· ${goals.length}/${FREE_GOAL_LIMIT}`}</p><h2>Frutos em construção</h2></div>{!isPremium && goals.length >= FREE_GOAL_LIMIT ? <button className="round-button" aria-label="Limite de metas atingido" onClick={() => openPaywall("goal_limit")}><LockKeyhole/></button> : <Dialog open={goalDialog} onOpenChange={setGoalDialog}><DialogTrigger asChild><button className="round-button" aria-label="Adicionar meta"><Plus/></button></DialogTrigger><DialogContent className="goal-dialog"><DialogHeader><DialogTitle>Plante uma nova meta</DialogTitle><DialogDescription>Defina algo que possa ser acompanhado por pequenas ações.</DialogDescription></DialogHeader><label>Nome da meta<input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Ex.: criar minha reserva"/></label><label>Categoria<select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)}>{["Financeiro","Carreira","Negócios","Conhecimento","Relacionamentos","Desenvolvimento pessoal"].map((x) => <option key={x}>{x}</option>)}</select></label><button className="gold-button" onClick={addGoal}>Criar meta · +15 XP</button></DialogContent></Dialog>}</div>{goals.length ? goals.map((g) => <article className="goal-item" key={g.id}><div><strong>{g.title}</strong><span>{g.category} · {g.progress}%</span></div><Progress value={g.progress}/><button onClick={() => advanceGoal(g.id)} disabled={g.progress === 100}>{g.progress === 100 ? "Fruto conquistado" : "Avançar +25%"}</button></article>) : <div className="empty-state"><Target/><p>Crie uma meta para começar a cultivar seu primeiro fruto.</p></div>}{!isPremium && goals.length >= FREE_GOAL_LIMIT && <p className="disclaimer">Limite do plano grátis: {FREE_GOAL_LIMIT} metas ativas.</p>}</section>
    <section className={`sync-card ${syncStatus}`}><span><Cloud/></span><div><strong>{syncStatus === "saved" ? "Jornada salva na sua conta" : syncStatus === "loading" ? "Salvando sua evolução…" : "Modo offline ativo"}</strong><small>{syncStatus === "saved" ? "Entre em outro celular com o mesmo e-mail para continuar." : syncStatus === "offline" ? "Suas mudanças continuam salvas neste dispositivo e serão sincronizadas depois." : "Aguarde um instante."}</small></div><i aria-hidden="true"/></section>
    {isPremium ? <section className="premium-card is-active"><div className="premium-icon"><Gem/></div><p className="eyebrow">Central da Prosperidade</p><h2>Sua jornada está completa.</h2><p>Trilhas ilimitadas, histórico completo, metas sem limite e todos os temas já estão liberados na sua conta.</p><button type="button" className="ghost-button" onClick={openBillingPortal}>Gerenciar assinatura</button></section>
      : <section className="premium-card"><div className="premium-icon"><Gem/></div><p className="eyebrow">Central da Prosperidade</p><h2>Você já descobriu seu signo.<br/>Agora destrave a jornada completa.</h2><p>Hoje seu plano grátis tem 1 trilha, {FREE_GOAL_LIMIT} metas e {FREE_JOURNAL_HISTORY} registros de histórico. O Premium remove esses limites.</p><ul><li><Check/> Trilhas de 21 dias e temas por objetivo</li><li><Check/> Metas e histórico do diário sem limite</li><li><Check/> Relatório semanal completo e temas da árvore</li></ul><button className="gold-button" onClick={() => openPaywall("premium_card")}>Desbloquear minha jornada</button><small>Sem promessas financeiras. Uma experiência de autoconhecimento, hábitos e metas.</small></section>}
    <section className="content-list"><div className="section-heading"><div><p className="eyebrow">Conteúdo</p><h2>Sua biblioteca</h2></div></div>{GUIDES.map((guide) => { const Icon = guideIcon[guide.id]; const locked = guide.premium && !isPremium; return <button key={guide.id} onClick={() => { if (locked) { openPaywall("content_library"); return; } track("guide_opened", { guide: guide.id }); setOpenGuide(guide.id); }}><span className="content-icon"><Icon/></span><span><strong>{guide.title}</strong><small>{locked ? "Premium" : guide.premium ? "Incluído no seu Premium" : guide.subtitle}</small></span>{locked ? <LockKeyhole size={16}/> : <ChevronRight/>}</button>; })}</section>
    <LibraryReader guideId={openGuide} sign={profile.sign} onClose={() => setOpenGuide(null)}/>
    <section className="account-card"><div><Mail/><span><small>Conta conectada</small><strong>{account.email}</strong></span></div><button onClick={logout}><LogOut/> Sair da conta</button></section>
  </div>;
}

function GoalDetailView({ goal, advanceGoal, addGoalAmount, navigate, isPremium, openPaywall }: { goal?: Goal; advanceGoal: (id: number) => void; addGoalAmount: (id: number, amount: number) => void; navigate: (v: View) => void; isPremium: boolean; openPaywall: (reason: string) => void }) {
  const [amountInput, setAmountInput] = useState("");
  const [steps, setSteps] = useState<string[] | null>(null);
  const [stepsLoading, setStepsLoading] = useState(false);

  useEffect(() => {
    if (!isPremium || !goal) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStepsLoading(true);
    fetch("/api/journey/goal-steps", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ goalId: goal.id }) })
      .then((response) => (response.ok ? response.json() as Promise<{ steps?: string[] }> : null))
      .then((data) => { if (!cancelled && data?.steps) setSteps(data.steps); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStepsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, goal?.id]);

  if (!goal) return <div className="view-stack"><p className="view-intro">Você ainda não plantou um objetivo principal.</p><button className="gold-button" onClick={() => navigate("profile")}>Criar minha meta</button></div>;
  const isFinancial = (goal.kind === "financial" || goal.kind === "partial") && Boolean(goal.targetAmount);
  const done = goal.progress >= 100;
  return <div className="view-stack">
    <button type="button" className="auth-back" onClick={() => navigate("home")}><ArrowLeft size={16}/> Voltar</button>
    <section className="surface-card">
      <div className="section-heading"><div><p className="eyebrow">Meu objetivo</p><h2>{goal.title}</h2></div><Target/></div>
      {goal.motivation && <div className="briefing-voice"><em>“{goal.motivation}”</em><span>Lembre por que você começou</span></div>}
      {isFinancial
        ? <>
            <div className="report-range">R${(goal.currentAmount ?? 0).toLocaleString("pt-BR")} de R${(goal.targetAmount ?? 0).toLocaleString("pt-BR")}</div>
            <Progress value={goal.progress}/>
            {!done && <div className="form-stack"><label>Guardei mais<input type="number" min={1} value={amountInput} onChange={(e) => setAmountInput(e.target.value)} placeholder="R$" /></label><button className="gold-button" disabled={!amountInput || Number(amountInput) <= 0} onClick={() => { addGoalAmount(goal.id, Number(amountInput)); setAmountInput(""); }}><CircleDollarSign/> Somar à meta</button></div>}
          </>
        : <>
            <Progress value={goal.progress}/>
            <p className="report-range">{goal.progress}% concluído</p>
            {!done && <button className="gold-button" onClick={() => advanceGoal(goal.id)}><Sprout/> Avançar +25%</button>}
          </>}
      {done && <p className="report-range"><Sparkles size={14}/> Objetivo conquistado — um fruto permanente na sua árvore.</p>}
    </section>
    {(goal.stage || goal.blocker || goal.dailyMinutes) && <section className="surface-card">
      <div className="section-heading"><div><p className="eyebrow">Seu diagnóstico</p><h2>Como você chegou até aqui</h2></div><Compass/></div>
      <div className="report-grid">
        {goal.stage && <div className="report-metric"><span>Momento</span><strong>{stageLabelByKey[goal.stage] ?? goal.stage}</strong></div>}
        {goal.blocker && <div className="report-metric"><span>Maior bloqueio</span><strong>{blockerLabelByKey[goal.blocker] ?? goal.blocker}</strong></div>}
        {goal.dailyMinutes !== undefined && <div className="report-metric"><span>Tempo por dia</span><strong>{goal.dailyMinutes} min</strong></div>}
      </div>
    </section>}
    <section className="surface-card">
      <div className="section-heading"><div><p className="eyebrow">Passos sugeridos</p><h2>Próximas ações para este objetivo</h2></div><Sparkles/></div>
      {!isPremium
        ? <button className="report-locked" onClick={() => openPaywall("goal_steps")}>
            <span className="report-locked-blur" aria-hidden="true"><Sparkles/><div>Pesquise o valor médio, defina um prazo realista e separe o primeiro valor esta semana.</div></span>
            <span className="report-locked-cta"><LockKeyhole/> Desbloquear passos personalizados por IA</span>
          </button>
        : stepsLoading && !steps ? <p className="view-intro">Gerando sugestões para o seu objetivo…</p>
        : steps ? <ul className="step-suggestions">{steps.map((step) => <li key={step}><Check size={14}/> {step}</li>)}</ul>
        : <p className="view-intro">Não foi possível gerar sugestões agora — tente novamente mais tarde.</p>}
    </section>
    <p className="paywall-fine-print">Sinal simbólico, não previsão: o progresso reflete só as ações que você registrou aqui.</p>
  </div>;
}

type ChatTurn = { role: "user" | "assistant"; content: string };
type ChatThreadSummary = { id: number; title: string; updatedAt: string };

const CHAT_ASSISTANT_NAME = "Sintonia";

function ChatView({ profile, isPremium, navigate, openPaywall, onSessionExpired }: { profile: Profile; isPremium: boolean; navigate: (v: View) => void; openPaywall: (reason: string) => void; onSessionExpired: () => void }) {
  const greeting = useMemo<ChatTurn>(() => ({ role: "assistant", content: `Oi, sou a ${CHAT_ASSISTANT_NAME}. Esse é um espaço pra você pensar em voz alta, desabafar ou só conversar sobre a sua jornada, ${profile.name.split(" ")[0]}. Como você está agora?` }), [profile.name]);
  const [messages, setMessages] = useState<ChatTurn[]>([greeting]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, sending]);

  useEffect(() => {
    if (!isPremium) return;
    fetch("/api/chat/threads").then((response) => (response.ok ? response.json() as Promise<{ threads?: ChatThreadSummary[] }> : null))
      .then((data) => { if (Array.isArray(data?.threads)) setThreads(data.threads); }).catch(() => {});
  }, [isPremium]);

  if (!isPremium) {
    return <div className="view-stack">
      <button type="button" className="auth-back" onClick={() => navigate("home")}><ArrowLeft size={16}/> Voltar</button>
      <section className="surface-card">
        <div className="section-heading"><div><p className="eyebrow">Conversar</p><h2>Desabafe com a IA sempre que precisar</h2></div><Sparkles/></div>
        <p>Um espaço de escuta, disponível a qualquer hora, com contexto do seu signo e da sua jornada.</p>
        <button className="gold-button" onClick={() => openPaywall("chat")}><LockKeyhole/> Desbloquear conversa</button>
      </section>
    </div>;
  }

  function newChat() {
    if (sending) return;
    setThreadId(null);
    setMessages([greeting]);
    setInput("");
  }

  async function openThread(id: number) {
    if (id === threadId || sending) return;
    try {
      const response = await fetch(`/api/chat/threads?id=${id}`);
      if (response.status === 401) { onSessionExpired(); return; }
      const data = await response.json().catch(() => ({})) as { messages?: ChatTurn[] };
      if (!response.ok || !Array.isArray(data.messages)) throw new Error();
      setThreadId(id);
      setMessages(data.messages.length ? data.messages : [greeting]);
    } catch {
      toast.error("Não foi possível abrir essa conversa agora.");
    }
  }

  async function deleteThread(id: number, event: React.MouseEvent) {
    event.stopPropagation();
    setThreads((current) => current.filter((item) => item.id !== id));
    if (id === threadId) newChat();
    try {
      await fetch(`/api/chat/threads?id=${id}`, { method: "DELETE" });
    } catch {
      toast.error("Não foi possível remover essa conversa agora.");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((current) => [...current, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: threadId ?? undefined, message: text }),
      });
      if (response.status === 401) { onSessionExpired(); return; }
      const data = await response.json().catch(() => ({})) as ApiMessage & { reply?: string; threadId?: number };
      if (!response.ok || !data.reply) throw new Error(data.error ?? "Não foi possível responder agora.");
      const reply = data.reply;
      const savedThreadId = data.threadId;
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      if (typeof savedThreadId === "number") {
        const now = new Date().toISOString();
        const isNew = savedThreadId !== threadId;
        setThreadId(savedThreadId);
        setThreads((current) => {
          const rest = current.filter((item) => item.id !== savedThreadId);
          const existing = current.find((item) => item.id === savedThreadId);
          const title = isNew ? (text.length > 40 ? `${text.slice(0, 40)}…` : text) : (existing?.title ?? text);
          return [{ id: savedThreadId, title, updatedAt: now }, ...rest];
        });
      }
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Não foi possível responder agora." }]);
    } finally {
      setSending(false);
    }
  }

  return <div className="view-stack chat-view">
    <button type="button" className="auth-back" onClick={() => navigate("home")}><ArrowLeft size={16}/> Voltar</button>
    <div className="chat-tabs" role="tablist" aria-label="Suas conversas">
      <button type="button" className={`chat-tab new ${threadId === null ? "active" : ""}`} onClick={newChat}><Plus size={14}/> Novo chat</button>
      {threads.map((item) => <button type="button" key={item.id} className={`chat-tab ${item.id === threadId ? "active" : ""}`} onClick={() => openThread(item.id)}>
        <span>{item.title || "Conversa"}</span>
        <i role="button" aria-label="Remover conversa" onClick={(event) => deleteThread(item.id, event)}><X size={12}/></i>
      </button>)}
    </div>
    <div className="chat-log" ref={listRef}>
      {messages.map((turn, index) => <div key={index} className={`chat-turn ${turn.role}`}>{turn.role === "assistant" && <span className="chat-turn-name">{CHAT_ASSISTANT_NAME}</span>}{turn.content}</div>)}
      {sending && <div className="chat-turn assistant typing"><span/><span/><span/></div>}
    </div>
    <div className="chat-composer">
      <textarea
        rows={1}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }}
        placeholder="Escreva o que você está sentindo…"
      />
      <button type="button" className="chat-send" disabled={!input.trim() || sending} onClick={send} aria-label="Enviar"><Send size={18}/></button>
    </div>
    <p className="paywall-fine-print">A IA não substitui ajuda profissional. Em emergência, ligue 188 (CVV) ou 192.</p>
  </div>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button className={active ? "active" : ""} onClick={onClick} aria-current={active ? "page" : undefined}>{icon}<span>{label}</span></button>; }
