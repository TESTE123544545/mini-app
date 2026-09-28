import handler from "vinext/server/fetch-handler";

/**
 * The Worker entry: vinext serves every request, and a cron (see vite.config.ts) renders the
 * "Horóscopo do dia" hub a few times after midnight in Brasília. That creates the day's texts for
 * all twelve signs before any visitor or crawler arrives, so search engines always find today's
 * reading on the page — and each newly created text is announced through IndexNow.
 */
type Handler = { fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> };
const app = handler as unknown as Handler;

const worker = {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(_controller: unknown, env: unknown, ctx: ExecutionContext) {
    const warm = new Request("https://veiasdasintonia.com.br/horoscopo-do-dia", { headers: { "user-agent": "VeiasDaSintonia-warmup/1.0" } });
    ctx.waitUntil(app.fetch(warm, env, ctx).then((response) => response.arrayBuffer()).catch((error) => console.error("warmup_failed", error)));
  },
};

export default worker;
