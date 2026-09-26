import type { MetadataRoute } from "next";
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
    ...ZODIAC_SIGNS.map((sign) => ({
      url: `${BASE_URL}/signos/${sign.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
