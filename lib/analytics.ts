/**
 * Local analytics layer. Events are kept on the device (last 50) and broadcast as a
 * `vds:analytics` window event, so a real provider can be plugged in later by listening
 * to that event — no external service is loaded today.
 */
export type AnalyticsEvent =
  | "diagnostic_started"
  | "diagnostic_question_answered"
  | "diagnostic_completed"
  | "diagnostic_result_viewed"
  | "diagnostic_restarted"
  | "prosperity_tree_opened"
  | (string & {});

const STORAGE_KEY = "vds-analytics";
const MAX_EVENTS = 50;

export function track(event: AnalyticsEvent, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const item = { event, data, at: new Date().toISOString() };
  try {
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...(Array.isArray(events) ? events : []).slice(-(MAX_EVENTS - 1)), item]));
  } catch { /* storage blocked or corrupted: still broadcast the event */ }
  window.dispatchEvent(new CustomEvent("vds:analytics", { detail: item }));
}
