"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematic entrance after login. The first time an account enters on a device it gets the
 * full journey (corredor dos signos → portal, ~16–18s), later entries a ~2.5s portal crossing.
 * Both end on the video's own golden flash, which this overlay holds and fades into the app.
 */
export type IntroMode = "full" | "short";

type Orientation = "portrait" | "landscape";

/** Phones get 9:16 cuts; desktops and landscape tablets keep the original 16:9 footage. */
const SOURCES: Record<IntroMode, Record<Orientation, string>> = {
  full: { portrait: "/intro-journey-portrait.mp4", landscape: "/intro-journey.mp4" },
  short: { portrait: "/intro-portal-short-portrait.mp4", landscape: "/intro-portal-short.mp4" },
};
/** Upper bound in case the video stalls or `ended` never fires (slow network, battery saver). */
const MAX_PLAY_MS: Record<IntroMode, number> = { full: 21_000, short: 5_000 };
const FLASH_MS = 1_100;

const seenKey = (accountKey: string) => `vds-intro-seen:${accountKey}`;

export function introModeFor(accountKey: string | undefined): IntroMode {
  if (!accountKey) return "short";
  try { return localStorage.getItem(seenKey(accountKey)) ? "short" : "full"; } catch { return "short"; }
}

function markIntroSeen(accountKey: string | undefined) {
  if (!accountKey) return;
  try { localStorage.setItem(seenKey(accountKey), new Date().toISOString()); } catch { /* storage blocked */ }
}

export function IntroExperience({ mode, accountKey, onComplete }: { mode: IntroMode; accountKey?: string; onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"playing" | "flash">("playing");
  // Chosen once: the overlay only ever renders on the client, after login state is known.
  const [orientation] = useState<Orientation>(() => window.matchMedia?.("(orientation: portrait)").matches ? "portrait" : "landscape");
  const finishing = useRef(false);
  // The parent re-renders often (sync, timers); keep the latest callback without restarting the flash timer.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  function finish() {
    if (finishing.current) return;
    finishing.current = true;
    markIntroSeen(accountKey);
    setPhase("flash");
  }

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const video = videoRef.current;
    if (reduceMotion || !video) { finish(); return; }
    video.muted = true;
    // Autoplay can be refused (iOS low-power mode, data saver): go straight to the flash instead of a black
    // screen. Other rejections (a play() interrupted by loading) are harmless — autoPlay and the guard cover them.
    video.play().catch((error: unknown) => { if (error instanceof DOMException && error.name === "NotAllowedError") finish(); });
    const guard = window.setTimeout(finish, MAX_PLAY_MS[mode]);
    return () => window.clearTimeout(guard);
  // Runs once per mount; `finish` only touches refs and state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "flash") return;
    const timer = window.setTimeout(() => onCompleteRef.current(), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return <div className={`intro-overlay is-${phase}`} role="presentation">
    <video
      ref={videoRef}
      className="intro-video"
      src={SOURCES[mode][orientation]}
      autoPlay
      muted
      playsInline
      preload="auto"
      onEnded={finish}
      onError={finish}
      aria-hidden="true"
    />
    <span className="intro-flash" aria-hidden="true" />
    {phase === "playing" && <button type="button" className="intro-skip" onClick={finish}>Pular</button>}
  </div>;
}
