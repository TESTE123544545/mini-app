import React, { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Clock3, Compass, Coins, Hash, Heart, LockKeyhole, Sparkles } from "lucide-react-native";
import { localDayKey } from "@/lib/daily";
import { EQUAL_HOURS, equalHourOf, nextEqualHour } from "@/lib/signals/hours";
import type { DailyMessage, HourReading, NumerologyProfile } from "@/lib/signals/compose";
import { api } from "../api";
import { useApp } from "../store";
import { Button, Card, Eyebrow, Field, Gap, H2, H3, P, Screen } from "../ui";
import { C, F } from "../theme";
import { brToIso, maskDate } from "./Auth";

export type SignalsData = {
  premium: boolean; sign: string; hasBirthDate: boolean; daily: DailyMessage; hour: HourReading | null; numerology: NumerologyProfile;
  combo: null | { title: string; lead: string; sections: { h: string; t: string }[] };
  history: { time: string; dayKey: string }[]; historyHidden: boolean;
};

/** /api/signals: the paid half of each answer is only sent for Premium accounts. */
export function useSignals(time: string | null, birth: string | null) {
  const { synced } = useApp();
  const [data, setData] = useState<SignalsData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!synced) return;
    let live = true;
    const query = [`day=${localDayKey()}`, time && `time=${time}`, birth && `birth=${birth}`].filter(Boolean).join("&");
    api<SignalsData>(`/api/signals?${query}`).then((next) => { if (live) { setData(next); setFailed(false); } }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [time, birth, synced]);
  return { data, failed };
}

const when = (dayKey: string) => (dayKey === localDayKey() ? "hoje" : dayKey.split("-").reverse().slice(0, 2).join("/"));

function Lock({ text, reason, children }: { text: string; reason: string; children: React.ReactNode }) {
  const { openPaywall } = useApp();
  return <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: C.line, borderRadius: 16, padding: 14, gap: 10, marginTop: 8 }}>
    <LockKeyhole size={16} color={C.gold}/>
    <P>{children}</P>
    <Button label={text} onPress={() => openPaywall(reason)}/>
  </View>;
}

