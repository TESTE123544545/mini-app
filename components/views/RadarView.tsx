"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Clock3, Copy, Radar, RefreshCw, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { capacity, difficultyWord, hourValue, hoursAdvanced, hoursLabel, mid, money, moneyRange, monthProfit, profitPerSale, salesNeeded, scaleWord, scenarios, speedWord } from "@/lib/radar/math";
import { radarSignNote } from "@/lib/radar/sign";
import { EMPTY_ANSWERS, SELL_MODELS, SOCIALS, VISIBILITY, type BoostPlan, type OfferKit, type RadarAnswers, type RadarReport, type ScoredOpportunity, type SellPlan } from "@/lib/radar/types";

type Props = { sign: string; openPaywall: (reason: string) => void };
type Stage = "loading" | "intro" | "form" | "analyzing" | "results" | "detail";
type Tab = "visao" | "simulador" | "vender" | "oferta" | "caminho" | "mais";

async function call<T>(body: unknown): Promise<T> {
  const response = await fetch("/api/radar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Não foi possível usar o Radar agora.");
  return data;
}

const FORM_STEPS = ["Você", "Seu tempo e recursos", "Seu jeito de vender", "Seu lugar"] as const;
const numberOrNull = (value: string) => (value.trim() === "" || Number.isNaN(Number(value)) ? null : Number(value));

function Ring({ value }: { value: number }) {
  const radius = 26, circumference = 2 * Math.PI * radius;
  return <svg className="radar-ring" viewBox="0 0 64 64" role="img" aria-label={`Compatibilidade ${value} de 100`}>
    <circle cx="32" cy="32" r={radius} className="radar-ring__track"/>
    <circle cx="32" cy="32" r={radius} className="radar-ring__fill" strokeDasharray={`${(value / 100) * circumference} ${circumference}`} transform="rotate(-90 32 32)"/>
    <text x="32" y="37" textAnchor="middle">{value}</text>
  </svg>;
}

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="radar-copy" onClick={() => { void navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); }}>{done ? <Check size={14}/> : <Copy size={14}/>} {done ? "Copiado" : label}</button>;
}

