"use client";

import { useEffect, useRef } from "react";
import { SIGNS, getSignByName } from "@/lib/signs";

/**
 * The app's background: a 60s pass through the twelve zodiac sculptures (Áries → Peixes,
 * ~5s each) that never plays on its own. It moves forward only when the person scrolls down
 * or changes tab, so the universe reacts to them instead of looping behind the content.
 */
const SRC = "/zodiac-bg-v2.mp4";
const SEGMENT_S = 5;
/** Scrolling this many pixels down advances the video by one second. */
const PX_PER_SECOND = 320;
/** Offset into a sign's segment where the sculpture is already on screen. */
const SIGN_ENTRY_S = 1;
/** A long fling should not queue up half a minute of catch-up playback. */
const MAX_LEAD_S = 6;

export function ZodiacBackdrop({ step, sign }: { step: string; sign?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Absolute timeline position we want to reach (seconds; keeps growing across loops).
  const target = useRef(0);
  const loops = useRef(0);
  const lastTime = useRef(0);
  const frame = useRef<number | null>(null);
  const reduceMotion = useRef(false);
  const firstStep = useRef(true);

  function absoluteTime(video: HTMLVideoElement) {
    // The element loops on its own; count each wrap so the target can keep moving forward.
    if (video.currentTime + 1 < lastTime.current) loops.current += 1;
    lastTime.current = video.currentTime;
    return loops.current * video.duration + video.currentTime;
  }

  function tick() {
    frame.current = null;
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const remaining = target.current - absoluteTime(video);
    if (remaining <= 0.04) { if (!video.paused) video.pause(); return; }
    // Touch the rate only in coarse steps: re-setting it every frame makes decoders hiccup on phones.
    const rate = Math.round(Math.min(2.5, Math.max(0.75, remaining * 0.9)) * 4) / 4;
    if (Math.abs(video.playbackRate - rate) >= 0.25) video.playbackRate = rate;
    if (video.paused) video.play().catch(() => { /* background autoplay refused: stay on the current frame */ });
    frame.current = requestAnimationFrame(tick);
  }

  function advanceTo(nextTarget: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const now = absoluteTime(video);
    target.current = Math.min(nextTarget, now + MAX_LEAD_S);
    if (reduceMotion.current) {
      // No scrubbing motion: jump straight to where the step would have landed.
      video.currentTime = target.current % video.duration;
      lastTime.current = video.currentTime;
      loops.current = Math.floor(target.current / video.duration);
      return;
    }
    if (frame.current === null) frame.current = requestAnimationFrame(tick);
  }

  // Start on the person's own sign, paused.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    reduceMotion.current = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const index = Math.max(0, SIGNS.findIndex((item) => item.id === getSignByName(sign ?? "").id));
    const start = index * SEGMENT_S + SIGN_ENTRY_S;
    const place = () => {
      video.pause();
      video.currentTime = start;
      lastTime.current = start;
      target.current = start;
    };
    if (video.readyState >= 1) place(); else video.addEventListener("loadedmetadata", place, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", place);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  // The starting sign is decided once; later sign edits should not yank the background around.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolling down moves the universe forward; scrolling up leaves it where it is.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (delta > 0 && !reduceMotion.current) advanceTo(target.current + delta / PX_PER_SECOND);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  // advanceTo only reads refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Each tab change glides on to the next sign.
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const now = absoluteTime(video);
    advanceTo((Math.floor(now / SEGMENT_S) + 1) * SEGMENT_S + SIGN_ENTRY_S);
  // advanceTo only reads refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return <video ref={videoRef} className="galaxy-bg-video" src={SRC} muted loop playsInline preload="auto" disablePictureInPicture disableRemotePlayback aria-hidden="true" />;
}
