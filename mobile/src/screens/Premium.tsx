import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { LockKeyhole, X } from "lucide-react-native";
import { useApp } from "../store";
import { Button, Card, Eyebrow, Gap, H1, H2, P, Screen } from "../ui";
import { C, F } from "../theme";
import { LOCKED_COPY, PAYWALL_HEADLINE, type View as TabView } from "../nav";
import { billingAvailable, loadOffers, purchase, restore, type Offer } from "../billing";

const FEATURES = [
  ["Árvore da Prosperidade", "cresce com as suas ações"],
  ["Diagnóstico completo", "seu perfil e suas 5 dimensões"],
  ["Seu Momento", "hoje, na semana e no mês"],
  ["Experiências exclusivas", "tarô, roda e trilhas guiadas"],
  ["Sinais do Universo completos", "horas iguais, numerologia e combinação"],
  ["Conversa com a IA", "uma dica para o seu dia"],
];

export function Features() {
  return <View style={{ gap: 10 }}>{FEATURES.map(([title, note]) => <View key={title} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.goldDeep }}/>
    <Text style={{ fontFamily: F.body, fontSize: 15, color: C.ink2, flex: 1 }}><Text style={{ fontFamily: F.bold, color: C.ink }}>{title}</Text>{` — ${note}`}</Text>
  </View>)}</View>;
}

/** The subscription offer: prices and purchase come from Google Play Billing, the server validates the receipt. */
export function Offers({ reason }: { reason: string }) {
  const { reloadAccount, say, closePaywall, account } = useApp();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    loadOffers().then((list) => { if (live) { setOffers(list); setSelected(list[0]?.id ?? null); } }).catch(() => live && setOffers([]));
    return () => { live = false; };
  }, []);

  async function buy() {
    const offer = offers?.find((item) => item.id === selected);
    if (!offer) return;
    setBusy(true);
    try {
      await purchase(offer, account?.deviceId ?? "");
      await reloadAccount();
      say("Premium ativado. Obrigado por apoiar sua jornada!");
      closePaywall();
    } catch (error) {
      say(error instanceof Error ? error.message : "Não foi possível concluir a compra.");
    } finally { setBusy(false); }
  }
  async function restorePurchases() {
    setBusy(true);
    try { const ok = await restore(); if (ok) { await reloadAccount(); say("Assinatura restaurada."); closePaywall(); } else say("Nenhuma assinatura encontrada nesta conta do Google."); }
    catch (error) { say(error instanceof Error ? error.message : "Não foi possível restaurar."); }
    finally { setBusy(false); }
  }

  if (!billingAvailable) return <P>A assinatura pelo app está disponível na versão instalada pela Google Play.</P>;
  if (offers === null) return <P dim>Carregando planos…</P>;
  if (!offers.length) return <P>Os planos não estão disponíveis agora. Tente novamente em instantes.</P>;
  return <View style={{ gap: 10 }}>
    {offers.map((offer) => <Pressable key={offer.id} onPress={() => setSelected(offer.id)} style={{ borderWidth: 1.5, borderColor: selected === offer.id ? C.gold : C.line, borderRadius: 16, padding: 14, gap: 2 }}>
      <Text style={{ fontFamily: F.black, fontSize: 18, color: C.goldSoft }}>{offer.price}</Text>
      <Text style={{ fontFamily: F.body, fontSize: 13, color: C.ink2 }}>{offer.title}</Text>
    </Pressable>)}
    <Button label="Assinar Premium" onPress={buy} busy={busy}/>
    <Button kind="ghost" label="Restaurar compras" onPress={restorePurchases} disabled={busy}/>
    <Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3, lineHeight: 18 }}>Sem promessas financeiras: o Premium libera mais ferramentas de autoconhecimento. A assinatura renova sozinha e pode ser cancelada a qualquer momento na Google Play.</Text>
  </View>;
}

export function PremiumScreen() {
  const { isPremium, onTrial, trialEndsAt, profile } = useApp();
  return <Screen>
    <Eyebrow>Premium</Eyebrow>
    <H1>{isPremium ? "Seu Premium está ativo." : "Quer ir além do diagnóstico?"}</H1>
    {onTrial && trialEndsAt && <P>{`Seu teste grátis vai até ${new Date(trialEndsAt).toLocaleDateString("pt-BR")}.`}</P>}
    {profile.plan === "premium" && <P>Obrigado por apoiar a sua jornada.</P>}
    <Card><Features/></Card>
    {profile.plan !== "premium" && <Card><H2>Assine o Premium</H2><Offers reason="premium_card"/></Card>}
  </Screen>;
}

export function Locked({ view, onDiagnostic }: { view: TabView; onDiagnostic: () => void }) {
  const copy = LOCKED_COPY[view] ?? { title: "Essa área", text: "Todos os recursos do Veias da Sintonia." };
  return <Screen>
    <Card style={{ alignItems: "center" }}>
      <LockKeyhole size={32} color={C.gold}/>
      <H2>{`${copy.title} é Premium`}</H2>
      <P>{copy.text}</P>
      <Button kind="ghost" label="Fazer meu diagnóstico grátis" onPress={onDiagnostic}/>
    </Card>
    <Card><H2>Tudo o que o Premium libera</H2><Features/><Gap n={6}/><Offers reason={`locked_${view}`}/></Card>
  </Screen>;
}

export function PaywallModal() {
  const { paywall, closePaywall } = useApp();
  if (!paywall) return null;
  return <Modal animationType="slide" onRequestClose={closePaywall}>
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, gap: 16 }}>
        <Pressable onPress={closePaywall} accessibilityLabel="Fechar" style={{ alignSelf: "flex-end", padding: 6 }}><X color={C.ink2}/></Pressable>
        <H1>{PAYWALL_HEADLINE[paywall] ?? "Destrave a jornada completa"}</H1>
        <Card><Features/></Card>
        <Card><Offers reason={paywall}/></Card>
      </ScrollView>
    </View>
  </Modal>;
}
