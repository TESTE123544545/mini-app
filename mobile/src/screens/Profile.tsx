import React, { useState } from "react";
import { Alert, Linking, Modal, Text, View } from "react-native";
import { ageFromDate } from "@/lib/birth";
import { useApp } from "../store";
import { Bar, Button, Card, Chip, Eyebrow, Field, Gap, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";
import type { View as TabView } from "../nav";
import { Features } from "./Premium";

const OBJECTIVES = ["Dinheiro", "Carreira", "Negócios", "Organização financeira", "Disciplina", "Desenvolvimento pessoal"];
const SITE = "https://veiasdasintonia.com.br";

export function ProfileScreen({ go }: { go: (view: TabView) => void }) {
  const { profile, setProfile, account, goals, isPremium, onTrial, trialEndsAt, logout, deleteAccount, syncStatus, say, xp, level, streak, advanceGoal, addGoal } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [objective, setObjective] = useState(profile.objective);
  const [intention, setIntention] = useState(profile.intention);
  const [goalTitle, setGoalTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const age = profile.birthDate ? ageFromDate(profile.birthDate) : null;

  return <Screen>
    <Card>
      <Eyebrow>Seu caminho</Eyebrow>
      <H2>{profile.name}</H2>
      <P>{`${profile.sign}${age !== null ? ` · ${age} anos` : ""} · ${profile.objective}`}</P>
      <P dim>{account?.email}</P>
      <P dim>{`Nível ${level} · ${xp} XP · sequência de ${streak} dia${streak === 1 ? "" : "s"}`}</P>
      <Text style={{ fontFamily: F.body, fontSize: 12, color: syncStatus === "offline" ? C.danger : C.ink3 }}>{syncStatus === "saved" ? "Tudo salvo na sua conta" : syncStatus === "saving" ? "Salvando…" : "Sem conexão: vamos salvar quando voltar"}</Text>
      {!editing && <Button kind="ghost" label="Editar perfil" onPress={() => { setName(profile.name); setObjective(profile.objective); setIntention(profile.intention); setEditing(true); }}/>}
    </Card>

    {editing && <Card>
      <Field label="Nome" value={name} onChangeText={setName}/>
      <H3>Objetivo principal</H3>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{OBJECTIVES.map((item) => <Chip key={item} label={item} on={objective === item} onPress={() => setObjective(item)}/>)}</View>
      <Field label="Sua intenção" value={intention} onChangeText={setIntention} multiline maxLength={280} placeholder="O que você quer cultivar?"/>
      <Gap n={4}/>
      <Button label="Salvar" disabled={name.trim().length < 2} onPress={() => { setProfile({ ...profile, name: name.trim(), objective, intention }); setEditing(false); say("Perfil atualizado."); }}/>
      <Button kind="ghost" label="Cancelar" onPress={() => setEditing(false)}/>
    </Card>}

    <Card>
      <Eyebrow>{isPremium ? "Plano Premium" : "Plano grátis"}</Eyebrow>
      {onTrial && trialEndsAt ? <P>{`Seu teste grátis do Premium vai até ${new Date(trialEndsAt).toLocaleDateString("pt-BR")}.`}</P> : isPremium ? <P>Obrigado por apoiar sua jornada.</P> : <><P>Com o Premium você libera tudo isto:</P><Features/></>}
      {profile.plan !== "premium" && <Button label={onTrial ? "Garantir o Premium" : "Conhecer o Premium"} onPress={() => go("premium")}/>}
    </Card>

    <Card>
      <Eyebrow>Minhas metas</Eyebrow>
      {goals.map((goal) => <View key={goal.id} style={{ gap: 6, paddingVertical: 6 }}>
        <H3>{goal.title}</H3><Bar value={goal.progress}/>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ fontFamily: F.body, color: C.ink3, fontSize: 12 }}>{`${goal.category} · ${goal.progress}%`}</Text>{goal.progress < 100 && <Text onPress={() => advanceGoal(goal.id)} style={{ fontFamily: F.bold, color: C.gold, fontSize: 13 }}>+25%</Text>}</View>
      </View>)}
      <Field label="Nova meta" value={goalTitle} onChangeText={setGoalTitle} placeholder="Ex.: guardar o primeiro valor"/>
      <Button kind="ghost" label="Plantar meta" disabled={goalTitle.trim().length < 3} onPress={() => { if (addGoal(goalTitle, profile.objective)) setGoalTitle(""); }}/>
    </Card>

    <Card>
      <Eyebrow>Ajuda e privacidade</Eyebrow>
      <Text onPress={() => Linking.openURL(`${SITE}/privacidade`)} style={{ fontFamily: F.bold, color: C.ink, paddingVertical: 8 }}>Política de privacidade</Text>
      <Text onPress={() => Linking.openURL(`${SITE}/termos`)} style={{ fontFamily: F.bold, color: C.ink, paddingVertical: 8 }}>Termos de uso</Text>
      <Text onPress={() => Linking.openURL("mailto:contato@veiasdasintonia.com.br")} style={{ fontFamily: F.bold, color: C.ink, paddingVertical: 8 }}>Falar com a gente</Text>
      <Text onPress={() => { setPassword(""); setDeleteError(""); setDeleting(true); }} style={{ fontFamily: F.bold, color: C.danger, paddingVertical: 8 }}>Excluir minha conta</Text>
      <Button kind="ghost" label="Sair da conta" onPress={() => Alert.alert("Sair da conta", "Você poderá entrar de novo quando quiser.", [{ text: "Cancelar", style: "cancel" }, { text: "Sair", style: "destructive", onPress: () => { void logout(); } }])}/>
    </Card>
    <Modal visible={deleting} transparent animationType="fade" onRequestClose={() => setDeleting(false)}>
      <View style={{ flex: 1, backgroundColor: "rgba(7,15,36,0.94)", justifyContent: "center", padding: 20 }}>
        <Card>
          <H2>Excluir minha conta</H2>
          <P>Isso apaga a sua conta, a árvore, as metas, o diário, as conversas e os sinais salvos. Não dá para desfazer. Assinaturas do site (Stripe) são canceladas; se você assinou pela Google Play, cancele também na Play Store.</P>
          <Field label="Confirme com a sua senha" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
          {deleteError ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{deleteError}</Text> : null}
          <Button label="Excluir para sempre" busy={busy} disabled={!password} onPress={async () => { setBusy(true); setDeleteError(""); try { await deleteAccount(password); } catch (e) { setDeleteError(e instanceof Error ? e.message : "Não foi possível excluir agora."); setBusy(false); } }}/>
          <Button kind="ghost" label="Cancelar" onPress={() => setDeleting(false)}/>
        </Card>
      </View>
    </Modal>
  </Screen>;
}
