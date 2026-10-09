import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { ArrowLeft, ChevronRight, Copy, Radar as RadarIcon, RefreshCw, Sparkles } from "lucide-react-native";
import { capacity, difficultyWord, hourValue, hoursAdvanced, hoursLabel, mid, money, moneyRange, monthProfit, profitPerSale, salesNeeded, scaleWord, scenarios, speedWord } from "@/lib/radar/math";
import { radarSignNote } from "@/lib/radar/sign";
import { EMPTY_ANSWERS, SELL_MODELS, SOCIALS, VISIBILITY, type BoostPlan, type OfferKit, type RadarAnswers, type RadarReport, type ScoredOpportunity, type SellPlan } from "@/lib/radar/types";
import { api, ApiError } from "../api";
import { useApp } from "../store";
import { Bar, Button, Card, Chip, Eyebrow, Field, Gap, H1, H2, H3, P, Screen, Segmented } from "../ui";
import { Block } from "./Signals";
import { C, F } from "../theme";

type Stage = "loading" | "intro" | "form" | "analyzing" | "results" | "detail";
type Tab = "visao" | "simulador" | "vender" | "oferta" | "caminho" | "mais";

const FORM_STEPS = ["Você", "Seu tempo e recursos", "Seu jeito de vender", "Seu lugar"] as const;
const num = (text: string) => (text.trim() === "" || Number.isNaN(Number(text.replace(",", "."))) ? null : Number(text.replace(",", ".")));
const run = <T,>(body: unknown) => api<T>("/api/radar", { method: "POST", body });

function Copyable({ text }: { text: string }) {
  // The system share sheet: copy it, or send it straight to WhatsApp or Instagram.
  return <Pressable onPress={() => { void Share.share({ message: text }); }} style={{ alignSelf: "flex-start", flexDirection: "row", gap: 6, alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
    <Copy size={14} color={C.gold}/><Text style={{ fontFamily: F.bold, fontSize: 12, color: C.ink2 }}>Copiar ou enviar</Text>
  </Pressable>;
}

const NumberField = ({ label, value, onChange, placeholder }: { label: string; value: number | null; onChange: (value: number | null) => void; placeholder?: string }) =>
  <Field label={label} keyboardType="decimal-pad" value={value === null ? "" : String(value)} onChangeText={(text) => onChange(num(text))} placeholder={placeholder}/>;

function Score({ value }: { value: number }) {
  return <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: C.goldDeep, alignItems: "center", justifyContent: "center", opacity: 0.55 + value / 220 }}>
    <Text style={{ fontFamily: F.black, fontSize: 19, color: C.goldSoft }}>{value}</Text>
  </View>;
}

