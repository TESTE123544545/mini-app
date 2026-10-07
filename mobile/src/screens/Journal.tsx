import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { journalAnchors } from "@/lib/daily";
import { useApp } from "../store";
import { Button, Card, Eyebrow, Field, H2, P, Screen } from "../ui";
import { C, F } from "../theme";

const FREE_HISTORY = 7;

export function JournalScreen() {
  const { plan, entries, saveJournal, isPremium, openPaywall } = useApp();
  const questions = useMemo(() => [plan.journalQuestion, ...journalAnchors], [plan.journalQuestion]);
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const visible = isPremium ? entries : entries.slice(0, FREE_HISTORY);
  const hidden = entries.length - visible.length;
  return <Screen>
    <P dim>Um espaço privado para observar padrões e transformar reflexão em escolha.</P>
    <Card>
      <Eyebrow>Reflexão de hoje · +10 XP</Eyebrow>
      <P dim>{`A primeira pergunta muda todos os dias: hoje ela vem do tema ${plan.theme.name.toLowerCase()}.`}</P>
      {questions.map((question, index) => <Field key={question} label={question} multiline value={answers[index]} maxLength={1500} onChangeText={(text) => setAnswers((current) => current.map((item, i) => (i === index ? text : item)))} placeholder="Escreva com calma…"/>)}
      <Button label="Salvar reflexão" onPress={() => { if (saveJournal(answers)) setAnswers(["", "", "", ""]); }}/>
    </Card>

    <Card>
      <Eyebrow>Seu histórico</Eyebrow>
      <H2>{entries.length === 0 ? "Sua primeira reflexão começa a história" : entries.length === 1 ? "1 reflexão" : `${entries.length} reflexões`}</H2>
      {visible.map((entry, index) => <View key={`${entry.date}-${index}`} style={{ borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 10, gap: 4 }}>
        <Text style={{ fontFamily: F.black, color: C.gold, fontSize: 13 }}>{entry.date}</Text>
        {entry.answers.map((answer, i) => answer.trim() ? <P key={i}>{answer}</P> : null)}
      </View>)}
      {hidden > 0 && <Button label={hidden === 1 ? "Ver mais 1 reflexão" : `Ver mais ${hidden} reflexões`} onPress={() => openPaywall("journal_history")}/>}
    </Card>
  </Screen>;
}
