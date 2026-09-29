import handler from "vinext/server/fetch-handler";
import { buildMissingArticles } from "@/lib/articles";
import { runTrialEmails } from "@/lib/trialEmails";
import { isCountableView, recordView } from "@/lib/visits";

/**
 * The Worker entry: vinext serves every request, and a cron (see vite.config.ts) renders the
 * "Horóscopo do dia" hub a few times after midnight in Brasília. That creates the day's texts for
 * all twelve signs before any visitor or crawler arrives, so search engines always find today's
 * reading on the page — and each newly created text is announced through IndexNow. It also
 * counts page views (lib/visits.ts) for the admin dashboard.
 */
type Handler = { fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> };
const app = handler as unknown as Handler;

const worker = {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const response = await app.fetch(request, env, ctx);
    // Page views for the admin dashboard, written after the response so visitors never wait for it.
    if (isCountableView(request, response)) ctx.waitUntil(recordView(request).catch((error) => console.error("visit_record_failed", error)));
    return response;
  },
  async scheduled(controller: { cron: string }, env: unknown, ctx: ExecutionContext) {
    // Every 15 minutes: write any long SEO article that doesn't exist yet (a no-op once all do).
    ctx.waitUntil(buildMissingArticles().catch((error) => console.error("articles_failed", error)));
    if (controller.cron === "*/15 * * * *") return;
    const warm = new Request("https://veiasdasintonia.com.br/horoscopo-do-dia", { headers: { "user-agent": "VeiasDaSintonia-warmup/1.0" } });
    ctx.waitUntil(app.fetch(warm, env, ctx).then((response) => response.arrayBuffer()).catch((error) => console.error("warmup_failed", error)));
    // Premium trial e-mails (sent only in daytime in Brasília).
    ctx.waitUntil(runTrialEmails().catch((error) => console.error("trial_emails_failed", error)));
  },
};

export default worker;
