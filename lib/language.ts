"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LANG, LANG_STORAGE_KEY, detectLanguage, isBot, isLangCode, languageDir, type LangCode } from "@/lib/i18n";

const CHANGE_EVENT = "vds-lang-change";

/** What the person picked, else the best match for their browser's language. */
export function getLanguage(): LangCode {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLangCode(saved)) return saved;
  } catch { /* private mode: fall through to detection */ }
  if (isBot(navigator.userAgent)) return DEFAULT_LANG;
  return detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function paintLanguage(code: LangCode) {
  const root = document.documentElement;
  root.lang = code === "pt" ? "pt-BR" : code;
  root.dir = languageDir(code);
}

export function setLanguage(code: LangCode) {
  try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch { /* private mode: still switch for this visit */ }
  paintLanguage(code);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLanguage(): LangCode {
  return useSyncExternalStore(subscribe, getLanguage, () => DEFAULT_LANG);
}
