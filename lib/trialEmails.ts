import { waitUntil } from "cloudflare:workers";
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import { emailIsConfigured, escapeHtml, sendEmail } from "@/lib/email";
import { isBlockedEmail } from "@/lib/emailPolicy";
import { TRIAL_DAYS, WELCOME_OFFER_PERCENT, welcomeOfferEndsAt } from "@/lib/plan";

/**
 * The trial sequence: day 1 (welcome, at sign-up), day 2 (what to explore), day 3 (last day, with
 * the welcome offer) and a note once the trial has ended (the offer's real deadline as a date).
 * Honest by design: no countdown pressure, no guilt; when the trial ends the account goes back
 * to the free plan, nothing is charged and the journey stays saved.
 */

const SITE = "https://veiasdasintonia.com.br";
type TrialUser = { id: string; email: string; trialEndsAt: string | null; emailToken: string | null };

const TZ = "America/Sao_Paulo";
const whenEnds = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(/ (\d{2}:\d{2})$/, " às $1");
const whenDay = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "numeric", month: "long" }).format(new Date(iso));
const unsubscribeUrl = (token: string | null) => (token ? `${SITE}/api/email/unsubscribe?t=${encodeURIComponent(token)}` : null);
const listUnsubscribe = (url: string | null) => (url ? { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined);
const gold = (text: string) => `<strong style="color:#eef1f8">${text}</strong>`;

const FEATURES = [
  ["Diagnóstico completo", "o resultado inteiro, com o que está influenciando sua prosperidade"],
  ["Conversa com a IA", "desabafe, pense em voz alta ou peça um conselho a qualquer hora"],
  ["Seu signo todo dia", "horóscopo do dia, da semana e do mês, com o céu ao vivo"],
  ["Árvore da Prosperidade", "missões, jornadas e o diário que fazem sua árvore crescer"],
];
const DAY2_IDEAS = [
  ["Pergunte à IA sobre o seu momento", "conte o que está vivendo e peça um próximo passo pequeno e concreto"],
  ["Leia o seu signo de hoje", "a frase do dia, trabalho, amor e energia — e o céu ao vivo"],
  ["Complete a missão do dia", "cada missão faz a sua Árvore da Prosperidade crescer"],
];

/** The celestial look: deep navy, a fine gold frame, the gold hearts mark and a gold pill. */
function layout({ eyebrow, title, paragraphs, list, cta, footnote, unsubscribe }: { eyebrow: string; title: string; paragraphs: string[]; list?: string[][]; cta: { label: string; url: string }; footnote: string; unsubscribe: string | null }) {
  const items = list ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;width:100%">${list.map(([name, text]) => `<tr><td style="padding:0 12px 12px 0;vertical-align:top;color:#e6c47a;font-size:16px">✦</td><td style="padding:0 0 12px;color:#c3cbe0;font-size:15px;line-height:1.5"><strong style="color:#eef1f8">${name}</strong> — ${text}</td></tr>`).join("")}</table>` : "";
  return `<div style="background:#070f24;padding:32px 14px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:540px;margin:auto;background:#0e1a3a;border:1px solid #6b5a33;border-radius:22px;padding:34px 28px;text-align:left">
<img src="${SITE}/app-icon-192.png" width="56" height="56" alt="Veias da Sintonia" style="display:block;border-radius:14px;margin:0 0 20px">
<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#e6c47a">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.2;font-weight:600;color:#f1d9a0">${escapeHtml(title)}</h1>
${paragraphs.map((text) => `<p style="margin:0 0 14px;color:#c3cbe0;font-size:15px;line-height:1.6">${text}</p>`).join("")}
${items}
<p style="margin:26px 0 24px"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#d9b26a;color:#0b1633;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1.5px;text-transform:uppercase;padding:15px 28px;border-radius:999px">${escapeHtml(cta.label)}</a></p>
<p style="margin:0;color:#8d99bb;font-size:13px;line-height:1.55">${footnote}</p>
</div>
<p style="max-width:540px;margin:18px auto 0;color:#6f7ca0;font-size:12px;line-height:1.5;text-align:center">Veias da Sintonia · conteúdo para entretenimento e autoconhecimento, não uma previsão.${unsubscribe ? `<br><a href="${escapeHtml(unsubscribe)}" style="color:#8d99bb">Não quero mais receber estes e-mails</a>` : ""}</p>
</div>`;
}

const plain = (lines: string[], unsubscribe: string | null) => `${lines.join("\n\n")}${unsubscribe ? `\n\nNão quer mais receber estes e-mails? ${unsubscribe}` : ""}`;

async function sendDay1(user: TrialUser) {
  const ends = whenEnds(user.trialEndsAt!);
  const unsubscribe = unsubscribeUrl(user.emailToken);
  await sendEmail({
    to: user.email,
    subject: `Seu Premium está liberado por ${TRIAL_DAYS} dias ✦`,
    headers: listUnsubscribe(unsubscribe),
    text: plain([`Boas-vindas ao Veias da Sintonia!`, `Como presente de boas-vindas, sua conta tem o Premium completo liberado por ${TRIAL_DAYS} dias, até ${ends}. Sem cartão e sem cobrança automática.`, FEATURES.map(([name, text]) => `• ${name}: ${text}`).join("\n"), `Comece pelo diagnóstico: ${SITE}/`, "Quando o teste terminar, sua conta volta sozinha ao plano grátis — nada é cobrado e sua jornada fica salva."], unsubscribe),
    html: layout({
      eyebrow: "Dia 1 · presente de boas-vindas",
      title: `Seu Premium está liberado por ${TRIAL_DAYS} dias`,
      paragraphs: [`Que bom ter você aqui. Para você sentir o app por inteiro, sua conta tem ${gold(`todo o Premium liberado até ${escapeHtml(ends)}`)} — sem cartão e sem cobrança automática.`, "Comece pelo diagnóstico: em poucos minutos você vê o resultado completo e o que ele diz sobre o seu momento."],
      list: FEATURES,
      cta: { label: "Fazer meu diagnóstico", url: `${SITE}/` },
      footnote: "Quando o teste terminar, sua conta volta sozinha ao plano grátis. Nada é cobrado e sua jornada continua salva.",
      unsubscribe,
    }),
  });
}

async function sendDay2(user: TrialUser) {
  const unsubscribe = unsubscribeUrl(user.emailToken);
  await sendEmail({
    to: user.email,
    subject: "Dia 2: três coisas para experimentar no Premium",
    headers: listUnsubscribe(unsubscribe),
    text: plain(["Seu teste do Premium continua. Hoje, três ideias para aproveitar:", DAY2_IDEAS.map(([name, text]) => `• ${name}: ${text}`).join("\n"), `Abrir o app: ${SITE}/`], unsubscribe),
    html: layout({
      eyebrow: "Dia 2 · seu teste Premium",
      title: "Três coisas para experimentar hoje",
      paragraphs: ["Seu teste continua — tudo liberado. Se tiver só alguns minutos hoje, estas são as partes que as pessoas mais gostam:"],
      list: DAY2_IDEAS,
      cta: { label: "Abrir o app", url: `${SITE}/` },
      footnote: `Seu teste vai até ${escapeHtml(whenEnds(user.trialEndsAt!))}.`,
      unsubscribe,
    }),
  });
}

async function sendDay3(user: TrialUser) {
  const ends = whenEnds(user.trialEndsAt!);
  const offerEnds = whenDay(welcomeOfferEndsAt(user)!);
  const unsubscribe = unsubscribeUrl(user.emailToken);
  await sendEmail({
    to: user.email,
    subject: `Último dia do seu teste — e ${WELCOME_OFFER_PERCENT}% no seu primeiro mês`,
    headers: listUnsubscribe(unsubscribe),
    text: plain([`Seu teste do Premium vai até ${ends}.`, `Se o app está fazendo sentido para você, dá para continuar com tudo liberado — e, como presente de boas-vindas, o seu primeiro mês sai com ${WELCOME_OFFER_PERCENT}% de desconto (válido até ${offerEnds}).`, `Continuar com o Premium: ${SITE}/?abrir=premium`, "Se preferir não assinar, não precisa fazer nada: sua conta continua no plano grátis e sua jornada fica salva."], unsubscribe),
    html: layout({
      eyebrow: "Dia 3 · último dia do teste",
      title: `${WELCOME_OFFER_PERCENT}% no seu primeiro mês de Premium`,
      paragraphs: [`Seu teste vai até ${gold(escapeHtml(ends))}.`, `Se o app está fazendo sentido para você, dá para continuar com tudo liberado — e, como presente de boas-vindas, ${gold(`o seu primeiro mês sai com ${WELCOME_OFFER_PERCENT}% de desconto`)}. A oferta vale até ${escapeHtml(offerEnds)}.`],
      cta: { label: `Assinar com ${WELCOME_OFFER_PERCENT}% no 1º mês`, url: `${SITE}/?abrir=premium` },
      footnote: "Se preferir não assinar, não precisa fazer nada: sua conta continua no plano grátis e tudo o que você construiu fica salvo. Sem fidelidade — cancele quando quiser.",
      unsubscribe,
    }),
  });
}

async function sendEnded(user: TrialUser) {
  const offerEnds = whenDay(welcomeOfferEndsAt(user)!);
  const unsubscribe = unsubscribeUrl(user.emailToken);
  await sendEmail({
    to: user.email,
    subject: "Seu teste Premium terminou — sua jornada continua salva",
    headers: listUnsubscribe(unsubscribe),
    text: plain(["Obrigado por experimentar o Premium do Veias da Sintonia.", "Seu teste terminou e sua conta voltou ao plano grátis — nada foi cobrado. Sua árvore, suas metas e seu diário continuam salvos.", `O desconto de ${WELCOME_OFFER_PERCENT}% no primeiro mês continua valendo até ${offerEnds}: ${SITE}/?abrir=premium`], unsubscribe),
    html: layout({
      eyebrow: "Obrigado por experimentar",
      title: "Seu teste Premium terminou",
      paragraphs: ["Sua conta voltou ao plano grátis — nada foi cobrado. Sua árvore, suas metas e seu diário continuam salvos, do jeito que você deixou.", `Se quiser voltar a ter tudo liberado, ${gold(`os ${WELCOME_OFFER_PERCENT}% de desconto no primeiro mês continuam valendo até ${escapeHtml(offerEnds)}`)}.`],
      cta: { label: "Assinar o Premium", url: `${SITE}/?abrir=premium` },
      footnote: "Sem fidelidade: você pode assinar quando quiser e cancelar quando quiser.",
      unsubscribe,
    }),
  });
}

/** Day-1 e-mail right after sign-up, sent after the response so sign-up never waits on it. */
export function sendTrialWelcome(user: TrialUser) {
  if (!emailIsConfigured() || !user.trialEndsAt || isBlockedEmail(user.email)) return;
  const job = sendDay1(user).catch((error) => console.error("trial_day1_failed", error));
  try { waitUntil(job); } catch { /* outside a request context */ }
}

/**
 * Run by the cron, in daytime in Brasília. For each account in (or just out of) its trial, sends the
 * one message now due — ended, else day 3, else day 2 — and marks the earlier ones as done, so
 * nobody gets two in a row. Never to paying, opted-out or test accounts.
 */
export async function runTrialEmails(now = new Date()) {
  if (!emailIsConfigured()) return;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(now));
  if (hour < 8 || hour > 21) return;
  const db = getDb();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const notPaying = sql`COALESCE((SELECT plan FROM ${profiles} WHERE ${profiles.deviceId} = ${users.primaryDeviceId}), 'free') <> 'premium'`;
  const candidates = await db.select().from(users).where(and(
    eq(users.emailOptOut, false), isNull(users.trialEndedSentAt), notPaying,
    gt(users.trialEndsAt, new Date(nowMs - 3 * 86_400_000).toISOString()),
    lte(users.createdAt, new Date(nowMs - 20 * 3_600_000).toISOString()),
  )).limit(100);

  for (const user of candidates) {
    if (!user.trialEndsAt || isBlockedEmail(user.email)) continue;
    const endsMs = new Date(user.trialEndsAt).getTime();
    try {
      if (endsMs <= nowMs) {
        await sendEnded(user);
        await db.update(users).set({ trialEndedSentAt: nowIso, trialReminderSentAt: user.trialReminderSentAt ?? nowIso, trialDay2SentAt: user.trialDay2SentAt ?? nowIso }).where(eq(users.id, user.id));
      } else if (!user.trialReminderSentAt && endsMs - nowMs <= 30 * 3_600_000) {
        await sendDay3(user);
        await db.update(users).set({ trialReminderSentAt: nowIso, trialDay2SentAt: user.trialDay2SentAt ?? nowIso }).where(eq(users.id, user.id));
      } else if (!user.trialDay2SentAt && !user.trialReminderSentAt) {
        await sendDay2(user);
        await db.update(users).set({ trialDay2SentAt: nowIso }).where(eq(users.id, user.id));
      }
    } catch (error) { console.error("trial_email_failed", error); }
  }
}
