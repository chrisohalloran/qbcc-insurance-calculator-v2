import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  getTendrankPost,
  getTendrankPosts,
  safeJsonLd,
  sanitizeTendrankHtml,
} from "@/lib/tendrank-content"

const BASE_URL = "https://www.qbccinsurancecalculator.com.au"

type PageParams = {
  slug: string
}

export const revalidate = 300
export const dynamicParams = true

export async function generateStaticParams(): Promise<PageParams[]> {
  const posts = await getTendrankPosts()
  return posts.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  const post = await getTendrankPost(params.slug)

  if (!post) {
    return { title: "Page not found", robots: { index: false, follow: false } }
  }

  const canonical = `${BASE_URL}/${post.slug}`

  return {
    title: post.title,
    description: post.meta_description || undefined,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "en_AU",
      url: canonical,
      title: post.title,
      description: post.meta_description || undefined,
      siteName: "QBCC Home Warranty Insurance Calculator",
      modifiedTime: post.updated_at,
    },
    robots: { index: true, follow: true },
  }
}

export default async function TendrankContentPage({
  params,
}: {
  params: PageParams
}) {
  const post = await getTendrankPost(params.slug)

  if (!post) notFound()

  const jsonLd = safeJsonLd(post.json_ld)
  const html = sanitizeTendrankHtml(post.html_body)

  return (
    <main className="min-h-screen bg-leva-grey-pale py-8 sm:py-12">
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      ) : null}

      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-600">
          <Link href="/" className="font-medium text-leva-navy hover:underline">
            QBCC Insurance Calculator
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span>{post.title}</span>
        </nav>

        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <div
            className="prose prose-zinc max-w-none prose-headings:text-leva-navy prose-a:text-leva-navy"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <aside className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 text-zinc-700">
            This independent estimator is not affiliated with QBCC. Confirm current premiums and
            eligibility with QBCC before relying on an estimate.
          </aside>

          <div className="mt-8 border-t border-zinc-200 pt-6">
            <Link href="/" className="font-semibold text-leva-navy hover:underline">
              Calculate a QBCC insurance estimate
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
