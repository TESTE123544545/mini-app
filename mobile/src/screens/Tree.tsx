import React, { useMemo, useState } from "react";
import { Modal, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { TREE_PART_HOTSPOTS, TREE_STAGES } from "@/lib/treeStages";
import { achievementState } from "@/lib/journey";
import { useApp } from "../store";
import { ProsperityTree } from "../Tree";
import { Bar, Button, Card, Eyebrow, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";
import type { View as TabView } from "../nav";

export function TreeScreen({ go, openRitual }: { go: (view: TabView) => void; openRitual: () => void }) {
  const { xp, level, streak, stage, goals, snapshot, missionDone, ritualDone, entries } = useApp();
  const { width } = useWindowDimensions();
  const { upcoming } = useMemo(() => achievementState(snapshot), [snapshot]);
  const [part, setPart] = useState<(typeof TREE_PART_HOTSPOTS)[number] | null>(null);
  const today = new Date().toLocaleDateString("pt-BR");
  const journaledToday = entries.some((entry) => entry.date === today);
  const cares: [string, string, boolean, () => void][] = [
    ["Missão do dia", "+20 XP", missionDone, () => go("home")],
    ["Ritual de 3 minutos", "+10 XP", ritualDone, openRitual],
    ["Reflexão no diário", "+10 XP", journaledToday, () => go("journal")],
  ];
  const done = cares.filter((item) => item[2]).length;
  const size = Math.min(width - 32, 340);
  const fruits = goals.filter((goal) => goal.progress === 100).length;

  return <Screen>
    <P dim>Toque nas partes da árvore para entender o que cada uma representa na sua jornada.</P>
    <Card style={{ alignItems: "center" }}>
      <Eyebrow>{`Estágio ${stage.stageIndex + 1} de ${TREE_STAGES.length}`}</Eyebrow>
      <H2>{stage.stage.name}</H2>
      <View style={{ width: size, height: (size * 420) / 300 }}>
        <ProsperityTree xp={xp} goalProgress={goals[0]?.progress} size={size}/>
        {TREE_PART_HOTSPOTS.map((item) => <Pressable key={item.key} accessibilityLabel={item.name} onPress={() => setPart(item)} style={{ position: "absolute", left: `${item.x}%`, top: `${item.y}%`, width: 44, height: 44, marginLeft: -22, marginTop: -22, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: xp >= item.unlockedAt ? C.gold : "transparent", borderWidth: 1.5, borderColor: C.gold, opacity: 0.85 }}/>
        </Pressable>)}
      </View>
      <P>{stage.stage.note}</P>
      <Bar value={stage.stageProgress * 100}/>
      <P dim>{`Nível ${level} · ${xp} XP · ${fruits} fruto${fruits === 1 ? "" : "s"} · sequência de ${streak} dia${streak === 1 ? "" : "s"}`}</P>
    </Card>

    <Card>
      <Eyebrow>{`Cuidados de hoje · ${done}/3`}</Eyebrow>
      <H2>{done === 3 ? "Dia completo — sua árvore agradece" : "Nutra sua árvore hoje"}</H2>
      {cares.map(([label, reward, isDone, action]) => <Pressable key={label} onPress={action} disabled={isDone} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.lineSoft }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: isDone ? C.ok : C.line, alignItems: "center", justifyContent: "center" }}>{isDone ? <Check size={14} color={C.ok}/> : null}</View>
        <View style={{ flex: 1 }}><H3>{label}</H3><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{isDone ? "Feito hoje" : reward}</Text></View>
        {!isDone && <ChevronRight size={18} color={C.ink3}/>}
      </Pressable>)}
      <P dim>Complete os três no mesmo dia e ganhe +20 XP de bônus.</P>
    </Card>

    {upcoming.length > 0 && <Card>
      <Eyebrow>Próximas conquistas</Eyebrow>
      <H2>O que falta para crescer</H2>
      {upcoming.map((item) => <View key={item.key} style={{ gap: 4, marginBottom: 6 }}>
        <H3>{item.name}</H3><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{`${item.hint} · ${item.current.toLocaleString("pt-BR")}/${item.target.toLocaleString("pt-BR")}`}</Text>
        <Bar value={item.current} max={item.target}/>
      </View>)}
      <Button kind="ghost" label="Ver todas as conquistas" onPress={() => go("missions")}/>
    </Card>}

    <Card>
      <Eyebrow>Linha do tempo</Eyebrow>
      <H2>A evolução da sua árvore</H2>
      {TREE_STAGES.map((item) => <View key={item.id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", opacity: xp >= item.minXP ? 1 : 0.5 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: xp >= item.minXP ? C.gold : C.line }}/>
        <View style={{ flex: 1 }}><H3>{`${item.name} · ${item.minXP} XP`}</H3><Text style={{ fontFamily: F.body, fontSize: 13, color: C.ink3, lineHeight: 19 }}>{item.note}</Text></View>
      </View>)}
    </Card>

    <Modal visible={part !== null} transparent animationType="fade" onRequestClose={() => setPart(null)}>
      <Pressable onPress={() => setPart(null)} style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.9)", justifyContent: "center", padding: 20 }}>
        {part && <Card>
          <H2>{part.name}</H2>
          <H3>{xp < part.unlockedAt ? `Ainda em formação · faltam ${part.unlockedAt - xp} XP` : "Desbloqueada"}</H3>
          <P>{part.note}</P>
          <Button kind="ghost" label="Fechar" onPress={() => setPart(null)}/>
        </Card>}
      </Pressable>
    </Modal>
  </Screen>;
}