export function RadarScreen({ go }: { go: (view: "home") => void }) {
  const { profile, openPaywall } = useApp();
  const [stage, setStage] = useState<Stage>("loading");
  const [answers, setAnswers] = useState<RadarAnswers>(EMPTY_ANSWERS);
  const [report, setReport] = useState<RadarReport | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [perHour, setPerHour] = useState<number | null>(null);
  const note = useMemo(() => radarSignNote(profile.sign), [profile.sign]);
  const patch = (change: Partial<RadarAnswers>) => setAnswers((current) => ({ ...current, ...change }));

  useEffect(() => {
    let live = true;
    api<{ report: RadarReport | null }>("/api/radar").then((data) => {
      if (!live) return;
      if (data.report) { setReport(data.report); setAnswers(data.report.answers); setPerHour(hourValue(data.report.answers)); setStage("results"); } else setStage("intro");
    }).catch((reason) => { if (live) { if (reason instanceof ApiError && reason.status === 402) openPaywall("radar"); setStage("intro"); } });
    return () => { live = false; };
  }, [openPaywall]);

  async function analyze() {
    setStage("analyzing"); setError("");
    try {
      const { report: fresh } = await run<{ report: RadarReport }>({ action: "analyze", answers });
      setReport(fresh); setPerHour(hourValue(answers)); setSelected(null); setStage("results");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível analisar agora."); setStage("form"); }
  }

  if (stage === "loading") return <Screen><P dim>Abrindo o Radar…</P></Screen>;

  if (stage === "intro") return <Screen>
    <Pressable onPress={() => go("home")}><Text style={{ color: C.gold, fontFamily: F.bold }}>← Voltar</Text></Pressable>
    <Card style={{ alignItems: "center" }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}><RadarIcon size={30} color={C.gold}/></View>
      <Eyebrow>Exclusivo Premium</Eyebrow>
      <H1>Radar da Prosperidade</H1>
      <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.ink, textAlign: "center" }}>Descubra como transformar aquilo que você gosta de fazer em oportunidades reais de renda.</Text>
      <P>Conte um pouco sobre você. O Radar vai analisar suas habilidades, interesses, recursos e objetivos para encontrar formas de transformar seu conhecimento e seu tempo em oportunidades de venda.</P>
      <View style={{ borderLeftWidth: 2, borderLeftColor: C.goldDeep, paddingLeft: 12 }}><Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.ink2, lineHeight: 22 }}>Sua vida tem horas limitadas. O objetivo não é apenas ganhar dinheiro, mas transformar dinheiro em horas da sua vida que você não precisará trocar novamente por trabalho.</Text></View>
      <Button label="Começar meu Radar" onPress={() => setStage("form")}/>
      <P dim>Os valores são projeções e dependem de execução, mercado, localização, concorrência e capacidade de vendas. Não há promessa de renda.</P>
    </Card>
  </Screen>;

  if (stage === "analyzing") return <Screen scroll={false}><View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 }}>
    <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}><View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: C.gold, opacity: 0.7 }}/></View>
    <Eyebrow>Radar da Prosperidade</Eyebrow>
    <H2>Procurando oportunidades para você…</H2>
    <P>Estamos cruzando o que você gosta de fazer, o seu tempo e o que você tem em mãos. Isso leva de 30 segundos a 1 minuto.</P>
  </View></Screen>;

  if (stage === "form") {
    const last = step === FORM_STEPS.length - 1;
    const ready = answers.likes.trim().length > 2 && answers.skills.trim().length > 2 && answers.monthlyGoal > 0 && answers.hoursPerDay > 0;
    return <Screen>
      <Card>
        <Eyebrow>{`Passo ${step + 1} de ${FORM_STEPS.length} · ${FORM_STEPS[step]}`}</Eyebrow>
        <Bar value={step + 1} max={FORM_STEPS.length}/>
        {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}
        {step === 0 && <>
          <Field label="O que você gosta de fazer?" multiline value={answers.likes} onChangeText={(text) => patch({ likes: text })} maxLength={600} placeholder="Ex.: desenhar, cozinhar, organizar coisas…"/>
          <Field label="Quais assuntos você domina?" multiline value={answers.topics} onChangeText={(text) => patch({ topics: text })} maxLength={600} placeholder="Ex.: finanças básicas, maquiagem, inglês…"/>
          <Field label="Quais habilidades você possui?" multiline value={answers.skills} onChangeText={(text) => patch({ skills: text })} maxLength={600} placeholder="Ex.: edito vídeos no celular, escrevo bem…"/>
          <Field label="O que as pessoas costumam pedir sua ajuda para fazer?" multiline value={answers.helpWith} onChangeText={(text) => patch({ helpWith: text })} maxLength={600} placeholder="Ex.: arrumar currículo, montar planilha…"/>
        </>}
        {step === 1 && <>
          <H3>{`Tempo disponível por dia: ${String(answers.hoursPerDay).replace(".", ",")} h`}</H3>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{[0.5, 1, 2, 3, 4, 6, 8].map((hours) => <Chip key={hours} label={`${String(hours).replace(".", ",")} h`} on={answers.hoursPerDay === hours} onPress={() => patch({ hoursPerDay: hours })}/>)}</View>
          <NumberField label="Quanto você pode investir inicialmente? (R$)" value={answers.investment} onChange={(value) => patch({ investment: Math.max(0, value ?? 0) })}/>
          <NumberField label="Quanto gostaria de ganhar por mês? (R$)" value={answers.monthlyGoal} onChange={(value) => patch({ monthlyGoal: Math.max(0, value ?? 0) })}/>
          <Field label="Quais equipamentos você possui?" multiline value={answers.equipment} onChangeText={(text) => patch({ equipment: text })} maxLength={400} placeholder="Ex.: celular, notebook, máquina de costura…"/>
        </>}
        {step === 2 && <>
          <H3>Você prefere:</H3>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{SELL_MODELS.map(([value, label]) => <Chip key={value} label={label} on={answers.model === value} onPress={() => patch({ model: value })}/>)}</View>
          <H3>Aparecer nas redes ou ficar nos bastidores?</H3>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{VISIBILITY.map(([value, label]) => <Chip key={value} label={label} on={answers.visibility === value} onPress={() => patch({ visibility: value })}/>)}</View>
          <H3>Redes que você já tem</H3>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{SOCIALS.map((item) => <Chip key={item} label={item} on={answers.socials.includes(item)} onPress={() => patch({ socials: answers.socials.includes(item) ? answers.socials.filter((current) => current !== item) : [...answers.socials, item] })}/>)}</View>
        </>}
        {step === 3 && <>
          <Field label="Sua cidade/país" value={answers.place} onChangeText={(text) => patch({ place: text })} maxLength={120} placeholder="Ex.: Campinas, Brasil"/>
          <Field label="Algum nicho que gostaria de explorar? (opcional)" multiline value={answers.niche} onChangeText={(text) => patch({ niche: text })} maxLength={300} placeholder="Ex.: pequenos negócios, mães, pets…"/>
          <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: C.line, borderRadius: 16, padding: 14, gap: 10 }}>
            <P><Text style={{ fontFamily: F.bold, color: C.ink }}>Quanto vale a sua hora hoje? </Text>Usamos isso para mostrar quantas horas da sua vida cada venda pode adiantar. Opcional.</P>
            <NumberField label="Valor da sua hora (R$)" value={answers.hourValue} onChange={(value) => patch({ hourValue: value })} placeholder="Ex.: 12"/>
            <P dim>ou calcule: renda mensal ÷ horas trabalhadas no mês</P>
            <NumberField label="Renda mensal (R$)" value={answers.monthlyIncome} onChange={(value) => patch({ monthlyIncome: value })}/>
            <NumberField label="Horas trabalhadas no mês" value={answers.monthlyHours} onChange={(value) => patch({ monthlyHours: value })}/>
            {hourValue(answers) !== null && <P>{`Sua hora vale hoje cerca de ${money(hourValue(answers)!)}.`}</P>}
          </View>
        </>}
        <Gap n={4}/>
        {last ? <Button label="Encontrar oportunidades" onPress={analyze} disabled={!ready}/> : <Button label="Continuar" onPress={() => setStep(step + 1)}/>}
        <Button kind="ghost" label={step > 0 ? "Voltar" : "Cancelar"} onPress={() => (step > 0 ? setStep(step - 1) : setStage(report ? "results" : "intro"))}/>
        {last && !ready ? <P dim>Preencha ao menos o que você gosta de fazer, suas habilidades e a meta mensal.</P> : null}
      </Card>
    </Screen>;
  }

  if (!report) return null;
  if (stage === "detail") {
    const opportunity = report.result.opportunities.find((item) => item.id === selected);
    if (opportunity) return <Detail report={report} opportunity={opportunity} perHour={perHour} setPerHour={setPerHour} onBack={() => setStage("results")} onChange={setReport}/>;
  }

  const result = report.result;
  const best = result.opportunities[0];
  const realistic = best ? scenarios(best, answers.hoursPerDay)[1] : null;
  const bestMonth = best && realistic ? monthProfit({ sales: realistic.sales, price: mid(best.price), cost: mid(best.costPerSale) }).profit : 0;
  return <Screen>
    <Card><Eyebrow>Radar da Prosperidade</Eyebrow><H1>Seu Radar está pronto</H1><P>Encontramos oportunidades que combinam com seu perfil.</P>
      {result.source === "basic" ? <P dim>A análise inteligente não estava disponível agora, então usamos nosso catálogo de oportunidades. Tente de novo mais tarde para uma versão mais personalizada.</P> : null}</Card>
    <Card><Eyebrow>Se eu estivesse no seu lugar</Eyebrow><P>{result.insight}</P></Card>
    <Card>
      <Eyebrow>Horas da sua vida adiantadas</Eyebrow>
      <NumberField label="Quanto vale a sua hora hoje? (R$)" value={perHour} onChange={setPerHour} placeholder="Ex.: 12"/>
      {perHour && best ? <>
        <Text style={{ fontFamily: F.black, fontSize: 26, color: C.goldDeep }}>{hoursLabel(hoursAdvanced(profitPerSale(mid(best.price), mid(best.costPerSale)), perHour))}<Text style={{ fontFamily: F.body, fontSize: 13, color: C.ink3 }}> adiantadas por venda</Text></Text>
        <P>{`Com a primeira oportunidade no cenário realista (${realistic?.sales} vendas, lucro estimado de ${money(bestMonth)}), seriam cerca de ${hoursLabel(hoursAdvanced(bestMonth, perHour))} da sua vida adiantadas por mês.`}</P>
        <Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.ink, lineHeight: 22 }}>{`Você não está apenas buscando ${money(Math.max(0, bestMonth))}. Você está potencialmente adiantando ${hoursLabel(hoursAdvanced(bestMonth, perHour))} da sua vida.`}</Text>
      </> : <P>Informe o valor da sua hora para ver quantas horas cada venda pode adiantar.</P>}
      <P dim>É uma representação matemática baseada no valor que você informou, não uma promessa de retorno.</P>
    </Card>
    {result.opportunities.map((item, index) => {
      const each = profitPerSale(mid(item.price), mid(item.costPerSale));
      return <Pressable key={item.id} onPress={() => { setSelected(item.id); setStage("detail"); }}><Card>
        <Text style={{ fontFamily: F.black, fontSize: 11, letterSpacing: 1.4, color: C.gold }}>{`OPORTUNIDADE #${index + 1}`}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><Text style={{ flex: 1, fontFamily: F.display, fontSize: 18, lineHeight: 24, color: C.goldSoft }}>{item.title}</Text><Score value={item.score}/></View>
        <P>{item.summary}</P>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {([["Investimento inicial", moneyRange(item.setupCost)], ["Preço sugerido", moneyRange(item.price)], ["Lucro por venda", money(each)], ["Dificuldade", difficultyWord(item.difficulty)], ["Velocidade para começar", speedWord(item.speed)], ["Potencial de escala", scaleWord(item.scale)], ["Potencial inicial", `${item.salesPerMonth.min} a ${item.salesPerMonth.max} vendas/mês`], ["Horas adiantadas", perHour ? `${hoursLabel(hoursAdvanced(each, perHour))} por venda` : "informe sua hora"]] as const).map(([label, value]) =>
            <View key={label} style={{ width: "48%", borderWidth: 1, borderColor: C.lineSoft, borderRadius: 12, padding: 10, gap: 2 }}><Text style={{ fontFamily: F.body, fontSize: 11, color: C.ink3 }}>{label}</Text><Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>{value}</Text></View>)}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ fontFamily: F.black, color: C.gold }}>Ver oportunidade</Text><ChevronRight size={16} color={C.gold}/></View>
      </Card></Pressable>;
    })}
    {note ? <Card><View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Sparkles size={14} color={C.gold}/><Eyebrow>{note.title}</Eyebrow></View><P>{note.text}</P></Card> : null}
    <Card><Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.ink2, lineHeight: 22 }}>Dinheiro é uma forma de trocar valor. A pergunta não é só “como ganhar dinheiro?”, mas “que valor eu consigo entregar para alguém e transformar em renda?” e depois “como essa renda pode me dar mais liberdade e menos dependência da troca direta do meu tempo por dinheiro?”.</Text></Card>
    <Button kind="ghost" icon={<RefreshCw size={15} color={C.gold}/>} label="Encontrar novas oportunidades" onPress={() => { setStep(0); setStage("form"); }}/>
    <P dim>Os valores do Radar são estimativas em faixas. Resultados dependem de execução, mercado, localização, concorrência e capacidade de vendas, e não são garantidos.</P>
  </Screen>;
}

