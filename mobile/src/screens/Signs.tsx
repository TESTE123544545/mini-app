import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Moon, Sparkles, Star } from "lucide-react-native";
import type { SignDaily, SignPeriod, SkyToday } from "../types";
import { SIGNS, getDailySignReading, getSignByName } from "@/lib/signs";
import { ELEMENTS_PROSPERITY, PLANETS_OF_PROSPERITY, getMoonPhase } from "@/lib/astrology";
import { MAJOR_ARCANA, WHEEL_HOUSES } from "@/lib/oracles";
import { localDayKey } from "@/lib/daily";
import { api } from "../api";
import { useApp } from "../store";
import { readJson, writeJson } from "../storage";
import { Button, Card, Chip, Eyebrow, Gap, H2, H3, P, Screen, Segmented } from "../ui";
import { Block } from "./Signals";
import { C, F } from "../theme";

type SkyPayload = { sky: SkyToday | null; sign: SignDaily | null; week: SignPeriod | null; month: SignPeriod | null };
const EMPTY: SkyPayload = { sky: null, sign: null, week: null, month: null };
const memo = new Map<string, Promise<SkyPayload>>();

function loadSky(sign: string) {
  const key = sign || "_";
  let pending = memo.get(key);
  if (!pending) {
    pending = api<SkyPayload>(`/api/sky${sign ? `?sign=${encodeURIComponent(sign)}` : ""}`).catch(() => EMPTY);
    pending.then((data) => { if (!data.sky && !data.sign) memo.delete(key); });
    memo.set(key, pending);
  }
  return pending;
}
function useSky(sign: string) {
  const [state, setState] = useState<{ key: string; data: SkyPayload | null }>({ key: "", data: null });
  useEffect(() => { let alive = true; loadSky(sign).then((data) => { if (alive) setState({ key: sign, data }); }); return () => { alive = false; }; }, [sign]);
  return state.key === sign ? state.data : null;
}

const shortDate = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const Loading = () => <P dim>Carregando…</P>;

function SignRow({ value, own, onPick }: { value: string; own: string; onPick: (name: string) => void }) {
  const ref = useRef<ScrollView>(null);
  return <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
    {SIGNS.map((item) => <Pressable key={item.id} onPress={() => onPick(item.name)} accessibilityRole="button" accessibilityState={{ selected: item.name === value }} style={{ minWidth: 76, alignItems: "center", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: item.name === value ? C.gold : C.line, backgroundColor: item.name === value ? C.card2 : "transparent" }}>
      <Text style={{ fontSize: 20, color: C.gold }}>{item.glyph}</Text>
      <Text style={{ fontFamily: F.bold, fontSize: 11, color: item.name === own ? C.gold : C.ink }}>{item.name}{item.name === own ? " ✦" : ""}</Text>
    </Pressable>)}
  </ScrollView>;
}

