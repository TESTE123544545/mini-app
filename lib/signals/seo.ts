import type { Metadata } from "next";
import { hourByTime } from "@/lib/signals/hours";

/** Shared by the public "horas iguais" and numerology pages (title, description, canonical, share card). */
export function seoMeta(title: string, description: string, path: string): Metadata {
  return { title: { absolute: `${title} | Veias da Sintonia` }, description, alternates: { canonical: path }, openGraph: { images: ["/og-image.jpg"], title, description, url: path, type: "article" } };
}

export const hourPath = (time: string) => `/horas-iguais/${time.replace(":", "-")}`;
export const hourFromSlug = (slug: string) => hourByTime(slug.replace("-", ":"));
export const lifePathUrl = (n: number) => `/numerologia/caminho-de-vida/${n}`;

export const SYMBOLIC_NOTE = "Numerologia e horas iguais são linguagens simbólicas, usadas para reflexão e autoconhecimento. Não preveem o futuro nem prometem resultados.";
