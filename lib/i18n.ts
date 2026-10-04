/** Languages the app can be shown in. Portuguese is the source; every other one is machine-translated. */
export const LANGUAGES = [
  { code: "pt", native: "Português", english: "Brazilian Portuguese" },
  { code: "en", native: "English", english: "English" },
  { code: "es", native: "Español", english: "Spanish" },
  { code: "fr", native: "Français", english: "French" },
  { code: "de", native: "Deutsch", english: "German" },
  { code: "it", native: "Italiano", english: "Italian" },
  { code: "nl", native: "Nederlands", english: "Dutch" },
  { code: "pl", native: "Polski", english: "Polish" },
  { code: "ru", native: "Русский", english: "Russian" },
  { code: "tr", native: "Türkçe", english: "Turkish" },
  { code: "ar", native: "العربية", english: "Arabic" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "id", native: "Bahasa Indonesia", english: "Indonesian" },
  { code: "vi", native: "Tiếng Việt", english: "Vietnamese" },
  { code: "th", native: "ไทย", english: "Thai" },
  { code: "zh", native: "中文（简体）", english: "Simplified Chinese" },
  { code: "ja", native: "日本語", english: "Japanese" },
  { code: "ko", native: "한국어", english: "Korean" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];
export const LANG_CODES = LANGUAGES.map((language) => language.code) as unknown as readonly [LangCode, ...LangCode[]];
export const DEFAULT_LANG: LangCode = "pt";
export const LANG_STORAGE_KEY = "vds-lang";
/** Bump when the translation prompt changes: older cached translations (server and browser) are then ignored. */
export const TRANSLATION_VERSION = "5";
const RTL: readonly string[] = ["ar"];

/** Search and preview crawlers keep seeing the Portuguese page: it is the one that is indexed. */
export const BOT_PATTERN = "bot|crawl|spider|slurp|lighthouse|pagespeed|headless|preview|facebookexternalhit";
export const isBot = (userAgent: string) => new RegExp(BOT_PATTERN, "i").test(userAgent);

export const isLangCode = (value: unknown): value is LangCode => LANGUAGES.some((language) => language.code === value);
export const languageDir = (code: LangCode) => (RTL.includes(code) ? "rtl" : "ltr");
export const languageEnglishName = (code: LangCode) => LANGUAGES.find((language) => language.code === code)?.english ?? "Brazilian Portuguese";

/**
 * The best match for the browser's language list. A language we don't offer falls back to English,
 * the most widely read; no list at all means the app's own language.
 */
export function detectLanguage(preferred: readonly string[]): LangCode {
  for (const entry of preferred) {
    const primary = entry.slice(0, 2).toLowerCase();
    if (isLangCode(primary)) return primary;
  }
  return preferred.length ? "en" : DEFAULT_LANG;
}

/**
 * Runs before the first paint: picks the saved or detected language, sets lang/dir on <html> and,
 * for a translated language, marks the page as loading so Portuguese is not flashed first.
 * Mirrors detectLanguage above, in plain ES5 for the inline script.
 */
export const LANG_BOOT = `(function(){try{var L=${JSON.stringify(LANG_CODES)};var s=localStorage.getItem("${LANG_STORAGE_KEY}");if(L.indexOf(s)<0){s=null;if(new RegExp("${BOT_PATTERN}","i").test(navigator.userAgent||""))s="pt";var p=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];for(var i=0;i<p.length&&!s;i++){var c=String(p[i]||"").slice(0,2).toLowerCase();if(L.indexOf(c)>-1)s=c}if(!s)s=p[0]?"en":"pt"}var h=document.documentElement;h.setAttribute("lang",s==="pt"?"pt-BR":s);h.setAttribute("dir",${JSON.stringify(RTL)}.indexOf(s)>-1?"rtl":"ltr");if(s!=="pt")h.setAttribute("data-i18n","loading")}catch(e){}})();`;