function Detail({ report, opportunity, perHour, setPerHour, onBack, onChange }: { report: RadarReport; opportunity: ScoredOpportunity; perHour: number | null; setPerHour: (value: number | null) => void; onBack: () => void; onChange: (report: RadarReport) => void }) {
  const [tab, setTab] = useState<Tab>("visao");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const plan = report.result.plans[opportunity.id];
  const offer = report.result.offers[opportunity.id];
  const boost = report.result.boosts[opportunity.id];

  async function load(action: "detail" | "offer" | "boost") {
    setBusy(action); setError("");
    try {
      const data = await run<{ plan?: SellPlan; offer?: OfferKit; boost?: BoostPlan }>({ action, reportId: report.id, opportunityId: opportunity.id });
      const result = { ...report.result, plans: { ...report.result.plans }, offers: { ...report.result.offers }, boosts: { ...report.result.boosts } };
      if (data.plan) result.plans[opportunity.id] = data.plan;
      if (data.offer) result.offers[opportunity.id] = data.offer;
      if (data.boost) result.boosts[opportunity.id] = data.boost;
      onChange({ ...report, result });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível gerar agora."); }
    finally { setBusy(null); }
  }
  function pick(next: Tab) {
    setTab(next);
    if ((next === "vender" || next === "caminho") && !plan && busy === null) void load("detail");
  }

  return <Screen>
    <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><ArrowLeft size={16} color={C.gold}/><Text style={{ color: C.gold, fontFamily: F.bold }}>Voltar ao Radar</Text></Pressable>
    <Card><Eyebrow>{`Compatibilidade ${opportunity.score}/100`}</Eyebrow><H2>{opportunity.title}</H2><P>{opportunity.summary}</P></Card>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
      {([["visao", "Visão geral"], ["simulador", "Simulador"], ["vender", "Como vender"], ["oferta", "Minha oferta"], ["caminho", "Primeira venda"], ["mais", "Ganhar mais"]] as [Tab, string][]).map(([key, label]) => <Chip key={key} label={label} on={tab === key} onPress={() => pick(key)}/>)}
    </ScrollView>
    {error ? <Text style={{ color: C.danger, fontFamily: F.bold }}>{error}</Text> : null}

    {tab === "visao" && <Card>
      <Block title="O que pode ser vendido" text={opportunity.whatToSell}/>
      <Block title="Para quem vender" text={opportunity.targetCustomer}/>
      <Block title="Problema que resolve" text={opportunity.problemSolved}/>
      <Block title="Onde encontrar clientes" text={opportunity.channels.join(", ")}/>
      <Block title="Primeira oferta" text={opportunity.firstOffer}/>
      <Block title="Preço sugerido" text={moneyRange(opportunity.price)}/>
      <Block title="Custo estimado por venda" text={moneyRange(opportunity.costPerSale)}/>
      <Block title="Investimento inicial" text={moneyRange(opportunity.setupCost)}/>
      <Block title="Tempo estimado para começar" text={`cerca de ${opportunity.daysToStart} dia${opportunity.daysToStart === 1 ? "" : "s"}`}/>
      <Block title="Demanda e concorrência" text={`demanda ${opportunity.demand}/5 · concorrência ${opportunity.competition}/5`}/>
      <Block title="Riscos" text={opportunity.risks.map((risk) => `• ${risk}`).join("\n")}/>
      <Block title="Recursos necessários" text={opportunity.resources.map((resource) => `• ${resource}`).join("\n")}/>
      <P dim>Faixas estimadas, que variam com a sua cidade, o seu preparo e o mercado.</P>
    </Card>}

    {tab === "simulador" && <Simulator opportunity={opportunity} answers={report.answers} perHour={perHour} setPerHour={setPerHour}/>}

    {tab === "vender" && <Card>{!plan ? <P dim>Montando o seu plano comercial…</P> : <>
      <Block title="Quem compraria" text={plan.whoBuys}/>
      <Block title="O que oferecer" text={plan.whatToOffer}/>
      <Block title="Quanto cobrar" text={plan.howMuch}/>
      <Block title="Onde encontrar clientes" text={plan.whereToFind.map((item) => `• ${item.channel}: ${item.how}`).join("\n")}/>
      <Block title="Como abordar" text={plan.howToApproach}/>
      <Block title="Primeira oferta" text={plan.firstOffer}/>
      <P dim>Nem todo canal funciona igual para todo negócio: teste dois e mantenha o que responder melhor.</P>
    </>}</Card>}

    {tab === "oferta" && <Card>{!offer ? <>
      <P>Gere o texto da sua oferta, mensagens prontas para WhatsApp e Instagram e ideias de anúncio e conteúdo.</P>
      <Button label="Criar minha oferta" busy={busy === "offer"} onPress={() => load("offer")}/>
    </> : <>
      <H2>{offer.name}</H2><P>{offer.description}</P>
      <Block title="Benefício principal" text={offer.mainBenefit}/>
      <Block title="Preço" text={offer.price}/>
      <Block title="Argumento de venda" text={offer.salesArgument}/>
      <Block title="Diferenciais" text={offer.differentials.map((item) => `• ${item}`).join("\n")}/>
      <Block title="Chamada para ação" text={offer.callToAction}/>
      <Block title="Mensagem para WhatsApp" text={offer.whatsapp}/><Copyable text={offer.whatsapp}/>
      <Block title="Mensagem para Instagram" text={offer.instagram}/><Copyable text={offer.instagram}/>
      <Block title="Ideia de anúncio" text={offer.adIdea}/>
      <Block title="Ideia de conteúdo" text={offer.contentIdea}/>
    </>}</Card>}

    {tab === "caminho" && <Card>
      <Eyebrow>Seu caminho até a primeira venda</Eyebrow>
      {!plan ? <P dim>Montando o seu passo a passo…</P> : <>
        {plan.path.map((item) => <Block key={item.day} title={`Dia ${item.day} · ${item.title}`} text={item.action}/>)}
        <P dim>Este é um roteiro de ações, não uma previsão: a primeira venda pode levar mais ou menos tempo, e isso é normal.</P>
      </>}
    </Card>}

    {tab === "mais" && <Card>{!boost ? <>
      <P>Veja como aumentar o potencial desta oportunidade: preço, volume, novos produtos, upsell, recorrência, indicação, automação e escala.</P>
      <Button label="Quero ganhar mais" busy={busy === "boost"} onPress={() => load("boost")}/>
    </> : <>
      <P>{boost.summary}</P>
      {boost.levers.map((item) => <Block key={item.lever} title={item.lever} text={`${item.idea}\n${item.effect}`}/>)}
    </>}</Card>}
  </Screen>;
}

function Simulator({ opportunity, answers, perHour, setPerHour }: { opportunity: ScoredOpportunity; answers: RadarAnswers; perHour: number | null; setPerHour: (value: number | null) => void }) {
  const [hours, setHours] = useState<number | null>(answers.hoursPerDay);
  const [goal, setGoal] = useState<number | null>(answers.monthlyGoal);
  const [price, setPrice] = useState<number | null>(Math.round(mid(opportunity.price)));
  const [cost, setCost] = useState<number | null>(Math.round(mid(opportunity.costPerSale)));
  const set = useMemo(() => scenarios(opportunity, hours ?? answers.hoursPerDay), [opportunity, hours, answers.hoursPerDay]);
  const [sales, setSales] = useState<number | null>(set[1].sales);
  const cap = capacity(hours ?? 0.25, opportunity.hoursPerSale);
  const { revenue, costs, profit } = monthProfit({ sales: sales ?? 0, price: price ?? 0, cost: cost ?? 0, setup: Math.round(mid(opportunity.setupCost)) });
  const needed = salesNeeded(goal ?? 0, price ?? 0, cost ?? 0);
  return <Card>
    <Segmented value={String(sales)} onChange={(value) => setSales(Number(value))} options={set.map((item): [string, string] => [String(item.sales), `${item.label}\n${item.sales}`])}/>
    <P dim>{set.find((item) => item.sales === sales)?.note ?? "Valores que você ajustou."}</P>
    <NumberField label="Vendas no mês" value={sales} onChange={setSales}/>
    <NumberField label="Preço (R$)" value={price} onChange={setPrice}/>
    <NumberField label="Custo por venda (R$)" value={cost} onChange={setCost}/>
    <NumberField label="Horas por dia" value={hours} onChange={setHours}/>
    <NumberField label="Meta mensal (R$)" value={goal} onChange={setGoal}/>
    <NumberField label="Valor da sua hora (R$)" value={perHour} onChange={setPerHour}/>
    <View style={{ gap: 8, marginTop: 6 }}>
      {([["Faturamento estimado", money(revenue)], ["− Custos estimados", money(costs)], ["= Lucro estimado", money(profit)], ["÷ Valor da hora = horas adiantadas", perHour ? hoursLabel(hoursAdvanced(profit, perHour)) : "informe sua hora"]] as const).map(([label, value]) =>
        <View key={label} style={{ borderWidth: 1, borderColor: C.lineSoft, borderRadius: 12, padding: 12 }}><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{label}</Text><Text style={{ fontFamily: F.black, fontSize: 19, color: label.startsWith("=") ? (profit < 0 ? C.danger : C.goldDeep) : C.ink }}>{value}</Text></View>)}
      <P dim>{`O custo inclui o investimento inicial de ${money(mid(opportunity.setupCost))}, que só pesa no 1º mês.`}</P>
    </View>
    {(sales ?? 0) > cap ? <P>{`Com ${String(hours).replace(".", ",")} h por dia e cerca de ${hoursLabel(opportunity.hoursPerSale)} por venda, o seu tempo comporta uns ${cap} vendas por mês. Acima disso, seria preciso mais horas ou ajuda.`}</P> : null}
    {needed !== null ? <P>{`Para chegar a ${money(goal ?? 0)} por mês, com lucro de ${money(profitPerSale(price ?? 0, cost ?? 0))} por venda, seriam necessárias cerca de ${needed} vendas.`}</P> : null}
    {perHour && profit > 0 ? <Text style={{ fontFamily: F.body, fontStyle: "italic", color: C.ink, lineHeight: 22 }}>{`Você não está apenas buscando ${money(profit)}. Você está potencialmente adiantando ${hoursLabel(hoursAdvanced(profit, perHour))} da sua vida.`}</Text> : null}
    <P dim>Simulação com números que você pode alterar. O cenário ambicioso não é o mais provável e nada aqui é garantido.</P>
  </Card>;
}
