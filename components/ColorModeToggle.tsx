"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { setColorMode, useColorMode, type ColorMode } from "@/lib/colorMode";

/** One tap between light and dark, for headers. */
export function ColorModeToggle({ className = "" }: { className?: string }) {
  const { resolved } = useColorMode();
  const next = resolved === "dark" ? "light" : "dark";
  return <button type="button" className={`mode-toggle ${className}`} onClick={() => setColorMode(next)} aria-label={next === "dark" ? "Ativar tema escuro" : "Ativar tema claro"} title={next === "dark" ? "Tema escuro" : "Tema claro"}>
    {resolved === "dark" ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}
  </button>;
}

const OPTIONS: [ColorMode, string, typeof Sun][] = [["light", "Claro", Sun], ["dark", "Escuro", Moon], ["system", "Automático", Monitor]];

/** The full choice, including following the phone's own setting. */
export function ColorModePicker() {
  const { mode } = useColorMode();
  return <div className="mode-picker" role="radiogroup" aria-label="Tema do app">
    {OPTIONS.map(([value, label, Icon]) => <button type="button" role="radio" aria-checked={mode === value} key={value} onClick={() => setColorMode(value)}><Icon aria-hidden="true"/>{label}</button>)}
  </div>;
}