export const Block = ({ icon, title, text }: { icon?: React.ReactNode; title: string; text: string }) =>
  <View style={{ borderLeftWidth: 2, borderLeftColor: C.goldDeep, paddingLeft: 12, gap: 4 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>{icon}<H3>{title}</H3></View><P>{text}</P>
  </View>;

export function SignalsScreen() {
  const [now, setNow] = useState(() => new Date());
  const [picked, setPicked] = useState<string | null>(() => equalHourOf(new Date()));
  const [birthText, setBirthText] = useState("");
  const [birth, setBirth] = useState<string | null>(null);
  const { data, failed } = useSignals(picked, birth);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 20_000); return () => clearInterval(timer); }, []);
  const open = useCallback((time: string) => setPicked(time), []);
  const equal = equalHourOf(now);
  const next = nextEqualHour(now);
  const hour = data?.hour ?? null;
  const premium = Boolean(data?.premium);
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return <Screen>
    <Card style={{ alignItems: "center" }}>
      <Eyebrow>Sinais do Universo</Eyebrow>
      <Text style={{ fontFamily: F.black, fontSize: 56, color: C.goldDeep, letterSpacing: 2 }}>{clock}</Text>
      {equal
        ? <P>É uma hora igual. {picked === equal ? "Seu sinal está logo abaixo." : ""}</P>
        : <P>{`Próxima hora igual: ${next.time}, em ${next.minutes >= 60 ? `${Math.floor(next.minutes / 60)} h ${next.minutes % 60} min` : `${next.minutes} min`}.`}</P>}
      {equal && picked !== equal && <Button kind="ghost" label={`Ver o que ${equal} significa`} onPress={() => open(equal)}/>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 10 }}>
        {EQUAL_HOURS.map((item) => <Pressable key={item.time} onPress={() => open(item.time)} accessibilityRole="button" style={{ width: "22%", minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: item.time === equal ? C.gold : C.line, backgroundColor: picked === item.time ? C.goldDeep : "transparent", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: F.black, color: picked === item.time ? C.bg : C.ink, fontSize: 13 }}>{item.time}</Text>
        </Pressable>)}
      </View>
    </Card>

    {failed && !data && <Card><P>Não foi possível carregar seus sinais agora. Tente novamente em instantes.</P></Card>}

    {hour && <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Clock3 size={14} color={C.gold}/><Eyebrow>{`${hour.time} · número ${hour.number.label}`}</Eyebrow></View>
      <H2>{hour.title}</H2>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{hour.keywords.map((word) => <Text key={word} style={{ fontFamily: F.bold, fontSize: 12, color: C.ink2, borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>{word}</Text>)}</View>
      <P>{hour.essence}</P>
      <Text style={{ fontFamily: F.bold, fontSize: 15, lineHeight: 23, color: C.ink }}>{hour.short}</Text>
      {hour.full ? <View style={{ gap: 14, marginTop: 8 }}>
        <Block icon={<Sparkles size={15} color={C.gold}/>} title="Para o seu signo" text={hour.full.sign}/>
        <Block icon={<Hash size={15} color={C.gold}/>} title="Numerologia" text={hour.full.numerology}/>
        <Block icon={<Coins size={15} color={C.gold}/>} title="Prosperidade" text={hour.full.prosperity}/>
        <Block icon={<Heart size={15} color={C.gold}/>} title="Amor" text={hour.full.love}/>
        <Block icon={<Compass size={15} color={C.gold}/>} title="Seu momento" text={hour.full.moment}/>
      </View> : <Lock text="Desbloquear minha interpretação completa" reason="signals_hour">{`Há mais neste sinal para ${data?.sign}: a leitura com o seu signo, sua numerologia, prosperidade, amor e o seu momento.`}</Lock>}
      <P dim>Interpretação simbólica, para reflexão e entretenimento. Não é previsão nem promessa.</P>
    </Card>}

    {data && <Card>
      <Eyebrow>A mensagem do seu dia</Eyebrow>
      <H2>{data.daily.title}</H2>
      <P dim>{`${data.daily.sign} · dia ${data.daily.dayNumberKind} ${data.daily.dayNumber}${data.daily.lifePath ? ` · Caminho de Vida ${data.daily.lifePath}` : ""}`}</P>
      {data.daily.full ? <View style={{ gap: 12 }}>
        <Block title="Prosperidade" text={data.daily.full.messages.prosperidade}/>
        <Block title="Amor" text={data.daily.full.messages.amor}/>
        <Block title="Momento pessoal" text={data.daily.full.messages.momento}/>
        <Block title="Dica do dia" text={data.daily.full.tip}/>
      </View> : <>
        <P>{data.daily.short}</P>
        <Lock text="Ativar minha experiência personalizada" reason="signals_daily">Receba a mensagem completa de hoje: prosperidade, amor e seu momento pessoal.</Lock>
      </>}
    </Card>}

    {data && <Card>
      <Eyebrow>Minha numerologia</Eyebrow>
      {!data.hasBirthDate ? <>
        <P>Para calcular seus números, informe sua data de nascimento.</P>
        <Field label="Data de nascimento" value={birthText} onChangeText={(text) => { const masked = maskDate(text); setBirthText(masked); const iso = brToIso(masked); if (iso) setBirth(iso); }} keyboardType="number-pad" placeholder="DD/MM/AAAA"/>
      </> : <>
        {data.numerology.lifePath && <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: C.goldDeep, alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: F.black, fontSize: 24, color: C.goldDeep }}>{data.numerology.lifePath.value}</Text></View>
          <View style={{ flex: 1, gap: 2 }}><H3>{`Caminho de Vida · ${data.numerology.lifePath.name}`}</H3><P>{data.numerology.lifePath.essence}</P></View>
        </View>}
        {premium ? <>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {([["Destino", data.numerology.destiny], ["Personalidade", data.numerology.personality], ["Alma", data.numerology.soul]] as const).map(([label, value]) =>
              <View key={label} style={{ flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingVertical: 10, alignItems: "center" }}><Text style={{ fontFamily: F.black, fontSize: 24, color: C.goldDeep }}>{value ?? "—"}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: C.ink3 }}>{label}</Text></View>)}
          </View>
          {data.numerology.cycles && <View style={{ gap: 8, marginTop: 8 }}>
            <Block title={`Ano pessoal ${data.numerology.cycles.year}`} text={data.numerology.cycles.yearText}/>
            <Block title={`Mês pessoal ${data.numerology.cycles.month}`} text={data.numerology.cycles.monthText}/>
            <Block title={`Dia pessoal ${data.numerology.cycles.day}`} text={data.numerology.cycles.dayText}/>
          </View>}
        </> : <Lock text="Descobrir o que esse sinal significa para mim" reason="signals_numerology">Destino, Personalidade, Alma e seus ciclos pessoais de ano, mês e dia.</Lock>}
      </>}
    </Card>}

    {data?.hasBirthDate && <Card>
      <Eyebrow>Sua combinação energética</Eyebrow>
      {data.combo ? <>
        <H2>{data.combo.title}</H2><P>{data.combo.lead}</P>
        <View style={{ gap: 12, marginTop: 4 }}>{data.combo.sections.map((section) => <Block key={section.h} title={section.h} text={section.t}/>)}</View>
      </> : <>
        <H2>{`${data.sign} + o seu Caminho de Vida ${data.numerology.lifePath?.value ?? ""}`}</H2>
        <Lock text="Desbloquear minha interpretação completa" reason="signals_combo">Personalidade, prosperidade, amor, carreira, desafios, potenciais e o conselho do momento para essa combinação.</Lock>
      </>}
    </Card>}

    {data && <Card>
      <Eyebrow>Meus sinais</Eyebrow>
      {data.history.length === 0 ? <P>Os sinais que você abrir ficam guardados aqui para rever depois.</P>
        : <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{data.history.map((item) => <Pressable key={`${item.dayKey}-${item.time}`} onPress={() => open(item.time)} style={{ borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ fontFamily: F.bold, color: C.ink }}>{item.time} <Text style={{ color: C.ink3, fontFamily: F.body }}>{when(item.dayKey)}</Text></Text></Pressable>)}</View>}
      {data.historyHidden && <Lock text="Ver meu histórico completo" reason="signals_history">Há mais sinais guardados no seu histórico.</Lock>}
    </Card>}

    <View style={{ flexDirection: "row", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
      <Text onPress={() => Linking.openURL("https://veiasdasintonia.com.br/horas-iguais")} style={{ color: C.ink2, fontFamily: F.body, textDecorationLine: "underline" }}>Significado das horas iguais</Text>
      <Text onPress={() => Linking.openURL("https://veiasdasintonia.com.br/numerologia")} style={{ color: C.ink2, fontFamily: F.body, textDecorationLine: "underline" }}>Numerologia</Text>
    </View>
    <Gap/>
  </Screen>;
}
