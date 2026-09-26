"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

type Metrics = { days: number; funnel: { key: string; label: string; people: number }[]; totals: { users: number; premium: number } };
const PERIODS = [7, 30, 90] as const;

/** Team-only funnel (ADMIN_EMAILS): how many people reach each step, from sign-up to paying. */
export function AdminMetrics() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  const [data, setData] = useState<{ days: number; metrics: Metrics | null } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/metrics?days=${days}`)
      .then((response) => (response.ok ? (response.json() as Promise<Metrics>) : null))
      .catch(() => null)
      .then((metrics) => { if (alive) setData({ days, metrics }); });
    return () => { alive = false; };
  }, [days]);

  const metrics = data?.days === days ? data.metrics : undefined;
  const top = metrics?.funnel[0]?.people || 0;

  return <section className="surface-card admin-metrics">
    <div className="section-heading"><div><h2>Funil do app</h2><p className="admin-metrics__sub">Visível só para a equipe</p></div><BarChart3 aria-hidden="true"/></div>
    <div className="admin-metrics__periods" role="tablist" aria-label="Período">
      {PERIODS.map((value) => <button type="button" role="tab" key={value} aria-selected={days === value} onClick={() => setDays(value)}>{value} dias</button>)}
    </div>
    {metrics === undefined ? <p className="admin-metrics__sub">Carregando…</p>
      : metrics === null ? <p className="admin-metrics__sub">Não foi possível carregar as métricas.</p>
      : <>
        <ol className="admin-metrics__funnel">
          {metrics.funnel.map((step) => {
            const share = top ? Math.round((step.people / top) * 100) : 0;
            return <li key={step.key}>
              <div><span>{step.label}</span><strong>{step.people.toLocaleString("pt-BR")}</strong></div>
              <i aria-hidden="true"><b style={{ width: `${share}%` }}/></i>
            </li>;
          })}
        </ol>
        <p className="admin-metrics__totals">Total de contas: <strong>{metrics.totals.users}</strong> · Premium: <strong>{metrics.totals.premium}</strong></p>
        <p className="admin-metrics__sub">As métricas começaram a ser registradas em 26/09/2026; antes disso não há dados.</p>
      </>}
  </section>;
}
