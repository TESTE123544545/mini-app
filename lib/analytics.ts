/**
 * First-party analytics. Events are kept on the device (last 50), broadcast as a
 * `vds:analytics` window event, and sent in small batches to /api/events, which stores them in
 * the app's own database — no third-party service is loaded. The admin funnel in Perfil reads them.
 */
export type AnalyticsEvent =
  | "diagnostic_started"
  | "diagnostic_question_answered"
  | "diagnostic_completed"
  | "diagnostic_result_viewed"
  | "diagnostic_restarted"
  | "prosperity_tree_opened"
  | (string & {});

type Item = { event: string; data: Record<string, unknown>; at: string };

const STORAGE_KEY = "vds-analytics";
const MAX_EVENTS = 50;
/** Per-question answers are too chatty to store server-side; the rest of the funnel is kept. */
const LOCAL_ONLY = new Set(["diagnostic_question_answered"]);

const queue: Item[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 20);
  // keepalive lets the request finish even when the page is closing.
  void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ events }), keepalive: true, credentials: "same-origin" }).catch(() => {});
  if (queue.length) timer = setTimeout(flush, 1000);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
}

export function track(event: AnalyticsEvent, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const item: Item = { event, data, at: new Date().toISOString() };
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...(Array.isArray(events) ? events : []).slice(-(MAX_EVENTS - 1)), item]));
  } catch { /* storage blocked or corrupted: still broadcast the event */ }
  window.dispatchEvent(new CustomEvent("vds:analytics", { detail: item }));
  if (LOCAL_ONLY.has(event)) return;
  queue.push(item);
  if (!timer) timer = setTimeout(flush, 2000);
}
