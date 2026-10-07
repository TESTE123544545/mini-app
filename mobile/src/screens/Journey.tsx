import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Check, ChevronRight, LockKeyhole, Sparkles, Target, Wind } from "lucide-react-native";
import { ACHIEVEMENT_CATEGORIES, achievementState, weeklyReport } from "@/lib/journey";
import { findTrail, trailStatus, trails, type Trail } from "@/lib/trails";
import { localDayKey } from "@/lib/daily";
import { api } from "../api";
import { useApp } from "../store";
import { Bar, Button, Card, Eyebrow, Gap, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";

const subtitle = (item: Trail, premium: boolean) => {
  const text = premium ? item.subtitle.replace(/\s*·\s*Premium$/i, "") : item.subtitle;
  return /\d+ dias/.test(text) ? text : `${text} · ${item.length} dias`;
};

function Trails() {
  const { trail: active, startTrail, completeTrailDay, abandonTrail, isPremium } = useApp();
  const trail = findTrail(active?.trailId);
  if (!active || !trail) return <Card>
    <Eyebrow>Trilhas guiadas</Eyebrow>
    <H2>Escolha um caminho</H2>
    <P>Cada trilha libera um capítulo pequeno por dia: mensagem, prática e reflexão.</P>
    {trails.map((item) => {
      const locked = item.premium && !isPremium;
      return <Pressable key={item.id} onPress={() => startTrail(item.id)} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.lineSoft }}>
        {locked ? <LockKeyhole size={18} color={C.gold}/> : <Sparkles size={18} color={C.gold}/>}
        <View style={{ flex: 1 }}><H3>{item.title}</H3><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{subtitle(item, isPremium)}</Text></View>
        <ChevronRight size={18} color={C.ink3}/>
      </Pressable>;
    })}
  </Card>;

  const status = trailStatus(trail, active);
  const dayToShow = Math.min(status.currentDay, status.unlocked);
  const content = trail.days[dayToShow - 1];
  const dayDone = active.completedDays.includes(dayToShow);
  const caughtUp = dayDone && status.unlocked <= status.currentDay;
  return <Card>
    <Eyebrow>{trail.title}</Eyebrow>
    <H2>{status.finished ? "Trilha concluída" : `Dia ${dayToShow} de ${trail.length}`}</H2>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{trail.days.map((day) => {
      const done = active.completedDays.includes(day.day);
      return <View key={day.day} style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: done ? C.goldDeep : "transparent", borderWidth: 1, borderColor: day.day === dayToShow ? C.gold : C.line }}><Text style={{ fontFamily: F.bold, fontSize: 11, color: done ? C.bg : C.ink2 }}>{day.day}</Text></View>;
    })}</View>
    {status.finished ? <P>{`Você completou os ${trail.length} dias. Sua árvore guarda essa conquista — escolha outra trilha quando quiser continuar.`}</P>
      : caughtUp ? <P>{`Dia ${dayToShow} concluído. Uma nova etapa libera amanhã.`}</P>
      : content ? <View style={{ gap: 10 }}>
        <Eyebrow>{content.title}</Eyebrow>
        <P>{content.message}</P>
        <View style={{ borderLeftWidth: 2, borderLeftColor: C.goldDeep, paddingLeft: 12 }}><H3>Prática</H3><P>{content.practice}</P></View>
        <View style={{ borderLeftWidth: 2, borderLeftColor: C.goldDeep, paddingLeft: 12 }}><H3>Reflexão</H3><P>{content.reflection}</P></View>
        <Button label={`Concluir dia ${dayToShow} · +15 XP`} onPress={() => completeTrailDay(dayToShow)}/>
      </View> : null}
    <Button kind="ghost" label="Trocar de trilha" onPress={abandonTrail}/>
  </Card>;
}