function Live({ go }: { go: (prompt: string) => void }) {
  const { profile } = useApp();
  const [sign, setSign] = useState(profile.sign);
  const [period, setPeriod] = useState<"dia" | "semana" | "mes">("dia");
  const data = useSky(sign);
  const sky = useSky("");
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <>
    <Card>
      <Eyebrow>Horóscopo de hoje · ao vivo</Eyebrow>
      <P dim>{today}</P>
      <SignRow value={sign} own={profile.sign} onPick={setSign}/>
      <Segmented value={period} onChange={setPeriod} options={[["dia", "Hoje"], ["semana", "Semana"], ["mes", "Mês"]]}/>
      <H2>{sign === profile.sign ? `Seu signo · ${sign}` : sign}</H2>
      {!data ? <Loading/> : period === "dia" ? (data.sign ? <View style={{ gap: 12 }}>
        <Block icon={<Sparkles size={15} color={C.gold}/>} title="Frase do dia" text={data.sign.tip}/>
        <P>{data.sign.overview}</P>
        <Block title="Trabalho e metas" text={data.sign.work}/>
        <Block title="Amor e relações" text={data.sign.relationships}/>
        <Block title="Energia e humor" text={data.sign.energy}/>
      </View> : <P>A leitura de hoje ainda está sendo preparada. Tente de novo em alguns instantes.</P>)
        : (() => { const item = period === "semana" ? data.week : data.month; return item ? <View style={{ gap: 10 }}>
          <P>{item.summary}</P>{item.focus ? <P>{item.focus}</P> : null}{item.tip ? <P><Text style={{ fontFamily: F.bold, color: C.ink }}>Conselho: </Text>{item.tip}</P> : null}
          {item.keyDates.map((k) => <Block key={`${k.date}-${k.title}`} title={`${shortDate(k.date)} · ${k.title}`} text={k.text}/>)}
        </View> : <P>A leitura deste período ainda está sendo preparada.</P>; })()}
      <P dim>Céu calculado pela CosmyDay · texto adaptado pelo Veias da Sintonia. Leitura simbólica, não uma previsão.</P>
    </Card>

    <Card>
      <H2>Como vai ser o seu dia?</H2>
      <P>A Sintonia, a IA do app, cruza o céu de hoje com o seu signo e o seu objetivo e te dá uma dica só sua.</P>
      {["Como vai ser meu dia hoje?", "O que o céu de hoje pede de mim?", "Me dá uma frase para hoje"].map((prompt) => <Button key={prompt} kind="ghost" label={prompt} onPress={() => go(prompt)}/>)}
    </Card>

    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Moon size={14} color={C.gold}/><Eyebrow>O céu agora</Eyebrow></View>
      {!sky ? <Loading/> : sky.sky ? <View style={{ gap: 10 }}>
        <H3>{`Lua em ${sky.sky.moon.sign}`}</H3>
        <P dim>{`${sky.sky.moon.phase} · ${sky.sky.moon.illumination}% iluminada`}</P>
        <P>{sky.sky.moon.text}</P>
        <H3>{sky.sky.transit.title}</H3><P>{sky.sky.transit.text}</P>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{sky.sky.planets.map((planet) => <Text key={planet.name} style={{ fontFamily: F.body, fontSize: 12, color: C.ink2, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>{`${planet.name} ${planet.sign} ${planet.degree}°${planet.retrograde ? " R" : ""}`}</Text>)}</View>
        {sky.sky.events.length > 0 && <><H3>Próximos eventos do céu</H3>{sky.sky.events.map((event) => <Block key={`${event.date}-${event.title}`} title={`${shortDate(event.date)} · ${event.title}`} text={event.meaning}/>)}</>}
      </View> : <P>O céu de hoje não está disponível agora.</P>}
    </Card>
  </>;
}

/** Once-a-day ritual (tarot card or wheel house): the draw is kept per day on this device. */
function useDailyDraw(key: string) {
  const day = localDayKey();
  const [draw, setDraw] = useState<number | null>(null);
  useEffect(() => { readJson<{ day: string; index: number }>(key).then((saved) => { if (saved?.day === day) setDraw(saved.index); }); }, [key, day]);
  return { draw, save: (index: number) => { setDraw(index); void writeJson(key, { day, index }); } };
}

function Tarot() {
  const { isPremium, openPaywall, profile } = useApp();
  const { draw, save } = useDailyDraw("vds-tarot");
  const card = draw !== null ? MAJOR_ARCANA[draw] : null;
  return <Card>
    <Eyebrow>Ritual diário · Premium</Eyebrow>
    <H2>Tarô: sua carta do dia</H2>
    <P>{`Uma carta dos 22 Arcanos Maiores por dia, lida para o seu momento de ${profile.sign}.`}</P>
    {card ? <View style={{ gap: 8 }}>
      <View style={{ alignItems: "center", borderWidth: 1, borderColor: C.gold, borderRadius: 16, padding: 18, backgroundColor: C.card2 }}>
        <Text style={{ fontFamily: F.display, fontSize: 22, color: C.gold }}>{card.roman}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 20, color: C.goldSoft }}>{card.name}</Text>
        <Text style={{ fontFamily: F.bold, color: C.ink2 }}>{card.keyword}</Text>
      </View>
      <P>{card.message}</P><P><Text style={{ fontFamily: F.bold, color: C.ink }}>Ação de hoje: </Text>{card.action}</P>
      <P dim>Leitura simbólica para reflexão, não uma previsão. Uma nova carta amanhã.</P>
    </View> : <Button label={isPremium ? "Virar a carta do dia" : "Desbloquear o Tarô"} onPress={() => { if (!isPremium) { openPaywall("tarot"); return; } save(Math.floor(Math.random() * MAJOR_ARCANA.length)); }}/>}
  </Card>;
}

