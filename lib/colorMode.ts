"use client";

import { useEffect, useSyncExternalStore } from "react";
import { COLOR_MODE_STORAGE_KEY as STORAGE_KEY } from "./colorModeBoot";

/** What the person picked. "system" follows the phone's own light/dark setting. */
export type ColorMode = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";

const CHANGE_EVENT = "vds-mode-change";
/** Matches the ground colour of each mode, for the browser/PWA status bar. */
const THEME_COLOR: Record<ResolvedMode, string> = { light: "#e9e7e3", dark: "#0f0f10" };

function readStored(): ColorMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "system" ? value : "light";
  } catch {
    return "light";
  }
}

function resolve(mode: ColorMode): ResolvedMode {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function paint(mode: ColorMode) {
  const resolved = resolve(mode);
  document.documentElement.dataset.mode = resolved;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", THEME_COLOR[resolved]));
}

export function setColorMode(mode: ColorMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* private mode: still switch for this visit */ }
  paint(mode);
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

/** The stored choice and what is actually on screen. */
export function useColorMode(): { mode: ColorMode; resolved: ResolvedMode } {
  const mode = useSyncExternalStore(subscribe, readStored, () => "light" as ColorMode);
  const resolved = useSyncExternalStore(subscribe, () => (document.documentElement.dataset.mode === "dark" ? "dark" : "light"), () => "light" as ResolvedMode);

  // In "system" mode, follow the phone when it switches (e.g. automatic dark at night).
  useEffect(() => {
    if (mode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => { paint("system"); window.dispatchEvent(new Event(CHANGE_EVENT)); };
    follow();
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [mode]);

  return { mode, resolved };
}
