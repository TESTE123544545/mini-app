/**
 * Radar da Prosperidade — shared shapes (server, site and Android app).
 * Everything numeric about an opportunity (score, profit, hours "adiantadas") is computed from these fields
 * by lib/radar/math.ts, never written by the AI: the AI only proposes ideas and ranges.
 */

export const SELL_MODELS = [
  ["produtos", "Vender produtos"],
  ["servicos", "Vender serviços"],
  ["conhecimento", "Vender conhecimento"],
  ["conteudo", "Criar conteúdo"],
  ["freelancer", "Trabalhar como freelancer"],
  ["comissao", "Trabalhar com comissão"],
  ["qualquer", "Qualquer oportunidade"],
] as const;
export type SellModel = (typeof SELL_MODELS)[number][0];

export const VISIBILITY = [
  ["aparecer", "Gosto de aparecer nas redes"],
  ["bastidores", "Prefiro trabalhar nos bastidores"],
  ["tanto-faz", "Tanto faz"],
] as const;
export type Visibility = (typeof VISIBILITY)[number][0];

export const SOCIALS = ["Instagram", "TikTok", "WhatsApp", "YouTube", "Facebook", "LinkedIn"] as const;

export type RadarAnswers = {
  likes: string;
  topics: string;
  skills: string;
  helpWith: string;
  hoursPerDay: number;
  investment: number;
  monthlyGoal: number;
  model: SellModel;
  visibility: Visibility;
  equipment: string;
  socials: string[];
  place: string;
  niche: string;
  /** What one hour of the person's time is worth today: typed directly, or estimated from income and hours. */
  hourValue: number | null;
  monthlyIncome: number | null;
  monthlyHours: number | null;
};

export const EMPTY_ANSWERS: RadarAnswers = {
  likes: "", topics: "", skills: "", helpWith: "", hoursPerDay: 2, investment: 100, monthlyGoal: 1500,
  model: "qualquer", visibility: "tanto-faz", equipment: "", socials: [], place: "", niche: "",
  hourValue: null, monthlyIncome: null, monthlyHours: null,
};

export type Range = { min: number; max: number };

/** 1 (low) to 5 (high). */
export type Level = 1 | 2 | 3 | 4 | 5;

export type Opportunity = {
  id: string;
  title: string;
  /** Specific to this person: what they would do, for whom, with what they already have. */
  summary: string;
  whatToSell: string;
  targetCustomer: string;
  problemSolved: string;
  channels: string[];
  firstOffer: string;
  price: Range;
  costPerSale: Range;
  setupCost: Range;
  salesPerMonth: Range;
  /** Working hours one sale takes (delivering it, not selling it). */
  hoursPerSale: number;
  daysToStart: number;
  /** How well it fits what the person said (their skills, interests, equipment, model). */
  fit: Level;
  difficulty: Level;
  /** 5 = a first sale can come fast. */
  speed: Level;
  demand: Level;
  /** 5 = very crowded. */
  competition: Level;
  scale: Level;
  risks: string[];
  resources: string[];
};

export type ScoredOpportunity = Opportunity & { score: number; parts: Record<string, number> };

export type SellPlan = {
  whoBuys: string;
  whatToOffer: string;
  howMuch: string;
  whereToFind: { channel: string; how: string }[];
  howToApproach: string;
  firstOffer: string;
  /** "Seu caminho até a primeira venda": no promise about when the sale happens. */
  path: { day: number; title: string; action: string }[];
};

export type OfferKit = {
  name: string;
  description: string;
  mainBenefit: string;
  price: string;
  salesArgument: string;
  differentials: string[];
  callToAction: string;
  whatsapp: string;
  instagram: string;
  adIdea: string;
  contentIdea: string;
};

export type BoostPlan = {
  levers: { lever: "Preço" | "Volume" | "Novos produtos" | "Upsell" | "Recorrência" | "Indicação" | "Automação" | "Escala"; idea: string; effect: string }[];
  summary: string;
};

export type RadarResult = {
  opportunities: ScoredOpportunity[];
  /** "Se eu estivesse no seu lugar": which one to start with and why. */
  insight: string;
  /** "basic" when the AI was unavailable and the built-in catalogue was used. */
  source: "ai" | "basic";
  plans: Record<string, SellPlan>;
  offers: Record<string, OfferKit>;
  boosts: Record<string, BoostPlan>;
};

export type RadarReport = { id: number; createdAt: string; answers: RadarAnswers; result: RadarResult };
