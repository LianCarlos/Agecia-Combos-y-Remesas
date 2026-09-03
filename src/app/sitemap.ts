import type { MetadataRoute } from "next";

const BASE_URL = "https://www.mrfactusremesas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