function Wheel() {
  const { isPremium, openPaywall } = useApp();
  const { draw, save } = useDailyDraw("vds-wheel");
  const house = draw !== null ? WHEEL_HOUSES[draw] : null;
  return <Card>
    <Eyebrow>Ritual diário · Premium</Eyebrow>
    <H2>Roda da Fortuna</H2>
    <P>Um giro por dia aponta uma das 12 casas astrológicas: um tema, uma reflexão e uma pequena ação. Sem prêmios, sem sorte garantida.</P>
    {house ? <View style={{ gap: 8 }}>
      <View style={{ alignItems: "center", borderWidth: 1, borderColor: C.gold, borderRadius: 16, padding: 18, backgroundColor: C.card2 }}>
        <Text style={{ fontSize: 34, color: C.gold }}>{house.glyph}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 18, color: C.goldSoft }}>{`Casa ${house.house} · ${house.theme}`}</Text>
      </View>
      <P>{house.message}</P><P><Text style={{ fontFamily: F.bold, color: C.ink }}>Ação de hoje: </Text>{house.action}</P>
    </View> : <Button label={isPremium ? "Girar a roda" : "Desbloquear a Roda"} onPress={() => { if (!isPremium) { openPaywall("wheel"); return; } save(Math.floor(Math.random() * WHEEL_HOUSES.length)); }}/>}
  </Card>;
}

type Section = "financas" | "carreira" | "parcerias" | "ritual";
function Twelve() {
  const { profile } = useApp();
  const [name, setName] = useState(profile.sign);
  const [section, setSection] = useState<Section>("financas");
  const sign = useMemo(() => getSignByName(name), [name]);
  const reading = useMemo(() => getDailySignReading(sign.name, localDayKey()), [sign.name]);
  return <>
    <Card>
      <Eyebrow>{`Mensagem do dia · ${sign.name}`}</Eyebrow>
      <H3>{`Sintonia de prosperidade para ${sign.name}`}</H3>
      <Text style={{ fontFamily: F.body, fontStyle: "italic", fontSize: 16, lineHeight: 24, color: C.goldSoft }}>{`“${reading.energy}”`}</Text>
      <P><Text style={{ fontFamily: F.bold, color: C.ink }}>Foco prático hoje: </Text>{reading.action}</P>
      <View style={{ borderTopWidth: 1, borderTopColor: C.lineSoft, paddingTop: 10, gap: 4 }}><Eyebrow>Mantra de ativação</Eyebrow><P>{`“${sign.prosperityMantra}”`}</P></View>
    </Card>
    <Tarot/>
    <SignRow value={name} own={profile.sign} onPick={setName}/>
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Text style={{ fontSize: 34, color: C.gold }}>{sign.glyph}</Text><View style={{ flex: 1 }}><H2>{sign.name}</H2><P dim>{`${sign.period} · ${sign.elementLabel} · ${sign.modality}`}</P></View>{sign.name === profile.sign && <Star size={16} color={C.gold}/>}</View>
      <P>{`${sign.archetype} · Regido por ${sign.rulingPlanet}`}</P>
      <P>{sign.wealthMindset}</P>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {([["financas", "Finanças"], ["carreira", "Carreira"], ["parcerias", "Parcerias"], ["ritual", "Ritual"]] as [Section, string][]).map(([key, label]) => <Chip key={key} label={label} on={section === key} onPress={() => setSection(key)}/>)}
      </View>
      {section === "financas" && <View style={{ gap: 12 }}>
        <Block title="Seus pontos fortes" text={sign.strengths.map((item) => `• ${item}`).join("\n")}/>
        <Block title="Pontos cegos" text={sign.blindSpots.map((item) => `• ${item}`).join("\n")}/>
        <Block title="Antídoto" text={sign.antidote}/>
      </View>}
      {section === "carreira" && <View style={{ gap: 12 }}>
        <Block title="Melhores áreas" text={sign.careerAndBusiness.bestFields.map((item) => `• ${item}`).join("\n")}/>
        <Block title="Estilo de liderança" text={sign.careerAndBusiness.leadershipStyle}/>
        <Block title="Poder de negociação" text={sign.careerAndBusiness.negotiationPower}/>
      </View>}
      {section === "parcerias" && <View style={{ gap: 12 }}>{sign.compatiblePartners.map((partner) => <Block key={partner.sign} title={partner.sign} text={partner.synergy}/>)}</View>}
      {section === "ritual" && <Block title={`${sign.prosperityRitual.title} · ${sign.prosperityRitual.duration}`} text={sign.prosperityRitual.practice}/>}
    </Card>
  </>;
}

