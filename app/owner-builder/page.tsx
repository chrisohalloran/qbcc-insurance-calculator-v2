import type { Metadata } from "next"
import Script from "next/script"
import Link from "next/link"
import { ContentLayout } from "@/components/content-layout"

export const metadata: Metadata = {
  title: "Owner Builder Insurance Requirements QLD",
  description:
    "Understand owner-builder insurance requirements in Queensland, including where QBCC home warranty insurance does and does not apply.",
  alternates: { canonical: "https://www.qbccinsurancecalculator.com.au/owner-builder" },
  openGraph: {
    title: "Owner Builder Insurance Requirements QLD",
    description: "Practical owner-builder guidance for Queensland projects and QBCC home warranty insurance boundaries.",
    type: "article",
    url: "https://www.qbccinsurancecalculator.com.au/owner-builder",
  },
}

const schema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Owner Builder Insurance Requirements QLD",
  datePublished: "2026-02-13",
  dateModified: "2026-02-13",
  inLanguage: "en-AU",
  mainEntityOfPage: "https://www.qbccinsurancecalculator.com.au/owner-builder",
}

export default function OwnerBuilderPage() {
  return (
    <>
      <Script id="owner-builder-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContentLayout
        currentPath="/owner-builder"
        title="Owner Builder Insurance Requirements QLD"
        intro="Owner-builder projects in Queensland follow different insurance rules. This guide explains what QBCC home warranty insurance covers, what it excludes, and where owners need extra caution."
      >
        <h2>Key point first</h2>
        <p>
          QBCC home warranty insurance generally covers contractor-performed insurable work. QBCC guidance lists owner-builder work as non-insurable under the Queensland Home Warranty Scheme.
        </p>

        <h2>What this means for owner-builders</h2>
        <p>
          If you are acting as owner-builder, you cannot assume the standard home warranty safety net will apply in the same way as a licensed contractor project. This affects risk planning, budget contingencies, and resale disclosures.
        </p>

        <h2>Where confusion happens</h2>
        <ul>
          <li>Owners assume all residential work over $3,300 is covered regardless of project setup.</li>
          <li>Contracting selected trades can blur who holds primary obligations.</li>
          <li>People mix public liability, contract works, and home warranty into one concept.</li>
        </ul>

        <h2>Practical risk controls for owner-builders</h2>
        <ol>
          <li>Confirm owner-builder permit and legal obligations before work starts.</li>
          <li>Use written trade contracts with clear scope, quality, and defect rectification terms.</li>
          <li>Verify each trade licence class and current status with QBCC registers.</li>
          <li>Arrange suitable site insurance and discuss policy scope with your insurer.</li>
          <li>Keep records for approvals, inspections, payments, and variations.</li>
        </ol>

        <h2>If you switch to a licensed builder mid-project</h2>
        <p>
          If project delivery model changes, confirm with QBCC whether any parts become insurable and what documentation is required. Do not rely on assumptions from older projects.
        </p>

        <h2>When to get formal advice</h2>
        <p>
          For high-value builds in areas like Sunshine Coast or Moreton Bay, legal and insurance advice is usually money well spent. Complex staging, subcontractor risk, and resale impacts can be significant.
        </p>

        <h2>Related internal pages</h2>
        <ul>
          <li><Link href="/">Use the QBCC calculator for standard contractor jobs</Link></li>
          <li><Link href="/guide">Read the full QBCC home warranty guide</Link></li>
          <li><Link href="/who-needs-it">Check who needs QBCC cover</Link></li>
          <li><Link href="/costs">Understand QBCC premium cost factors</Link></li>
        </ul>
      </ContentLayout>
    </>
  )
}
