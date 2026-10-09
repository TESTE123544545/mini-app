import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Check, Compass, Play, Sparkles, Target } from "lucide-react-native";
import { dayPartLabel, greetingLabel } from "@/lib/daily";
import { useApp } from "../store";
import { Bar, Button, Card, Chip, Eyebrow, Gap, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";
import { useSignals } from "./Signals";
import type { View as TabView } from "../nav";

const MOODS = ["Calmo", "Ansioso", "Motivado", "Cansado", "Grato"];
const BREATH = ["Inspire fundo contando até 4.", "Segure o ar por 4 segundos.", "Solte devagar contando até 6.", "Repita mais duas vezes, no seu ritmo."];

export function RitualModal() {
  const { completeRitual, plan, ritualOpen, closeRitual: onClose } = useApp();
  if (!ritualOpen) return null;
  const [mood, setMood] = useState("");
  return <Modal animationType="slide" transparent onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.92)", justifyContent: "center", padding: 20 }}>
      <Card>
        <Eyebrow>Ritual de 3 minutos</Eyebrow>
        <H2>{`Hoje: ${plan.theme.name}`}</H2>
        {BREATH.map((line, index) => <P key={line}>{`${index + 1}. ${line}`}</P>)}
        <H3>Como você chega agora?</H3>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{MOODS.map((item) => <Chip key={item} label={item} on={mood === item} onPress={() => setMood(item)}/>)}</View>
        <Gap n={6}/>
        <Button label="Concluir ritual" disabled={!mood} onPress={() => { completeRitual(); onClose(); }}/>
        <Button kind="ghost" label="Fechar" onPress={onClose}/>
      </Card>
    </View>
  </Modal>;
}

export function HomeScreen({ go }: { go: (view: TabView) => void }) {
  const { profile, plan, part, missionDone, ritualDone, completeMission, stage, xp, level, streak, goals, week, openRitual } = useApp();
  const { data } = useSignals(null, null);
  const first = profile.name.split(" ")[0];
  const next = stage.next;
  const progress = next ? ((xp - stage.stage.minXP) / (next.minXP - stage.stage.minXP)) * 100 : 100;
  return <Screen>
    <View style={{ gap: 2 }}>
      <Eyebrow>{dayPartLabel[part]}</Eyebrow>
      <H2>{`${greetingLabel[part]}, ${first}.`}</H2>
    </View>

    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Compass size={14} color={C.gold}/><Eyebrow>{`Dia de ${plan.theme.name}`}</Eyebrow></View>
      <H2>{`${plan.theme.verb} é a palavra de hoje.`}</H2>
      <P>{`${plan.theme.guidance} Sua intenção principal continua sendo ${profile.objective.toLowerCase()}.`}</P>
      <Pressable onPress={() => go("signs")}><Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.goldSoft, fontSize: 15, lineHeight: 23 }}>{`“${plan.voice}”`}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{`Leitura de hoje para ${profile.sign} · Toque para ver mais`}</Text></Pressable>
      <Gap n={4}/>
      <Pressable onPress={() => !ritualDone && openRitual()} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14 }}>
        {ritualDone ? <Check size={20} color={C.ok}/> : <Play size={20} color={C.gold}/>}
        <View style={{ flex: 1 }}><H3>{ritualDone ? "Ritual concluído" : "Começar ritual de 3 minutos"}</H3><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>Check-in, respiração, ação</Text></View>
      </Pressable>
    </Card>

    {data && <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Sparkles size={14} color={C.gold}/><Eyebrow>A mensagem do seu dia</Eyebrow></View>
      <P dim>{`${data.daily.sign} · dia ${data.daily.dayNumberKind} ${data.daily.dayNumber}${data.daily.lifePath ? ` · Caminho de Vida ${data.daily.lifePath}` : ""}`}</P>
      <H2>{data.daily.title}</H2>
      <P>{data.daily.full?.messages[data.daily.category] ?? data.daily.short}</P>
      <Button kind="ghost" label="Ver meus sinais" onPress={() => go("signals")}/>
    </Card>}

    <Card>
      <Eyebrow>Seu diário</Eyebrow>
      <H2>Uma reflexão por dia</H2>
      <P>Escreva o que você percebeu hoje e acompanhe a sua evolução.</P>
      <Button kind="ghost" label="Abrir o diário" onPress={() => go("journal")}/>
    </Card>

    <Card>
      <Eyebrow>Novo · Premium</Eyebrow>
      <H2>Radar da Prosperidade</H2>
      <P>Descubra como transformar o que você gosta de fazer em oportunidades reais de renda, e quantas horas da sua vida cada venda pode adiantar.</P>
      <Button label="Abrir o Radar" onPress={() => go("radar")}/>
    </Card>

    <Card style={missionDone ? { borderColor: "rgba(112,203,160,0.4)" } : undefined}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{missionDone ? <Check size={16} color={C.ok}/> : <Target size={16} color={C.gold}/>}<Eyebrow>{`Missão do dia · +20 XP`}</Eyebrow></View>
      <H2>{plan.theme.verb}</H2>
      <P>{plan.mission}</P>
      <P dim>{`Micro-ação: ${plan.micro}`}</P>
      <Button label={missionDone ? "Missão concluída" : "Concluir missão"} onPress={completeMission} disabled={missionDone}/>
    </Card>

    <Card>
      <Eyebrow>Sua árvore</Eyebrow>
      <H2>{stage.stage.name}</H2>
      <P>{stage.stage.note}</P>
      <Bar value={progress}/>
      <P dim>{`Nível ${level} · ${xp} XP · sequência de ${streak} dia${streak === 1 ? "" : "s"}${next ? ` · próximo estágio: ${next.name} (${next.minXP} XP)` : ""}`}</P>
      <Button kind="ghost" label="Ver minha árvore" onPress={() => go("tree")}/>
    </Card>

    {goals[0] && <Card>
      <Eyebrow>Sua meta principal</Eyebrow>
      <H3>{goals[0].title}</H3>
      <Bar value={goals[0].progress}/>
      <P dim>{`${goals[0].progress}% concluída`}</P>
    </Card>}

    <Card>
      <Eyebrow>Conversar</Eyebrow>
      <H3>Quer pensar em voz alta?</H3>
      <P>A Sintonia, a IA do app, conversa com você sobre o seu dia, com o céu de hoje e o seu signo como contexto.</P>
      <Button kind="ghost" label="Conversar com a IA" onPress={() => go("chat")}/>
    </Card>

    <Card>
      <Eyebrow>Próximos 7 dias</Eyebrow>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {week.map((day, index) => <View key={day.dayKey} style={{ alignItems: "center", gap: 2, flex: 1, paddingVertical: 6, borderRadius: 12, backgroundColor: index === 0 ? C.card2 : "transparent" }}>
          <Text style={{ fontFamily: F.body, fontSize: 11, color: C.ink3 }}>{day.weekday}</Text>
          <Text style={{ fontFamily: F.black, fontSize: 16, color: index === 0 ? C.gold : C.ink }}>{day.day}</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 9, color: C.ink2 }}>{day.theme.name}</Text>
        </View>)}
      </View>
    </Card>
  </Screen>;
}
