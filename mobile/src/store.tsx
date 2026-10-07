import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { api, ApiError, hasSession, loadSession, setExpiredHandler } from "./api";
import { dailyPlan, dayPart, localDayKey, weekPlan, type DailyPlan, type DayPart } from "@/lib/daily";
import { treeStageFor } from "@/lib/treeStages";
import { trialActive } from "@/lib/plan";
import { signFromDate } from "@/lib/birth";
import { achievementState, type JourneySnapshot } from "@/lib/journey";
import { findTrail, type TrailProgress } from "@/lib/trails";

export type GoalKind = "financial" | "non_financial" | "partial";
export type Goal = {
  id: number; title: string; category: string; progress: number; isPrimary?: boolean;
  kind?: GoalKind; targetAmount?: number; currentAmount?: number; deadline?: string;
  motivation?: string; stage?: string; blocker?: string; dailyMinutes?: number;
};
export type JournalEntry = { date: string; answers: string[] };
export type Profile = { name: string; birthDate: string; birthTime?: string; birthPlace?: string; objective: string; sign: string; intention: string; theme: string; hasAvatar?: boolean; plan?: "free" | "premium" };
export type Account = { email: string; deviceId: string | null; trialEndsAt?: string | null };
type CloudState = {
  profile: Partial<Profile>; xp?: number; missionDone?: boolean; ritualDone?: boolean; streak?: number;
  goals?: Goal[]; entries?: JournalEntry[]; trail?: TrailProgress | null; unlockedAchievements?: string[];
};

export const FREE_GOAL_LIMIT = 3;
const emptyProfile: Profile = { name: "", birthDate: "", objective: "", sign: "Capricórnio", intention: "", theme: "dourado", plan: "free" };
const newDeviceId = () => Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

type Phase = "loading" | "signedOut" | "onboarding" | "ready";

