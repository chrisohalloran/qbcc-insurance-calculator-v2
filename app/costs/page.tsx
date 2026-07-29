import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { ContentLayout } from "@/components/content-layout"

export const metadata: Metadata = {
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

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How Much Does QBCC Home Warranty Insurance Cost in 2026?",
  datePublished: "2026-02-13",
  dateModified: "2026-02-13",
  inLanguage: "en-AU",
  mainEntityOfPage: "https://www.qbccinsurancecalculator.com.au/costs",
}

export default function CostsPage() {
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
