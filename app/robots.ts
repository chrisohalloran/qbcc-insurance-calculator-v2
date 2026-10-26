import type { MetadataRoute } from "next"

const ANSWER_ENGINE_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Google-Extended",
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      ...ANSWER_ENGINE_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
    ],
    sitemap: "https://www.qbccinsurancecalculator.com.au/sitemap.xml",
  }
}