function Astro() {
  const moon = useMemo(() => getMoonPhase(), []);
  const [planetId, setPlanetId] = useState("jupiter");
  const planet = PLANETS_OF_PROSPERITY.find((item) => item.id === planetId) ?? PLANETS_OF_PROSPERITY[0];
  return <>
    <Card>
      <Eyebrow>Fase da Lua</Eyebrow>
      <H2>{`${moon.symbol} ${moon.name} · ${moon.illumination}%`}</H2>
      <P>{moon.theme}</P>
      <Block title="Foco financeiro" text={moon.financialFocus}/>
      <Block title="Boa ação para agora" text={moon.favorableAction}/>
      <Block title="Melhor evitar" text={moon.avoidAction}/>
    </Card>
    <Wheel/>
    <Card>
      <Eyebrow>Planetas da prosperidade</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{PLANETS_OF_PROSPERITY.map((item) => <Chip key={item.id} label={item.name} on={item.id === planetId} onPress={() => setPlanetId(item.id)}/>)}</ScrollView>
      <H3>{`${planet.name} · ${planet.archetype}`}</H3>
      <P>{planet.wealthDomain}</P>
      <Block title="Como ativar" text={planet.howToActivate}/>
      <Block title="Conselho da semana" text={planet.weeklyAdvice}/>
    </Card>
    <Card>
      <Eyebrow>Os quatro elementos</Eyebrow>
      {ELEMENTS_PROSPERITY.map((element) => <View key={element.element} style={{ gap: 6, marginBottom: 10 }}>
        <H3>{element.name}</H3>
        <Block title="Superpoder" text={element.wealthSuperpower}/>
        <Block title="Armadilha" text={element.scarcityTrap}/>
        <Block title="Reequilíbrio" text={element.rebalancingPractice}/>
      </View>)}
    </Card>
  </>;
}

export function SignsScreen({ ask }: { ask: (prompt: string) => void }) {
  const [tab, setTab] = useState<"hoje" | "signos" | "astro">("hoje");
  return <Screen>
    <Segmented value={tab} onChange={setTab} options={[["hoje", "Hoje ao vivo"], ["signos", "12 Signos"], ["astro", "Astrologia & Céu"]]}/>
    {tab === "hoje" && <Live go={ask}/>}
    {tab === "signos" && <Twelve/>}
    {tab === "astro" && <Astro/>}
    <Gap/>
  </Screen>;
}
