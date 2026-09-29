"use client";

import { useEffect } from "react";

/**
 * First-party, cookie-free measurement for the public SEO pages: clicks on the diagnostic CTAs
 * (elements with data-cta) and how far people read (50% and 90% of the page). Sent to
 * /api/events and shown in the admin dashboard.
 */
function send(event: string, data: Record<string, string | number>) {
  fetch("/api/events", { method: "POST", keepalive: true, headers: { "content-type": "application/json" }, body: JSON.stringify({ events: [{ event, data }] }) }).catch(() => {});
}

export function SeoTracker() {
  useEffect(() => {
    const path = window.location.pathname;
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-cta]");
      if (target) send("cta_click", { where: target.dataset.cta ?? "outro", path });
    };
    const reached = new Set<number>();
    const onScroll = () => {
      const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      for (const mark of [50, 90]) {
        if (scrolled * 100 >= mark && !reached.has(mark)) { reached.add(mark); send("scroll_depth", { depth: mark, path }); }
      }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("scroll", onScroll); };
  }, []);
  return null;
}