type Ctx = {
  phase: Phase; account: Account | null; profile: Profile; setProfile: (profile: Profile) => void;
  xp: number; streak: number; level: number; stage: ReturnType<typeof treeStageFor>;
  missionDone: boolean; ritualDone: boolean; goals: Goal[]; entries: JournalEntry[]; trail: TrailProgress | null; unlocked: string[];
  isPremium: boolean; onTrial: boolean; trialEndsAt: string | null;
  dayKey: string; part: DayPart; plan: DailyPlan; week: ReturnType<typeof weekPlan>; snapshot: JourneySnapshot;
  syncStatus: "saved" | "saving" | "offline";
  /** True once the server holds this account's profile (loaded, or first save done): only then are profile-based calls valid. */
  synced: boolean;
  toast: string | null; say: (message: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, seed: { name: string; birthDate: string; birthTime: string; birthPlace: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  finishOnboarding: (input: { objective: string; goalTitle: string; name?: string; birthDate?: string }) => void;
  completeMission: () => void; completeRitual: () => void;
  addGoal: (title: string, category: string) => boolean; advanceGoal: (id: number) => void; addGoalAmount: (id: number, amount: number) => void;
  saveJournal: (answers: string[]) => boolean;
  startTrail: (trailId: string) => boolean; completeTrailDay: (day: number) => void; abandonTrail: () => void;
  ritualOpen: boolean; openRitual: () => void; closeRitual: () => void;
  paywall: string | null; openPaywall: (reason: string) => void; closePaywall: () => void;
  reloadAccount: () => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);
export const useApp = () => { const value = useContext(AppContext); if (!value) throw new Error("AppProvider missing"); return value; };

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missionDone, setMissionDone] = useState(false);
  const [ritualDone, setRitualDone] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [trail, setTrail] = useState<TrailProgress | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [dayKey, setDayKey] = useState(() => localDayKey());
  const [part, setPart] = useState<DayPart>(() => dayPart(new Date().getHours()));
  const [clock, setClock] = useState(() => Date.now());
  const [syncStatus, setSyncStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [ritualOpen, setRitualOpen] = useState(false);
  const deviceId = useRef("");
  const lastBody = useRef("");
  const lastSections = useRef<Record<string, string>>({});
  const known = useRef<Set<string> | null>(null);
  const lastDay = useRef(dayKey);

  const say = useCallback((message: string) => { setToast(message); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 2600); return () => clearTimeout(timer); }, [toast]);
  const buzz = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

  const reset = useCallback(() => {
    setAccount(null); setProfile(emptyProfile); setXp(0); setStreak(0); setMissionDone(false); setRitualDone(false);
    setGoals([]); setEntries([]); setTrail(null); setUnlocked([]); setSynced(false); known.current = null; lastBody.current = ""; lastSections.current = {};
  }, []);

  const loadState = useCallback(async (user: Account) => {
    const { state, deviceId: cloudId } = await api<{ state: CloudState | null; deviceId: string | null }>(`/api/sync?day=${localDayKey()}`);
    deviceId.current = cloudId || deviceId.current || newDeviceId();
    setAccount({ ...user, deviceId: cloudId });
    if (state) {
      setProfile({ ...emptyProfile, ...state.profile } as Profile);
      setXp(state.xp ?? 0); setMissionDone(state.missionDone ?? false); setRitualDone(state.ritualDone ?? false); setStreak(state.streak ?? 0);
      setGoals(state.goals ?? []); setEntries(state.entries ?? []); setTrail(state.trail ?? null); setUnlocked(state.unlockedAchievements ?? []);
      known.current = new Set(state.unlockedAchievements ?? []);
      setSynced(true);
      setPhase("ready");
    } else {
      known.current = new Set();
      setPhase("onboarding");
    }
  }, []);

  const reloadAccount = useCallback(async () => {
    const { user } = await api<{ user: Account | null }>("/api/auth");
    if (user) await loadState(user);
  }, [loadState]);

  useEffect(() => {
    setExpiredHandler(() => { reset(); setPhase("signedOut"); });
    (async () => {
      await loadSession();
      try {
        if (!hasSession()) { setPhase("signedOut"); return; }
        const { user } = await api<{ user: Account | null }>("/api/auth");
        if (!user) { setPhase("signedOut"); return; }
        await loadState(user);
      } catch { setPhase("signedOut"); }
    })();
  }, [loadState, reset]);

  useEffect(() => {
    const timer = setInterval(() => { setDayKey(localDayKey()); setPart(dayPart(new Date().getHours())); setClock(Date.now()); }, 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (lastDay.current === dayKey) return;
    lastDay.current = dayKey; setMissionDone(false); setRitualDone(false);
  }, [dayKey]);

  const onTrial = profile.plan !== "premium" && trialActive(account, clock);
  const isPremium = profile.plan === "premium" || onTrial;
  const level = Math.floor(xp / 100) + 1;
  const stage = useMemo(() => treeStageFor(xp), [xp]);
  const plan = useMemo(() => dailyPlan({ dayKey, sign: profile.sign, objective: profile.objective }), [dayKey, profile.sign, profile.objective]);
  const week = useMemo(() => weekPlan(profile.sign, 7, new Date(`${dayKey}T00:00:00`)), [profile.sign, dayKey]);
  const snapshot = useMemo<JourneySnapshot>(() => ({ xp, level, streak, entries, goals, trailDays: trail?.completedDays.length ?? 0, unlockedKeys: unlocked }), [xp, level, streak, entries, goals, trail, unlocked]);

  const awardXp = useCallback((amount: number) => { setXp((value) => value + amount); buzz(); }, []);

  // Achievements reached by the journey so far: Premium accounts unlock them, with their XP bonus.
  useEffect(() => {
    if (phase !== "ready" || !known.current || !isPremium) return;
    const reached = achievementState(snapshot).resolved.filter((item) => item.unlocked && !known.current!.has(item.key));
    if (!reached.length) return;
    for (const item of reached) known.current.add(item.key);
    setUnlocked((current) => [...current, ...reached.map((item) => item.key)]);
    const bonus = reached.reduce((sum, item) => sum + (item.xpBonus ?? 0), 0);
    if (bonus) awardXp(bonus);
    say(reached.length > 2 ? `🏆 ${reached.length} conquistas desbloqueadas` : `🏆 Conquista: ${reached[0].name}${bonus ? ` · +${bonus} XP` : ""}`);
  }, [phase, snapshot, isPremium, awardXp, say]);

  // Debounced save, the same body and "skip unchanged sections" rule as the site.
  useEffect(() => {
    if (phase !== "ready" || !account || !profile.name) return;
    setSyncStatus("saving");
    const timer = setTimeout(() => {
      const body = JSON.stringify({ deviceId: deviceId.current, dayKey, profile: { name: profile.name, birthDate: profile.birthDate, birthTime: profile.birthTime ?? "", birthPlace: profile.birthPlace ?? "", objective: profile.objective, sign: profile.sign, intention: profile.intention, theme: profile.theme === "lua" || profile.theme === "aurora" ? profile.theme : "dourado" }, xp, missionDone, ritualDone, goals, entries, trail, unlockedAchievements: unlocked });
      if (body === lastBody.current) { setSyncStatus("saved"); return; }
      const sections: Record<string, string> = { goals: JSON.stringify(goals), entries: JSON.stringify(entries), trail: JSON.stringify(trail), achievements: JSON.stringify(unlocked) };
      const skip = Object.keys(sections).filter((name) => sections[name] === lastSections.current[name]);
      api<{ streak?: number }>("/api/sync", { method: "POST", body: skip.length ? { ...JSON.parse(body), skip } : JSON.parse(body) })
        .then((result) => { lastBody.current = body; lastSections.current = sections; setSynced(true); setAccount((current) => (current && !current.deviceId ? { ...current, deviceId: deviceId.current } : current)); if (typeof result?.streak === "number") setStreak(result.streak); setSyncStatus("saved"); })
        .catch((error) => { if (!(error instanceof ApiError && error.status === 401)) setSyncStatus("offline"); });
    }, 1500);
    return () => clearTimeout(timer);
    // dayKey is read but left out on purpose: a rollover clears the daily flags first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, account, profile, xp, missionDone, ritualDone, goals, entries, trail, unlocked]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await api<{ user: Account }>("/api/auth", { method: "POST", body: { action: "login", email, password } });
    await loadState(user);
  }, [loadState]);

  const signUp = useCallback<Ctx["signUp"]>(async (email, password, seed) => {
    const { user } = await api<{ user: Account }>("/api/auth", { method: "POST", body: { action: "register", email, password } });
    deviceId.current = newDeviceId();
    setAccount({ ...user, deviceId: null });
    setProfile({ ...emptyProfile, name: seed.name, birthDate: seed.birthDate, birthTime: seed.birthTime, birthPlace: seed.birthPlace, sign: signFromDate(seed.birthDate) });
    known.current = new Set();
    setPhase("onboarding");
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth", { method: "POST", body: { action: "logout" } }).catch(() => {});
    reset(); setPhase("signedOut");
  }, [reset]);

  const deleteAccount = useCallback(async (password: string) => {
    await api("/api/account", { method: "POST", body: { action: "delete", password } });
    reset(); setPhase("signedOut");
  }, [reset]);

  const finishOnboarding = useCallback<Ctx["finishOnboarding"]>(({ objective, goalTitle, name, birthDate }) => {
    const born = birthDate || profile.birthDate;
    const sign = signFromDate(born);
    setProfile({ ...profile, name: name || profile.name, birthDate: born, objective, sign });
    setGoals([{ id: Date.now(), title: goalTitle.trim() || objective, category: objective, progress: 0, isPrimary: true, kind: "non_financial" }]);
    setXp(30); setPhase("ready"); say(`Sua árvore de ${sign} foi plantada.`);
  }, [profile, say]);

  const completeMission = useCallback(() => {
    if (missionDone) return;
    setMissionDone(true); awardXp(20); say("+20 XP · Mais um passo foi dado na sua jornada.");
  }, [missionDone, awardXp, say]);
  const completeRitual = useCallback(() => {
    if (ritualDone) return;
    setRitualDone(true); awardXp(10); say("Ritual concluído · sua árvore recebeu +10 XP");
  }, [ritualDone, awardXp, say]);

  const openPaywall = useCallback((reason: string) => { setPaywall(reason); }, []);
  const closePaywall = useCallback(() => setPaywall(null), []);

  const addGoal = useCallback((title: string, category: string) => {
    if (!title.trim()) return false;
    if (!isPremium && goals.length >= FREE_GOAL_LIMIT) { openPaywall("goal_limit"); return false; }
    setGoals((items) => [...items, { id: Date.now(), title: title.trim(), category, progress: 0 }]);
    awardXp(15); say("Meta plantada · +15 XP"); return true;
  }, [isPremium, goals.length, openPaywall, awardXp, say]);

  const advanceGoal = useCallback((id: number) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal || goal.progress === 100) return;
    const next = Math.min(100, goal.progress + 25);
    setGoals((items) => items.map((item) => (item.id === id ? { ...item, progress: next } : item)));
    if (next === 100) { awardXp(50); say("Um novo fruto nasceu na sua árvore · +50 XP"); } else { buzz(); say(`${goal.title} · ${next}%`); }
  }, [goals, awardXp, say]);

  const addGoalAmount = useCallback((id: number, amount: number) => {
    const goal = goals.find((item) => item.id === id);
    if (!goal || !goal.targetAmount || amount <= 0 || goal.progress === 100) return;
    const currentAmount = Math.min(goal.targetAmount, (goal.currentAmount ?? 0) + amount);
    const next = Math.round((currentAmount / goal.targetAmount) * 100);
    setGoals((items) => items.map((item) => (item.id === id ? { ...item, currentAmount, progress: next } : item)));
    if (next === 100) { awardXp(50); say("Meta alcançada · +50 XP"); } else say(`+R$${amount.toLocaleString("pt-BR")} guardados · ${next}%`);
  }, [goals, awardXp, say]);

  const saveJournal = useCallback((answers: string[]) => {
    if (!answers.some((answer) => answer.trim())) { say("Escreva ao menos uma reflexão."); return false; }
    setEntries((items) => [{ date: new Date().toLocaleDateString("pt-BR"), answers }, ...items]);
    awardXp(10); say("Reflexão salva · +10 XP"); return true;
  }, [awardXp, say]);

  const startTrail = useCallback((trailId: string) => {
    const found = findTrail(trailId);
    if (!found) return false;
    if (found.premium && !isPremium) { openPaywall("trail_start"); return false; }
    setTrail({ trailId, startedAt: dayKey, completedDays: [] });
    say(`${found.title} · dia 1 começou`); return true;
  }, [isPremium, dayKey, openPaywall, say]);
  const completeTrailDay = useCallback((day: number) => {
    if (!trail || trail.completedDays.includes(day)) return;
    const found = findTrail(trail.trailId);
    setTrail({ ...trail, completedDays: [...trail.completedDays, day] });
    awardXp(15);
    say(found && day >= found.length ? "Trilha concluída · sua árvore guarda essa conquista" : `Dia ${day} concluído · +15 XP`);
  }, [trail, awardXp, say]);
  const abandonTrail = useCallback(() => setTrail(null), []);

  const value: Ctx = {
    phase, account, profile, setProfile, xp, streak, level, stage, missionDone, ritualDone, goals, entries, trail, unlocked,
    isPremium, onTrial, trialEndsAt: onTrial ? account?.trialEndsAt ?? null : null, dayKey, part, plan, week, snapshot, syncStatus, synced, toast, say,
    signIn, signUp, logout, deleteAccount, finishOnboarding, completeMission, completeRitual, addGoal, advanceGoal, addGoalAmount, saveJournal,
    startTrail, completeTrailDay, abandonTrail, ritualOpen, openRitual: () => setRitualOpen(true), closeRitual: () => setRitualOpen(false), paywall, openPaywall, closePaywall, reloadAccount,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
