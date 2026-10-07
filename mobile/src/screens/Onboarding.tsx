import React, { useState } from "react";
import { View } from "react-native";
import { signFromDate } from "@/lib/birth";
import { useApp } from "../store";
import { Button, Card, Chip, Eyebrow, Field, Gap, H1, P, Screen } from "../ui";
import { brToIso, maskDate } from "./Auth";

const OBJECTIVES = ["Dinheiro", "Carreira", "Negócios", "Organização financeira", "Disciplina", "Desenvolvimento pessoal"];

/** After sign-up: the objective and the first goal (the site's onboarding, in short steps). */
export function Onboarding() {
  const { profile, finishOnboarding } = useApp();
  // An account that closed the app before finishing has no profile on the server yet: ask for name and birth again.
  const needsBasics = !profile.name || !profile.birthDate;
  const [step, setStep] = useState(needsBasics ? -1 : 0);
  const [name, setName] = useState(profile.name);
  const [birthText, setBirthText] = useState("");
  const [objective, setObjective] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const birthDate = needsBasics ? brToIso(birthText) ?? "" : profile.birthDate;
  const first = (needsBasics ? name : profile.name).split(" ")[0];
  const total = needsBasics ? 3 : 2;
  return <Screen>
    <Eyebrow>{`Passo ${step + 1 + (needsBasics ? 1 : 0)} de ${total}`}</Eyebrow>
    {step === -1 && <>
      <H1>Vamos começar por você.</H1>
      <Card>
        <Field label="Seu nome" value={name} onChangeText={setName} placeholder="Seu nome"/>
        <Field label="Data de nascimento" value={birthText} onChangeText={(text) => setBirthText(maskDate(text))} keyboardType="number-pad" placeholder="DD/MM/AAAA"/>
        <Gap n={6}/>
        <Button label="Continuar" onPress={() => setStep(0)} disabled={name.trim().length < 2 || !birthDate}/>
      </Card>
    </>}
    {step === 0 && <>
      <H1>{`Prazer, ${first}.`}</H1>
      <P>{`Seu signo é ${signFromDate(birthDate)}. Agora conte o que mais te chama.`}</P>
      <Card>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{OBJECTIVES.map((item) => <Chip key={item} label={item} on={objective === item} onPress={() => setObjective(item)}/>)}</View>
        <Gap n={6}/>
        <Button label="Continuar" onPress={() => setStep(1)} disabled={!objective}/>
      </Card>
    </>}
    {step === 1 && <>
      <H1>Qual é a sua primeira meta?</H1>
      <P>Uma meta pequena e concreta já planta sua árvore.</P>
      <Card>
        <Field label="Sua meta" value={goalTitle} onChangeText={setGoalTitle} placeholder={`Ex.: organizar minhas contas (${objective.toLowerCase()})`}/>
        <Gap n={6}/>
        <Button label="Plantar minha árvore" onPress={() => finishOnboarding({ objective, goalTitle, name: name.trim(), birthDate })} disabled={goalTitle.trim().length < 3}/>
      </Card>
    </>}
  </Screen>;
}
