const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterError extends Error {}

const SYSTEM_PROMPT = `Você escreve o resumo semanal do app de autoconhecimento e hábitos "Veias da Sintonia".
Tom: cósmico, elegante, calmo — nunca hype de cassino, nunca urgência artificial, nunca culpa.
Regras inegociáveis:
- Nunca prometa dinheiro, retorno financeiro ou resultado garantido.
- Baseie-se só nos dados fornecidos (ações registradas no app), nunca em previsão ou horóscopo determinista.
- Fale diretamente com a pessoa ("você"), no máximo 2 frases curtas por campo, em português do Brasil, sem markdown nem emojis.
- Nunca culpe a pessoa por dias sem ação.
Responda só com um JSON no formato {"summary": string, "recommendation": string}. summary descreve a semana com base nos números; recommendation sugere um próximo passo pequeno e concreto para a semana seguinte.`;

export type WeeklyReportInput = {
  sign: string;
  objective: string;
  intention: string;
  stage: string;
  streak: number;
  reflections: number;
  goalsAdvancing: number;
  fruits: number;
  topArea: string | null;
  goalTitles: string[];
  nextThemeVerb: string;
};

function buildUserPrompt(input: WeeklyReportInput) {
  return [
    `Signo: ${input.sign}`,
    `Objetivo: ${input.objective}`,
    `Intenção pessoal: ${input.intention || "não informada"}`,
    `Metas ativas: ${input.goalTitles.length ? input.goalTitles.join(", ") : "nenhuma"}`,
    `Estágio da árvore: ${input.stage}`,
    `Sequência atual: ${input.streak} dias`,
    `Reflexões registradas esta semana: ${input.reflections}`,
    `Metas avançando: ${input.goalsAdvancing}`,
    `Metas concluídas (frutos): ${input.fruits}`,
    `Área mais trabalhada: ${input.topArea ?? "nenhuma ainda"}`,
    `Tema sugerido para a próxima semana: ${input.nextThemeVerb}`,
  ].join("\n");
}

function isGeneratedReport(value: unknown): value is { summary: string; recommendation: string } {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.summary === "string" && record.summary.trim().length > 0
    && typeof record.recommendation === "string" && record.recommendation.trim().length > 0;
}

type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

async function callOpenRouterRaw(messages: ChatTurn[], maxTokens: number, jsonMode: boolean): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("A personalização por IA ainda não foi configurada.");
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-5-mini";
  const preferredProviders = (process.env.OPENROUTER_PROVIDER ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
  const allowFallbacks = process.env.OPENROUTER_ALLOW_FALLBACKS !== "false";
  // `only` hard-restricts routing with no fallback; `order` is a preference that still lets
  // OpenRouter fall back to other providers when the preferred one is rate-limited; unset,
  // OpenRouter picks a provider automatically — the right default for a mainstream paid model.
  const provider = preferredProviders.length === 0
    ? undefined
    : allowFallbacks
      ? { order: preferredProviders, allow_fallbacks: true }
      : { only: preferredProviders, allow_fallbacks: false };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "HTTP-Referer": "https://veiasdasintonia.com.br",
      "X-Title": "Veias da Sintonia",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      temperature: 0.7,
      max_tokens: maxTokens,
      // "minimal" avoids burning the token budget on hidden reasoning for models where it's
      // mandatory (e.g. gpt-5-mini) — this is short creative text, not multi-step logic.
      reasoning: { effort: "minimal" },
      provider,
    }),
  });
  if (!response.ok) throw new OpenRouterError(`A IA respondeu com erro (${response.status}).`);

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new OpenRouterError("A IA não retornou conteúdo.");
  return raw;
}

