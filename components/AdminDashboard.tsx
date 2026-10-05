"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, RefreshCw } from "lucide-react";
import { AdminAchievements } from "@/components/AdminAchievements";
import { AdminResetLink } from "@/components/AdminResetLink";
import { BrandLockup } from "@/components/BrandLockup";

type Day = { day: string; views: number; visitors: number; signups: number; active: number };
type Dashboard = {
  days: number;
  today: string;
  kpis: {
    accounts: number; accountsNew: number; accountsToday: number; premium: number; lifetime: number; trials: number;
    viewsToday: number; visitorsToday: number; viewsYesterday: number | null; visitorsYesterday: number | null;
    views: number; visitorsPerDay: number; activeToday: number; activeWeek: number; missionsToday: number;
  };
  series: Day[];
  pages: { path: string; views: number; visitors: number }[];
  sources: { source: string; views: number }[];
  countries: { country: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  funnel: { key: string; label: string; people: number }[];
  events: { name: string; count: number }[];
  recentAccounts: { email: string; name: string | null; sign: string | null; plan: string; createdAt: string }[];
  content: { views: number; readHalf: number; readMost: number; ctaClicks: { where: string; clicks: number }[] };
  security: {
    failed24h: number; blockedNow: number; last24h: Record<string, number>;
    recent: { kind: string; ip: string; asn: string | null; country: string | null; detail: string; createdAt: string }[];
  };
};

const SECURITY_LABEL: Record<string, string> = {
  ip_blocked: "IP bloqueado", account_locked: "Conta travada", rotation_suspected: "Troca de IP / VPN suspeita", network_watched: "Rede sob vigilância",
};

const CTA_LABEL: Record<string, string> = { "barra-fixa": "Barra fixa no celular", "meio-do-texto": "No meio do texto", "fim-da-pagina": "No fim da página", topo: "Botão do topo", outro: "Outros" };

const PERIODS = [7, 30, 90] as const;
const nf = new Intl.NumberFormat("pt-BR");
const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const longDate = (day: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day}T12:00:00Z`));
const COUNTRY = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const countryName = (code: string) => { try { return code === "—" ? "Desconhecido" : COUNTRY.of(code) ?? code; } catch { return code; } };
const pageName = (path: string) => (path === "/" ? "Início (app)" : path);
const EVENT_LABEL: Record<string, string> = {
  signup: "Cadastro", onboarding_completed: "Cadastro inicial concluído", diagnostic_completed: "Diagnóstico concluído",
  diagnostic_question_answered: "Pergunta do diagnóstico", diagnostic_result_viewed: "Resultado do diagnóstico visto",
  paywall_viewed: "Oferta Premium vista", signal_hour_opened: "Sinais: hora aberta", signal_hour_detected: "Sinais: hora igual detectada", signal_upsell_clicked: "Sinais: clique para desbloquear", premium_tab_viewed: "Aba Premium vista", checkout_started: "Pagamento aberto",
  checkout_completed: "Assinatura concluída", daily_mission_completed: "Missão do dia", daily_ritual_completed: "Ritual de 3 minutos",
  journal_entry_created: "Reflexão no diário", goal_created: "Meta criada", goal_completed: "Meta concluída",
  oracle_revealed: "Oráculo revelado", tarot_drawn: "Carta do tarô", wheel_spun: "Roda da Fortuna",
  trail_started: "Trilha iniciada", trail_day_completed: "Dia de trilha", trail_abandoned: "Trilha abandonada",
  prosperity_tree_opened: "Árvore aberta", first_tree_created: "Primeira árvore", guide_opened: "Guia aberto", day_completed: "Dia completo",
};

/** Width of an element, kept current, so charts draw at real pixels (legible text on a phone too). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The top of a 4-step axis: the smallest round step (1, 2, 2.5, 5 × 10ⁿ) whose 4 steps cover the value. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const base = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(base));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= base) ?? base;
  return step * 4;
}

type Series = { key: "views" | "visitors" | "signups" | "active"; label: string; color: string };

/** Time series: lines for two measures on one axis, bars for a single one. Crosshair/hover tooltip on both. */
function TimeChart({ data, series, kind, title }: { data: Day[]; series: Series[]; kind: "line" | "bar"; title: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 220;
  const margin = { top: 14, right: 14, bottom: 26, left: 38 };
  const innerW = Math.max(0, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const max = niceMax(Math.max(0, ...data.flatMap((day) => series.map((item) => day[item.key]))));
  const y = (value: number) => margin.top + innerH - (value / max) * innerH;
  const step = data.length > 1 ? innerW / (kind === "bar" ? data.length : data.length - 1) : innerW;
  const x = (index: number) => margin.left + (kind === "bar" ? step * index + step / 2 : step * index);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerW / 64))));
  const barW = Math.max(2, Math.min(28, step - 2));

  const pick = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || !data.length) return;
    const local = clientX - box.left - margin.left;
    const index = kind === "bar" ? Math.floor(local / step) : Math.round(local / step);
    setHover(Math.min(data.length - 1, Math.max(0, index)));
  };
  const hovered = hover === null ? null : data[hover];

  return <figure className="adm-chart">
    <figcaption>
      <h3>{title}</h3>
      {series.length > 1 && <ul className="adm-legend">{series.map((item) => <li key={item.key}><i style={{ background: item.color }}/>{item.label}</li>)}</ul>}
    </figcaption>
    <div className="adm-chart__plot" ref={ref} onMouseMove={(event) => pick(event.clientX)} onMouseLeave={() => setHover(null)} onTouchStart={(event) => pick(event.touches[0].clientX)} onTouchMove={(event) => pick(event.touches[0].clientX)}>
      {width > 0 && <svg width={width} height={height} role="img" aria-label={title}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const value = max * fraction;
          return <g key={fraction}>
            <line x1={margin.left} x2={width - margin.right} y1={y(value)} y2={y(value)} className="adm-grid"/>
            <text x={margin.left - 8} y={y(value)} dy="0.32em" textAnchor="end" className="adm-axis">{nf.format(Math.round(value))}</text>
          </g>;
        })}
        {data.map((day, index) => (data.length - 1 - index) % labelEvery === 0 && <text key={day.day} x={x(index)} y={height - 8} textAnchor="middle" className="adm-axis">{shortDate(day.day)}</text>)}
        {kind === "bar" ? data.map((day, index) => {
          const value = day[series[0].key];
          const top = y(value);
          const h = margin.top + innerH - top;
          const left = x(index) - barW / 2;
          const r = Math.min(4, barW / 2, h);
          return value > 0 && <path key={day.day} fill={series[0].color} opacity={hover === null || hover === index ? 1 : 0.55}
            d={`M${left},${top + h} V${top + r} Q${left},${top} ${left + r},${top} H${left + barW - r} Q${left + barW},${top} ${left + barW},${top + r} V${top + h} Z`}/>;
        }) : series.map((item) => <g key={item.key}>
          <polyline fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={data.map((day, index) => `${x(index)},${y(day[item.key])}`).join(" ")}/>
          {data.length > 0 && <circle cx={x(data.length - 1)} cy={y(data[data.length - 1][item.key])} r={4} fill={item.color} stroke="var(--adm-surface)" strokeWidth={2}/>}
        </g>)}
        {hovered && <g pointerEvents="none">
          <line x1={x(hover!)} x2={x(hover!)} y1={margin.top} y2={margin.top + innerH} className="adm-crosshair"/>
          {kind === "line" && series.map((item) => <circle key={item.key} cx={x(hover!)} cy={y(hovered[item.key])} r={5} fill={item.color} stroke="var(--adm-surface)" strokeWidth={2}/>)}
        </g>}
      </svg>}
      {hovered && <div className="adm-tooltip" style={{ left: Math.min(Math.max(x(hover!), 70), width - 70) }}>
        <strong>{longDate(hovered.day)}</strong>
        {series.map((item) => <span key={item.key}><i style={{ background: item.color }}/>{item.label}<b>{nf.format(hovered[item.key])}</b></span>)}
      </div>}
    </div>
    <details className="adm-table-toggle">
      <summary>Ver os números</summary>
      <table className="adm-table"><thead><tr><th>Dia</th>{series.map((item) => <th key={item.key}>{item.label}</th>)}</tr></thead>
        <tbody>{[...data].reverse().map((day) => <tr key={day.day}><td>{longDate(day.day)}</td>{series.map((item) => <td key={item.key}>{nf.format(day[item.key])}</td>)}</tr>)}</tbody>
      </table>
    </details>
  </figure>;
}

/** A ranked list with a quiet meter behind each value. */
function RankList({ title, rows, unit }: { title: string; rows: { label: string; value: number; note?: string }[]; unit: string }) {
  const top = Math.max(1, ...rows.map((row) => row.value));
  return <section className="adm-card">
    <h3>{title}</h3>
    {rows.length === 0 ? <p className="adm-empty">Ainda sem dados neste período.</p> : <ol className="adm-rank">
      {rows.map((row) => <li key={row.label}>
        <i style={{ width: `${(row.value / top) * 100}%` }} aria-hidden="true"/>
        <span title={row.label}>{row.label}{row.note && <small>{row.note}</small>}</span>
        <b>{nf.format(row.value)} <small>{unit}</small></b>
      </li>)}
    </ol>}
  </section>;
}

function Delta({ now, before }: { now: number; before: number | null }) {
  if (before === null) return null;
  const diff = now - before;
  return <small className={`adm-delta ${diff > 0 ? "up" : diff < 0 ? "down" : ""}`}>{diff === 0 ? "igual a ontem" : `${diff > 0 ? "▲" : "▼"} ${nf.format(Math.abs(diff))} vs. ontem`}</small>;
}

type LoadState = { status: "loading" } | { status: "error"; message: string; code?: number } | { status: "ready"; data: Dashboard };

async function fetchDashboard(days: number): Promise<LoadState> {
  try {
    const response = await fetch(`/api/admin/dashboard?days=${days}`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { status: "error", message: (body as { error?: string }).error ?? "Não foi possível carregar o painel.", code: response.status };
    return { status: "ready", data: body as Dashboard };
  } catch {
    return { status: "error", message: "Sem conexão com o servidor." };
  }
}

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
  window.location.reload();
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchDashboard(days).then((next) => {
      if (!alive) return;
      setState(next);
      if (next.status === "ready") setRefreshedAt(new Date());
    });
    // Refreshes itself every minute while the page is open.
    const timer = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => { alive = false; clearInterval(timer); };
  }, [days, tick]);

  const data = state.status === "ready" ? state.data : null;
  const k = data?.kpis;
  const funnelTop = data?.funnel[0]?.people || 0;

  return <main className="adm">
    <header className="adm-head">
      <div className="adm-head__brand">
        <BrandLockup/>
        <div><p className="adm-eyebrow">Acesso restrito · equipe</p><h1>Painel</h1><span className="adm-user">{adminEmail}</span></div>
      </div>
      <div className="adm-head__actions">
        <div className="adm-periods" role="tablist" aria-label="Período">
          {PERIODS.map((value) => <button key={value} type="button" role="tab" aria-selected={days === value} onClick={() => { setDays(value); setState({ status: "loading" }); }}>{value} dias</button>)}
        </div>
        <button type="button" className="adm-icon-btn" onClick={() => setTick((value) => value + 1)} aria-label="Atualizar agora"><RefreshCw/></button>
        <Link href="/" className="adm-back"><ArrowLeft/>App</Link>
        <button type="button" className="adm-back" onClick={logout}><LogOut/>Sair</button>
      </div>
    </header>

    {state.status === "loading" && <p className="adm-status">Carregando o painel…</p>}
    {state.status === "error" && <div className="adm-status adm-status--error">
      <p>{state.message}</p>
      {state.code === 401 && <p>Sua sessão do painel expirou. <button type="button" className="adm-login__link" onClick={() => window.location.reload()}>Entrar de novo</button></p>}
    </div>}

    {data && k && <>
      <section className="adm-kpis" aria-label="Resumo">
        <article className="adm-kpi adm-kpi--hero"><span>Contas criadas</span><strong>{nf.format(k.accounts)}</strong><small>+{nf.format(k.accountsNew)} em {data.days} dias · +{nf.format(k.accountsToday)} hoje</small></article>
        <article className="adm-kpi"><span>Visitas hoje</span><strong>{nf.format(k.viewsToday)}</strong><Delta now={k.viewsToday} before={k.viewsYesterday}/></article>
        <article className="adm-kpi"><span>Visitantes hoje</span><strong>{nf.format(k.visitorsToday)}</strong><Delta now={k.visitorsToday} before={k.visitorsYesterday}/></article>
        <article className="adm-kpi"><span>Visitas em {data.days} dias</span><strong>{nf.format(k.views)}</strong><small>média de {nf.format(k.visitorsPerDay)} visitantes/dia</small></article>
        <article className="adm-kpi"><span>Premium</span><strong>{nf.format(k.premium)}</strong><small>{k.accounts ? `${Math.round((k.premium / k.accounts) * 100)}% das contas` : "—"}{k.lifetime ? ` · ${k.lifetime} vitalício` : ""}</small></article>
        <article className="adm-kpi"><span>Em teste Premium grátis</span><strong>{nf.format(k.trials)}</strong><small>contas novas no teste de 3 dias</small></article>
        <article className="adm-kpi"><span>Usuários ativos</span><strong>{nf.format(k.activeToday)}</strong><small>hoje · {nf.format(k.activeWeek)} nos últimos 7 dias</small></article>
        <article className="adm-kpi"><span>Missões concluídas hoje</span><strong>{nf.format(k.missionsToday)}</strong><small>no app</small></article>
      </section>

      <section className="adm-card adm-card--wide">
        <TimeChart title="Visitas por dia" kind="line" data={data.series} series={[{ key: "views", label: "Visitas", color: "#b8893a" }, { key: "visitors", label: "Visitantes únicos", color: "#4f7fe0" }]}/>
      </section>
      <div className="adm-two">
        <section className="adm-card"><TimeChart title="Novas contas por dia" kind="bar" data={data.series} series={[{ key: "signups", label: "Novas contas", color: "#b8893a" }]}/></section>
        <section className="adm-card"><TimeChart title="Usuários ativos por dia" kind="bar" data={data.series} series={[{ key: "active", label: "Ativos", color: "#b8893a" }]}/></section>
      </div>

      <div className="adm-three">
        <RankList title="Páginas mais vistas" unit="visitas" rows={data.pages.map((row) => ({ label: pageName(row.path), value: row.views, note: `${nf.format(row.visitors)} pessoas` }))}/>
        <RankList title="De onde vêm as visitas" unit="visitas" rows={data.sources.map((row) => ({ label: row.source, value: row.views }))}/>
        <div className="adm-stack">
          <RankList title="Dispositivos" unit="pessoas" rows={data.devices.map((row) => ({ label: row.device, value: row.visitors }))}/>
          <RankList title="Países" unit="pessoas" rows={data.countries.map((row) => ({ label: countryName(row.country), value: row.visitors }))}/>
        </div>
      </div>

      <div className="adm-two">
        <section className="adm-card">
          <h3>Funil de conversão · {data.days} dias</h3>
          <ol className="adm-funnel">
            {data.funnel.map((step, index) => {
              const share = funnelTop ? Math.round((step.people / funnelTop) * 100) : 0;
              return <li key={step.key}>
                <div><span>{index + 1}. {step.label}</span><b>{nf.format(step.people)} <small>{index > 0 && funnelTop ? `${share}%` : ""}</small></b></div>
                <i aria-hidden="true"><em style={{ width: `${share}%` }}/></i>
              </li>;
            })}
          </ol>
        </section>
        <RankList title={`O que as pessoas fazem no app · ${data.days} dias`} unit="vezes" rows={data.events.map((row) => ({ label: EVENT_LABEL[row.name] ?? row.name, value: row.count }))}/>
      </div>

      <div className="adm-two">
        <section className="adm-card">
          <h3>Páginas de conteúdo · {data.days} dias</h3>
          <div className="adm-content-stats">
            <div><strong>{nf.format(data.content.views)}</strong><span>visitas nas páginas de conteúdo</span></div>
            <div><strong>{data.content.views ? `${Math.round((data.content.readHalf / data.content.views) * 100)}%` : "—"}</strong><span>leram metade da página</span></div>
            <div><strong>{data.content.views ? `${Math.round((data.content.readMost / data.content.views) * 100)}%` : "—"}</strong><span>leram quase tudo</span></div>
            <div><strong>{data.content.views ? `${(data.content.ctaClicks.reduce((sum, row) => sum + row.clicks, 0) / data.content.views * 100).toFixed(1)}%` : "—"}</strong><span>clicaram para fazer o diagnóstico</span></div>
          </div>
        </section>
        <RankList title="Cliques nos botões de diagnóstico" unit="cliques" rows={data.content.ctaClicks.map((row) => ({ label: CTA_LABEL[row.where] ?? row.where, value: row.clicks }))}/>
      </div>

      <section className="adm-card adm-card--wide">
        <h3>Últimas contas criadas</h3>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Quando</th><th>Nome</th><th>E-mail</th><th>Signo</th><th>Plano</th></tr></thead>
            <tbody>{data.recentAccounts.map((row) => <tr key={row.email + row.createdAt}>
              <td>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(row.createdAt.includes("T") ? row.createdAt : `${row.createdAt.replace(" ", "T")}Z`))}</td>
              <td>{row.name || "—"}</td><td>{row.email}</td><td>{row.sign || "—"}</td>
              <td><span className={`adm-plan adm-plan--${row.plan}`}>{row.plan === "premium" ? "Premium" : "Grátis"}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="adm-card adm-card--wide" aria-label="Segurança">
        <h3>Segurança · tentativas de invasão</h3>
        <div className="adm-content-stats">
          <div><strong>{nf.format(data.security.failed24h)}</strong><span>senhas erradas nas últimas 24 h</span></div>
          <div><strong>{nf.format(data.security.blockedNow)}</strong><span>IPs bloqueados agora</span></div>
          <div><strong>{nf.format((data.security.last24h.account_locked ?? 0) + (data.security.last24h.rotation_suspected ?? 0))}</strong><span>contas travadas em 24 h</span></div>
          <div><strong>{nf.format(data.security.last24h.rotation_suspected ?? 0)}</strong><span>trocas de IP / VPN suspeitas em 24 h</span></div>
        </div>
        {data.security.recent.length > 0
          ? <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Quando</th><th>O que houve</th><th>IP</th><th>País</th><th>Detalhe</th></tr></thead>
              <tbody>{data.security.recent.map((row) => <tr key={row.createdAt + row.ip + row.kind}>
                <td>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(row.createdAt))}</td>
                <td>{SECURITY_LABEL[row.kind] ?? row.kind}</td><td>{row.ip}{row.asn ? ` · AS${row.asn}` : ""}</td><td>{row.country ? countryName(row.country) : "—"}</td><td>{row.detail}</td>
              </tr>)}</tbody>
            </table>
          </div>
          : <p className="adm-empty">Nenhuma tentativa suspeita registrada. Bom sinal.</p>}
      </section>

      <section className="adm-tools" aria-label="Ferramentas da equipe">
        <AdminResetLink/>
        <AdminAchievements/>
      </section>

      <p className="adm-foot">
        Visitas contadas a partir de 27/09/2026, sem cookies e sem guardar IP: um visitante é contado uma vez por dia; robôs de busca ficam de fora.
        {refreshedAt && <> Atualizado às {refreshedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · atualiza sozinho a cada minuto.</>}
      </p>
    </>}
  </main>;
}
