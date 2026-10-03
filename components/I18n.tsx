"use client";

import { useEffect } from "react";
import { type LangCode } from "@/lib/i18n";
import { paintLanguage, useLanguage } from "@/lib/language";

/**
 * Shows the whole app in the chosen language without rewriting any screen. The source text stays
 * Portuguese; this walks the page, asks /api/translate (cached in the database, then in this browser)
 * for the visible strings and swaps them in place. It only ever writes text and four attributes —
 * never markup — and leaves anything marked translate="no" (names, diary entries, chat) untouched.
 */

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "TITLE"]);
const ATTRS = ["placeholder", "aria-label", "title", "alt"];
const OPT_OUT = '[translate="no"],.notranslate,[contenteditable="true"]';
const MAX_TEXT = 1500;
const BATCH_ITEMS = 50;
const BATCH_CHARS = 8000;
const SAFETY_MS = 1800;

type Slot = { orig: string; shown: string };
const textSlots = new WeakMap<Text, Slot>();
const attrSlots = new WeakMap<Element, Record<string, Slot>>();

let lang: LangCode = "pt";
let cache = new Map<string, string>();
/** Strings waiting to be sent, and every string asked for and not answered yet (never asked twice). */
const pending = new Set<string>();
const requested = new Set<string>();
const failedUntil = new Map<string, number>();
let inflight = 0;
let flushTimer = 0;
let scanTimer = 0;
let persistTimer = 0;
const dirty = new Map<Node, boolean>();

const storageKey = (code: string) => `vds-i18n:${code}`;

function loadCache(code: LangCode) {
  try { return new Map<string, string>(JSON.parse(localStorage.getItem(storageKey(code)) ?? "[]")); } catch { return new Map<string, string>(); }
}

function persist(code: LangCode) {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      const json = JSON.stringify([...cache]);
      if (json.length < 900_000) localStorage.setItem(storageKey(code), json);
    } catch { /* storage full or blocked: the database cache still serves it */ }
  }, 500);
}

function split(value: string) {
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value)!;
  return { lead: match[1], key: match[2].replace(/\s+/g, " "), trail: match[3] };
}

function translatable(key: string) {
  return key.length >= 2 && key.length <= MAX_TEXT && /\p{L}/u.test(key) && !/^(https?:\/\/|www\.)\S+$/i.test(key) && !/^\S+@\S+\.\S+$/.test(key);
}

/** The translation of a piece of text, or null while it is not known yet (it is then requested). */
function lookup(unit: string): string | null {
  const { lead, key, trail } = split(unit);
  if (!translatable(key)) return null;
  const hit = cache.get(key);
  if (hit !== undefined) return lead + hit + trail;
  if ((failedUntil.get(key) ?? 0) < Date.now() && !requested.has(key)) {
    pending.add(key);
    requested.add(key);
    window.clearTimeout(flushTimer);
    flushTimer = window.setTimeout(flush, 60);
  }
  return null;
}

/** Adjacent text nodes (React splits "Olá, {name}!" in three) are translated as one sentence. */
function applyRun(nodes: Text[]) {
  const slots = nodes.map((node) => {
    const value = node.nodeValue ?? "";
    let slot = textSlots.get(node);
    if (!slot || slot.shown !== value) { slot = { orig: value, shown: value }; textSlots.set(node, slot); }
    return slot;
  });
  const unit = slots.map((slot) => slot.orig).join("");
  const out = lang === "pt" || !unit.trim() ? null : lookup(unit);
  nodes.forEach((node, index) => {
    const next = out === null ? slots[index].orig : index === 0 ? out : "";
    if (node.nodeValue !== next) node.nodeValue = next;
    slots[index].shown = next;
  });
}

function applyAttrs(element: Element) {
  for (const name of ATTRS) {
    const value = element.getAttribute(name);
    if (value === null) continue;
    const slots = attrSlots.get(element) ?? {};
    let slot = slots[name];
    if (!slot || slot.shown !== value) slot = slots[name] = { orig: value, shown: value };
    attrSlots.set(element, slots);
    const next = (lang === "pt" ? null : lookup(value)) ?? slot.orig;
    if (next !== value) element.setAttribute(name, next);
    slot.shown = next;
  }
}

