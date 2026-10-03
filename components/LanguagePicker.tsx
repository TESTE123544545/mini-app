"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LANGUAGES, languageDir, type LangCode } from "@/lib/i18n";
import { setLanguage, useLanguage } from "@/lib/language";

/** Every language as a choice. The names are in their own language and are never translated. */
export function LanguageList({ onPick }: { onPick?: (code: LangCode) => void }) {
  const current = useLanguage();
  return <div className="lang-grid" role="radiogroup" aria-label="Idioma">
    {LANGUAGES.map(({ code, native }) => <button type="button" role="radio" aria-checked={current === code} key={code} translate="no" lang={code} dir={languageDir(code)} onClick={() => { setLanguage(code); onPick?.(code); }}>{native}</button>)}
  </div>;
}

/** A globe in the headers that opens the language choice. */
export function LanguageButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const current = useLanguage();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <button type="button" className={`lang-toggle ${className}`} aria-label="Idioma" title="Idioma"><Globe aria-hidden="true"/><span translate="no">{current}</span></button>
    </DialogTrigger>
    <DialogContent className="goal-dialog">
      <DialogHeader>
        <DialogTitle>Idioma</DialogTitle>
        <DialogDescription>O app é traduzido automaticamente. O texto original é em português.</DialogDescription>
      </DialogHeader>
      <LanguageList onPick={() => setOpen(false)}/>
    </DialogContent>
  </Dialog>;
}
