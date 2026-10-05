"use client";

import { useEffect } from "react";

const SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2475304135325161";
export const AD_FREE_EVENT = "vds-ad-free";

/** What Google puts on the page: removing these takes the ads away. */
const AD_NODES = "ins.adsbygoogle, .google-auto-placed, iframe[id^='aswift'], iframe[id^='google_ads_iframe'], [id^='google_vignette'], [id^='ad_iframe'], div[id^='google_ads_top_frame']";

function loadAds() {
  if (document.querySelector("script[src*='adsbygoogle.js']")) return;
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = SRC;
  document.head.appendChild(script);
}

/**
 * Google AdSense for every visitor — and none for a Premium account (paid, or the free trial).
 * - No session: the server already put the script in the HTML.
 * - Signed in: the server leaves it out; this asks /api/auth whether the account is Premium and loads it only if not.
 * - Later changes inside the app (signing in, buying Premium, signing out) arrive as an event from the page.
 */
export function Ads() {
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    let adFree = false;
    const root = document.documentElement;
    const strip = () => document.querySelectorAll(AD_NODES).forEach((node) => node.remove());
    const watcher = new MutationObserver(() => { if (adFree) strip(); });

    const apply = (value: boolean) => {
      adFree = value;
      if (value) {
        root.dataset.adFree = "1";
        strip();
        watcher.observe(document.body, { childList: true, subtree: true });
      } else {
        delete root.dataset.adFree;
        watcher.disconnect();
        loadAds();
      }
    };

    const onEvent = (event: Event) => apply(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(AD_FREE_EVENT, onEvent);

    // A browser with a session: ask before loading anything.
    fetch("/api/auth").then((response) => (response.ok ? response.json() as Promise<{ user: unknown; adFree?: boolean }> : null))
      .then((data) => { if (data) apply(Boolean(data.adFree)); })
      .catch(() => {});

    return () => { window.removeEventListener(AD_FREE_EVENT, onEvent); watcher.disconnect(); };
  }, []);
  return null;
}
