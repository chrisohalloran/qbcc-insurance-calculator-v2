import type { Metadata } from "next"
import { guides } from "./guides-data"
import GuidePageClient from "./GuidePageClient"
import { notFound } from "next/navigation"

// Define params type separately to avoid conflicts
type PageParams = {
  slug: string
}

// Use the correct approach for Next.js 15.x
export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  // Log for debugging
  console.log("Generating metadata for slug:", params.slug)
  console.log("Available guide keys:", Object.keys(guides))

  // Type guard to check if the slug is a valid key in guides
  if (!(params.slug in guides)) {
    console.error(`Guide not found for slug: ${params.slug}`)
    return {
      title: "Guide Not Found",
      description: "The requested guide could not be found.",
    }
  }

  const guide = guides[params.slug as keyof typeof guides]

  return {
    title: `${guide.title} | QBCC Insurance Guide`,
    description: guide.description,
    keywords: [
      "QBCC insurance",
      "home warranty",
      params.slug.replace(/-/g, " "),
      "Queensland building insurance",
      "QBCC guide",
    ],
    openGraph: {
      type: "article",
      locale: "en_AU",
      url: `https://qbccinsurancecalculator.com.au/guides/${params.slug}`,
      title: guide.title,
      description: guide.description,
      siteName: "QBCC Home Warranty Insurance Calculator",
      publishedTime: guide.publishedDate,
      modifiedTime: guide.updatedDate || undefined,
    },
  }
}

// Use the correct typing for Next.js 15.x page component
export default async function GuidePage({
  params,
}: {
  params: PageParams
}) {
  // Log for debugging
  console.log("Rendering guide page for slug:", params.slug)

  // Type guard to check if the slug is a valid key in guides
  if (!(params.slug in guides)) {
    console.error(`Guide not found for slug: ${params.slug}`)
    notFound()
  }

  return <GuidePageClient params={params} />
}

// Generate static paths for all guides
export function generateStaticParams(): Array<{ slug: string }> {
  const slugs = Object.keys(guides).map((slug) => ({ slug }))
  console.log("Generated static paths:", slugs)
  return slugs
}
