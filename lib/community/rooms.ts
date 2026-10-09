import { ABUSIVE_PATTERNS, normalize } from "@/lib/moderation";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

/**
 * Comunidade da Sintonia — shared rules (server, site and app).
 * Rooms: one global room and one club per sun sign. A club is open only to members of that sign, and the
 * sign always comes from the birth date on the account (never from a field the person can type).
 */
export type RoomInfo = { id: string; kind: "global" | "club"; name: string; glyph: string; tagline: string; sign?: string };

const GLYPHS: Record<string, string> = { aries: "♈", touro: "♉", gemeos: "♊", cancer: "♋", leao: "♌", virgem: "♍", libra: "♎", escorpiao: "♏", sagitario: "♐", capricornio: "♑", aquario: "♒", peixes: "♓" };

export const ROOMS: readonly RoomInfo[] = [
  { id: "global", kind: "global", name: "Chat Global", glyph: "✦", tagline: "A praça da Sintonia: conversas sobre prosperidade, astrologia e objetivos." },
  ...ZODIAC_SIGNS.map((sign): RoomInfo => ({ id: `clube-${sign.slug}`, kind: "club", name: `Clube de ${sign.name}`, glyph: GLYPHS[sign.slug] ?? "✦", tagline: "Conexões, astrologia e prosperidade", sign: sign.name })),
];

export const roomById = (id: string) => ROOMS.find((room) => room.id === id);
export const clubForSign = (sign: string) => ROOMS.find((room) => room.sign === sign);

export const MAX_MESSAGE = 500;
export const MAX_BIO = 160;
export const MIN_AGE = 18;
export const REPORT_REASONS = ["Ofensa ou assédio", "Spam ou propaganda", "Informação pessoal", "Conteúdo impróprio", "Outro motivo"] as const;

export const RULES = [
  "Respeito sempre: sem ofensas, assédio, discriminação ou ameaças.",
  "Sem spam, propaganda, links, vendas ou pedidos de dinheiro.",
  "Não compartilhe dados pessoais (telefone, endereço, documentos) seus nem de outras pessoas.",
  "Astrologia e prosperidade aqui são conversa e reflexão: ninguém dá promessa de ganho nem aconselhamento financeiro, médico ou psicológico.",
  "A equipe pode apagar mensagens e suspender contas que quebrem estas regras. Você pode denunciar e bloquear quem te incomodar.",
] as const;

export function usernameProblem(value: string) {
  if (!/^[a-z0-9_]{3,20}$/.test(value)) return "Use de 3 a 20 letras minúsculas, números ou _ (sem espaços nem acentos).";
  if (/^(admin|fundador|founder|oficial|veias|sintonia|suporte|moderador)/.test(value)) return "Esse nome é reservado.";
  return null;
}

/** Whole-word match, so words that merely contain a bad word ("pintor") pass. */
export function hasAbuse(text: string) {
  const flat = ` ${normalize(text).replace(/[^a-z0-9]+/g, " ")} `;
  return ABUSIVE_PATTERNS.some((pattern) => flat.includes(` ${normalize(pattern).replace(/[^a-z0-9]+/g, " ").trim()} `));
}

/** Why a message may not be posted, or null. Links and long digit runs (phones, documents) are kept out of the rooms. */
export function messageProblem(text: string, { allowLinks = false }: { allowLinks?: boolean } = {}) {
  const body = text.trim();
  if (!body) return "Escreva uma mensagem.";
  if (body.length > MAX_MESSAGE) return `A mensagem pode ter até ${MAX_MESSAGE} caracteres.`;
  if (hasAbuse(body)) return "Vamos manter a conversa respeitosa. Reescreva a mensagem sem ofensas.";
  if (!allowLinks && /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|io|me|app|xyz|link)\b)/i.test(body)) return "Links não são permitidos na comunidade.";
  if (/(\d[\s.()-]*){9,}/.test(body)) return "Não compartilhe telefone, documentos ou outros números pessoais.";
  if (/(.)\1{9,}/.test(body)) return "Evite repetir o mesmo caractere muitas vezes.";
  return null;
}

/** "yyyy-mm-dd hh:mm:ss" (D1's UTC timestamp) as an ISO string the clients can parse everywhere. */
export const isoTime = (stamp: string) => (stamp.includes("T") ? stamp : `${stamp.replace(" ", "T")}Z`);

export type Badge = "fundador" | "premium";

export type MessageView = {
  id: number; room: string; body: string; createdAt: string; pinned: boolean; removed: boolean;
  replyTo: { id: number; username: string; body: string } | null;
  author: { username: string; displayName: string; sign: string; badges: Badge[] };
  mine: boolean;
};