export function JourneyScreen() {
  const { profile, plan, snapshot, week, missionDone, ritualDone, completeMission, openRitual, isPremium, openPaywall } = useApp();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<{ summary: string; recommendation: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { resolved, unlockedCount, total, next } = useMemo(() => achievementState(snapshot), [snapshot]);
  const report = useMemo(() => weeklyReport(snapshot, week[1].theme.verb), [snapshot, week]);

  useEffect(() => {
    setAiReport(null);
    if (!isPremium) return;
    let cancelled = false;
    setAiLoading(true);
    api<{ summary: string; recommendation: string }>("/api/journey/weekly-report-ai", { method: "POST", body: { dayKey: localDayKey(), nextThemeVerb: week[1].theme.verb } })
      .then((data) => { if (!cancelled && data?.summary) setAiReport(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
    // Only re-runs when the 7-day window rolls over.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, report.rangeLabel]);

  const selected = resolved.find((item) => item.key === openKey);
  const streakWeek = Math.min(snapshot.streak, 7);
  return <Screen>
    <P dim>Sua jornada acompanha o que você fez de verdade: missão de hoje, sequência, conquistas e o resumo da semana.</P>

    <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: C.goldDeep, alignItems: "center", justifyContent: "center", opacity: 0.4 + streakWeek / 12 }}><Text style={{ fontFamily: F.black, fontSize: 26, color: C.gold }}>{snapshot.streak}</Text><Text style={{ fontFamily: F.body, fontSize: 10, color: C.ink3 }}>dias</Text></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Eyebrow>Sua sequência</Eyebrow>
        <H3>{snapshot.streak === 0 ? "Comece sua sequência hoje" : snapshot.streak >= 7 ? "Sete dias de constância" : `${snapshot.streak} ${snapshot.streak === 1 ? "dia" : "dias"} seguidos`}</H3>
        <P dim>{snapshot.streak === 0 ? "Concluir o ritual ou a missão de hoje inicia a contagem." : ritualDone || missionDone ? "Hoje já está contado. Volte amanhã para manter a sequência." : "Conclua o ritual ou a missão de hoje para manter a sequência."}</P>
      </View>
    </Card>

    <Card style={missionDone ? { borderColor: "rgba(112,203,160,0.4)" } : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Target size={16} color={C.gold}/><Eyebrow>{`Missão diária · +20 XP · ${plan.theme.name}`}</Eyebrow></View>
      <H2>{plan.mission}</H2>
      <P>{`Leva cerca de 15 minutos e foi escolhida para ${profile.objective.toLowerCase()}. O valor está na ação realizada, não em uma promessa de resultado.`}</P>
      <Button label={missionDone ? "Concluída hoje" : "Concluir missão"} onPress={completeMission} disabled={missionDone} icon={missionDone ? <Check size={16} color={C.bg}/> : undefined}/>
    </Card>

    {!ritualDone && <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Wind size={22} color={C.gold}/><View style={{ flex: 1 }}><H3>Ritual de 3 minutos</H3><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>Check-in, respiração e um gesto pequeno.</Text></View>
      <Button kind="ghost" label="Fazer" onPress={openRitual}/>
    </Card>}

    <Trails/>

    <Card>
      <Eyebrow>Relatório da semana</Eyebrow>
      <H2>Como foram seus últimos 7 dias</H2>
      <P dim>{report.rangeLabel}</P>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {([["Reflexões", report.reflections, report.moodNote], ["Sequência", report.streak, "dias seguidos de presença"], ["Metas avançando", report.goalsAdvancing, "em progresso agora"], ["Frutos", report.fruits, "metas concluídas até aqui"]] as const).map(([label, value, note]) =>
          <View key={label} style={{ width: "48%", borderWidth: 1, borderColor: C.lineSoft, borderRadius: 14, padding: 12, gap: 2 }}>
            <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{label}</Text><Text style={{ fontFamily: F.black, fontSize: 26, color: C.gold }}>{value}</Text><Text style={{ fontFamily: F.body, fontSize: 11, color: C.ink3 }}>{note}</Text>
          </View>)}
      </View>
      {isPremium ? <P>{aiLoading && !aiReport ? "Gerando a leitura da sua semana…" : `${aiReport?.summary ?? report.summary} ${aiReport?.recommendation ?? report.recommendation}`}</P>
        : <Pressable onPress={() => openPaywall("weekly_report")} style={{ borderWidth: 1, borderStyle: "dashed", borderColor: C.line, borderRadius: 14, padding: 14, gap: 8 }}>
          <Text style={{ fontFamily: F.body, color: C.ink3, fontSize: 14, lineHeight: 21 }} numberOfLines={2}>{`${report.summary} ${report.recommendation}`}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><LockKeyhole size={14} color={C.gold}/><Text style={{ fontFamily: F.bold, color: C.gold }}>Desbloquear leitura completa da semana</Text></View>
        </Pressable>}
    </Card>

    <Card>
      <Eyebrow>Conquistas</Eyebrow>
      <H2>{`${unlockedCount} de ${total} desbloqueadas`}</H2>
      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const items = resolved.filter((item) => item.category === category.id);
        if (!items.length) return null;
        return <View key={category.id} style={{ gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink2 }}>{`${category.label} · ${items.filter((item) => item.unlocked).length}/${items.length}`}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{items.map((item) => <Pressable key={item.key} onPress={() => setOpenKey(item.key)} style={{ width: "30.5%", minHeight: 78, borderRadius: 14, borderWidth: 1, borderColor: item.unlocked ? C.gold : C.lineSoft, backgroundColor: item.unlocked ? C.card2 : "transparent", padding: 8, alignItems: "center", justifyContent: "center", gap: 4 }}>
            {item.unlocked ? <Sparkles size={18} color={C.gold}/> : <LockKeyhole size={16} color={C.ink3}/>}
            <Text style={{ fontFamily: F.bold, fontSize: 10, textAlign: "center", color: item.unlocked ? C.ink : C.ink3 }}>{item.name}</Text>
          </Pressable>)}</View>
        </View>;
      })}
      {next && <P dim>{`Próxima: ${next.name} — ${next.hint.toLowerCase()} (${next.current}/${next.target}).`}</P>}
    </Card>
    <Gap/>

    <Modal visible={selected !== undefined} transparent animationType="fade" onRequestClose={() => setOpenKey(null)}>
      <Pressable onPress={() => setOpenKey(null)} style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.9)", justifyContent: "center", padding: 20 }}>
        {selected && <Card>
          <H2>{selected.name}</H2>
          <P dim>{selected.unlocked ? "Desbloqueada na sua jornada." : selected.hint}</P>
          <P>{selected.story}</P>
          <Bar value={selected.current} max={selected.target}/>
          <H3>{selected.unlocked ? selected.reward : `${selected.current} de ${selected.target}`}</H3>
          <Button kind="ghost" label="Fechar" onPress={() => setOpenKey(null)}/>
        </Card>}
      </Pressable>
    </Modal>
  </Screen>;
}
