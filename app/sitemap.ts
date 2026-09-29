import type { MetadataRoute } from "next";
import { SIGN_TOPICS } from "@/lib/articles";
import { allPairs, pairSlug } from "@/lib/compat";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

const BASE_URL = "https://veiasdasintonia.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/signos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...["/privacidade", "/termos"].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: new Date("2026-09-28"), changeFrequency: "yearly" as const, priority: 0.2 })),
    ...["/astrologia-e-dinheiro", "/compatibilidade-amorosa"].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 })),
    ...ZODIAC_SIGNS.flatMap((sign) => SIGN_TOPICS.map((topic) => ({ url: `${BASE_URL}/signos/${sign.slug}/${topic.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 }))),
    ...allPairs().map(([a, b]) => ({ url: `${BASE_URL}/compatibilidade/${pairSlug(a, b)}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 })),
    {
      url: `${BASE_URL}/horoscopo-do-dia`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...ZODIAC_SIGNS.map((sign) => ({
      url: `${BASE_URL}/horoscopo-do-dia/${sign.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...ZODIAC_SIGNS.map((sign) => ({
      url: `${BASE_URL}/signos/${sign.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