function walk(element: Element, deep: boolean) {
  if (SKIP_TAGS.has(element.tagName) || element.matches(OPT_OUT)) return;
  applyAttrs(element);
  // An <option> without a value uses its text as the value: pin the Portuguese one before it is translated.
  if (element.tagName === "OPTION" && !element.hasAttribute("value")) element.setAttribute("value", element.textContent ?? "");
  let run: Text[] = [];
  const flushRun = () => { if (run.length) applyRun(run); run = []; };
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) run.push(child as Text);
    else { flushRun(); if (deep && child.nodeType === Node.ELEMENT_NODE) walk(child as Element, true); }
  }
  flushRun();
}

function scan(node: Node, deep: boolean) {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!element || !element.isConnected || element.closest(OPT_OUT)) return;
  walk(element, deep && node.nodeType === Node.ELEMENT_NODE);
}

/** Queues a re-scan: a whole subtree for added elements, only the node itself (and its text) otherwise. */
function scanSoon(node: Node, deep: boolean) {
  const target = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
  if (!target) return;
  dirty.set(target, (dirty.get(target) ?? false) || (deep && node.nodeType === Node.ELEMENT_NODE));
  if (scanTimer) return;
  scanTimer = window.setTimeout(() => {
    scanTimer = 0;
    const queued = [...dirty];
    dirty.clear();
    for (const [queuedNode, queuedDeep] of queued) scan(queuedNode, queuedDeep);
  }, 30);
}

function settle() {
  if (!pending.size && !inflight) document.documentElement.removeAttribute("data-i18n");
}

async function send(code: LangCode, batch: string[]) {
  try {
    const response = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: code, texts: batch }) });
    if (!response.ok) throw new Error(String(response.status));
    const { translations } = await response.json() as { translations: string[] };
    if (code !== lang) return;
    batch.forEach((key, index) => { if (typeof translations[index] === "string" && translations[index]) cache.set(key, translations[index]); });
    persist(code);
    scanSoon(document.body, true);
  } catch {
    batch.forEach((key) => failedUntil.set(key, Date.now() + 30_000));
  } finally {
    batch.forEach((key) => requested.delete(key));
  }
}

function flush() {
  flushTimer = 0;
  if (lang === "pt") { pending.clear(); return; }
  while (pending.size && inflight < 2) {
    const batch: string[] = [];
    let chars = 0;
    for (const key of pending) {
      if (batch.length >= BATCH_ITEMS || (batch.length && chars + key.length > BATCH_CHARS)) break;
      batch.push(key);
      chars += key.length;
    }
    batch.forEach((key) => pending.delete(key));
    inflight += 1;
    void send(lang, batch).finally(() => { inflight -= 1; if (pending.size) flush(); else settle(); });
  }
}

let observer: MutationObserver | null = null;

function start(code: LangCode) {
  const root = document.documentElement;
  const adminPage = location.pathname.startsWith("/admin");
  lang = adminPage ? "pt" : code;
  cache = loadCache(lang);
  pending.clear();
  requested.clear();
  if (lang === "pt") root.removeAttribute("data-i18n");
  const safety = window.setTimeout(() => root.removeAttribute("data-i18n"), SAFETY_MS);

  scan(document.body, true);
  settle();
  if (lang === "pt") {
    return () => window.clearTimeout(safety);
  }

  observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "childList") {
        record.addedNodes.forEach((added) => {
          scanSoon(added, true);
        });
      } else scanSoon(record.target, false);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => { observer?.disconnect(); observer = null; window.clearTimeout(safety); };
}

export function I18n() {
  const code = useLanguage();
  useEffect(() => {
    paintLanguage(code);
    const stop = start(code);
    return () => {
      stop();
      // Back to the source text before the next language (or none) is applied.
      if (code !== "pt") { lang = "pt"; scan(document.body, true); }
    };
  }, [code]);
  return null;
}
