"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Sign = { slug: string; name: string; symbol: string };

/** The compatibility test: pick two signs, open their pair's page. */
export function CompatPicker({ signs }: { signs: Sign[] }) {
  const router = useRouter();
  const [a, setA] = useState(signs[0].slug);
  const [b, setB] = useState(signs[4].slug);
  const order = (x: string, y: string) => (signs.findIndex((s) => s.slug === x) <= signs.findIndex((s) => s.slug === y) ? `${x}-${y}` : `${y}-${x}`);
  return <form className="compat-picker" onSubmit={(event) => { event.preventDefault(); router.push(`/compatibilidade/${order(a, b)}`); }}>
    <label><span>Seu signo</span><select value={a} onChange={(event) => setA(event.target.value)}>{signs.map((sign) => <option key={sign.slug} value={sign.slug}>{sign.name}</option>)}</select></label>
    <span className="compat-picker__plus" aria-hidden="true">+</span>
    <label><span>Signo da outra pessoa</span><select value={b} onChange={(event) => setB(event.target.value)}>{signs.map((sign) => <option key={sign.slug} value={sign.slug}>{sign.name}</option>)}</select></label>
    <button type="submit" className="zodiac-pill">Ver compatibilidade</button>
  </form>;
}