export function RadarView({ sign, openPaywall }: Props) {
  const [stage, setStage] = useState<Stage>("loading");
  const [answers, setAnswers] = useState<RadarAnswers>(EMPTY_ANSWERS);
  const [report, setReport] = useState<RadarReport | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [perHour, setPerHour] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/radar").then(async (response) => {
      if (response.status === 402) { openPaywall("radar"); return null; }
      return response.ok ? await response.json() as { report: RadarReport | null } : null;
    }).then((data) => {
      if (!live) return;
      if (data?.report) { setReport(data.report); setAnswers(data.report.answers); setPerHour(hourValue(data.report.answers)); setStage("results"); } else setStage("intro");
    }).catch(() => live && setStage("intro"));
    return () => { live = false; };
  // Runs once on mount: the parent recreates openPaywall on every render, which must not reload (and reset) the screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = useCallback((change: Partial<RadarAnswers>) => setAnswers((current) => ({ ...current, ...change })), []);
  const note = useMemo(() => radarSignNote(sign), [sign]);

  async function run() {
    setStage("analyzing"); setError("");
    track("radar_analyze_started");
    try {
      const { report: fresh } = await call<{ report: RadarReport }>({ action: "analyze", answers });
      setReport(fresh); setPerHour(hourValue(answers)); setSelected(null); setStage("results");
      track("radar_analyze_done", { source: fresh.result.source });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível analisar agora.");
      setStage("form");
    }
  }

  if (stage === "loading") return <div className="view-stack"><div className="live-skeleton" aria-busy="true" aria-label="Carregando o Radar"><span/><span/><span/></div></div>;

  if (stage === "intro") return <div className="view-stack radar">
    <section className="surface-card radar-hero">
      <span className="radar-hero__icon" aria-hidden="true"><Radar/></span>
      <p className="eyebrow">Exclusivo Premium</p>
      <h2>Radar da Prosperidade</h2>
      <p className="radar-lede">Descubra como transformar aquilo que você gosta de fazer em oportunidades reais de renda.</p>
      <p>Conte um pouco sobre você. O Radar vai analisar suas habilidades, interesses, recursos e objetivos para encontrar formas de transformar seu conhecimento e seu tempo em oportunidades de venda.</p>
      <blockquote className="radar-quote">Sua vida tem horas limitadas. O objetivo não é apenas ganhar dinheiro, mas transformar dinheiro em horas da sua vida que você não precisará trocar novamente por trabalho.</blockquote>
      <button type="button" className="gold-button" onClick={() => { track("radar_started"); setStage("form"); }}>Começar meu Radar</button>
      <p className="disclaimer">Os valores são projeções e dependem de execução, mercado, localização, concorrência e capacidade de vendas. Não há promessa de renda.</p>
    </section>
  </div>;

  if (stage === "analyzing") return <div className="view-stack radar"><section className="surface-card radar-scan" aria-busy="true">
    <div className="radar-sweep" aria-hidden="true"><i/><i/><i/></div>
    <p className="eyebrow">Radar da Prosperidade</p>
    <h2>Procurando oportunidades para você…</h2>
    <p>Estamos cruzando o que você gosta de fazer, o seu tempo e o que você tem em mãos. Isso leva de 30 segundos a 1 minuto.</p>
  </section></div>;

  if (stage === "form") {
    const last = step === FORM_STEPS.length - 1;
    const ready = answers.likes.trim().length > 2 && answers.skills.trim().length > 2 && answers.monthlyGoal > 0 && answers.hoursPerDay > 0;
    return <div className="view-stack radar">
      <section className="surface-card radar-form">
        <p className="eyebrow">{`Passo ${step + 1} de ${FORM_STEPS.length} · ${FORM_STEPS[step]}`}</p>
        <div className="radar-steps" aria-hidden="true">{FORM_STEPS.map((item, index) => <i key={item} className={index <= step ? "on" : ""}/>)}</div>
        {error && <p className="radar-error" role="alert">{error}</p>}
        {step === 0 && <>
          <label>O que você gosta de fazer?<textarea rows={2} maxLength={600} value={answers.likes} onChange={(event) => patch({ likes: event.target.value })} placeholder="Ex.: desenhar, cozinhar, organizar coisas, conversar com pessoas…"/></label>
          <label>Quais assuntos você domina?<textarea rows={2} maxLength={600} value={answers.topics} onChange={(event) => patch({ topics: event.target.value })} placeholder="Ex.: finanças básicas, maquiagem, inglês, jardinagem…"/></label>
          <label>Quais habilidades você possui?<textarea rows={2} maxLength={600} value={answers.skills} onChange={(event) => patch({ skills: event.target.value })} placeholder="Ex.: edito vídeos no celular, escrevo bem, sei costurar…"/></label>
          <label>O que as pessoas costumam pedir sua ajuda para fazer?<textarea rows={2} maxLength={600} value={answers.helpWith} onChange={(event) => patch({ helpWith: event.target.value })} placeholder="Ex.: arrumar currículo, montar planilha, escolher presentes…"/></label>
        </>}
        {step === 1 && <>
          <label>Quanto tempo você tem disponível por dia? <b>{answers.hoursPerDay.toString().replace(".", ",")} h</b>
            <input type="range" min={0.5} max={10} step={0.5} value={answers.hoursPerDay} onChange={(event) => patch({ hoursPerDay: Number(event.target.value) })}/></label>
          <label>Quanto dinheiro você pode investir inicialmente? (R$)<input type="number" inputMode="numeric" min={0} value={answers.investment} onChange={(event) => patch({ investment: Math.max(0, Number(event.target.value) || 0) })}/></label>
          <label>Quanto gostaria de ganhar por mês? (R$)<input type="number" inputMode="numeric" min={0} value={answers.monthlyGoal} onChange={(event) => patch({ monthlyGoal: Math.max(0, Number(event.target.value) || 0) })}/></label>
          <label>Quais equipamentos você possui?<textarea rows={2} maxLength={400} value={answers.equipment} onChange={(event) => patch({ equipment: event.target.value })} placeholder="Ex.: celular, notebook, impressora, máquina de costura, bicicleta…"/></label>
        </>}
        {step === 2 && <>
          <fieldset><legend>Você prefere:</legend><div className="choice-grid">{SELL_MODELS.map(([value, label]) => <button type="button" key={value} className={answers.model === value ? "selected" : ""} onClick={() => patch({ model: value })}>{label}</button>)}</div></fieldset>
          <fieldset><legend>Aparecer nas redes ou trabalhar nos bastidores?</legend><div className="choice-grid">{VISIBILITY.map(([value, label]) => <button type="button" key={value} className={answers.visibility === value ? "selected" : ""} onClick={() => patch({ visibility: value })}>{label}</button>)}</div></fieldset>
          <fieldset><legend>Você tem Instagram, TikTok, WhatsApp ou outra rede?</legend><div className="choice-grid">{SOCIALS.map((item) => <button type="button" key={item} className={answers.socials.includes(item) ? "selected" : ""} onClick={() => patch({ socials: answers.socials.includes(item) ? answers.socials.filter((current) => current !== item) : [...answers.socials, item] })}>{item}</button>)}</div></fieldset>
        </>}
        {step === 3 && <>
          <label>Sua cidade/país<input type="text" maxLength={120} value={answers.place} onChange={(event) => patch({ place: event.target.value })} placeholder="Ex.: Campinas, Brasil"/></label>
          <label>Existe algum nicho específico que gostaria de explorar? (opcional)<textarea rows={2} maxLength={300} value={answers.niche} onChange={(event) => patch({ niche: event.target.value })} placeholder="Ex.: pequenos negócios, mães, estudantes, pets…"/></label>
          <div className="radar-hourbox"><p><Clock3 size={14}/> <strong>Quanto vale a sua hora hoje?</strong> Usamos isso para mostrar quantas horas da sua vida cada venda pode adiantar. Opcional.</p>
            <label>Valor da sua hora (R$)<input type="number" inputMode="decimal" min={0} value={answers.hourValue ?? ""} onChange={(event) => patch({ hourValue: numberOrNull(event.target.value) })} placeholder="Ex.: 12"/></label>
            <p className="radar-or">ou calcule: renda mensal ÷ horas trabalhadas no mês</p>
            <div className="radar-two"><label>Renda mensal (R$)<input type="number" inputMode="numeric" min={0} value={answers.monthlyIncome ?? ""} onChange={(event) => patch({ monthlyIncome: numberOrNull(event.target.value) })}/></label>
              <label>Horas no mês<input type="number" inputMode="numeric" min={1} max={744} value={answers.monthlyHours ?? ""} onChange={(event) => patch({ monthlyHours: numberOrNull(event.target.value) })}/></label></div>
            {hourValue(answers) !== null && <p className="radar-calc">Sua hora vale hoje cerca de <strong>{money(hourValue(answers)!)}</strong>.</p>}</div>
        </>}
        <div className="radar-nav">
          {step > 0 ? <button type="button" className="ghost-button" onClick={() => setStep(step - 1)}>Voltar</button> : <button type="button" className="ghost-button" onClick={() => setStage(report ? "results" : "intro")}>Cancelar</button>}
          {last ? <button type="button" className="gold-button" disabled={!ready} onClick={run}>Encontrar oportunidades</button> : <button type="button" className="gold-button" onClick={() => setStep(step + 1)}>Continuar <ChevronRight size={16}/></button>}
        </div>
        {last && !ready && <p className="disclaimer">Preencha ao menos o que você gosta de fazer, suas habilidades e a meta mensal.</p>}
      </section>
    </div>;
  }

  if (!report) return null;
  const result = report.result;

  if (stage === "detail") {
    const opportunity = result.opportunities.find((item) => item.id === selected);
    if (opportunity) return <Detail report={report} opportunity={opportunity} perHour={perHour} setPerHour={setPerHour} onBack={() => setStage("results")} onChange={(next) => setReport(next)}/>;
  }

  const best = result.opportunities[0];
  const bestRealistic = best ? scenarios(best, answers.hoursPerDay)[1] : null;
  const bestMonth = best && bestRealistic ? monthProfit({ sales: bestRealistic.sales, price: mid(best.price), cost: mid(best.costPerSale) }).profit : 0;
  return <div className="view-stack radar">
    <section className="surface-card radar-ready">
      <p className="eyebrow">Radar da Prosperidade</p>
      <h2>Seu Radar está pronto</h2>
      <p>Encontramos oportunidades que combinam com seu perfil.</p>
      {result.source === "basic" && <p className="disclaimer">A análise inteligente não estava disponível agora, então usamos nosso catálogo de oportunidades. Tente de novo mais tarde para uma versão mais personalizada.</p>}
    </section>

    <section className="surface-card radar-insight">
      <p className="eyebrow">Se eu estivesse no seu lugar</p>
      <p>{result.insight}</p>
    </section>

    <section className="surface-card radar-hours">
      <p className="eyebrow">Horas da sua vida adiantadas</p>
      <label>Quanto vale a sua hora hoje? (R$)
        <input type="number" inputMode="decimal" min={0} value={perHour ?? ""} onChange={(event) => setPerHour(numberOrNull(event.target.value))} placeholder="Ex.: 12"/></label>
      {perHour && best ? <>
        <p className="radar-hours__big">{hoursLabel(hoursAdvanced(profitPerSale(mid(best.price), mid(best.costPerSale)), perHour))} <small>adiantadas por venda</small></p>
        <p>Com a primeira oportunidade no cenário realista ({bestRealistic?.sales} vendas, lucro estimado de {money(bestMonth)}), seriam cerca de <strong>{hoursLabel(hoursAdvanced(bestMonth, perHour))}</strong> da sua vida adiantadas por mês.</p>
        <p className="radar-emotion">Você não está apenas buscando {money(Math.max(0, bestMonth))}. Você está potencialmente adiantando {hoursLabel(hoursAdvanced(bestMonth, perHour))} da sua vida.</p>
      </> : <p>Informe o valor da sua hora (ou renda e horas, no formulário) para ver quantas horas cada venda pode adiantar.</p>}
      <p className="disclaimer">É uma representação matemática baseada no valor que você informou, não uma promessa de retorno.</p>
    </section>

    <div className="radar-list">
      {result.opportunities.map((item, index) => {
        const each = profitPerSale(mid(item.price), mid(item.costPerSale));
        return <button type="button" key={item.id} className="surface-card radar-card" onClick={() => { setSelected(item.id); setStage("detail"); track("radar_opportunity_opened", { rank: index + 1 }); }}>
          <span className="radar-card__rank">{`Oportunidade #${index + 1}`}</span>
          <span className="radar-card__head"><strong>{item.title}</strong><Ring value={item.score}/></span>
          <span className="radar-card__summary">{item.summary}</span>
          <dl className="radar-metrics">
            <div><dt>Investimento inicial</dt><dd>{moneyRange(item.setupCost)}</dd></div>
            <div><dt>Preço sugerido</dt><dd>{moneyRange(item.price)}</dd></div>
            <div><dt>Lucro por venda</dt><dd>{money(each)}</dd></div>
            <div><dt>Dificuldade</dt><dd>{difficultyWord(item.difficulty)}</dd></div>
            <div><dt>Velocidade para começar</dt><dd>{speedWord(item.speed)}</dd></div>
            <div><dt>Potencial de escala</dt><dd>{scaleWord(item.scale)}</dd></div>
            <div><dt>Potencial inicial</dt><dd>{`${item.salesPerMonth.min} a ${item.salesPerMonth.max} vendas/mês`}</dd></div>
            <div><dt>Horas adiantadas</dt><dd>{perHour ? `${hoursLabel(hoursAdvanced(each, perHour))} por venda` : "informe sua hora"}</dd></div>
          </dl>
          <span className="radar-card__go">Ver oportunidade <ChevronRight size={16}/></span>
        </button>;
      })}
    </div>

    {note && <section className="surface-card radar-sign"><p className="eyebrow"><Sparkles size={14}/> {note.title}</p><p>{note.text}</p></section>}

    <section className="surface-card radar-philosophy">
      <p>Dinheiro é uma forma de trocar valor. A pergunta não é só “como ganhar dinheiro?”, mas “que valor eu consigo entregar para alguém e transformar em renda?” e depois “como essa renda pode me dar mais liberdade e menos dependência da troca direta do meu tempo por dinheiro?”.</p>
    </section>

    <button type="button" className="ghost-button radar-again" onClick={() => { setStep(0); setStage("form"); }}><RefreshCw size={15}/> Encontrar novas oportunidades</button>
    <p className="disclaimer">Os valores do Radar são estimativas em faixas. Resultados dependem de execução, mercado, localização, concorrência e capacidade de vendas, e não são garantidos.</p>
  </div>;
}

