"use client";

import { useState } from "react";
import { Crown, Search } from "lucide-react";
import { toast } from "sonner";
import { EXCLUSIVE_ACHIEVEMENTS } from "@/lib/journey";

type Target = { email: string; name: string; sign: string; granted: string[] };

/** Team-only panel (shown to ADMIN_EMAILS accounts) to grant or revoke exclusive achievements. */
export function AdminAchievements() {
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(input: RequestInfo, init?: RequestInit) {
    setBusy(true);
    try {
      const response = await fetch(input, init);
      const result = await response.json().catch(() => ({})) as Target & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível concluir.");
      setTarget(result);
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    void call(`/api/admin/achievements?email=${encodeURIComponent(email.trim())}`);
  }

  async function toggle(key: string, grant: boolean) {
    if (!target) return;
    const result = await call("/api/admin/achievements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: target.email, key, action: grant ? "grant" : "revoke" }) });
    if (result) toast.success(grant ? "Conquista concedida." : "Conquista removida.");
  }

  return <section className="surface-card admin-achievements">
    <div className="section-heading"><div><p className="eyebrow">Equipe · Administração</p><h2>Conquistas exclusivas</h2></div><Crown/></div>
    <p className="detail-narrative">Conceda ou remova conquistas exclusivas pelo e-mail da conta. A pessoa vê a conquista na próxima vez que abrir o app.</p>
    <form className="admin-achievements__search" onSubmit={lookup}>
      <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@da-pessoa.com" aria-label="E-mail da conta" autoComplete="off"/>
      <button type="submit" className="ghost-button" disabled={busy}><Search size={15}/> Buscar</button>
    </form>
    {target && <div className="admin-achievements__target">
      <p><strong>{target.name || "Sem nome"}</strong> · {target.sign || "—"} · <span>{target.email}</span></p>
      <div className="admin-achievements__list">
        {EXCLUSIVE_ACHIEVEMENTS.map((item) => { const has = target.granted.includes(item.key); return <div key={item.key} className={has ? "is-granted" : ""}>
          <span>{item.name}</span>
          <button type="button" className={has ? "ghost-button" : "gold-button"} disabled={busy} onClick={() => toggle(item.key, !has)}>{has ? "Remover" : "Conceder"}</button>
        </div>; })}
      </div>
    </div>}
  </section>;
}