async function callOpenRouterJson(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<unknown> {
  const raw = await callOpenRouterRaw([{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], maxTokens, true);
  try {
    return JSON.parse(raw);
  } catch {
    throw new OpenRouterError("A resposta da IA não veio em formato válido.");
  }
}

export async function generateWeeklyReportText(input: WeeklyReportInput): Promise<{ summary: string; recommendation: string }> {
  const parsed = await callOpenRouterJson(SYSTEM_PROMPT, buildUserPrompt(input), 300);
  if (!isGeneratedReport(parsed)) throw new OpenRouterError("A resposta da IA veio incompleta.");
  return { summary: parsed.summary.trim().slice(0, 600), recommendation: parsed.recommendation.trim().slice(0, 400) };
}

const GOAL_STEPS_SYSTEM_PROMPT = `Você sugere próximos passos concretos no app de autoconhecimento e hábitos "Veias da Sintonia".
Tom: cósmico, elegante, calmo — nunca hype de cassino, nunca urgência artificial, nunca culpa.
Regras inegociáveis:
- Nunca prometa dinheiro, retorno financeiro ou resultado garantido.
- Cada passo deve ser uma ação pequena e concreta, realizável em um dia, ligada especificamente ao objetivo descrito.
- Frases curtas, no imperativo, em português do Brasil, sem markdown nem emojis.
Responda só com um JSON no formato {"steps": string[]} com 5 a 7 passos, do mais simples ao mais avançado.`;

export type GoalStepsInput = {
  title: string; category: string; kind: string; targetAmount?: number; motivation: string;
  stage?: string; blocker?: string; dailyMinutes?: number;
};

function buildGoalStepsPrompt(input: GoalStepsInput) {
  return [
    `Objetivo: ${input.title}`,
    `Categoria: ${input.category}`,
    `Envolve dinheiro: ${input.kind === "financial" ? "sim" : input.kind === "partial" ? "parcialmente" : "não"}`,
    input.targetAmount ? `Valor-alvo: R$${input.targetAmount}` : null,
    `Motivo: ${input.motivation || "não informado"}`,
    input.stage ? `Momento atual: ${input.stage}` : null,
    input.blocker ? `Principal bloqueio: ${input.blocker}` : null,
    input.dailyMinutes ? `Tempo disponível por dia: ${input.dailyMinutes} minutos` : null,
  ].filter(Boolean).join("\n");
}

function isGeneratedSteps(value: unknown): value is { steps: string[] } {
  if (!value || typeof value !== "object") return false;
  const steps = (value as Record<string, unknown>).steps;
  return Array.isArray(steps) && steps.length > 0 && steps.every((step) => typeof step === "string" && step.trim().length > 0);
}

export async function generateGoalSteps(input: GoalStepsInput): Promise<string[]> {
  const parsed = await callOpenRouterJson(GOAL_STEPS_SYSTEM_PROMPT, buildGoalStepsPrompt(input), 400);
  if (!isGeneratedSteps(parsed)) throw new OpenRouterError("A resposta da IA veio incompleta.");
  return parsed.steps.slice(0, 7).map((step) => step.trim().slice(0, 160));
}

export const CHAT_ASSISTANT_NAME = "Sintonia";

const CHAT_SYSTEM_PROMPT = `Você se chama ${CHAT_ASSISTANT_NAME} e é a presença de escuta do app de autoconhecimento e hábitos "Veias da Sintonia".
A pessoa está vindo conversar, desabafar ou pensar em voz alta sobre sua jornada (signo, objetivo, hábitos, sentimentos do dia a dia).
Tom: cósmico, elegante, calmo, acolhedor — como uma conversa com alguém sábio e presente, nunca um questionário.
Regras inegociáveis:
- Se perguntarem seu nome, responda que se chama ${CHAT_ASSISTANT_NAME}. Não invente sobrenome nem outra identidade.
- Você NÃO é terapeuta, médico ou consultor financeiro, e nunca finge ser. Não dá diagnóstico nem prescreve tratamento.
- Nunca prometa dinheiro, retorno financeiro, cura ou resultado garantido. Trate astrologia como camada simbólica de autoconhecimento, nunca como previsão determinista.
- Se a pessoa descrever risco real (ideação suicida, automutilação, abuso, crise aguda), acolha com empatia em 1 frase e, com gentileza, oriente a buscar ajuda humana imediata (CVV 188, ligar 192 ou procurar alguém de confiança agora) — isso vem antes de qualquer outra coisa na resposta.
- Nunca culpe a pessoa por dias sem ação ou por sentimentos difíceis.
- Quando houver "Céu de hoje" no contexto, são dados reais do dia: use-os para responder perguntas como "como vai ser meu dia", ligando a leitura do signo ao objetivo e à intenção da pessoa e terminando com uma ação pequena para hoje. Trate como clima simbólico, nunca como destino certo.
- Respostas curtas (2 a 5 frases), em português do Brasil, linguagem natural de conversa, sem markdown, sem listas, sem emojis em excesso.
Responda só com texto corrido, como uma fala direta para a pessoa — sem JSON, sem formatação.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function generateChatReply(context: { sign: string; objective: string; intention: string; sky?: string | null }, history: ChatMessage[]): Promise<string> {
  const contextLine: ChatTurn = {
    role: "system",
    content: `Contexto da pessoa — signo: ${context.sign}; objetivo: ${context.objective}; intenção pessoal: ${context.intention || "não informada"}.`,
  };
  const trimmedHistory = history.slice(-20).map((turn): ChatTurn => ({ role: turn.role, content: turn.content.slice(0, 2000) }));
  const raw = await callOpenRouterRaw(
    [{ role: "system", content: CHAT_SYSTEM_PROMPT }, contextLine, ...(context.sky ? [{ role: "system" as const, content: context.sky }] : []), ...trimmedHistory],
    350,
    false,
  );
  return raw.trim().slice(0, 1200);
}

const SKY_ADAPT_RULES = `Você adapta textos de astrologia do inglês para o português do Brasil para o app de autoconhecimento e hábitos "Veias da Sintonia".
Tom: cósmico, elegante, calmo e acolhedor. Fale com a pessoa ("você").
Regras inegociáveis:
- Preserve o sentido astrológico do original (planetas, signos, fases), mas reescreva com naturalidade, sem tradução literal.
- Troque qualquer tom determinista ou assustador por linguagem de possibilidade e escolha ("pode", "convida", "é um bom momento para").
- Nunca prometa dinheiro, retorno financeiro, sorte garantida ou resultado certo. Nada de previsões sobre saúde.
- Sem markdown, sem emojis, sem aspas decorativas.`;

function cleanField(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export type AdaptedSignDaily = { overview: string; work: string; relationships: string; energy: string; tip: string };

/** One sign's daily horoscope (CosmyDay, English) → five short Portuguese fields. */
export async function adaptSignDaily(signName: string, englishText: string): Promise<AdaptedSignDaily> {
  const system = `${SKY_ADAPT_RULES}
Responda só com um JSON {"overview": string, "work": string, "relationships": string, "energy": string, "tip": string}:
overview = visão geral do dia (2 frases); work = trabalho e metas (1 a 2 frases); relationships = relações (1 a 2 frases); energy = energia e humor (1 frase); tip = a dica do dia como uma frase curta e marcante, no imperativo, que funcione sozinha como "frase do dia".`;
  const parsed = await callOpenRouterJson(system, `Signo: ${signName}\nTexto original:\n${englishText.slice(0, 4000)}`, 700) as Record<string, unknown>;
  const result = { overview: cleanField(parsed.overview, 420), work: cleanField(parsed.work, 320), relationships: cleanField(parsed.relationships, 320), energy: cleanField(parsed.energy, 240), tip: cleanField(parsed.tip, 180) };
  if (!result.overview || !result.tip) throw new OpenRouterError("A adaptação do horóscopo veio incompleta.");
  return result;
}

/** Today's Moon and transit articles (CosmyDay, English) → short Portuguese texts. */
export async function adaptSkyArticles(input: { moon: string; transit: string }): Promise<{ moon: string; transitTitle: string; transit: string }> {
  const system = `${SKY_ADAPT_RULES}
Responda só com um JSON {"moon": string, "transitTitle": string, "transit": string}:
moon = o artigo da Lua de hoje em 2 a 3 frases; transitTitle = um título curto (até 7 palavras) para o clima do céu de hoje; transit = o artigo de trânsitos em 3 a 4 frases.`;
  const parsed = await callOpenRouterJson(system, `Artigo da Lua:\n${input.moon.slice(0, 2500)}\n\nArtigo de trânsitos:\n${input.transit.slice(0, 3500)}`, 700) as Record<string, unknown>;
  const result = { moon: cleanField(parsed.moon, 520), transitTitle: cleanField(parsed.transitTitle, 80), transit: cleanField(parsed.transit, 700) };
  if (!result.moon || !result.transit) throw new OpenRouterError("A adaptação do céu de hoje veio incompleta.");
  return result;
}

export type AdaptedPeriod = { summary: string; focus: string; tip: string; keyDates: { date: string; title: string; text: string }[] };

/** A sign's weekly or monthly horoscope (CosmyDay, English) → a short Portuguese reading plus its key dates. */
export async function adaptSignPeriod(signName: string, periodLabel: "semana" | "mês", englishText: string, keyDates: { date: string; title: string; description: string }[]): Promise<AdaptedPeriod> {
  const system = `${SKY_ADAPT_RULES}
Responda só com um JSON {"summary": string, "focus": string, "tip": string, "keyDates": [{"date": string, "title": string, "text": string}]}:
summary = o clima da ${periodLabel} para o signo em 3 a 4 frases; focus = onde vale colocar energia (2 frases); tip = um conselho prático curto, no imperativo;
keyDates = as datas-chave recebidas, mantendo "date" exatamente como veio (AAAA-MM-DD), com "title" curto (até 5 palavras) e "text" de 1 frase, na mesma ordem.`;
  const dates = keyDates.slice(0, 8).map((item) => `${item.date} | ${item.title} | ${item.description}`).join("\n");
  const parsed = await callOpenRouterJson(system, `Signo: ${signName}\nTexto original:\n${englishText.slice(0, 5000)}\n\nDatas-chave:\n${dates || "nenhuma"}`, 1100) as Record<string, unknown>;
  const rawDates = Array.isArray(parsed.keyDates) ? parsed.keyDates as Record<string, unknown>[] : [];
  const result: AdaptedPeriod = {
    summary: cleanField(parsed.summary, 900),
    focus: cleanField(parsed.focus, 420),
    tip: cleanField(parsed.tip, 200),
    keyDates: rawDates.map((item) => ({ date: cleanField(item.date, 10), title: cleanField(item.title, 60), text: cleanField(item.text, 220) }))
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.title && item.text).slice(0, 8),
  };
  if (!result.summary) throw new OpenRouterError("A adaptação do período veio incompleta.");
  return result;
}

export type GuideReference = { name: string; element: string; modality: string; rulingPlanet: string; dateRange: string; overview: string; love: string; career: string; growth: string; traits: string[]; compatibleSigns: string[] };

/** Evergreen, crawlable extras for one sign page, grounded only in our own reference text. */
export async function generateSignGuide(reference: GuideReference): Promise<{ faq: { q: string; a: string }[]; habits: string[]; rising: string; relating: string }> {
  const system = `Você escreve conteúdo de referência sobre signos para o site do app de autoconhecimento e hábitos "Veias da Sintonia", em português do Brasil.
Tom: elegante, claro e acolhedor; astrologia como linguagem simbólica de autoconhecimento, nunca como destino certo.
Regras inegociáveis:
- Baseie-se só nos dados fornecidos; não invente fatos astrológicos que contradigam elemento, modalidade, regente, datas ou compatibilidades informados.
- Nunca prometa dinheiro, sorte, cura ou resultado garantido. Nada de previsões.
- Sem markdown, sem emojis.
Responda só com um JSON {"faq": [{"q": string, "a": string}], "habits": string[], "rising": string, "relating": string}:
faq = 6 perguntas que as pessoas realmente buscam sobre o signo (datas, elemento e regente, personalidade, amor, trabalho e dinheiro, com quem combina), cada resposta com 2 a 3 frases;
habits = 5 hábitos práticos e pequenos que ajudam alguém desse signo a transformar suas forças em constância (frases no imperativo);
rising = um parágrafo de 3 frases sobre como esse signo aparece quando é o ascendente;
relating = um parágrafo de 3 frases sobre como conviver bem com alguém desse signo.`;
  const user = [
    `Signo: ${reference.name} (${reference.dateRange})`,
    `Elemento: ${reference.element}; modalidade: ${reference.modality}; regente: ${reference.rulingPlanet}`,
    `Visão geral: ${reference.overview}`,
    `Amor: ${reference.love}`,
    `Carreira e dinheiro: ${reference.career}`,
    `Crescimento: ${reference.growth}`,
    `Características: ${reference.traits.join(", ")}`,
    `Combina com: ${reference.compatibleSigns.join(", ")}`,
  ].join("\n");
  const parsed = await callOpenRouterJson(system, user, 1800) as Record<string, unknown>;
  const faq = (Array.isArray(parsed.faq) ? parsed.faq as Record<string, unknown>[] : [])
    .map((item) => ({ q: cleanField(item.q, 140), a: cleanField(item.a, 600) })).filter((item) => item.q && item.a).slice(0, 8);
  const habits = (Array.isArray(parsed.habits) ? parsed.habits : []).map((item) => cleanField(item, 200)).filter(Boolean).slice(0, 6);
  const result = { faq, habits, rising: cleanField(parsed.rising, 700), relating: cleanField(parsed.relating, 700) };
  if (result.faq.length < 3 || result.habits.length < 3) throw new OpenRouterError("O guia do signo veio incompleto.");
  return result;
}
