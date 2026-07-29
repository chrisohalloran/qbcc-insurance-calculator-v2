"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Calendar, Share2 } from "lucide-react"
import { notFound } from "next/navigation"
import { guides } from "./guides-data"

type ClientProps = {
  params: { slug: string }
}

export default function GuidePageClient({ params }: ClientProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guideData, setGuideData] = useState<any>(null)

  useEffect(() => {
    try {
      // Log the params for debugging
      console.log("Guide params:", params)

      if (!params || !params.slug) {
        setError("No slug parameter provided")
        setIsLoading(false)
        return
      }

      // Log available guide keys for debugging
      console.log("Available guide keys:", Object.keys(guides))

      // Type guard to check if the slug is a valid key in guides
      if (!(params.slug in guides)) {
        console.error(`Guide not found for slug: ${params.slug}`)
        setError(`Guide not found for: ${params.slug}`)
        setIsLoading(false)
        return
      }

      const guide = guides[params.slug as keyof typeof guides]
      setGuideData(guide)
      setIsLoading(false)
    } catch (err) {
      console.error("Error loading guide:", err)
      setError("Error loading guide content")
      setIsLoading(false)
    }
  }, [params])

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p>Loading guide content...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start mb-8">
            <Link href="/guides">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Guides
              </Button>
            </Link>
          </div>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Error Loading Guide</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // If no guide data, use notFound
  if (!guideData) {
    notFound()
  }

  const guide = guideData

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start mb-8">
          <Link href="/guides">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Guides
            </Button>
          </Link>
        </div>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <header className="mb-6 sm:mb-8 not-prose">
            <div className="text-xs sm:text-sm text-muted-foreground mb-2">{guide.category}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">{guide.title}</h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">{guide.description}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                <span>{guide.readTime}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                <span>Published: {guide.publishedDate}</span>
              </div>
              {guide.updatedDate && (
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Updated: {guide.updatedDate}</span>
                </div>
              )}
              <div>
                <span>By {guide.author}</span>
              </div>
            </div>
          </header>

          {/* Guide content */}
          {guide.content ? (
            <div
              dangerouslySetInnerHTML={{
                __html: guide.content.replace(/<img/g, '<img loading="lazy" decoding="async"'),
              }}
            />
          ) : (
            <p className="text-yellow-600">No content available for this guide.</p>
          )}

          {/* Schema.org structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: guide.title,
                description: guide.description,
                author: {
                  "@type": "Person",
                  name: guide.author,
                },
                publisher: {
                  "@type": "Organization",
                  name: "QBCC Home Warranty Insurance Calculator",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://www.qbccinsurancecalculator.com.au/logo.png",
                  },
                },
                datePublished: guide.publishedDate,
                dateModified: guide.updatedDate || guide.publishedDate,
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `https://www.qbccinsurancecalculator.com.au/guides/${params.slug}`,
                },
              }),
            }}
          />
        </article>

        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/guides">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Guides
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: guide.title,
                      text: guide.description,
                      url: `https://www.qbccinsurancecalculator.com.au/guides/${params.slug}`,
                    })
                    .catch((err) => console.error("Error sharing:", err))
                } else {
                  // Fallback for browsers that don't support the Web Share API
                  const url = `https://www.qbccinsurancecalculator.com.au/guides/${params.slug}`
                  navigator.clipboard
                    .writeText(url)
                    .then(() => alert("Link copied to clipboard!"))
                    .catch((err) => console.error("Error copying to clipboard:", err))
                }
              }}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
