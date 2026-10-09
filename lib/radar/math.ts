import type { Opportunity, RadarAnswers, Range, ScoredOpportunity } from "@/lib/radar/types";

/** The numbers of the Radar. Pure functions, used by the server (ranking) and by the screens (simulator). */

export const mid = (range: Range) => (range.min + range.max) / 2;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
export const money = (value: number) => `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
export const moneyRange = (range: Range) => (range.min === range.max ? money(range.min) : `${money(range.min)} a ${money(range.max)}`);

/** VALOR DA HORA = renda mensal / horas trabalhadas no mês (or the value the person typed). */
export function hourValue(answers: Pick<RadarAnswers, "hourValue" | "monthlyIncome" | "monthlyHours">): number | null {
  if (answers.hourValue && answers.hourValue > 0) return answers.hourValue;
  if (answers.monthlyIncome && answers.monthlyHours && answers.monthlyIncome > 0 && answers.monthlyHours > 0) return answers.monthlyIncome / answers.monthlyHours;
  return null;
}

export const profitPerSale = (price: number, cost: number) => price - cost;

/** Sales one month can hold: the hours available divided by the hours each sale takes. */
export function capacity(hoursPerDay: number, hoursPerSale: number) {
  return Math.max(1, Math.floor((hoursPerDay * 30) / Math.max(0.25, hoursPerSale)));
}

/** Profit of a month: sales × (price − variable cost) − the one-time setup (counted once, in the first month). */
export function monthProfit({ sales, price, cost, setup = 0 }: { sales: number; price: number; cost: number; setup?: number }) {
  const revenue = sales * price;
  const costs = sales * cost + setup;
  return { revenue, costs, profit: revenue - costs };
}

/** HORAS ADIANTADAS = lucro / valor da hora. A mathematical picture from the number the person gave, not a promise. */
export const hoursAdvanced = (profit: number, perHour: number | null) => (perHour && perHour > 0 && profit > 0 ? profit / perHour : 0);

export function salesNeeded(goal: number, price: number, cost: number) {
  const each = profitPerSale(price, cost);
  return each > 0 ? Math.ceil(goal / each) : null;
}

export type Scenario = { key: "conservador" | "realista" | "ambicioso"; label: string; note: string; sales: number };

/** Three honest pictures of a month. The ambitious one is labelled as what it is: a stretch, not a forecast. */
export function scenarios(opportunity: Opportunity, hoursPerDay: number): Scenario[] {
  const cap = capacity(hoursPerDay, opportunity.hoursPerSale);
  const low = clamp(Math.round(opportunity.salesPerMonth.min), 1, cap);
  const middle = clamp(Math.round(mid(opportunity.salesPerMonth)), low, cap);
  const high = clamp(Math.round(opportunity.salesPerMonth.max * 1.5), middle, cap);
  return [
    { key: "conservador", label: "Conservador", note: "Poucas vendas, um começo devagar.", sales: low },
    { key: "realista", label: "Realista", note: "Um ritmo intermediário, se você mantiver a rotina.", sales: middle },
    { key: "ambicioso", label: "Ambicioso", note: "Exige mais horas e boa execução. Não é o cenário mais provável.", sales: high },
  ];
}

/** 0-100: how good an opportunity looks for THIS person. The weights are listed so the ranking is explainable. */
export function scoreOpportunity(opportunity: Opportunity, answers: Pick<RadarAnswers, "hoursPerDay" | "investment" | "monthlyGoal">): ScoredOpportunity {
  const price = mid(opportunity.price);
  const cost = mid(opportunity.costPerSale);
  const each = profitPerSale(price, cost);
  const cap = capacity(answers.hoursPerDay, opportunity.hoursPerSale);
  const realisticSales = clamp(Math.round(mid(opportunity.salesPerMonth)), 1, cap);
  const monthly = Math.max(0, realisticSales * each);
  const setup = opportunity.setupCost.max;

  const parts: Record<string, number> = {
    compatibilidade: (opportunity.fit / 5) * 25,
    investimento: (setup <= answers.investment ? 1 : clamp(answers.investment / Math.max(1, setup), 0, 1) * 0.8) * 15,
    facilidade: ((6 - opportunity.difficulty) / 5) * 10,
    lucro: clamp(monthly / Math.max(1, answers.monthlyGoal), 0, 1) * 15,
    demanda: (((opportunity.demand + (6 - opportunity.competition)) / 2) / 5) * 10,
    velocidade: (opportunity.speed / 5) * 10,
    escala: (opportunity.scale / 5) * 5,
    tempo: clamp((answers.hoursPerDay * 30) / Math.max(1, opportunity.hoursPerSale * mid(opportunity.salesPerMonth)), 0, 1) * 10,
  };
  const score = Math.round(Object.values(parts).reduce((sum, part) => sum + part, 0));
  return { ...opportunity, score: clamp(score, 0, 100), parts };
}

export const rank = (opportunities: Opportunity[], answers: Pick<RadarAnswers, "hoursPerDay" | "investment" | "monthlyGoal">) =>
  opportunities.map((item) => scoreOpportunity(item, answers)).sort((a, b) => b.score - a.score);

export const LEVEL_WORDS: Record<number, string> = { 1: "Muito baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito alta" };
export const difficultyWord = (level: number) => ({ 1: "Muito baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito alta" })[level] ?? "Média";
export const speedWord = (level: number) => ({ 1: "Lenta", 2: "Lenta", 3: "Média", 4: "Alta", 5: "Muito alta" })[level] ?? "Média";
export const scaleWord = (level: number) => ({ 1: "Pequeno", 2: "Pequeno", 3: "Médio", 4: "Alto", 5: "Muito alto" })[level] ?? "Médio";

/** "10 horas" / "1 hora e meia" in the language of the screen. */
export function hoursLabel(hours: number) {
  if (hours < 0.5) return "menos de meia hora";
  const rounded = Math.round(hours * 2) / 2;
  if (rounded === 1) return "1 hora";
  return `${String(rounded).replace(".", ",")} horas`;
}
