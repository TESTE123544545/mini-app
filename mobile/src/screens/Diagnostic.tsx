import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Check, LockKeyhole } from "lucide-react-native";
import { DIAGNOSTIC_QUESTIONS, DIMENSIONS, PROFILES, TREE_FOCUS, TREE_OPENING, buildResult, followUpLabel, interpret, optionLabel, type Answers, type DiagnosticResult } from "@/lib/diagnostic";
import { useApp } from "../store";
import { readJson, writeJson } from "../storage";
import { ProsperityTree } from "../Tree";
import { Bar, Button, Card, Eyebrow, Gap, H1, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";
import type { View as TabView } from "../nav";

const STEPS = ["Analisando suas respostas…", "Identificando seus principais padrões…", "Preparando seu mapa de prosperidade…"];

function Processing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = STEPS.map((_, index) => setTimeout(() => { if (index < STEPS.length - 1) setStep(index + 1); else onDone(); }, 1100 * (index + 1)));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timers start once
  }, []);
  return <Screen scroll={false}><View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
    <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: C.gold, opacity: 0.5 + step * 0.25 }}/>
    <Eyebrow>Meu diagnóstico</Eyebrow>
    <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.goldSoft }}>{STEPS[step]}</Text>
  </View></Screen>;
}

function Result({ result, onRestart, go, history }: { result: DiagnosticResult; onRestart: () => void; go: (view: TabView) => void; history: DiagnosticResult[] }) {
  const { xp } = useApp();
  const { summary, strength, attention } = interpret(result.scores);
  const profile = PROFILES[result.profile];
  const focus = TREE_FOCUS[attention];
  return <Screen>
    <Card>
      <Eyebrow>Seu diagnóstico está pronto</Eyebrow>
      <H2>{`${result.sign}, encontramos alguns pontos importantes no seu momento atual.`}</H2>
      <P>{`Área que você quer transformar: ${[optionLabel("area", result.area), followUpLabel("area", result.answers)].filter(Boolean).join(" · ")}`}</P>
      <View style={{ borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 10, gap: 4 }}>
        <Eyebrow>Seu perfil de prosperidade</Eyebrow>
        <H2>{profile.name}</H2>
        <Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.goldSoft, fontSize: 15 }}>{profile.tagline}</Text>
        <P>{profile.description}</P>
      </View>
    </Card>
    <Card>
      <Eyebrow>Suas cinco dimensões</Eyebrow>
      <H2>Onde está sua energia hoje</H2>
      {DIMENSIONS.map((item) => <View key={item.id} style={{ gap: 4, marginBottom: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: F.bold, color: C.ink }}>{item.label}{item.id === strength ? "  · sua força" : item.id === attention ? "  · ponto de atenção" : ""}</Text>
          <Text style={{ fontFamily: F.black, color: C.gold }}>{result.scores[item.id]}%</Text>
        </View>
        <Bar value={result.scores[item.id]}/>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{item.description}</Text>
      </View>)}
    </Card>
    <Card>
      <Eyebrow>Interpretação</Eyebrow>
      <P>{summary}</P>
      <P dim>Dentro da proposta simbólica do Veias da Sintonia, isso não significa que seu caminho esteja definido. O diagnóstico é uma ferramenta de reflexão sobre o seu momento atual, não uma avaliação psicológica, médica ou financeira.</P>
    </Card>
    <Card style={{ alignItems: "center" }}>
      <Eyebrow>Próxima etapa</Eyebrow>
      <H2>Agora que você conhece seu momento, é hora de descobrir onde sua prosperidade começa.</H2>
      <ProsperityTree xp={xp} size={220}/>
      <P><Text style={{ fontFamily: F.bold, color: C.ink }}>{TREE_OPENING[strength]} </Text>{focus.message}</P>
      <Button label="Descobrir minha Árvore da Prosperidade" onPress={() => go("tree")}/>
    </Card>
    {history.length > 1 && <Card>
      <Eyebrow>Sua evolução</Eyebrow><H2>Diagnósticos anteriores</H2>
      {history.map((item, index) => <View key={item.completedAt} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
        <Text style={{ fontFamily: F.body, color: C.ink2 }}>{new Date(item.completedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{index === 0 ? " · atual" : ""}</Text>
        <Text style={{ fontFamily: F.bold, color: C.gold }}>{PROFILES[item.profile].name}</Text>
      </View>)}
    </Card>}
    <Button kind="ghost" label="Refazer diagnóstico" onPress={onRestart}/>
  </Screen>;
}

function LockedResult({ onRestart }: { onRestart: () => void }) {
  const { openPaywall } = useApp();
  return <Screen>
    <Card style={{ alignItems: "center" }}>
      <LockKeyhole size={30} color={C.gold}/>
      <H2>Seu diagnóstico está pronto</H2>
      <P>Suas respostas já foram lidas. Assine o Premium para ver o resultado completo:</P>
      {["Seu perfil de prosperidade", "Suas cinco dimensões, com a pontuação de cada uma", "A interpretação do seu momento", "Seu próximo passo, ligado à sua árvore"].map((part) => <View key={part} style={{ flexDirection: "row", gap: 8, alignSelf: "flex-start" }}><LockKeyhole size={14} color={C.gold}/><Text style={{ fontFamily: F.body, color: C.ink2, flex: 1 }}>{part}</Text></View>)}
      <Gap n={4}/>
      <Button label="Ver meu resultado completo" onPress={() => openPaywall("diagnostic_result")}/>
    </Card>
    <Button kind="ghost" label="Refazer diagnóstico" onPress={onRestart}/>
  </Screen>;
}

export function DiagnosticScreen({ go }: { go: (view: TabView) => void }) {
  const { account, profile, isPremium } = useApp();
  const storageKey = `vds-diagnostic:${account?.email ?? "anon"}`;
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [stage, setStage] = useState<"rest" | "question" | "processing">("rest");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const total = DIAGNOSTIC_QUESTIONS.length;
  const question = DIAGNOSTIC_QUESTIONS[index];
  const detailKey = question.options.find((option) => option.followUp)?.followUp?.id;

  useEffect(() => { readJson<DiagnosticResult[]>(storageKey).then((saved) => { if (Array.isArray(saved)) setResults(saved); }); }, [storageKey]);

  function start() { setAnswers(profile.sign ? { sign: profile.sign } : {}); setIndex(0); setError(""); setStage("question"); }
  function select(optionId: string) {
    setAnswers((current) => { const next = { ...current, [question.id]: optionId }; if (detailKey && current[question.id] !== optionId) delete next[detailKey]; return next; });
    setError("");
  }
  function next() {
    const selected = answers[question.id];
    if (!selected) { setError("Escolha uma opção para continuar."); return; }
    const followUp = question.options.find((option) => option.id === selected)?.followUp;
    if (followUp && !answers[followUp.id]) { setError("Escolha também uma das opções logo abaixo para continuar."); return; }
    if (index < total - 1) setIndex(index + 1); else setStage("processing");
  }
  function finish() {
    const result = buildResult(answers);
    const updated = [result, ...results].slice(0, 6);
    setResults(updated); void writeJson(storageKey, updated); setStage("rest");
  }

  if (stage === "processing") return <Processing onDone={finish}/>;
  if (stage === "question") {
    const selected = answers[question.id];
    const followUp = question.options.find((option) => option.id === selected)?.followUp;
    return <Screen>
      <Pressable onPress={() => { setError(""); if (index > 0) setIndex(index - 1); else setStage("rest"); }}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
      <View style={{ gap: 6 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{`Pergunta ${index + 1} de ${total}`}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{`${Math.round(((index + 1) / total) * 100)}%`}</Text></View><Bar value={index + 1} max={total}/></View>
      <H1>{question.title}</H1>
      {question.helper ? <P dim>{question.helper}</P> : null}
      {question.id === "sign" && profile.sign ? <P dim>{`Pelo seu cadastro, seu signo é ${profile.sign}. Confirme ou escolha outro.`}</P> : null}
      <View style={{ flexDirection: question.layout === "grid" ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
        {question.options.map((option) => {
          const checked = selected === option.id;
          return <View key={option.id} style={{ width: question.layout === "grid" ? "47.5%" : "100%", gap: 8 }}>
            <Pressable onPress={() => select(option.id)} accessibilityRole="radio" accessibilityState={{ checked }} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1.5, borderColor: checked ? C.gold : C.line, backgroundColor: checked ? C.card2 : C.card, padding: 14 }}>
              {option.hint ? <Text style={{ fontSize: 20, color: C.gold }}>{option.hint}</Text> : null}
              <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 15, color: C.ink }}>{option.label}</Text>
              {checked && <Check size={16} color={C.gold}/>}
            </Pressable>
            {checked && option.followUp && <View style={{ gap: 8, paddingLeft: 8 }}>
              <H3>{option.followUp.title}</H3>
              {option.followUp.options.map((item) => {
                const picked = answers[option.followUp!.id] === item.id;
                return <Pressable key={item.id} onPress={() => { setAnswers((current) => ({ ...current, [option.followUp!.id]: item.id })); setError(""); }} accessibilityRole="radio" accessibilityState={{ checked: picked }} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, borderColor: picked ? C.gold : C.line, padding: 12, backgroundColor: picked ? C.card2 : "transparent" }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}>{picked && <Check size={11} color={C.gold}/>}</View>
                  <Text style={{ flex: 1, fontFamily: F.body, fontSize: 14, color: C.ink2 }}>{item.label}</Text>
                </Pressable>;
              })}
            </View>}
          </View>;
        })}
      </View>
      {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
      <Button label={index === total - 1 ? "Ver meu diagnóstico" : "Continuar"} onPress={next} disabled={!selected || (Boolean(followUp) && !answers[followUp!.id])}/>
    </Screen>;
  }
  if (results[0]) return isPremium ? <Result result={results[0]} history={results} onRestart={start} go={go}/> : <LockedResult onRestart={start}/>;
  return <Screen>
    <Card style={{ alignItems: "center" }}>
      <Eyebrow>Meu diagnóstico</Eyebrow>
      <H1>Descubra o que está influenciando sua prosperidade</H1>
      <P>Responda algumas perguntas e descubra seu momento atual, seus principais bloqueios e onde sua energia de prosperidade pode ser direcionada.</P>
      <Button label="Começar meu diagnóstico" onPress={start}/>
      <P dim>Leva menos de 2 minutos.</P>
      <P dim>Uma leitura simbólica e de autoconhecimento. Não é diagnóstico psicológico, médico ou financeiro.</P>
    </Card>
  </Screen>;
}
