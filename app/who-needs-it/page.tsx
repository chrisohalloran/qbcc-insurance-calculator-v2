import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { ContentLayout } from "@/components/content-layout"

export const metadata: Metadata = {
  title: "Do I Need QBCC Home Warranty Insurance?",
  description:
    "Clear Queensland guidance on who needs QBCC insurance, which projects are insurable, and common exclusions for residential building work.",
  alternates: { canonical: "https://www.qbccinsurancecalculator.com.au/who-needs-it" },
  openGraph: {
    title: "Do I Need QBCC Home Warranty Insurance?",
    description: "Check QBCC insurance requirements for builders, homeowners, and residential projects in Queensland.",
    type: "article",
    url: "https://www.qbccinsurancecalculator.com.au/who-needs-it",
  },
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Do I Need QBCC Home Warranty Insurance?",
  datePublished: "2026-02-13",
  dateModified: "2026-02-13",
  inLanguage: "en-AU",
  mainEntityOfPage: "https://www.qbccinsurancecalculator.com.au/who-needs-it",
}

export default function WhoNeedsItPage() {
  return (
    <>
      <Script id="who-needs-it-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentLayout
        currentPath="/who-needs-it"
        title="Do I Need QBCC Home Warranty Insurance?"
        intro="If your Queensland residential building work is over $3,300, there is a strong chance QBCC home warranty insurance is required. This page breaks down the rules in plain language."
      >
        <h2>Short answer</h2>
        <p>
          For most residential construction work in Queensland above $3,300, yes, QBCC home warranty insurance is required.
          This applies across new homes, alterations, additions, and many repair or renovation scopes.
        </p>

        <h2>Who is responsible</h2>
        <p>
          The licensed contractor is responsible for taking out the policy through QBCC. Owners usually fund the premium as part of the contract amount, but the compliance responsibility sits with the contractor.
        </p>

        <h2>Projects that usually require cover</h2>
        <ul>
          <li>New detached homes in suburbs like Springfield, Redland Bay, or North Lakes.</li>
          <li>Renovations and extensions where total work exceeds $3,300.</li>
          <li>Kitchen and bathroom works above threshold.</li>
          <li>Building work affecting structural integrity.</li>
          <li>Certain associated works when part of a bigger insurable project.</li>
        </ul>

        <h2>Projects that may not be insurable</h2>
        <p>QBCC publishes clear exclusions. Common examples include:</p>
        <ul>
          <li>Projects below the $3,300 threshold.</li>
          <li>Multiple-unit dwellings over 3 storeys above a car park.</li>
          <li>Specific non-residential classes of work.</li>
          <li>Owner-builder work under the statutory owner-builder framework.</li>
        </ul>

        <h2>Do I need QBCC insurance as a homeowner?</h2>
        <p>
          You do not lodge the policy yourself in standard contractor projects. Your contractor lodges it with QBCC and gives you policy details. You should request this record before significant progress payments.
        </p>

        <h2>Do I need QBCC insurance as a builder?</h2>
        <p>
          If you are doing insurable residential work, yes. You cannot avoid the obligation by splitting contracts or labelling work as labour only when insurable value rules still apply.
        </p>

        <h2>Quick compliance workflow</h2>
        <ol>
          <li>Confirm scope is residential construction work under QBCC definitions.</li>
          <li>Confirm insurable value exceeds $3,300.</li>
          <li>Calculate premium based on insurable value and project type.</li>
          <li>Take out cover via QBCC process.</li>
          <li>Store policy records and contract evidence.</li>
        </ol>

        <h2>Related internal pages</h2>
        <ul>
          <li><Link href="/">Use the QBCC insurance calculator</Link></li>
          <li><Link href="/guide">Read the complete QBCC guide</Link></li>
          <li><Link href="/costs">See detailed cost and premium examples</Link></li>
          <li><Link href="/owner-builder">Read owner-builder specific rules</Link></li>
        </ul>
      </ContentLayout>
    </>
  )
}