const TABS: [Tab, string][] = [["visao", "Visão geral"], ["simulador", "Simulador"], ["vender", "Como vender"], ["oferta", "Minha oferta"], ["caminho", "Primeira venda"], ["mais", "Ganhar mais"]];

type DetailProps = { report: RadarReport; opportunity: ScoredOpportunity; perHour: number | null; setPerHour: (value: number | null) => void; onBack: () => void; onChange: (report: RadarReport) => void };

function Detail({ report, opportunity, perHour, setPerHour, onBack, onChange }: DetailProps) {
  const [tab, setTab] = useState<Tab>("visao");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const answers = report.answers;
  const plan = report.result.plans[opportunity.id];
  const offer = report.result.offers[opportunity.id];
  const boost = report.result.boosts[opportunity.id];

  async function load(action: "detail" | "offer" | "boost") {
    setBusy(action); setError("");
    try {
      const data = await call<{ plan?: SellPlan; offer?: OfferKit; boost?: BoostPlan }>({ action, reportId: report.id, opportunityId: opportunity.id });
      const result = { ...report.result, plans: { ...report.result.plans }, offers: { ...report.result.offers }, boosts: { ...report.result.boosts } };
      if (data.plan) result.plans[opportunity.id] = data.plan;
      if (data.offer) result.offers[opportunity.id] = data.offer;
      if (data.boost) result.boosts[opportunity.id] = data.boost;
      onChange({ ...report, result });
      track("radar_piece_loaded", { action });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível gerar agora.");
    } finally { setBusy(null); }
  }

  // The plan serves two tabs: it is requested the first time either one opens.
  function pick(next: Tab) {
    setTab(next);
    if ((next === "vender" || next === "caminho") && !plan && busy === null) void load("detail");
  }

  return <div className="view-stack radar">
    <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={16}/> Voltar ao Radar</button>
    <section className="surface-card radar-detail-head">
      <p className="eyebrow">Compatibilidade {opportunity.score}/100</p>
      <h2>{opportunity.title}</h2>
      <p>{opportunity.summary}</p>
    </section>
    <div className="radar-tabs" role="tablist" aria-label="Seções da oportunidade">{TABS.map(([key, label]) => <button type="button" role="tab" key={key} aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => pick(key)}>{label}</button>)}</div>
    {error && <p className="radar-error" role="alert">{error}</p>}

    {tab === "visao" && <section className="surface-card radar-block">
      <dl className="radar-facts">
        <div><dt>O que pode ser vendido</dt><dd>{opportunity.whatToSell}</dd></div>
        <div><dt>Para quem vender</dt><dd>{opportunity.targetCustomer}</dd></div>
        <div><dt>Problema que resolve</dt><dd>{opportunity.problemSolved}</dd></div>
        <div><dt>Onde encontrar clientes</dt><dd>{opportunity.channels.join(", ")}</dd></div>
        <div><dt>Primeira oferta</dt><dd>{opportunity.firstOffer}</dd></div>
        <div><dt>Preço sugerido</dt><dd>{moneyRange(opportunity.price)}</dd></div>
        <div><dt>Custo estimado por venda</dt><dd>{moneyRange(opportunity.costPerSale)}</dd></div>
        <div><dt>Investimento inicial</dt><dd>{moneyRange(opportunity.setupCost)}</dd></div>
        <div><dt>Tempo estimado para começar</dt><dd>{`cerca de ${opportunity.daysToStart} dia${opportunity.daysToStart === 1 ? "" : "s"}`}</dd></div>
        <div><dt>Demanda e concorrência</dt><dd>{`demanda ${opportunity.demand}/5 · concorrência ${opportunity.competition}/5`}</dd></div>
      </dl>
      <h3>Riscos</h3><ul>{opportunity.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
      <h3>Recursos necessários</h3><ul>{opportunity.resources.map((resource) => <li key={resource}>{resource}</li>)}</ul>
      <p className="disclaimer">Faixas estimadas, que variam com a sua cidade, o seu preparo e o mercado.</p>
    </section>}

    {tab === "simulador" && <Simulator opportunity={opportunity} answers={answers} perHour={perHour} setPerHour={setPerHour}/>}

    {tab === "vender" && <section className="surface-card radar-block">
      {!plan ? <p aria-busy="true">{busy === "detail" ? "Montando o seu plano comercial…" : "Preparando…"}</p> : <>
        <h3>Quem compraria</h3><p>{plan.whoBuys}</p>
        <h3>O que oferecer</h3><p>{plan.whatToOffer}</p>
        <h3>Quanto cobrar</h3><p>{plan.howMuch}</p>
        <h3>Onde encontrar clientes</h3><ul>{plan.whereToFind.map((item) => <li key={item.channel}><strong>{item.channel}:</strong> {item.how}</li>)}</ul>
        <h3>Como abordar</h3><p>{plan.howToApproach}</p>
        <h3>Primeira oferta</h3><p>{plan.firstOffer}</p>
        <p className="disclaimer">Nem todo canal funciona igual para todo negócio: teste dois e mantenha o que responder melhor.</p>
      </>}
    </section>}

    {tab === "oferta" && <section className="surface-card radar-block">
      {!offer ? <>
        <p>Gere o texto da sua oferta, mensagens prontas para WhatsApp e Instagram e ideias de anúncio e conteúdo.</p>
        <button type="button" className="gold-button" disabled={busy === "offer"} onClick={() => load("offer")}>{busy === "offer" ? "Criando…" : "Criar minha oferta"}</button>
      </> : <>
        <h3>{offer.name}</h3><p>{offer.description}</p>
        <h3>Benefício principal</h3><p>{offer.mainBenefit}</p>
        <h3>Preço</h3><p>{offer.price}</p>
        <h3>Argumento de venda</h3><p>{offer.salesArgument}</p>
        <h3>Diferenciais</h3><ul>{offer.differentials.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Chamada para ação</h3><p>{offer.callToAction}</p>
        <h3>Mensagem para WhatsApp</h3><p className="radar-msg">{offer.whatsapp}</p><CopyButton text={offer.whatsapp}/>
        <h3>Mensagem para Instagram</h3><p className="radar-msg">{offer.instagram}</p><CopyButton text={offer.instagram}/>
        <h3>Ideia de anúncio</h3><p>{offer.adIdea}</p>
        <h3>Ideia de conteúdo</h3><p>{offer.contentIdea}</p>
      </>}
    </section>}

    {tab === "caminho" && <section className="surface-card radar-block">
      <p className="eyebrow">Seu caminho até a primeira venda</p>
      {!plan ? <p aria-busy="true">Montando o seu passo a passo…</p> : <>
        <ol className="radar-path">{plan.path.map((item) => <li key={item.day}><span>{`Dia ${item.day}`}</span><div><strong>{item.title}</strong><p>{item.action}</p></div></li>)}</ol>
        <p className="disclaimer">Este é um roteiro de ações, não uma previsão: a primeira venda pode levar mais ou menos tempo, e isso é normal.</p>
      </>}
    </section>}

    {tab === "mais" && <section className="surface-card radar-block">
      {!boost ? <>
        <p>Veja como aumentar o potencial desta oportunidade: preço, volume, novos produtos, upsell, recorrência, indicação, automação e escala.</p>
        <button type="button" className="gold-button" disabled={busy === "boost"} onClick={() => load("boost")}>{busy === "boost" ? "Analisando…" : "Quero ganhar mais"}</button>
      </> : <>
        <p>{boost.summary}</p>
        {boost.levers.map((item) => <div className="radar-lever" key={item.lever}><strong>{item.lever}</strong><p>{item.idea}</p><small>{item.effect}</small></div>)}
      </>}
    </section>}
  </div>;
}

function Simulator({ opportunity, answers, perHour, setPerHour }: { opportunity: ScoredOpportunity; answers: RadarAnswers; perHour: number | null; setPerHour: (value: number | null) => void }) {
  const [hours, setHours] = useState(answers.hoursPerDay);
  const [goal, setGoal] = useState(answers.monthlyGoal);
  const [price, setPrice] = useState(Math.round(mid(opportunity.price)));
  const [cost, setCost] = useState(Math.round(mid(opportunity.costPerSale)));
  const set = useMemo(() => scenarios(opportunity, hours), [opportunity, hours]);
  const [sales, setSales] = useState(set[1].sales);
  const cap = capacity(hours, opportunity.hoursPerSale);
  const { revenue, costs, profit } = monthProfit({ sales, price, cost, setup: Math.round(mid(opportunity.setupCost)) });
  const needed = salesNeeded(goal, price, cost);
  return <section className="surface-card radar-block radar-sim">
    <div className="radar-scenarios" role="group" aria-label="Cenários">{set.map((item) => <button type="button" key={item.key} className={sales === item.sales ? "active" : ""} onClick={() => setSales(item.sales)}><strong>{item.label}</strong><small>{item.sales} vendas</small></button>)}</div>
    <p className="disclaimer">{set.find((item) => item.sales === sales)?.note ?? "Valores que você ajustou."}</p>
    <div className="radar-two">
      <label>Vendas no mês<input type="number" inputMode="numeric" min={0} max={500} value={sales} onChange={(event) => setSales(Math.max(0, Number(event.target.value) || 0))}/></label>
      <label>Preço (R$)<input type="number" inputMode="decimal" min={0} value={price} onChange={(event) => setPrice(Math.max(0, Number(event.target.value) || 0))}/></label>
      <label>Custo por venda (R$)<input type="number" inputMode="decimal" min={0} value={cost} onChange={(event) => setCost(Math.max(0, Number(event.target.value) || 0))}/></label>
      <label>Horas por dia<input type="number" inputMode="decimal" min={0.25} max={16} step={0.25} value={hours} onChange={(event) => setHours(Math.max(0.25, Number(event.target.value) || 0.25))}/></label>
      <label>Meta mensal (R$)<input type="number" inputMode="numeric" min={0} value={goal} onChange={(event) => setGoal(Math.max(0, Number(event.target.value) || 0))}/></label>
      <label>Valor da sua hora (R$)<input type="number" inputMode="decimal" min={0} value={perHour ?? ""} onChange={(event) => setPerHour(numberOrNull(event.target.value))}/></label>
    </div>
    <div className="radar-equation">
      <div><span>Faturamento estimado</span><strong>{money(revenue)}</strong></div>
      <div><span>− Custos estimados</span><strong>{money(costs)}</strong><small>inclui o investimento inicial de {money(mid(opportunity.setupCost))}, que só pesa no 1º mês</small></div>
      <div className={profit < 0 ? "neg" : "pos"}><span>= Lucro estimado</span><strong>{money(profit)}</strong></div>
      <div><span>÷ Valor da hora = horas adiantadas</span><strong>{perHour ? hoursLabel(hoursAdvanced(profit, perHour)) : "informe sua hora"}</strong></div>
    </div>
    {sales > cap && <p className="radar-warn">Com {hours.toString().replace(".", ",")} h por dia e cerca de {hoursLabel(opportunity.hoursPerSale)} por venda, o seu tempo comporta uns {cap} vendas por mês. Acima disso, seria preciso mais horas ou ajuda.</p>}
    {needed !== null && <p>Para chegar a {money(goal)} por mês, com lucro de {money(profitPerSale(price, cost))} por venda, seriam necessárias cerca de <strong>{needed} vendas</strong>.</p>}
    {perHour && profit > 0 && <p className="radar-emotion">Você não está apenas buscando {money(profit)}. Você está potencialmente adiantando {hoursLabel(hoursAdvanced(profit, perHour))} da sua vida.</p>}
    <p className="disclaimer">Simulação com números que você pode alterar. O cenário ambicioso não é o mais provável e nada aqui é garantido.</p>
  </section>;
}
