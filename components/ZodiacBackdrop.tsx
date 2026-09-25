"use client";

import { useEffect, useRef, useState } from "react";
import { SIGNS, getSignByName } from "@/lib/signs";

/**
 * The app's background: the twelve zodiac sculptures (Áries → Peixes), one still image each.
 * It starts on the person's own sign and moves on to the next one when they scroll down or change
 * tab, with a soft crossfade. Stills replaced a scroll-scrubbed video: decoding video behind
 * scrolling content stuttered on phones, while a composited opacity fade costs almost nothing.
 */
const SIGN_IDS = SIGNS.map((sign) => sign.id);
const imageFor = (index: number) => `/zodiac/${SIGN_IDS[index]}.webp`;
/** Scrolling this far down moves the background on to the next sign. */
const PX_PER_SIGN = 900;
/** Matches the CSS fade; the outgoing image is dropped once the new one covers it. */
const FADE_MS = 900;

export function ZodiacBackdrop({ step, sign }: { step: string; sign?: string }) {
  const [layers, setLayers] = useState(() => {
    const start = Math.max(0, SIGN_IDS.indexOf(getSignByName(sign ?? "").id));
    return { current: start, previous: null as number | null };
  });
  const firstStep = useRef(true);

  const advance = () => setLayers((state) => ({ current: (state.current + 1) % SIGN_IDS.length, previous: state.current }));

  // Scrolling down accumulates distance; scrolling up leaves the sign where it is.
  useEffect(() => {
    let lastY = window.scrollY;
    let travelled = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY) {
        travelled += y - lastY;
        if (travelled >= PX_PER_SIGN) { travelled = 0; advance(); }
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Each tab change moves on to the next sign.
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    advance();
  }, [step]);

  // Drop the outgoing layer after the fade, and warm the cache for the sign that comes next.
  useEffect(() => {
    const preload = new Image();
    preload.src = imageFor((layers.current + 1) % SIGN_IDS.length);
    if (layers.previous === null) return;
    const timer = window.setTimeout(() => setLayers((state) => ({ ...state, previous: null })), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [layers]);

  // Plain <img>: the stills are already sized and encoded as small WebP files, nothing left for next/image to do.
  /* eslint-disable @next/next/no-img-element */
  return <div className="zodiac-backdrop" aria-hidden="true">
    {layers.previous !== null && <img key={`previous-${layers.previous}`} src={imageFor(layers.previous)} alt="" decoding="async" />}
    <img key={`current-${layers.current}`} src={imageFor(layers.current)} alt="" decoding="async" className={layers.previous !== null ? "is-entering" : ""} />
  </div>;
  /* eslint-enable @next/next/no-img-element */
}
