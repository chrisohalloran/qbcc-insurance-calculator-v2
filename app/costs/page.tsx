import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { ContentLayout } from "@/components/content-layout"
import {
  getTendrankPageOverlay,
  safeJsonLd,
  sanitizeTendrankHtml,
  type TendrankPost,
} from "@/lib/tendrank-content"

const BASE_URL = "https://www.qbccinsurancecalculator.com.au"

const defaultMetadata: Metadata = {
  title: "How Much Does QBCC Home Warranty Insurance Cost in 2026?",
  description:
    "Understand QBCC insurance cost drivers, premium calculation inputs, and practical estimating steps for Queensland building contracts in 2026.",
  alternates: { canonical: "https://www.qbccinsurancecalculator.com.au/costs" },
  openGraph: {
    title: "How Much Does QBCC Home Warranty Insurance Cost in 2026?",
    description: "A practical guide to QBCC insurance premium calculations and pricing factors in Queensland.",
    type: "article",
    url: "https://www.qbccinsurancecalculator.com.au/costs",
  },
}

export const revalidate = 5

export async function generateMetadata(): Promise<Metadata> {
  const post = await getTendrankPageOverlay("costs")

  if (!post) return defaultMetadata

  const canonical = `${BASE_URL}/costs`

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

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How Much Does QBCC Home Warranty Insurance Cost in 2026?",
  datePublished: "2026-02-13",
  dateModified: "2026-02-13",
  inLanguage: "en-AU",
  mainEntityOfPage: "https://www.qbccinsurancecalculator.com.au/costs",
}

function ManagedCostsPage({ post }: { post: TendrankPost }) {
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

export default async function CostsPage() {
  const managedPost = await getTendrankPageOverlay("costs")

  if (managedPost) return <ManagedCostsPage post={managedPost} />

  return (
    <>
      <Script id="costs-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentLayout
        currentPath="/costs"
        title="How Much Does QBCC Home Warranty Insurance Cost in 2026?"
        intro="QBCC insurance cost is based on insurable value and project type. This page explains how premiums are calculated and how to estimate costs accurately before you quote or sign."
      >
        <h2>What drives QBCC insurance premium amount</h2>
        <p>
          The main input is the insurable value of the work. This usually includes labour, materials, and GST. Premium tables and methods then apply based on whether the job is a new home, alteration, or a multi-dwelling scenario.
        </p>

        <h2>Minimum threshold to pay a premium</h2>
        <p>
          For projects under $3,300, home warranty premium is generally not payable. Once value exceeds that threshold, premium obligations begin and the amount is mapped against QBCC premium tables.
        </p>

        <h2>Single dwelling vs multiple dwellings</h2>
        <p>
          Single detached dwellings are straightforward. For projects with two or more dwellings, notional pricing often applies. That means you can divide total value per dwelling, find premium per dwelling, then multiply back to project total.
        </p>

        <h2>Worked examples for Queensland builders</h2>
        <h3>Example 1: $420,000 new detached home in Ipswich</h3>
        <p>
          Use total insurable value for the dwelling, check the applicable table for new construction, then apply the premium band. If contract terms include premium recovery from owner, make that line item explicit.
        </p>

        <h3>Example 2: 4 townhouse renovation units in Logan</h3>
        <p>
          If notional pricing applies, divide project value by 4 first. Calculate premium from the per-unit value, then multiply by 4. Record assumptions in your estimate notes.
        </p>

        <h2>QLeave is separate from QBCC premium</h2>
        <p>
          For higher value jobs, builders also need to include QLeave levy where applicable. This is not the same as QBCC insurance premium. Keep them as separate line items to avoid confusion during contract negotiation.
        </p>

        <h2>How to avoid underquoting premium costs</h2>
        <ul>
          <li>Use accurate take-offs before setting insurable value.</li>
          <li>Include all eligible associated works in value calculations.</li>
          <li>Document whether notional pricing applies.</li>
          <li>Recheck values when variations materially change scope.</li>
          <li>Use current premium tables and update your estimate template.</li>
        </ul>

        <h2>Fast way to estimate your QBCC insurance cost</h2>
        <p>
          Use our <Link href="/">QBCC insurance calculator</Link> to generate a practical estimate in seconds. Then validate final amounts against QBCC table references before policy lodgement.
        </p>

        <h2>Related internal pages</h2>
        <ul>
          <li><Link href="/guide">QBCC Home Warranty Insurance complete guide</Link></li>
          <li><Link href="/who-needs-it">Who needs QBCC insurance</Link></li>
          <li><Link href="/owner-builder">Owner builder insurance rules in Queensland</Link></li>
        </ul>
      </ContentLayout>
    </>
  )
}
